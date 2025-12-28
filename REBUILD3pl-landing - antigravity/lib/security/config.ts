// Enterprise Security Configuration for BlueShip Sync 3PL Platform

export interface SecurityConfig {
  // Zero Trust Configuration
  zeroTrust: {
    enableServiceAuth: boolean;
    mtlsEnabled: boolean;
    networkSegmentation: boolean;
    continuousValidation: boolean;
    trustExpirationTime: number; // seconds
  };

  // Authentication Configuration
  authentication: {
    mfa: {
      enabled: boolean;
      totpEnabled: boolean;
      biometricEnabled: boolean;
      backupCodesEnabled: boolean;
      gracePeriod: number; // seconds
    };
    sso: {
      enabled: boolean;
      samlEnabled: boolean;
      oauth2Enabled: boolean;
      allowedProviders: string[];
    };
    sessions: {
      accessTokenExpiry: number; // seconds
      refreshTokenExpiry: number; // seconds
      rotationEnabled: boolean;
      maxConcurrentSessions: number;
    };
  };

  // Data Protection Configuration
  dataProtection: {
    encryption: {
      algorithm: string;
      keyRotationInterval: number; // days
      e2eEnabled: boolean;
      databaseEncryption: boolean;
    };
    classification: {
      enabled: boolean;
      autoClassification: boolean;
      retentionPolicies: boolean;
    };
    storage: {
      encryptionAtRest: boolean;
      accessLogging: boolean;
      versionControl: boolean;
    };
  };

  // Audit and Compliance Configuration
  audit: {
    comprehensive: boolean;
    realTimeMonitoring: boolean;
    dataRetention: number; // days
    gdprCompliance: boolean;
    ccpaCompliance: boolean;
    soc2Preparation: boolean;
  };

  // Threat Protection Configuration
  threats: {
    ddosProtection: {
      enabled: boolean;
      rateLimit: number; // requests per minute
      ipBlacklisting: boolean;
      geoBlocking: string[]; // country codes
    };
    xssProtection: {
      enabled: boolean;
      contentSecurityPolicy: boolean;
      sanitization: boolean;
    };
    csrfProtection: {
      enabled: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      doubleSubmitCookie: boolean;
    };
    sqlInjection: {
      parameterizedQueries: boolean;
      inputValidation: boolean;
      queryLogging: boolean;
    };
  };

  // Monitoring Configuration
  monitoring: {
    securityDashboard: boolean;
    alerting: {
      enabled: boolean;
      channels: string[]; // email, slack, webhook
      severityLevels: string[];
    };
    incidentResponse: {
      enabled: boolean;
      autoResponse: boolean;
      escalationMatrix: boolean;
    };
  };
}

// Default enterprise security configuration
export const defaultSecurityConfig: SecurityConfig = {
  zeroTrust: {
    enableServiceAuth: true,
    mtlsEnabled: true,
    networkSegmentation: true,
    continuousValidation: true,
    trustExpirationTime: 3600, // 1 hour
  },

  authentication: {
    mfa: {
      enabled: true,
      totpEnabled: true,
      biometricEnabled: true,
      backupCodesEnabled: true,
      gracePeriod: 300, // 5 minutes
    },
    sso: {
      enabled: true,
      samlEnabled: true,
      oauth2Enabled: true,
      allowedProviders: ['google', 'microsoft', 'okta', 'auth0'],
    },
    sessions: {
      accessTokenExpiry: 900, // 15 minutes
      refreshTokenExpiry: 604800, // 7 days
      rotationEnabled: true,
      maxConcurrentSessions: 5,
    },
  },

  dataProtection: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 90, // days
      e2eEnabled: true,
      databaseEncryption: true,
    },
    classification: {
      enabled: true,
      autoClassification: true,
      retentionPolicies: true,
    },
    storage: {
      encryptionAtRest: true,
      accessLogging: true,
      versionControl: true,
    },
  },

  audit: {
    comprehensive: true,
    realTimeMonitoring: true,
    dataRetention: 2555, // 7 years for compliance
    gdprCompliance: true,
    ccpaCompliance: true,
    soc2Preparation: true,
  },

  threats: {
    ddosProtection: {
      enabled: true,
      rateLimit: 1000, // requests per minute
      ipBlacklisting: true,
      geoBlocking: [], // Configure based on business requirements
    },
    xssProtection: {
      enabled: true,
      contentSecurityPolicy: true,
      sanitization: true,
    },
    csrfProtection: {
      enabled: true,
      sameSite: 'strict',
      doubleSubmitCookie: true,
    },
    sqlInjection: {
      parameterizedQueries: true,
      inputValidation: true,
      queryLogging: true,
    },
  },

  monitoring: {
    securityDashboard: true,
    alerting: {
      enabled: true,
      channels: ['email', 'slack', 'webhook'],
      severityLevels: ['low', 'medium', 'high', 'critical'],
    },
    incidentResponse: {
      enabled: true,
      autoResponse: true,
      escalationMatrix: true,
    },
  },
};

