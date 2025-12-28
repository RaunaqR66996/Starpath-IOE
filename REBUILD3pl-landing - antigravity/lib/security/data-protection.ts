// Data Protection System for BlueShip Sync 3PL Platform
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync, createHash } from 'crypto';
import { getSecurityConfig, generateSecureRandom, SECURITY_CONSTANTS } from './config';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export interface EncryptionKey {
  id: string;
  algorithm: string;
  key: string;
  iv?: string;
  salt?: string;
  createdAt: Date;
  expiresAt: Date;
  version: number;
  active: boolean;
}

export interface EncryptedData {
  data: string;
  keyId: string;
  algorithm: string;
  iv: string;
  tag?: string;
  metadata: {
    classification: DataClassification;
    encryptedAt: Date;
    version: number;
  };
}

export interface DataClassificationRule {
  id: string;
  name: string;
  description: string;
  pattern: string; // Regex pattern
  classification: DataClassification;
  dataType: 'email' | 'phone' | 'ssn' | 'credit_card' | 'address' | 'custom';
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PIIField {
  tableName: string;
  columnName: string;
  classification: DataClassification;
  encryptionRequired: boolean;
  retentionDays?: number;
  accessLog: boolean;
}

export interface DataAccessLog {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  action: 'read' | 'write' | 'delete' | 'export';
  dataClassification: DataClassification;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  justification?: string;
  approved: boolean;
}

export class DataProtectionManager {
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private classificationRules: Map<string, DataClassificationRule> = new Map();
  private piiFields: Map<string, PIIField[]> = new Map(); // tableName -> fields
  private accessLogs: DataAccessLog[] = [];
  private config = getSecurityConfig();

  constructor() {
    this.initializeEncryptionKeys();
    this.initializeClassificationRules();
    this.initializePIIFields();
    this.startKeyRotationScheduler();
  }

  /**
   * Encrypt sensitive data with automatic classification
   */
  async encryptData(
    data: string, 
    classification?: DataClassification,
    additionalContext?: Record<string, any>
  ): Promise<EncryptedData> {
    // Auto-classify if not provided
    if (!classification) {
      classification = await this.classifyData(data);
    }

    // Get appropriate encryption key
    const key = this.getEncryptionKeyForClassification(classification);
    if (!key) {
      throw new Error(`No encryption key available for classification: ${classification}`);
    }

    // Generate IV for each encryption
    const iv = randomBytes(SECURITY_CONSTANTS.ENCRYPTION.IV_LENGTH);
    
    let encryptedData: string;
    let tag: string | undefined;

    if (key.algorithm === 'aes-256-gcm') {
      // AES-GCM provides authentication
      const result = await this.encryptAESGCM(data, key.key, iv);
      encryptedData = result.encrypted;
      tag = result.tag;
    } else {
      // Fallback to AES-CBC
      encryptedData = await this.encryptAESCBC(data, key.key, iv);
    }

    const encrypted: EncryptedData = {
      data: encryptedData,
      keyId: key.id,
      algorithm: key.algorithm,
      iv: iv.toString('hex'),
      tag,
      metadata: {
        classification,
        encryptedAt: new Date(),
        version: 1,
      },
    };

    return encrypted;
  }

  /**
   * Decrypt data with access logging
   */
  async decryptData(
    encryptedData: EncryptedData,
    userId: string,
    justification?: string
  ): Promise<string> {
    const key = this.encryptionKeys.get(encryptedData.keyId);
    if (!key || !key.active) {
      throw new Error('Encryption key not found or inactive');
    }

    // Log data access
    await this.logDataAccess({
      userId,
      resourceType: 'encrypted_data',
      resourceId: encryptedData.keyId,
      action: 'read',
      dataClassification: encryptedData.metadata.classification,
      justification,
    });

    const iv = Buffer.from(encryptedData.iv, 'hex');
    let decryptedData: string;

    if (encryptedData.algorithm === 'aes-256-gcm') {
      if (!encryptedData.tag) {
        throw new Error('Authentication tag required for AES-GCM');
      }
      decryptedData = await this.decryptAESGCM(
        encryptedData.data, 
        key.key, 
        iv, 
        encryptedData.tag
      );
    } else {
      decryptedData = await this.decryptAESCBC(encryptedData.data, key.key, iv);
    }

    return decryptedData;
  }

