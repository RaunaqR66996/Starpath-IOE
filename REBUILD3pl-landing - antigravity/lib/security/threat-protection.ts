// Threat Protection System for BlueShip Sync 3PL Platform
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { getSecurityConfig, generateSecureRandom, SecurityUtils, SECURITY_CONSTANTS } from './config';
import { auditComplianceManager } from './audit-compliance';

export interface ThreatSignature {
  id: string;
  name: string;
  type: 'xss' | 'sql_injection' | 'command_injection' | 'csrf' | 'ddos' | 'malware';
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  description: string;
  mitigation: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatEvent {
  id: string;
  timestamp: Date;
  type: 'blocked' | 'detected' | 'mitigated';
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  userAgent?: string;
  requestData: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    params?: Record<string, any>;
  };
  signatureId?: string;
  action: 'block' | 'log' | 'challenge' | 'rate_limit';
  details: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or identifier
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: 'ip' | 'user' | 'session' | 'custom';
  onLimitReached: 'block' | 'delay' | 'challenge';
  enabled: boolean;
}

export interface IPReputationData {
  ip: string;
  score: number; // 0-100, higher is worse
  category: 'clean' | 'suspicious' | 'malicious' | 'unknown';
  sources: string[];
  lastUpdated: Date;
  details: {
    isProxy?: boolean;
    isVPN?: boolean;
    isTor?: boolean;
    isDatacenter?: boolean;
    country?: string;
    asn?: number;
    threats?: string[];
  };
}

export interface CSRFToken {
  token: string;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  origin?: string;
}

export class ThreatProtectionManager {
  private threatSignatures: Map<string, ThreatSignature> = new Map();
  private threatEvents: ThreatEvent[] = [];
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private rateLimitCounts: Map<string, Map<string, number>> = new Map(); // ruleId -> key -> count
  private ipReputation: Map<string, IPReputationData> = new Map();
  private csrfTokens: Map<string, CSRFToken> = new Map();
  private blockedIPs: Set<string> = new Set();
  private config = getSecurityConfig();

  constructor() {
    this.initializeThreatSignatures();
    this.initializeRateLimitRules();
    this.startReputationUpdater();
    this.startCleanupScheduler();
  }