// Environment-specific security configurations
export const getSecurityConfig = (): SecurityConfig => {
  const env = (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV) || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...defaultSecurityConfig,
        // Production-specific overrides
        authentication: {
          ...defaultSecurityConfig.authentication,
          sessions: {
            ...defaultSecurityConfig.authentication.sessions,
            accessTokenExpiry: 600, // 10 minutes in production
          },
        },
        threats: {
          ...defaultSecurityConfig.threats,
          ddosProtection: {
            ...defaultSecurityConfig.threats.ddosProtection,
            rateLimit: 500, // Stricter rate limiting in production
          },
        },
      };
    
    case 'staging':
      return {
        ...defaultSecurityConfig,
        audit: {
          ...defaultSecurityConfig.audit,
          dataRetention: 90, // Shorter retention for staging
        },
      };
    
    case 'development':
      return {
        ...defaultSecurityConfig,
        zeroTrust: {
          ...defaultSecurityConfig.zeroTrust,
          mtlsEnabled: false, // Disabled for easier development
        },
        audit: {
          ...defaultSecurityConfig.audit,
          dataRetention: 30, // Shorter retention for development
        },
      };
    
    default:
      return defaultSecurityConfig;
  }
};

// Security constants
export const SECURITY_CONSTANTS = {
  // Encryption keys and algorithms
  ENCRYPTION: {
    AES_KEY_LENGTH: 32,
    IV_LENGTH: 16,
    TAG_LENGTH: 16,
    SALT_LENGTH: 32,
    PBKDF2_ITERATIONS: 100000,
  },

  // Authentication constants
  AUTH: {
    BCRYPT_ROUNDS: 12,
    JWT_ALGORITHM: 'HS256' as const,
    TOTP_WINDOW: 1,
    TOTP_PERIOD: 30,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 900, // 15 minutes
  },

  // Security headers
  HEADERS: {
    CONTENT_SECURITY_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
    HSTS_MAX_AGE: 31536000, // 1 year
    REFERRER_POLICY: 'strict-origin-when-cross-origin' as const,
  },

  // Rate limiting
  RATE_LIMITS: {
    GLOBAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // requests per window
    },
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // login attempts per window
    },
    API: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // API calls per minute
    },
    SENSITIVE: {
      windowMs: 60 * 1000, // 1 minute
      max: 5, // sensitive operations per minute
    },
  },

  // Audit event types
  AUDIT_EVENTS: {
    AUTHENTICATION: {
      LOGIN_SUCCESS: 'auth.login.success',
      LOGIN_FAILURE: 'auth.login.failure',
      LOGOUT: 'auth.logout',
      MFA_ENABLED: 'auth.mfa.enabled',
      MFA_DISABLED: 'auth.mfa.disabled',
      PASSWORD_CHANGED: 'auth.password.changed',
      ACCOUNT_LOCKED: 'auth.account.locked',
    },
    AUTHORIZATION: {
      ACCESS_GRANTED: 'authz.access.granted',
      ACCESS_DENIED: 'authz.access.denied',
      ROLE_CHANGED: 'authz.role.changed',
      PERMISSION_GRANTED: 'authz.permission.granted',
      PERMISSION_REVOKED: 'authz.permission.revoked',
    },
    DATA: {
      CREATE: 'data.create',
      READ: 'data.read',
      UPDATE: 'data.update',
      DELETE: 'data.delete',
      EXPORT: 'data.export',
      IMPORT: 'data.import',
    },
    SECURITY: {
      THREAT_DETECTED: 'security.threat.detected',
      POLICY_VIOLATION: 'security.policy.violation',
      ENCRYPTION_KEY_ROTATED: 'security.encryption.key_rotated',
      SECURITY_SCAN_COMPLETED: 'security.scan.completed',
    },
    ADMIN: {
      CONFIG_CHANGED: 'admin.config.changed',
      USER_CREATED: 'admin.user.created',
      USER_DELETED: 'admin.user.deleted',
      BACKUP_CREATED: 'admin.backup.created',
      SYSTEM_MAINTENANCE: 'admin.system.maintenance',
    },
  },
} as const;

// Generate secure random values
export const generateSecureRandom = {
  /**
   * Generate cryptographically secure random bytes
   */
  bytes: (length: number): Uint8Array => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(length));
    }
    // Fallback for environments without crypto
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },

  /**
   * Generate secure random string
   */
  string: (length: number): string => {
    const bytes = generateSecureRandom.bytes(length);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Generate secure random UUID
   */
  uuid: (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback UUID v4 implementation
    const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return template.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Generate secure random integer
   */
  int: (min: number, max: number): number => {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const randomBytes = generateSecureRandom.bytes(bytesNeeded);
    const randomValue = randomBytes.reduce((acc: number, byte: number, index: number) => {
      return acc + byte * Math.pow(256, index);
    }, 0);
    
    return min + (randomValue % range);
  },
};

// Security utilities
export class SecurityUtils {
  /**
   * Validate security configuration
   */
  static validateConfig(config: SecurityConfig): boolean {
    // Validate encryption algorithm
    if (!['aes-256-gcm', 'aes-256-cbc'].includes(config.dataProtection.encryption.algorithm)) {
      throw new Error('Invalid encryption algorithm');
    }

    // Validate token expiry times
    if (config.authentication.sessions.accessTokenExpiry > config.authentication.sessions.refreshTokenExpiry) {
      throw new Error('Access token expiry cannot be greater than refresh token expiry');
    }

    // Validate rate limits
    if (config.threats.ddosProtection.rateLimit <= 0) {
      throw new Error('Rate limit must be positive');
    }

    return true;
  }

  /**
   * Get security headers for HTTP responses
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': `max-age=${SECURITY_CONSTANTS.HEADERS.HSTS_MAX_AGE}; includeSubDomains`,
      'Content-Security-Policy': SECURITY_CONSTANTS.HEADERS.CONTENT_SECURITY_POLICY,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': SECURITY_CONSTANTS.HEADERS.REFERRER_POLICY,
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate IP address format
   */
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Check if request origin is allowed
   */
  static isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false;
    return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  }
} 