  /**
   * Encrypt database field
   */
  async encryptDatabaseField(
    tableName: string,
    columnName: string,
    value: string,
    userId: string
  ): Promise<string> {
    const piiField = this.getPIIField(tableName, columnName);
    if (!piiField) {
      // Not a PII field, return as-is
      return value;
    }

    if (!piiField.encryptionRequired) {
      return value;
    }

    // Log the encryption operation
    await this.logDataAccess({
      userId,
      resourceType: 'database_field',
      resourceId: `${tableName}.${columnName}`,
      action: 'write',
      dataClassification: piiField.classification,
    });

    const encrypted = await this.encryptData(value, piiField.classification);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt database field
   */
  async decryptDatabaseField(
    tableName: string,
    columnName: string,
    encryptedValue: string,
    userId: string,
    justification?: string
  ): Promise<string> {
    const piiField = this.getPIIField(tableName, columnName);
    if (!piiField || !piiField.encryptionRequired) {
      // Not encrypted, return as-is
      return encryptedValue;
    }

    try {
      const encrypted: EncryptedData = JSON.parse(encryptedValue);
      return await this.decryptData(encrypted, userId, justification);
    } catch (error) {
      console.error('Failed to decrypt database field:', error);
      return '[ENCRYPTED]';
    }
  }

  /**
   * Auto-classify data based on patterns
   */
  async classifyData(data: string): Promise<DataClassification> {
    // Sort rules by priority (higher priority first)
    const sortedRules = Array.from(this.classificationRules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(data)) {
        console.log(`Data classified as ${rule.classification} by rule: ${rule.name}`);
        return rule.classification;
      }
    }

    // Default classification for unmatched data
    return 'internal';
  }

  /**
   * Bulk classify and protect data
   */
  async protectDataBatch(
    dataItems: Array<{ id: string; data: string; context?: Record<string, any> }>
  ): Promise<Array<{ id: string; encrypted: EncryptedData; classification: DataClassification }>> {
    const results = [];

    for (const item of dataItems) {
      const classification = await this.classifyData(item.data);
      const encrypted = await this.encryptData(item.data, classification, item.context);
      
      results.push({
        id: item.id,
        encrypted,
        classification,
      });
    }

    return results;
  }

