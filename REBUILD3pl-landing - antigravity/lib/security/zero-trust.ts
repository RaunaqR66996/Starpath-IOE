// Zero Trust Architecture Implementation for BlueShip Sync 3PL Platform
import { createHmac, timingSafeEqual } from 'crypto';
import { getSecurityConfig, generateSecureRandom, SECURITY_CONSTANTS } from './config';

export interface ServiceIdentity {
  id: string;
  name: string;
  version: string;
  publicKey: string;
  certificateChain?: string[];
  permissions: string[];
  createdAt: Date;
  expiresAt: Date;
  lastValidated?: Date;
}

export interface TrustContext {
  serviceId: string;
  requestId: string;
  timestamp: number;
  clientIP: string;
  userAgent?: string;
  sourceService?: string;
  targetResource: string;
  permissions: string[];
  riskScore: number;
  verified: boolean;
}

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  id: string;
  condition: string; // JSON Logic expression
  action: 'allow' | 'deny' | 'require_mfa' | 'audit';
  metadata?: Record<string, any>;
}

export class ZeroTrustManager {
  private services: Map<string, ServiceIdentity> = new Map();
  private policies: Map<string, ZeroTrustPolicy> = new Map();
  private trustCache: Map<string, TrustContext> = new Map();
  private config = getSecurityConfig();

  constructor() {
    this.initializeDefaultPolicies();
    this.startTrustValidationScheduler();
  }

  /**
   * Register a new service in the Zero Trust network
   */
  async registerService(service: Omit<ServiceIdentity, 'id' | 'createdAt' | 'expiresAt'>): Promise<ServiceIdentity> {
    const serviceId = generateSecureRandom.uuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.zeroTrust.trustExpirationTime * 1000);

    const serviceIdentity: ServiceIdentity = {
      ...service,
      id: serviceId,
      createdAt: now,
      expiresAt,
    };

    this.services.set(serviceId, serviceIdentity);

