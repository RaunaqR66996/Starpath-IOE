// Advanced Authentication System for BlueShip Sync 3PL Platform
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { getSecurityConfig, generateSecureRandom, SECURITY_CONSTANTS } from './config';
import { supabaseAdmin } from '../supabase/client';

export interface TOTPConfig {
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  window: number;
}

export interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'backup_codes' | 'biometric';
  name: string;
  enabled: boolean;
  verified: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  config?: any;
}

export interface BiometricTemplate {
  id: string;
  type: 'fingerprint' | 'face' | 'voice';
  template: string; // Encrypted biometric template
  deviceId: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser: string;
    location?: string;
  };
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  refreshExpiry: Date;
  ipAddress: string;
  mfaVerified: boolean;
  biometricVerified: boolean;
  riskScore: number;
  createdAt: Date;
  lastActivity: Date;
  active: boolean;
}

export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth2' | 'oidc';
  enabled: boolean;
  config: {
    clientId?: string;
    clientSecret?: string;
    issuer?: string;
    authorizationUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    callbackUrl: string;
    scopes?: string[];
    // SAML specific
    entityId?: string;
    ssoUrl?: string;
    certificate?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class AdvancedAuthenticationManager {
  private sessions: Map<string, UserSession> = new Map();
  private mfaMethods: Map<string, MFAMethod[]> = new Map(); // userId -> methods
  private biometricTemplates: Map<string, BiometricTemplate[]> = new Map(); // userId -> templates
  private ssoProviders: Map<string, SSOProvider> = new Map();
  private loginAttempts: Map<string, number> = new Map(); // userId -> attempts
  private config = getSecurityConfig();

  constructor() {
    this.initializeDefaultSSOProviders();
    this.startSessionCleanupScheduler();
  }

  /**
   * Enhanced login with risk assessment
   */
  async authenticateUser(
    email: string, 
    password: string, 
    deviceInfo: UserSession['deviceInfo'],
    ipAddress: string
  ): Promise<{ success: boolean; session?: UserSession; requiresMFA?: boolean; error?: string }> {
    // Check for account lockout
    const attemptKey = email.toLowerCase();
    const attempts = this.loginAttempts.get(attemptKey) || 0;
    
    if (attempts >= SECURITY_CONSTANTS.AUTH.MAX_LOGIN_ATTEMPTS) {
      return { success: false, error: 'Account temporarily locked due to failed attempts' };
    }

    try {
      // Verify credentials (integrate with existing auth system)
      const user = await this.verifyCredentials(email, password);
      if (!user) {
        this.incrementLoginAttempts(attemptKey);
        return { success: false, error: 'Invalid credentials' };
      }

      // Calculate risk score for this login
      const riskScore = await this.calculateLoginRiskScore(user.id, deviceInfo, ipAddress);

      // Check if MFA is required
      const mfaMethods = this.mfaMethods.get(user.id) || [];
      const enabledMFA = mfaMethods.filter(m => m.enabled);
      const requiresMFA = enabledMFA.length > 0 || riskScore > 60;

      if (requiresMFA && !enabledMFA.length) {
        // First-time MFA setup required
        return { 
          success: false, 
          requiresMFA: true, 
          error: 'MFA setup required for security' 
        };
      }

      if (requiresMFA) {
        // Create temporary session pending MFA verification
        const tempSession = await this.createTempSession(user.id, deviceInfo, ipAddress, riskScore);
        return { 
          success: false, 
          requiresMFA: true, 
          session: tempSession 
        };
      }

      // Create full session
      const session = await this.createSession(user.id, deviceInfo, ipAddress, riskScore, true);
      
      // Clear failed attempts
      this.loginAttempts.delete(attemptKey);

      return { success: true, session };

    } catch (error) {
      this.incrementLoginAttempts(attemptKey);
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(
    sessionId: string, 
    methodId: string, 
    token: string
  ): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.active) {
      return { success: false, error: 'Invalid session' };
    }

    const userMethods = this.mfaMethods.get(session.userId) || [];
    const method = userMethods.find(m => m.id === methodId);
    
    if (!method || !method.enabled) {
      return { success: false, error: 'Invalid MFA method' };
    }

    let verified = false;

    switch (method.type) {
      case 'totp':
        verified = await this.verifyTOTP(method.config as TOTPConfig, token);
        break;
      case 'backup_codes':
        verified = await this.verifyBackupCode(session.userId, token);
        break;
      default:
        return { success: false, error: 'Unsupported MFA method' };
    }

    if (!verified) {
      return { success: false, error: 'Invalid MFA token' };
    }

    // Update session to mark MFA as verified
    session.mfaVerified = true;
    session.lastActivity = new Date();
    method.lastUsedAt = new Date();

    // Generate new tokens for the fully authenticated session
    const newTokens = await this.generateTokens(session.userId);
    session.accessToken = newTokens.accessToken;
    session.refreshToken = newTokens.refreshToken;
    session.tokenExpiry = newTokens.tokenExpiry;

    return { success: true, session };
  }

  /**
   * Biometric authentication
   */
  async verifyBiometric(
    sessionId: string,
    biometricData: string,
    biometricType: 'fingerprint' | 'face' | 'voice',
    deviceId: string
  ): Promise<{ success: boolean; error?: string }> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.active) {
      return { success: false, error: 'Invalid session' };
    }

    const userTemplates = this.biometricTemplates.get(session.userId) || [];
    const matchingTemplate = userTemplates.find(t => 
      t.type === biometricType && t.deviceId === deviceId
    );

    if (!matchingTemplate) {
      return { success: false, error: 'No biometric template found for this device' };
    }

    // Verify biometric match (in production, use specialized biometric libraries)
    const verified = await this.verifyBiometricMatch(biometricData, matchingTemplate.template);
    
    if (verified) {
      session.biometricVerified = true;
      session.lastActivity = new Date();
      matchingTemplate.lastUsedAt = new Date();
      
      // Reduce risk score for biometric verification
      session.riskScore = Math.max(0, session.riskScore - 20);
      
      return { success: true };
    }

    return { success: false, error: 'Biometric verification failed' };
  }

  /**
   * Register biometric template
   */
  async registerBiometric(
    userId: string,
    biometricData: string,
    biometricType: 'fingerprint' | 'face' | 'voice',
    deviceId: string
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      // Encrypt biometric template (in production, use specialized encryption for biometric data)
      const encryptedTemplate = await this.encryptBiometricData(biometricData);
      
      const template: BiometricTemplate = {
        id: generateSecureRandom.uuid(),
        type: biometricType,
        template: encryptedTemplate,
        deviceId,
        createdAt: new Date(),
      };

      let userTemplates = this.biometricTemplates.get(userId) || [];
      
      // Remove existing template for same type and device
      userTemplates = userTemplates.filter(t => 
        !(t.type === biometricType && t.deviceId === deviceId)
      );
      
      userTemplates.push(template);
      this.biometricTemplates.set(userId, userTemplates);

      return { success: true, templateId: template.id };
    } catch (error) {
      console.error('Biometric registration error:', error);
      return { success: false, error: 'Failed to register biometric' };
    }
  }

  /**
   * Setup TOTP MFA
   */
  async setupTOTP(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = this.generateTOTPSecret();
    const qrCode = this.generateTOTPQRCode(userId, secret);
    const backupCodes = this.generateBackupCodes();

    const totpMethod: MFAMethod = {
      id: generateSecureRandom.uuid(),
      type: 'totp',
      name: 'Authenticator App',
      enabled: false, // Will be enabled after verification
      verified: false,
      createdAt: new Date(),
      config: {
        secret,
        algorithm: 'SHA1',
        digits: 6,
        period: SECURITY_CONSTANTS.AUTH.TOTP_PERIOD,
        window: SECURITY_CONSTANTS.AUTH.TOTP_WINDOW,
      } as TOTPConfig,
    };

    const backupMethod: MFAMethod = {
      id: generateSecureRandom.uuid(),
      type: 'backup_codes',
      name: 'Backup Codes',
      enabled: true,
      verified: true,
      createdAt: new Date(),
      config: {
        codes: backupCodes.map(code => ({
          code: this.hashBackupCode(code),
          used: false,
        })),
      },
    };

    const userMethods = this.mfaMethods.get(userId) || [];
    userMethods.push(totpMethod, backupMethod);
    this.mfaMethods.set(userId, userMethods);

    return { secret, qrCode, backupCodes };
  }

  /**
   * Enable TOTP after verification
   */
  async enableTOTP(userId: string, methodId: string, token: string): Promise<boolean> {
    const userMethods = this.mfaMethods.get(userId) || [];
    const method = userMethods.find(m => m.id === methodId && m.type === 'totp');
    
    if (!method) return false;

    const verified = await this.verifyTOTP(method.config as TOTPConfig, token);
    if (verified) {
      method.enabled = true;
      method.verified = true;
      return true;
    }

    return false;
  }

  /**
   * SSO Authentication
   */
  async initiateSSOLogin(providerId: string, redirectUri: string): Promise<{ authUrl: string }> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider || !provider.enabled) {
      throw new Error('Invalid or disabled SSO provider');
    }

    const state = generateSecureRandom.string(32);
    const nonce = generateSecureRandom.string(32);

    let authUrl: string;

    switch (provider.type) {
      case 'oauth2':
      case 'oidc':
        const params = new URLSearchParams({
          client_id: provider.config.clientId!,
          response_type: 'code',
          scope: provider.config.scopes?.join(' ') || 'openid profile email',
          redirect_uri: provider.config.callbackUrl,
          state,
          nonce,
        });
        authUrl = `${provider.config.authorizationUrl}?${params}`;
        break;

      case 'saml':
        // Generate SAML AuthnRequest (simplified)
        authUrl = `${provider.config.ssoUrl}?SAMLRequest=${this.generateSAMLRequest(provider, state)}`;
        break;

      default:
        throw new Error('Unsupported SSO provider type');
    }

    // Store state for verification
    // In production, store in Redis or database
    
    return { authUrl };
  }

  /**
   * Handle SSO callback
   */
  async handleSSOCallback(
    providerId: string, 
    code: string, 
    state: string
  ): Promise<{ success: boolean; user?: any; session?: UserSession; error?: string }> {
    const provider = this.ssoProviders.get(providerId);
    if (!provider) {
      return { success: false, error: 'Invalid provider' };
    }

    try {
      let userInfo: any;

      switch (provider.type) {
        case 'oauth2':
        case 'oidc':
          userInfo = await this.handleOAuth2Callback(provider, code);
          break;
        case 'saml':
          userInfo = await this.handleSAMLCallback(provider, code);
          break;
        default:
          return { success: false, error: 'Unsupported provider type' };
      }

      if (!userInfo) {
        return { success: false, error: 'Failed to get user information' };
      }

      // Find or create user based on SSO identity
      const user = await this.findOrCreateSSOUser(userInfo, providerId);
      
      // Create session
      const deviceInfo = {
        userAgent: 'SSO Login',
        platform: 'web',
        browser: 'sso',
      };

      const session = await this.createSession(
        user.id, 
        deviceInfo, 
        'sso-login', 
        0, // Low risk for SSO
        true, // MFA verified through SSO
        true  // SSO authenticated
      );

      return { success: true, user, session };

    } catch (error) {
      console.error('SSO callback error:', error);
      return { success: false, error: 'SSO authentication failed' };
    }
  }

  /**
   * Session management
   */
  async refreshSession(refreshToken: string): Promise<{ success: boolean; session?: UserSession; error?: string }> {
    // Find session by refresh token
    const session = Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken);
    
    if (!session || !session.active) {
      return { success: false, error: 'Invalid refresh token' };
    }

    if (session.refreshExpiry < new Date()) {
      // Remove expired session
      this.sessions.delete(session.id);
      return { success: false, error: 'Refresh token expired' };
    }

    // Generate new tokens
    const newTokens = await this.generateTokens(session.userId);
    
    // Update session
    session.accessToken = newTokens.accessToken;
    session.refreshToken = newTokens.refreshToken;
    session.tokenExpiry = newTokens.tokenExpiry;
    session.refreshExpiry = new Date(Date.now() + this.config.authentication.sessions.refreshTokenExpiry * 1000);
    session.lastActivity = new Date();

    return { success: true, session };
  }

  /**
   * Logout and cleanup session
   */
  async logout(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Get active sessions for user
   */
  getUserSessions(userId: string): UserSession[] {
    return Array.from(this.sessions.values()).filter(s => 
      s.userId === userId && s.active
    );
  }

  /**
   * Terminate all sessions for user
   */
  terminateAllUserSessions(userId: string): number {
    const userSessions = this.getUserSessions(userId);
    userSessions.forEach(session => {
      session.active = false;
      this.sessions.delete(session.id);
    });
    return userSessions.length;
  }

  // Private helper methods

  private async verifyCredentials(email: string, password: string): Promise<any> {
    try {
      // Use Supabase Auth to verify credentials
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email,
        user: data.user
      };
    } catch (error) {
      console.error('Supabase auth error:', error);
      return null;
    }
  }

  private async calculateLoginRiskScore(
    userId: string, 
    deviceInfo: UserSession['deviceInfo'], 
    ipAddress: string
  ): Promise<number> {
    let score = 0;

    // New device risk
    const existingSessions = this.getUserSessions(userId);
    const knownDevices = existingSessions.map(s => s.deviceInfo.userAgent);
    if (!knownDevices.includes(deviceInfo.userAgent)) {
      score += 30;
    }

    // Time-based risk
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 20;
    }

    // Location risk (placeholder - integrate with GeoIP)
    // if (isNewLocation(ipAddress)) score += 25;

    return Math.min(score, 100);
  }

  private async createSession(
    userId: string,
    deviceInfo: UserSession['deviceInfo'],
    ipAddress: string,
    riskScore: number,
    mfaVerified: boolean = false,
    ssoAuthenticated: boolean = false
  ): Promise<UserSession> {
    const sessionId = generateSecureRandom.uuid();
    const deviceId = this.generateDeviceId(deviceInfo);
    const tokens = await this.generateTokens(userId);

    const session: UserSession = {
      id: sessionId,
      userId,
      deviceId,
      deviceInfo,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.tokenExpiry,
      refreshExpiry: new Date(Date.now() + this.config.authentication.sessions.refreshTokenExpiry * 1000),
      ipAddress,
      mfaVerified,
      biometricVerified: false,
      riskScore,
      createdAt: new Date(),
      lastActivity: new Date(),
      active: true,
    };

    this.sessions.set(sessionId, session);

    // Enforce max concurrent sessions
    this.enforceSessionLimits(userId);

    return session;
  }

  private async createTempSession(
    userId: string,
    deviceInfo: UserSession['deviceInfo'],
    ipAddress: string,
    riskScore: number
  ): Promise<UserSession> {
    // Create temporary session with limited access pending MFA
    const session = await this.createSession(userId, deviceInfo, ipAddress, riskScore, false);
    
    // Set shorter expiry for temp sessions
    session.tokenExpiry = new Date(Date.now() + this.config.authentication.mfa.gracePeriod * 1000);
    
    return session;
  }

  private async generateTokens(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenExpiry: Date;
  }> {
    const accessToken = generateSecureRandom.string(32);
    const refreshToken = generateSecureRandom.string(32);
    const tokenExpiry = new Date(Date.now() + this.config.authentication.sessions.accessTokenExpiry * 1000);

    return { accessToken, refreshToken, tokenExpiry };
  }

  private generateDeviceId(deviceInfo: UserSession['deviceInfo']): string {
    const combined = `${deviceInfo.userAgent}:${deviceInfo.platform}:${deviceInfo.browser}`;
    return createHmac('sha256', 'device-secret').update(combined).digest('hex').substring(0, 16);
  }

  private enforceSessionLimits(userId: string): void {
    const userSessions = this.getUserSessions(userId);
    const maxSessions = this.config.authentication.sessions.maxConcurrentSessions;

    if (userSessions.length > maxSessions) {
      // Remove oldest sessions
      const sortedSessions = userSessions.sort((a, b) => 
        a.lastActivity.getTime() - b.lastActivity.getTime()
      );

      const sessionsToRemove = sortedSessions.slice(0, userSessions.length - maxSessions);
      sessionsToRemove.forEach(session => {
        session.active = false;
        this.sessions.delete(session.id);
      });
    }
  }

  private generateTOTPSecret(): string {
    return generateSecureRandom.string(16);
  }

  private generateTOTPQRCode(userId: string, secret: string): string {
    // Generate QR code data for TOTP setup
    const issuer = 'BlueShip Sync';
    const label = `${issuer}:${userId}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(generateSecureRandom.int(100000, 999999).toString());
    }
    return codes;
  }

  private hashBackupCode(code: string): string {
    return createHmac('sha256', 'backup-code-secret').update(code).digest('hex');
  }

  private async verifyTOTP(config: TOTPConfig, token: string): Promise<boolean> {
    // TOTP verification implementation
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(currentTime / config.period);

    for (let i = -config.window; i <= config.window; i++) {
      const testTimeStep = timeStep + i;
      const expectedToken = this.generateTOTPToken(config.secret, testTimeStep, config);
      
      if (timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))) {
        return true;
      }
    }

    return false;
  }

  private generateTOTPToken(secret: string, timeStep: number, config: TOTPConfig): string {
    // TOTP token generation (simplified implementation)
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(timeStep, 4);
    
    const hmac = createHmac(config.algorithm.toLowerCase(), secret);
    const hash = hmac.update(timeBuffer).digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const binary = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
    
    const token = (binary % Math.pow(10, config.digits)).toString();
    return token.padStart(config.digits, '0');
  }

  private async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const userMethods = this.mfaMethods.get(userId) || [];
    const backupMethod = userMethods.find(m => m.type === 'backup_codes');
    
    if (!backupMethod) return false;

    const hashedCode = this.hashBackupCode(code);
    const codes = backupMethod.config.codes;
    
    const matchingCode = codes.find((c: any) => c.code === hashedCode && !c.used);
    if (matchingCode) {
      matchingCode.used = true;
      return true;
    }

    return false;
  }

  private async encryptBiometricData(data: string): Promise<string> {
    // In production, use specialized encryption for biometric data
    return Buffer.from(data).toString('base64');
  }

  private async verifyBiometricMatch(data: string, template: string): Promise<boolean> {
    // In production, use specialized biometric matching algorithms
    return data === Buffer.from(template, 'base64').toString();
  }

  private incrementLoginAttempts(email: string): void {
    const current = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, current + 1);
    
    // Clear attempts after lockout duration
    setTimeout(() => {
      this.loginAttempts.delete(email);
    }, SECURITY_CONSTANTS.AUTH.LOCKOUT_DURATION * 1000);
  }

  private async handleOAuth2Callback(provider: SSOProvider, code: string): Promise<any> {
    // OAuth2/OIDC callback handling
    // Exchange code for tokens and get user info
    return { email: 'user@example.com', name: 'SSO User' }; // Placeholder
  }

  private async handleSAMLCallback(provider: SSOProvider, samlResponse: string): Promise<any> {
    // SAML response handling
    // Parse and verify SAML response
    return { email: 'user@example.com', name: 'SAML User' }; // Placeholder
  }

  private generateSAMLRequest(provider: SSOProvider, state: string): string {
    // Generate SAML AuthnRequest
    return 'base64-encoded-saml-request'; // Placeholder
  }

  private async findOrCreateSSOUser(userInfo: any, providerId: string): Promise<any> {
    // Find existing user or create new one based on SSO identity
    return { id: 'sso-user-123', email: userInfo.email }; // Placeholder
  }

  private initializeDefaultSSOProviders(): void {
    // Initialize common SSO providers
    const googleProvider: SSOProvider = {
      id: 'google',
      name: 'Google',
      type: 'oauth2',
      enabled: false,
      config: {
        clientId: '',
        clientSecret: '',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        callbackUrl: '/auth/sso/google/callback',
        scopes: ['openid', 'profile', 'email'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const githubProvider: SSOProvider = {
      id: 'github',
      name: 'GitHub',
      type: 'oauth2',
      enabled: true, // Enable GitHub by default
      config: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        callbackUrl: '/auth/sso/github/callback',
        scopes: ['user:email', 'read:user'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.ssoProviders.set('google', googleProvider);
    this.ssoProviders.set('github', githubProvider);
  }

  private startSessionCleanupScheduler(): void {
    // Clean up expired sessions every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.tokenExpiry < now || session.refreshExpiry < now) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Singleton instance
export const advancedAuthManager = new AdvancedAuthenticationManager(); 