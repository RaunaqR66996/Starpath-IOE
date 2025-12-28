/**
 * Base ERP Connector Framework
 * Provides standardized interface for all ERP integrations
 */

export interface ERPConfig {
  type: 'SAP' | 'Oracle' | 'Dynamics' | 'NetSuite' | 'ERPNext' | 'Custom'
  endpoint: string
  apiKey?: string
  apiSecret?: string
  username?: string
  password?: string
  clientId?: string
  clientSecret?: string
  tenantId?: string
  environment: 'production' | 'staging' | 'sandbox'
  timeout?: number
  retryAttempts?: number
  rateLimitPerMinute?: number
}

export interface ERPSyncResult {
  success: boolean
  recordsSynced: number
  recordsFailed: number
  errors: string[]
  syncDuration: number
  lastSyncTimestamp: Date
}

export interface MasterDataRecord {
  id: string
  externalId: string
  type: 'customer' | 'supplier' | 'item' | 'location'
  data: any
  lastModified: Date
}

export interface OrderRecord {
  externalOrderId: string
  orderNumber: string
  customerCode: string
  orderDate: Date
  requiredDate?: Date
  status: string
  totalAmount: number
  currency: string
  lines: Array<{
    lineNumber: number
    itemCode: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export abstract class BaseERPConnector {
  protected config: ERPConfig
  protected rateLimiter: Map<string, number[]> = new Map()
  
  constructor(config: ERPConfig) {
    this.config = config
  }

  /**
   * Test connection to ERP system
   */
  abstract testConnection(): Promise<{ success: boolean; message: string }>

  /**
   * Authenticate with ERP system
   */
  abstract authenticate(): Promise<{ success: boolean; token?: string; error?: string }>

  /**
   * Sync customer master data from ERP
   */
  abstract syncCustomers(lastSync?: Date): Promise<ERPSyncResult>

  /**
   * Sync supplier master data from ERP
   */
  abstract syncSuppliers(lastSync?: Date): Promise<ERPSyncResult>

  /**
   * Sync item/product master data from ERP
   */
  abstract syncItems(lastSync?: Date): Promise<ERPSyncResult>

  /**
   * Sync orders from ERP
   */
  abstract syncOrders(lastSync?: Date): Promise<ERPSyncResult>

  /**
   * Push order status back to ERP
   */
  abstract pushOrderStatus(orderId: string, status: string, data: any): Promise<boolean>

  /**
   * Push shipment confirmation to ERP
   */
  abstract pushShipmentConfirmation(shipmentId: string, data: any): Promise<boolean>

  /**
   * Transform ERP data to internal format
   */
  protected abstract transformData(erpData: any, dataType: string): any

  /**
   * Handle API errors with retry logic
   */
  protected async handleApiCall<T>(
    apiCall: () => Promise<T>,
    operation: string
  ): Promise<T> {
    const maxRetries = this.config.retryAttempts || 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check rate limit
        await this.checkRateLimit()

        // Execute API call
        const result = await Promise.race([
          apiCall(),
          this.timeout(this.config.timeout || 30000)
        ])

        return result as T
      } catch (error) {
        lastError = error as Error
        console.error(`ERP API call failed (attempt ${attempt}/${maxRetries}): ${operation}`, error)

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error(`Failed after ${maxRetries} attempts: ${operation}`)
  }

  /**
   * Check and enforce rate limiting
   */
  protected async checkRateLimit(): Promise<void> {
    if (!this.config.rateLimitPerMinute) return

    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const key = 'api_calls'

    // Get recent calls
    let calls = this.rateLimiter.get(key) || []
    
    // Remove calls older than 1 minute
    calls = calls.filter(timestamp => timestamp > oneMinuteAgo)

    if (calls.length >= this.config.rateLimitPerMinute) {
      // Wait until oldest call is 1 minute old
      const oldestCall = Math.min(...calls)
      const waitTime = 60000 - (now - oldestCall)
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }

    // Add current call
    calls.push(now)
    this.rateLimiter.set(key, calls)
  }

  /**
   * Timeout helper
   */
  protected timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    )
  }

  /**
   * Validate configuration
   */
  protected validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.config.endpoint) {
      errors.push('Endpoint is required')
    }

    if (!this.config.type) {
      errors.push('ERP type is required')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Log sync activity
   */
  protected logSync(operation: string, result: ERPSyncResult): void {
    console.log(`ERP Sync [${this.config.type}] - ${operation}:`, {
      success: result.success,
      recordsSynced: result.recordsSynced,
      recordsFailed: result.recordsFailed,
      duration: `${result.syncDuration}ms`,
      timestamp: result.lastSyncTimestamp
    })
  }
}