  /**
   * Comprehensive request validation and threat detection
   */
  async validateRequest(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
    params?: Record<string, any>;
    ip: string;
    userAgent?: string;
    userId?: string;
    sessionId?: string;
  }): Promise<{
    allowed: boolean;
    threats: string[];
    action: 'allow' | 'block' | 'challenge' | 'rate_limit';
    details?: Record<string, any>;
  }> {
    const threats: string[] = [];
    const detectedThreats: ThreatEvent[] = [];

    // 1. IP Reputation Check
    const ipCheck = await this.checkIPReputation(request.ip);
    if (!ipCheck.allowed) {
      threats.push(`IP reputation: ${ipCheck.reason}`);
      detectedThreats.push(await this.logThreatEvent({
        type: 'blocked',
        threatType: 'ip_reputation',
        severity: 'high',
        sourceIP: request.ip,
        userAgent: request.userAgent,
        requestData: request,
        action: 'block',
        details: ipCheck,
      }));
      return { allowed: false, threats, action: 'block', details: ipCheck };
    }

    // 2. Rate Limiting Check
    const rateLimitCheck = await this.checkRateLimits(request);
    if (!rateLimitCheck.allowed) {
      threats.push(`Rate limit exceeded: ${rateLimitCheck.rule}`);
      detectedThreats.push(await this.logThreatEvent({
        type: 'blocked',
        threatType: 'rate_limit',
        severity: 'medium',
        sourceIP: request.ip,
        userAgent: request.userAgent,
        requestData: request,
        action: 'rate_limit',
        details: rateLimitCheck,
        userId: request.userId,
        sessionId: request.sessionId,
      }));
      return { allowed: false, threats, action: 'rate_limit', details: rateLimitCheck };
    }

    // 3. XSS Detection
    const xssThreats = await this.detectXSS(request);
    if (xssThreats.length > 0) {
      threats.push(...xssThreats.map(t => `XSS: ${t.name}`));
      for (const threat of xssThreats) {
        detectedThreats.push(await this.logThreatEvent({
          type: 'blocked',
          threatType: 'xss',
          severity: threat.severity,
          sourceIP: request.ip,
          userAgent: request.userAgent,
          requestData: request,
          signatureId: threat.id,
          action: 'block',
          details: { signature: threat.name, pattern: threat.pattern },
          userId: request.userId,
          sessionId: request.sessionId,
        }));
      }
    }

    // 4. SQL Injection Detection
    const sqlThreats = await this.detectSQLInjection(request);
    if (sqlThreats.length > 0) {
      threats.push(...sqlThreats.map(t => `SQL Injection: ${t.name}`));
      for (const threat of sqlThreats) {
        detectedThreats.push(await this.logThreatEvent({
          type: 'blocked',
          threatType: 'sql_injection',
          severity: threat.severity,
          sourceIP: request.ip,
          userAgent: request.userAgent,
          requestData: request,
          signatureId: threat.id,
          action: 'block',
          details: { signature: threat.name, pattern: threat.pattern },
          userId: request.userId,
          sessionId: request.sessionId,
        }));
      }
    }

    // 5. CSRF Protection (for state-changing operations)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method.toUpperCase())) {
      const csrfCheck = await this.validateCSRFToken(request);
      if (!csrfCheck.valid) {
        threats.push(`CSRF: ${csrfCheck.reason}`);
        detectedThreats.push(await this.logThreatEvent({
          type: 'blocked',
          threatType: 'csrf',
          severity: 'high',
          sourceIP: request.ip,
          userAgent: request.userAgent,
          requestData: request,
          action: 'block',
          details: csrfCheck,
          userId: request.userId,
          sessionId: request.sessionId,
        }));
      }
    }

    // 6. Command Injection Detection
    const cmdThreats = await this.detectCommandInjection(request);
    if (cmdThreats.length > 0) {
      threats.push(...cmdThreats.map(t => `Command Injection: ${t.name}`));
      for (const threat of cmdThreats) {
        detectedThreats.push(await this.logThreatEvent({
          type: 'blocked',
          threatType: 'command_injection',
          severity: threat.severity,
          sourceIP: request.ip,
          userAgent: request.userAgent,
          requestData: request,
          signatureId: threat.id,
          action: 'block',
          details: { signature: threat.name },
          userId: request.userId,
          sessionId: request.sessionId,
        }));
      }
    }

    // 7. Malware/Suspicious Content Detection
    const malwareThreats = await this.detectMalware(request);
    if (malwareThreats.length > 0) {
      threats.push(...malwareThreats.map(t => `Malware: ${t.name}`));
      for (const threat of malwareThreats) {
        detectedThreats.push(await this.logThreatEvent({
          type: 'blocked',
          threatType: 'malware',
          severity: threat.severity,
          sourceIP: request.ip,
          userAgent: request.userAgent,
          requestData: request,
          signatureId: threat.id,
          action: 'block',
          details: { signature: threat.name },
          userId: request.userId,
          sessionId: request.sessionId,
        }));
      }
    }

    // If threats detected, determine action
    if (threats.length > 0) {
      const highSeverityThreats = detectedThreats.filter(t => 
        t.severity === 'critical' || t.severity === 'high'
      );
      
      if (highSeverityThreats.length > 0) {
        // Block immediately for high severity threats
        await this.blockIP(request.ip, 'High severity threat detected');
        return { allowed: false, threats, action: 'block' };
      } else {
        // Log and challenge for medium/low severity
        return { allowed: false, threats, action: 'challenge' };
      }
    }

    // No threats detected
    return { allowed: true, threats: [], action: 'allow' };
  }

  /**
   * Generate CSRF token for form protection
   */
  generateCSRFToken(sessionId: string, origin?: string): string {
    const token = generateSecureRandom.string(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const csrfToken: CSRFToken = {
      token,
      sessionId,
      createdAt: new Date(),
      expiresAt,
      used: false,
      origin,
    };

    this.csrfTokens.set(token, csrfToken);

    // Clean up old tokens for this session
    this.cleanupCSRFTokens(sessionId);

    return token;
  }

  /**
   * Validate CSRF token
   */
  async validateCSRFToken(request: {
    headers: Record<string, string>;
    body?: string;
    sessionId?: string;
  }): Promise<{ valid: boolean; reason?: string }> {
    if (!this.config.threats.csrfProtection.enabled) {
      return { valid: true };
    }

    const token = request.headers['x-csrf-token'] || 
                  request.headers['csrf-token'] ||
                  this.extractCSRFFromBody(request.body);

    if (!token) {
      return { valid: false, reason: 'CSRF token missing' };
    }

    const csrfToken = this.csrfTokens.get(token);
    if (!csrfToken) {
      return { valid: false, reason: 'Invalid CSRF token' };
    }

    if (csrfToken.used) {
      return { valid: false, reason: 'CSRF token already used' };
    }

    if (csrfToken.expiresAt < new Date()) {
      this.csrfTokens.delete(token);
      return { valid: false, reason: 'CSRF token expired' };
    }

    if (request.sessionId && csrfToken.sessionId !== request.sessionId) {
      return { valid: false, reason: 'CSRF token session mismatch' };
    }

    // Mark token as used (single-use)
    csrfToken.used = true;

    return { valid: true };
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string, allowedTags: string[] = []): string {
    if (!this.config.threats.xssProtection.sanitization) {
      return input;
    }

    let sanitized = SecurityUtils.sanitizeInput(input);

    // Allow specific tags if specified
    if (allowedTags.length > 0) {
      const allowedTagsRegex = new RegExp(
        `&lt;(/?(?:${allowedTags.join('|')}))&gt;`,
        'gi'
      );
      sanitized = sanitized.replace(allowedTagsRegex, '<$1>');
    }

    return sanitized;
  }

  /**
   * Block IP address
   */
  async blockIP(ip: string, reason: string, duration?: number): Promise<void> {
    this.blockedIPs.add(ip);

    // Auto-unblock after duration
    if (duration) {
      setTimeout(() => {
        this.blockedIPs.delete(ip);
      }, duration);
    }

    await auditComplianceManager.logAuditEvent({
      eventType: 'ip_blocked',
      category: 'security',
      severity: 'warning',
      ipAddress: ip,
      action: 'block_ip',
      outcome: 'success',
      details: { reason, duration },
      dataClassification: 'internal',
    });
  }

  /**
   * Get threat statistics
   */
  getThreatStatistics(timeframe: 'hour' | 'day' | 'week' = 'day'): {
    totalThreats: number;
    threatsBlocked: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
    topAttackingIPs: Array<{ ip: string; count: number }>;
    threatTrends: Array<{ timestamp: Date; count: number }>;
  } {
    const now = new Date();
    const timeframeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    }[timeframe];

    const recentEvents = this.threatEvents.filter(event =>
      event.timestamp.getTime() > now.getTime() - timeframeMs
    );

    const threatsByType: Record<string, number> = {};
    const threatsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    recentEvents.forEach(event => {
      threatsByType[event.threatType] = (threatsByType[event.threatType] || 0) + 1;
      threatsBySeverity[event.severity] = (threatsBySeverity[event.severity] || 0) + 1;
      ipCounts[event.sourceIP] = (ipCounts[event.sourceIP] || 0) + 1;
    });

    const topAttackingIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Generate hourly trend data
    const trendBuckets = timeframe === 'hour' ? 60 : 24; // minutes or hours
    const bucketSize = timeframeMs / trendBuckets;
    const threatTrends: Array<{ timestamp: Date; count: number }> = [];

    for (let i = 0; i < trendBuckets; i++) {
      const bucketStart = new Date(now.getTime() - ((trendBuckets - i) * bucketSize));
      const bucketEnd = new Date(bucketStart.getTime() + bucketSize);
      
      const count = recentEvents.filter(event =>
        event.timestamp >= bucketStart && event.timestamp < bucketEnd
      ).length;

      threatTrends.push({ timestamp: bucketStart, count });
    }

    return {
      totalThreats: recentEvents.length,
      threatsBlocked: recentEvents.filter(e => e.action === 'block').length,
      threatsByType,
      threatsBySeverity,
      topAttackingIPs,
      threatTrends,
    };
  }

  // Private helper methods

  private async checkIPReputation(ip: string): Promise<{ allowed: boolean; reason?: string; score?: number }> {
    // Check if IP is in blocked list
    if (this.blockedIPs.has(ip)) {
      return { allowed: false, reason: 'IP is blocked' };
    }

    // Get reputation data
    const reputation = this.ipReputation.get(ip);
    if (reputation) {
      if (reputation.category === 'malicious') {
        return { allowed: false, reason: 'Malicious IP', score: reputation.score };
      }
      if (reputation.score > 80) {
        return { allowed: false, reason: 'High risk IP', score: reputation.score };
      }
    }

    // Check for private/internal IPs
    if (this.isPrivateIP(ip)) {
      return { allowed: true };
    }

    return { allowed: true };
  }

  private async checkRateLimits(request: any): Promise<{ allowed: boolean; rule?: string; remaining?: number }> {
    for (const rule of this.rateLimitRules.values()) {
      if (!rule.enabled) continue;

      const urlMatches = new RegExp(rule.pattern).test(request.url);
      if (!urlMatches) continue;

      const key = this.generateRateLimitKey(rule, request);
      const windowStart = Math.floor(Date.now() / rule.windowMs) * rule.windowMs;
      const countKey = `${rule.id}:${key}:${windowStart}`;

      let ruleCounts = this.rateLimitCounts.get(rule.id);
      if (!ruleCounts) {
        ruleCounts = new Map();
        this.rateLimitCounts.set(rule.id, ruleCounts);
      }

      const currentCount = ruleCounts.get(countKey) || 0;
      if (currentCount >= rule.maxRequests) {
        return { allowed: false, rule: rule.name, remaining: 0 };
      }

      // Increment counter
      ruleCounts.set(countKey, currentCount + 1);

      // Schedule cleanup
      setTimeout(() => {
        ruleCounts?.delete(countKey);
      }, rule.windowMs);

      return { allowed: true, remaining: rule.maxRequests - currentCount - 1 };
    }

    return { allowed: true };
  }

  private async detectXSS(request: any): Promise<ThreatSignature[]> {
    const threats: ThreatSignature[] = [];
    const xssSignatures = Array.from(this.threatSignatures.values()).filter(s => 
      s.type === 'xss' && s.enabled
    );

    const testStrings = [
      request.url,
      request.body || '',
      ...Object.values(request.params || {}),
      ...Object.values(request.headers),
    ].filter(str => typeof str === 'string');

    for (const signature of xssSignatures) {
      const regex = new RegExp(signature.pattern, 'i');
      for (const testString of testStrings) {
        if (regex.test(testString)) {
          threats.push(signature);
          break;
        }
      }
    }

    return threats;
  }

  private async detectSQLInjection(request: any): Promise<ThreatSignature[]> {
    const threats: ThreatSignature[] = [];
    const sqlSignatures = Array.from(this.threatSignatures.values()).filter(s => 
      s.type === 'sql_injection' && s.enabled
    );

    const testStrings = [
      request.url,
      request.body || '',
      ...Object.values(request.params || {}),
    ].filter(str => typeof str === 'string');

    for (const signature of sqlSignatures) {
      const regex = new RegExp(signature.pattern, 'i');
      for (const testString of testStrings) {
        if (regex.test(testString)) {
          threats.push(signature);
          break;
        }
      }
    }

    return threats;
  }

  private async detectCommandInjection(request: any): Promise<ThreatSignature[]> {
    const threats: ThreatSignature[] = [];
    const cmdSignatures = Array.from(this.threatSignatures.values()).filter(s => 
      s.type === 'command_injection' && s.enabled
    );

    const testStrings = [
      request.body || '',
      ...Object.values(request.params || {}),
    ].filter(str => typeof str === 'string');

    for (const signature of cmdSignatures) {
      const regex = new RegExp(signature.pattern, 'i');
      for (const testString of testStrings) {
        if (regex.test(testString)) {
          threats.push(signature);
          break;
        }
      }
    }

    return threats;
  }

  private async detectMalware(request: any): Promise<ThreatSignature[]> {
    const threats: ThreatSignature[] = [];
    const malwareSignatures = Array.from(this.threatSignatures.values()).filter(s => 
      s.type === 'malware' && s.enabled
    );

    // Check user agent and headers for malware indicators
    const testStrings = [
      request.userAgent || '',
      ...Object.values(request.headers),
    ].filter(str => typeof str === 'string');

    for (const signature of malwareSignatures) {
      const regex = new RegExp(signature.pattern, 'i');
      for (const testString of testStrings) {
        if (regex.test(testString)) {
          threats.push(signature);
          break;
        }
      }
    }

    return threats;
  }

  private async logThreatEvent(event: Omit<ThreatEvent, 'id' | 'timestamp'>): Promise<ThreatEvent> {
    const threatEvent: ThreatEvent = {
      ...event,
      id: generateSecureRandom.uuid(),
      timestamp: new Date(),
    };

    this.threatEvents.push(threatEvent);

    // Log to audit system
    await auditComplianceManager.logAuditEvent({
      eventType: SECURITY_CONSTANTS.AUDIT_EVENTS.SECURITY.THREAT_DETECTED,
      category: 'security',
      severity: event.severity === 'critical' ? 'critical' : 'warning',
      userId: event.userId,
      sessionId: event.sessionId,
      ipAddress: event.sourceIP,
      userAgent: event.userAgent,
      resourceType: 'threat_event',
      resourceId: threatEvent.id,
      action: 'threat_detected',
      outcome: 'success',
      details: {
        threatType: event.threatType,
        action: event.action,
        signatureId: event.signatureId,
        ...event.details,
      },
      dataClassification: 'internal',
    });

    return threatEvent;
  }

  private generateRateLimitKey(rule: RateLimitRule, request: any): string {
    switch (rule.keyGenerator) {
      case 'user':
        return request.userId || request.ip;
      case 'session':
        return request.sessionId || request.ip;
      case 'ip':
      default:
        return request.ip;
    }
  }

  private extractCSRFFromBody(body?: string): string | null {
    if (!body) return null;
    
    try {
      const parsed = JSON.parse(body);
      return parsed._csrf || parsed.csrfToken || null;
    } catch {
      // Try form-encoded data
      const match = body.match(/(?:_csrf|csrfToken)=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
  }

  private cleanupCSRFTokens(sessionId: string): void {
    const now = new Date();
    for (const [token, csrfToken] of this.csrfTokens.entries()) {
      if (csrfToken.sessionId === sessionId && 
          (csrfToken.used || csrfToken.expiresAt < now)) {
        this.csrfTokens.delete(token);
      }
    }
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
    ];

    return privateRanges.some(range => range.test(ip));
  }

  private initializeThreatSignatures(): void {
    const signatures: Omit<ThreatSignature, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // XSS Signatures
      {
        name: 'Script Tag Injection',
        type: 'xss',
        pattern: '<script[^>]*>.*?</script>',
        severity: 'high',
        enabled: true,
        description: 'Detects script tag injection attempts',
        mitigation: 'Input sanitization and CSP headers',
      },
      {
        name: 'JavaScript Event Handler',
        type: 'xss',
        pattern: 'on\\w+\\s*=',
        severity: 'medium',
        enabled: true,
        description: 'Detects JavaScript event handler injection',
        mitigation: 'HTML entity encoding',
      },
      {
        name: 'JavaScript Protocol',
        type: 'xss',
        pattern: 'javascript:',
        severity: 'medium',
        enabled: true,
        description: 'Detects javascript: protocol usage',
        mitigation: 'URL validation and whitelist',
      },

      // SQL Injection Signatures
      {
        name: 'Union-based SQL Injection',
        type: 'sql_injection',
        pattern: '\\b(union|union\\s+all)\\s+select\\b',
        severity: 'critical',
        enabled: true,
        description: 'Detects UNION-based SQL injection',
        mitigation: 'Parameterized queries',
      },
      {
        name: 'Boolean-based SQL Injection',
        type: 'sql_injection',
        pattern: '\\b(and|or)\\s+\\d+\\s*=\\s*\\d+',
        severity: 'high',
        enabled: true,
        description: 'Detects boolean-based SQL injection',
        mitigation: 'Input validation and prepared statements',
      },
      {
        name: 'SQL Comment Injection',
        type: 'sql_injection',
        pattern: '(--|#|/\\*|\\*/)',
        severity: 'medium',
        enabled: true,
        description: 'Detects SQL comment injection',
        mitigation: 'Input sanitization',
      },

      // Command Injection Signatures
      {
        name: 'Shell Command Injection',
        type: 'command_injection',
        pattern: '[;&|`$()]|\\b(cat|ls|pwd|whoami|id|uname)\\b',
        severity: 'critical',
        enabled: true,
        description: 'Detects shell command injection attempts',
        mitigation: 'Input validation and avoid shell execution',
      },
      {
        name: 'PowerShell Command Injection',
        type: 'command_injection',
        pattern: '\\b(powershell|cmd|exec|system)\\b',
        severity: 'high',
        enabled: true,
        description: 'Detects PowerShell command injection',
        mitigation: 'Strict input validation',
      },

      // Malware Signatures
      {
        name: 'Suspicious User Agent',
        type: 'malware',
        pattern: '(sqlmap|nmap|nikto|wget|curl.*bot|scanner)',
        severity: 'medium',
        enabled: true,
        description: 'Detects suspicious user agents',
        mitigation: 'User agent filtering',
      },
      {
        name: 'Malicious File Upload',
        type: 'malware',
        pattern: '\\.(php|jsp|asp|exe|bat|sh|py)$',
        severity: 'high',
        enabled: true,
        description: 'Detects potentially malicious file uploads',
        mitigation: 'File type validation and sandboxing',
      },
    ];

    signatures.forEach(sig => {
      const id = generateSecureRandom.uuid();
      const signature: ThreatSignature = {
        ...sig,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.threatSignatures.set(id, signature);
    });
  }

  private initializeRateLimitRules(): void {
    const rules: Omit<RateLimitRule, 'id'>[] = [
      {
        name: 'Global API Rate Limit',
        pattern: '/api/.*',
        windowMs: SECURITY_CONSTANTS.RATE_LIMITS.API.windowMs,
        maxRequests: SECURITY_CONSTANTS.RATE_LIMITS.API.max,
        keyGenerator: 'ip',
        onLimitReached: 'block',
        enabled: true,
      },
      {
        name: 'Authentication Rate Limit',
        pattern: '/api/auth/.*',
        windowMs: SECURITY_CONSTANTS.RATE_LIMITS.AUTH.windowMs,
        maxRequests: SECURITY_CONSTANTS.RATE_LIMITS.AUTH.max,
        keyGenerator: 'ip',
        onLimitReached: 'block',
        enabled: true,
      },
      {
        name: 'Sensitive Operations Rate Limit',
        pattern: '/api/(admin|export|backup)/.*',
        windowMs: SECURITY_CONSTANTS.RATE_LIMITS.SENSITIVE.windowMs,
        maxRequests: SECURITY_CONSTANTS.RATE_LIMITS.SENSITIVE.max,
        keyGenerator: 'user',
        onLimitReached: 'challenge',
        enabled: true,
      },
    ];

    rules.forEach(rule => {
      const id = generateSecureRandom.uuid();
      this.rateLimitRules.set(id, { ...rule, id });
    });
  }

  private startReputationUpdater(): void {
    // Update IP reputation data every 4 hours
    setInterval(() => {
      this.updateIPReputation();
    }, 4 * 60 * 60 * 1000);
  }

  private startCleanupScheduler(): void {
    // Clean up old threat events and rate limit data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }

  private async updateIPReputation(): Promise<void> {
    // In production, integrate with threat intelligence feeds
    console.log('Updating IP reputation data...');
    
    // Placeholder for threat intel integration
    // const threatIntelData = await fetchThreatIntelligence();
    // this.processReputationData(threatIntelData);
  }

  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    // Clean up old threat events
    this.threatEvents = this.threatEvents.filter(event => 
      event.timestamp > cutoffTime
    );

    // Clean up expired CSRF tokens
    for (const [token, csrfToken] of this.csrfTokens.entries()) {
      if (csrfToken.expiresAt < new Date()) {
        this.csrfTokens.delete(token);
      }
    }

    // Clean up old rate limit counters
    for (const [ruleId, ruleCounts] of this.rateLimitCounts.entries()) {
      for (const [countKey] of ruleCounts.entries()) {
        const [, , windowStart] = countKey.split(':');
        if (parseInt(windowStart) < cutoffTime.getTime()) {
          ruleCounts.delete(countKey);
        }
      }
    }
  }

  /**
   * Add custom threat signature
   */
  addThreatSignature(signature: Omit<ThreatSignature, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = generateSecureRandom.uuid();
    const fullSignature: ThreatSignature = {
      ...signature,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.threatSignatures.set(id, fullSignature);
    return id;
  }

  /**
   * Remove threat signature
   */
  removeThreatSignature(signatureId: string): boolean {
    return this.threatSignatures.delete(signatureId);
  }

  /**
   * Add rate limit rule
   */
  addRateLimitRule(rule: Omit<RateLimitRule, 'id'>): string {
    const id = generateSecureRandom.uuid();
    this.rateLimitRules.set(id, { ...rule, id });
    return id;
  }

  /**
   * Get recent threat events
   */
  getRecentThreatEvents(limit: number = 100): ThreatEvent[] {
    return this.threatEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get threat signatures
   */
  getThreatSignatures(): ThreatSignature[] {
    return Array.from(this.threatSignatures.values());
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  /**
   * Unblock IP
   */
  unblockIP(ip: string): boolean {
    return this.blockedIPs.delete(ip);
  }
}

// Singleton instance
export const threatProtectionManager = new ThreatProtectionManager();

// Middleware for Express.js integration
export function createThreatProtectionMiddleware() {
  return async (req: any, res: any, next: any) => {
    const request = {
      method: req.method,
      url: req.originalUrl || req.url,
      headers: req.headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
      params: { ...req.params, ...req.query },
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      sessionId: req.sessionID,
    };

    try {
      const validation = await threatProtectionManager.validateRequest(request);
      
      if (!validation.allowed) {
        const statusCode = validation.action === 'rate_limit' ? 429 : 403;
        return res.status(statusCode).json({
          error: 'Request blocked by security policy',
          action: validation.action,
          threats: validation.threats,
          details: validation.details,
        });
      }

      // Add security headers
      const securityHeaders = SecurityUtils.getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      next();
    } catch (error) {
      console.error('Threat protection error:', error);
      res.status(500).json({ error: 'Security validation failed' });
    }
  };
} 