    console.log(`Service registered: ${service.name} (${serviceId})`);
    return serviceIdentity;
  }

  /**
   * Generate service-to-service authentication token
   */
  generateServiceToken(sourceServiceId: string, targetServiceId: string, permissions: string[]): string {
    const sourceService = this.services.get(sourceServiceId);
    const targetService = this.services.get(targetServiceId);

    if (!sourceService || !targetService) {
      throw new Error('Invalid service ID');
    }

    const payload = {
      iss: sourceServiceId, // Issuer
      aud: targetServiceId, // Audience
      sub: sourceServiceId, // Subject
      iat: Math.floor(Date.now() / 1000), // Issued at
      exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      permissions,
      nonce: generateSecureRandom.string(16),
    };

    // Sign with HMAC for service-to-service communication
    const secret = this.generateServiceSecret(sourceServiceId, targetServiceId);
    const token = this.createJWT(payload, secret);

    return token;
  }

  /**
   * Verify service-to-service authentication token
   */
  verifyServiceToken(token: string, expectedSourceId: string, expectedTargetId: string): boolean {
    try {
      const secret = this.generateServiceSecret(expectedSourceId, expectedTargetId);
      const payload = this.verifyJWT(token, secret);

      // Verify claims
      if (payload.iss !== expectedSourceId || payload.aud !== expectedTargetId) {
        return false;
      }

      // Check expiration
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Service token verification failed:', error);
      return false;
    }
  }

  /**
   * Evaluate trust context against Zero Trust policies
   */
  async evaluateTrust(context: Omit<TrustContext, 'verified' | 'riskScore'>): Promise<TrustContext> {
    const riskScore = await this.calculateRiskScore(context);
    const verified = await this.verifyTrustContext(context, riskScore);

    const fullContext: TrustContext = {
      ...context,
      riskScore,
      verified,
    };

    // Cache the trust context
    const cacheKey = `${context.serviceId}:${context.requestId}`;
    this.trustCache.set(cacheKey, fullContext);

    // Clean up expired cache entries
    setTimeout(() => {
      this.trustCache.delete(cacheKey);
    }, this.config.zeroTrust.trustExpirationTime * 1000);

    return fullContext;
  }

  /**
   * Calculate risk score based on multiple factors
   */
  private async calculateRiskScore(context: Omit<TrustContext, 'verified' | 'riskScore'>): Promise<number> {
    let score = 0;

    // Service identity risk (0-20 points)
    const service = this.services.get(context.serviceId);
    if (!service) {
      score += 20; // Unknown service = high risk
    } else if (service.expiresAt < new Date()) {
      score += 15; // Expired service
    } else if (!service.lastValidated || 
               (Date.now() - service.lastValidated.getTime()) > 24 * 60 * 60 * 1000) {
      score += 10; // Not validated in 24 hours
    }

    // Time-based risk (0-15 points)
    const now = new Date();
    const hour = now.getHours();
    if (hour < 6 || hour > 22) {
      score += 10; // Outside business hours
    }
    if (now.getDay() === 0 || now.getDay() === 6) {
      score += 5; // Weekend access
    }

    // IP-based risk (0-25 points)
    if (await this.isIPSuspicious(context.clientIP)) {
      score += 25;
    } else if (await this.isIPFromUnusualLocation(context.clientIP)) {
      score += 15;
    }

    // Resource sensitivity risk (0-20 points)
    if (context.targetResource.includes('/admin/')) {
      score += 20;
    } else if (context.targetResource.includes('/api/sensitive/')) {
      score += 15;
    } else if (context.targetResource.includes('/api/')) {
      score += 5;
    }

    // Permission risk (0-20 points)
    const highRiskPermissions = ['admin', 'delete', 'export', 'backup'];
    const riskPerms = context.permissions.filter(p => 
      highRiskPermissions.some(hrp => p.includes(hrp))
    );
    score += Math.min(riskPerms.length * 5, 20);

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Verify trust context against policies
   */
  private async verifyTrustContext(
    context: Omit<TrustContext, 'verified' | 'riskScore'>, 
    riskScore: number
  ): Promise<boolean> {
    // Check if service exists and is valid
    const service = this.services.get(context.serviceId);
    if (!service || service.expiresAt < new Date()) {
      return false;
    }

    // Apply Zero Trust policies
    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      const policyResult = await this.evaluatePolicy(policy, { ...context, riskScore });
      if (policyResult === 'deny') {
        return false;
      }
    }

    // Default deny for high-risk scores
    if (riskScore > 75) {
      return false;
    }

    return true;
  }

  /**
   * Evaluate a specific policy against the context
   */
  private async evaluatePolicy(
    policy: ZeroTrustPolicy, 
    context: Omit<TrustContext, 'verified'> & { riskScore: number }
  ): Promise<'allow' | 'deny' | 'require_mfa' | 'audit'> {
    for (const rule of policy.rules) {
      if (await this.evaluateRuleCondition(rule.condition, context)) {
        // Log the policy evaluation
        console.log(`Policy ${policy.name} rule ${rule.id} matched: ${rule.action}`);
        return rule.action;
      }
    }

    return 'allow'; // Default to allow if no rules match
  }

  /**
   * Evaluate rule condition using a simple expression evaluator
   */
  private async evaluateRuleCondition(
    condition: string, 
    context: Omit<TrustContext, 'verified'> & { riskScore: number }
  ): Promise<boolean> {
    try {
      // Simple condition evaluation (in production, use a proper JSON Logic library)
      const conditionObj = JSON.parse(condition);
      
      if (conditionObj.riskScore) {
        const { operator, value } = conditionObj.riskScore;
        switch (operator) {
          case '>':
            return context.riskScore > value;
          case '<':
            return context.riskScore < value;
          case '>=':
            return context.riskScore >= value;
          case '<=':
            return context.riskScore <= value;
          case '==':
            return context.riskScore === value;
        }
      }

      if (conditionObj.permissions) {
        const { contains } = conditionObj.permissions;
        return context.permissions.some(p => contains.includes(p));
      }

      if (conditionObj.targetResource) {
        const { matches } = conditionObj.targetResource;
        return new RegExp(matches).test(context.targetResource);
      }

      return false;
    } catch (error) {
      console.error('Error evaluating rule condition:', error);
      return false;
    }
  }

  /**
   * Initialize default Zero Trust policies
   */
  private initializeDefaultPolicies(): void {
    // High-risk score policy
    const highRiskPolicy: ZeroTrustPolicy = {
      id: generateSecureRandom.uuid(),
      name: 'High Risk Access Control',
      description: 'Deny access for high-risk requests',
      enabled: true,
      priority: 1,
      rules: [
        {
          id: generateSecureRandom.uuid(),
          condition: JSON.stringify({ riskScore: { operator: '>', value: 80 } }),
          action: 'deny',
        },
        {
          id: generateSecureRandom.uuid(),
          condition: JSON.stringify({ riskScore: { operator: '>', value: 60 } }),
          action: 'require_mfa',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Admin access policy
    const adminPolicy: ZeroTrustPolicy = {
      id: generateSecureRandom.uuid(),
      name: 'Admin Access Control',
      description: 'Strict controls for admin operations',
      enabled: true,
      priority: 2,
      rules: [
        {
          id: generateSecureRandom.uuid(),
          condition: JSON.stringify({ permissions: { contains: ['admin'] } }),
          action: 'require_mfa',
        },
        {
          id: generateSecureRandom.uuid(),
          condition: JSON.stringify({ targetResource: { matches: '/admin/.*' } }),
          action: 'audit',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(highRiskPolicy.id, highRiskPolicy);
    this.policies.set(adminPolicy.id, adminPolicy);
  }

  /**
   * Start continuous trust validation
   */
  private startTrustValidationScheduler(): void {
    setInterval(() => {
      this.validateAllServices();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Validate all registered services
   */
  private async validateAllServices(): Promise<void> {
    for (const [serviceId, service] of this.services.entries()) {
      // Remove expired services
      if (service.expiresAt < new Date()) {
        this.services.delete(serviceId);
        console.log(`Removed expired service: ${service.name} (${serviceId})`);
        continue;
      }

      // Update last validated timestamp
      service.lastValidated = new Date();
      console.log(`Validated service: ${service.name} (${serviceId})`);
    }
  }

  /**
   * Generate service-specific secret for HMAC
   */
  private generateServiceSecret(sourceId: string, targetId: string): string {
    // Use a deterministic but secure method to generate secrets
    const combined = `${sourceId}:${targetId}:${this.config.authentication.sessions.accessTokenExpiry}`;
    return createHmac('sha256', 'zero-trust-secret').update(combined).digest('hex');
  }

  /**
   * Create JWT token with HMAC signature
   */
  private createJWT(payload: any, secret: string): string {
    const header = {
      alg: SECURITY_CONSTANTS.AUTH.JWT_ALGORITHM,
      typ: 'JWT',
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const signature = createHmac('sha256', secret).update(data).digest('base64url');
    
    return `${data}.${signature}`;
  }

  /**
   * Verify JWT token with HMAC signature
   */
  private verifyJWT(token: string, secret: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const expectedSignature = createHmac('sha256', secret).update(data).digest('base64url');
    
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid JWT signature');
    }

    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
  }

  /**
   * Check if IP is suspicious (placeholder implementation)
   */
  private async isIPSuspicious(ip: string): Promise<boolean> {
    // In production, integrate with threat intelligence services
    const suspiciousIPs = ['127.0.0.1']; // Placeholder
    return suspiciousIPs.includes(ip);
  }

  /**
   * Check if IP is from unusual location (placeholder implementation)
   */
  private async isIPFromUnusualLocation(ip: string): Promise<boolean> {
    // In production, use GeoIP services and user's typical locations
    return false; // Placeholder
  }

  /**
   * Get service by ID
   */
  getService(serviceId: string): ServiceIdentity | undefined {
    return this.services.get(serviceId);
  }

  /**
   * List all registered services
   */
  listServices(): ServiceIdentity[] {
    return Array.from(this.services.values());
  }

  /**
   * Add or update Zero Trust policy
   */
  setPolicy(policy: ZeroTrustPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): ZeroTrustPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * List all policies
   */
  listPolicies(): ZeroTrustPolicy[] {
    return Array.from(this.policies.values());
  }
}

// Singleton instance
export const zeroTrustManager = new ZeroTrustManager();

// Middleware for Zero Trust validation
export interface ZeroTrustMiddlewareOptions {
  requireServiceAuth?: boolean;
  requiredPermissions?: string[];
  sensitiveResource?: boolean;
}

export function createZeroTrustMiddleware(options: ZeroTrustMiddlewareOptions = {}) {
  return async (req: any, res: any, next: any) => {
    const requestId = generateSecureRandom.uuid();
    const serviceId = req.headers['x-service-id'] || 'unknown';
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];
    const targetResource = req.originalUrl || req.url;

    // Extract permissions from request context
    const permissions = req.user?.permissions || req.headers['x-permissions']?.split(',') || [];

    try {
      // Create trust context
      const trustContext = await zeroTrustManager.evaluateTrust({
        serviceId,
        requestId,
        timestamp: Date.now(),
        clientIP,
        userAgent,
        sourceService: req.headers['x-source-service'],
        targetResource,
        permissions,
      });

      // Add context to request
      req.zeroTrust = trustContext;

      // Check if access should be denied
      if (!trustContext.verified) {
        return res.status(403).json({
          error: 'Access denied by Zero Trust policy',
          requestId,
          riskScore: trustContext.riskScore,
        });
      }

      // Check service authentication if required
      if (options.requireServiceAuth) {
        const serviceToken = req.headers['x-service-token'];
        if (!serviceToken) {
          return res.status(401).json({
            error: 'Service authentication required',
            requestId,
          });
        }

        const sourceServiceId = req.headers['x-source-service'];
        const targetServiceId = serviceId;

        if (!zeroTrustManager.verifyServiceToken(serviceToken, sourceServiceId, targetServiceId)) {
          return res.status(401).json({
            error: 'Invalid service authentication',
            requestId,
          });
        }
      }

      // Check required permissions
      if (options.requiredPermissions?.length) {
        const hasPermissions = options.requiredPermissions.every(perm => 
          permissions.includes(perm)
        );

        if (!hasPermissions) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            requestId,
            required: options.requiredPermissions,
            actual: permissions,
          });
        }
      }

      // Log high-risk access
      if (trustContext.riskScore > 50) {
        console.warn(`High-risk access detected:`, {
          requestId,
          serviceId,
          clientIP,
          targetResource,
          riskScore: trustContext.riskScore,
        });
      }

      next();
    } catch (error) {
      console.error('Zero Trust evaluation failed:', error);
      res.status(500).json({
        error: 'Trust evaluation failed',
        requestId,
      });
    }
  };
} 