  /**
   * Generate data classification report
   */
  async generateClassificationReport(): Promise<{
    summary: Record<DataClassification, number>;
    byDataType: Record<string, Record<DataClassification, number>>;
    recentAccess: DataAccessLog[];
  }> {
    const summary: Record<DataClassification, number> = {
      public: 0,
      internal: 0,
      confidential: 0,
      restricted: 0,
      top_secret: 0,
    };

    const byDataType: Record<string, Record<DataClassification, number>> = {};

    // Analyze access logs for classification distribution
    const recentAccess = this.accessLogs
      .filter(log => log.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .slice(0, 100);

    recentAccess.forEach(log => {
      summary[log.dataClassification]++;
      
      if (!byDataType[log.resourceType]) {
        byDataType[log.resourceType] = {
          public: 0,
          internal: 0,
          confidential: 0,
          restricted: 0,
          top_secret: 0,
        };
      }
      byDataType[log.resourceType][log.dataClassification]++;
    });

    return { summary, byDataType, recentAccess };
  }

  /**
   * Get data retention policy
   */
  getRetentionPolicy(classification: DataClassification): {
    retentionDays: number;
    requiresApprovalToDelete: boolean;
    backupRequired: boolean;
  } {
    switch (classification) {
      case 'top_secret':
        return {
          retentionDays: 2555, // 7 years
          requiresApprovalToDelete: true,
          backupRequired: true,
        };
      case 'restricted':
        return {
          retentionDays: 1825, // 5 years
          requiresApprovalToDelete: true,
          backupRequired: true,
        };
      case 'confidential':
        return {
          retentionDays: 1095, // 3 years
          requiresApprovalToDelete: false,
          backupRequired: true,
        };
      case 'internal':
        return {
          retentionDays: 365, // 1 year
          requiresApprovalToDelete: false,
          backupRequired: false,
        };
      case 'public':
        return {
          retentionDays: 90, // 3 months
          requiresApprovalToDelete: false,
          backupRequired: false,
        };
    }
  }

  /**
   * Hash sensitive data for searching
   */
  hashForSearch(data: string, salt?: string): string {
    const actualSalt = salt || generateSecureRandom.string(SECURITY_CONSTANTS.ENCRYPTION.SALT_LENGTH);
    return pbkdf2Sync(data, actualSalt, SECURITY_CONSTANTS.ENCRYPTION.PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
  }

  /**
   * Create searchable hash with privacy preservation
   */
  createSearchableHash(data: string): { hash: string; salt: string } {
    const salt = generateSecureRandom.string(SECURITY_CONSTANTS.ENCRYPTION.SALT_LENGTH);
    const hash = this.hashForSearch(data, salt);
    return { hash, salt };
  }

  // Private helper methods

  private initializeEncryptionKeys(): void {
    // Create default encryption keys for each classification level
    const classifications: DataClassification[] = ['public', 'internal', 'confidential', 'restricted', 'top_secret'];
    
    classifications.forEach(classification => {
      const key: EncryptionKey = {
        id: generateSecureRandom.uuid(),
        algorithm: this.config.dataProtection.encryption.algorithm,
        key: this.generateEncryptionKey(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.dataProtection.encryption.keyRotationInterval * 24 * 60 * 60 * 1000),
        version: 1,
        active: true,
      };
      
      this.encryptionKeys.set(`${classification}-current`, key);
    });
  }

  private initializeClassificationRules(): void {
    const rules: Omit<DataClassificationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // Social Security Numbers
      {
        name: 'SSN Detection',
        description: 'Detect US Social Security Numbers',
        pattern: '\\b\\d{3}-?\\d{2}-?\\d{4}\\b',
        classification: 'restricted',
        dataType: 'ssn',
        enabled: true,
        priority: 100,
      },
      // Credit Card Numbers
      {
        name: 'Credit Card Detection',
        description: 'Detect credit card numbers',
        pattern: '\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b',
        classification: 'restricted',
        dataType: 'credit_card',
        enabled: true,
        priority: 95,
      },
      // Email Addresses
      {
        name: 'Email Detection',
        description: 'Detect email addresses',
        pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
        classification: 'confidential',
        dataType: 'email',
        enabled: true,
        priority: 80,
      },
      // Phone Numbers
      {
        name: 'Phone Number Detection',
        description: 'Detect phone numbers',
        pattern: '\\b(?:\\+?1[-.]?)?\\(?\\d{3}\\)?[-.]?\\d{3}[-.]?\\d{4}\\b',
        classification: 'confidential',
        dataType: 'phone',
        enabled: true,
        priority: 75,
      },
      // Addresses
      {
        name: 'Address Detection',
        description: 'Detect physical addresses',
        pattern: '\\d+\\s+[A-Za-z0-9\\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)',
        classification: 'confidential',
        dataType: 'address',
        enabled: true,
        priority: 70,
      },
      // API Keys
      {
        name: 'API Key Detection',
        description: 'Detect API keys and tokens',
        pattern: '(?:api[_-]?key|access[_-]?token|secret[_-]?key)[\'\"\\s]*[=:][\'\"\\s]*[A-Za-z0-9+/=]{20,}',
        classification: 'top_secret',
        dataType: 'custom',
        enabled: true,
        priority: 110,
      },
    ];

    rules.forEach(rule => {
      const fullRule: DataClassificationRule = {
        ...rule,
        id: generateSecureRandom.uuid(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.classificationRules.set(fullRule.id, fullRule);
    });
  }

  private initializePIIFields(): void {
    // Define PII fields that require encryption
    const piiFieldConfigs: PIIField[] = [
      // User table
      { tableName: 'users', columnName: 'email', classification: 'confidential', encryptionRequired: false, accessLog: true },
      { tableName: 'users', columnName: 'phone', classification: 'confidential', encryptionRequired: true, accessLog: true },
      { tableName: 'users', columnName: 'ssn', classification: 'restricted', encryptionRequired: true, accessLog: true, retentionDays: 2555 },
      
      // Customer table
      { tableName: 'customers', columnName: 'email', classification: 'confidential', encryptionRequired: false, accessLog: true },
      { tableName: 'customers', columnName: 'phone', classification: 'confidential', encryptionRequired: true, accessLog: true },
      { tableName: 'customers', columnName: 'address', classification: 'confidential', encryptionRequired: true, accessLog: true },
      { tableName: 'customers', columnName: 'tax_id', classification: 'restricted', encryptionRequired: true, accessLog: true },
      
      // Payment table
      { tableName: 'payments', columnName: 'card_number', classification: 'restricted', encryptionRequired: true, accessLog: true, retentionDays: 1095 },
      { tableName: 'payments', columnName: 'cvv', classification: 'restricted', encryptionRequired: true, accessLog: true, retentionDays: 90 },
      { tableName: 'payments', columnName: 'bank_account', classification: 'restricted', encryptionRequired: true, accessLog: true },
      
      // Document table
      { tableName: 'documents', columnName: 'content', classification: 'confidential', encryptionRequired: true, accessLog: true },
      { tableName: 'documents', columnName: 'metadata', classification: 'internal', encryptionRequired: false, accessLog: true },
    ];

    piiFieldConfigs.forEach(field => {
      if (!this.piiFields.has(field.tableName)) {
        this.piiFields.set(field.tableName, []);
      }
      this.piiFields.get(field.tableName)!.push(field);
    });
  }

  private generateEncryptionKey(): string {
    return randomBytes(SECURITY_CONSTANTS.ENCRYPTION.AES_KEY_LENGTH).toString('hex');
  }

  private getEncryptionKeyForClassification(classification: DataClassification): EncryptionKey | undefined {
    return this.encryptionKeys.get(`${classification}-current`);
  }

  private getPIIField(tableName: string, columnName: string): PIIField | undefined {
    const tableFields = this.piiFields.get(tableName);
    return tableFields?.find(field => field.columnName === columnName);
  }

  private async encryptAESGCM(data: string, key: string, iv: Buffer): Promise<{ encrypted: string; tag: string }> {
    try {
      // Use Web Crypto API if available, fallback to Node.js crypto
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const keyBuffer = Buffer.from(key, 'hex');
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt']
        );

        const result = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          Buffer.from(data, 'utf8')
        );

        const encrypted = Buffer.from(result).toString('hex');
        const tag = encrypted.slice(-32); // Last 16 bytes as hex
        const ciphertext = encrypted.slice(0, -32);

        return { encrypted: ciphertext, tag };
      } else {
        // Fallback implementation
        const keyBuffer = Buffer.from(key, 'hex');
        const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = (cipher as any).getAuthTag().toString('hex');
        return { encrypted, tag };
      }
    } catch (error) {
      console.error('AES-GCM encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  private async decryptAESGCM(encryptedData: string, key: string, iv: Buffer, tag: string): Promise<string> {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const keyBuffer = Buffer.from(key, 'hex');
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );

        const ciphertext = Buffer.from(encryptedData + tag, 'hex');
        const result = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          cryptoKey,
          ciphertext
        );

        return Buffer.from(result).toString('utf8');
      } else {
        // Fallback implementation
        const keyBuffer = Buffer.from(key, 'hex');
        const decipher = createDecipheriv('aes-256-gcm', keyBuffer, iv);
        (decipher as any).setAuthTag(Buffer.from(tag, 'hex'));
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }
    } catch (error) {
      console.error('AES-GCM decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  private async encryptAESCBC(data: string, key: string, iv: Buffer): Promise<string> {
    const keyBuffer = Buffer.from(key, 'hex');
    const cipher = createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private async decryptAESCBC(encryptedData: string, key: string, iv: Buffer): Promise<string> {
    const keyBuffer = Buffer.from(key, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', keyBuffer, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async logDataAccess(params: Omit<DataAccessLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'approved'>): Promise<void> {
    const log: DataAccessLog = {
      ...params,
      id: generateSecureRandom.uuid(),
      timestamp: new Date(),
      ipAddress: 'unknown', // Would be populated from request context
      userAgent: 'unknown', // Would be populated from request context
      approved: true, // Implement approval workflow as needed
    };

    this.accessLogs.push(log);

    // Keep only recent logs in memory (in production, store in database)
    if (this.accessLogs.length > 10000) {
      this.accessLogs = this.accessLogs.slice(-5000);
    }

    // Log high-sensitivity access
    if (params.dataClassification === 'restricted' || params.dataClassification === 'top_secret') {
      console.warn('High-sensitivity data access:', {
        userId: params.userId,
        resourceType: params.resourceType,
        classification: params.dataClassification,
        action: params.action,
        timestamp: log.timestamp,
      });
    }
  }

  private startKeyRotationScheduler(): void {
    // Rotate encryption keys based on configured interval
    const rotationInterval = this.config.dataProtection.encryption.keyRotationInterval * 24 * 60 * 60 * 1000;
    
    setInterval(() => {
      this.rotateEncryptionKeys();
    }, rotationInterval);
  }

  private rotateEncryptionKeys(): void {
    console.log('Starting encryption key rotation...');
    
    for (const [keyId, key] of this.encryptionKeys.entries()) {
      if (key.expiresAt < new Date()) {
        // Mark old key as inactive
        key.active = false;
        
        // Create new key
        const newKey: EncryptionKey = {
          id: generateSecureRandom.uuid(),
          algorithm: key.algorithm,
          key: this.generateEncryptionKey(),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + this.config.dataProtection.encryption.keyRotationInterval * 24 * 60 * 60 * 1000),
          version: key.version + 1,
          active: true,
        };
        
        // Replace current key
        this.encryptionKeys.set(keyId, newKey);
        
        // Keep old key for decryption (store with unique ID)
        this.encryptionKeys.set(key.id, key);
        
        console.log(`Rotated encryption key: ${keyId}`);
      }
    }
  }

  /**
   * Get data access logs for audit
   */
  getAccessLogs(filters?: {
    userId?: string;
    classification?: DataClassification;
    startDate?: Date;
    endDate?: Date;
    resourceType?: string;
  }): DataAccessLog[] {
    let logs = this.accessLogs;

    if (filters) {
      logs = logs.filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.classification && log.dataClassification !== filters.classification) return false;
        if (filters.startDate && log.timestamp < filters.startDate) return false;
        if (filters.endDate && log.timestamp > filters.endDate) return false;
        if (filters.resourceType && log.resourceType !== filters.resourceType) return false;
        return true;
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Add custom classification rule
   */
  addClassificationRule(rule: Omit<DataClassificationRule, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = generateSecureRandom.uuid();
    const fullRule: DataClassificationRule = {
      ...rule,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.classificationRules.set(id, fullRule);
    return id;
  }

  /**
   * Remove classification rule
   */
  removeClassificationRule(ruleId: string): boolean {
    return this.classificationRules.delete(ruleId);
  }

  /**
   * List all classification rules
   */
  listClassificationRules(): DataClassificationRule[] {
    return Array.from(this.classificationRules.values());
  }
}

// Singleton instance
export const dataProtectionManager = new DataProtectionManager();

// Utility functions for easy integration

/**
 * Middleware to automatically encrypt/decrypt PII fields in database operations
 */
export function createDataProtectionMiddleware() {
  return {
    // Prisma middleware for automatic encryption/decryption
    prismaMiddleware: async (params: any, next: any) => {
      const { model, action, args } = params;

      // Encrypt data before write operations
      if (['create', 'update', 'upsert'].includes(action) && args.data) {
        args.data = await encryptPIIFields(model, args.data, 'system-user');
      }

      const result = await next(params);

      // Decrypt data after read operations
      if (['findUnique', 'findFirst', 'findMany'].includes(action) && result) {
        if (Array.isArray(result)) {
          return Promise.all(result.map(item => decryptPIIFields(model, item, 'system-user')));
        } else {
          return decryptPIIFields(model, result, 'system-user');
        }
      }

      return result;
    },
  };
}

/**
 * Encrypt PII fields in data object
 */
async function encryptPIIFields(tableName: string, data: any, userId: string): Promise<any> {
  const encryptedData = { ...data };

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      encryptedData[key] = await dataProtectionManager.encryptDatabaseField(
        tableName,
        key,
        value,
        userId
      );
    }
  }

  return encryptedData;
}

/**
 * Decrypt PII fields in data object
 */
async function decryptPIIFields(tableName: string, data: any, userId: string): Promise<any> {
  const decryptedData = { ...data };

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      decryptedData[key] = await dataProtectionManager.decryptDatabaseField(
        tableName,
        key,
        value,
        userId
      );
    }
  }

  return decryptedData;
} 