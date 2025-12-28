import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'
import { createHash } from 'crypto'

// In-memory performance monitoring (replacing Redis)
interface PerformanceMetric {
  id: string
  operation: string
  duration: number
  timestamp: Date
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

interface QueryCache {
  key: string
  result: any
  timestamp: Date
  ttl: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetric> = new Map()
  private queryCache: Map<string, QueryCache> = new Map()
  private slowQueries: PerformanceMetric[] = []
  private readonly MAX_METRICS = 10000
  private readonly MAX_SLOW_QUERIES = 1000
  private readonly SLOW_QUERY_THRESHOLD = 1000 // 1 second

  constructor() {
    this.startCleanupInterval()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  recordOperation(operation: string, duration: number, success: boolean, error?: string, metadata?: Record<string, any>): void {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const metric: PerformanceMetric = {
      id,
      operation,
      duration,
      timestamp: new Date(),
      success,
      error,
      metadata
    }

    this.metrics.set(id, metric)

    // Track slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.slowQueries.push(metric)
      if (this.slowQueries.length > this.MAX_SLOW_QUERIES) {
        this.slowQueries.shift()
      }
    }

    // Cleanup old metrics if needed
    if (this.metrics.size > this.MAX_METRICS) {
      const oldestKeys = Array.from(this.metrics.keys()).slice(0, this.metrics.size - this.MAX_METRICS)
      oldestKeys.forEach(key => this.metrics.delete(key))
    }
  }

  async measureOperation<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      this.recordOperation(operation, duration, true, undefined, metadata)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordOperation(operation, duration, false, error instanceof Error ? error.message : String(error), metadata)
      throw error
    }
  }

  getMetrics(operation?: string, startDate?: Date, endDate?: Date): PerformanceMetric[] {
    let metrics = Array.from(this.metrics.values())

    if (operation) {
      metrics = metrics.filter(m => m.operation === operation)
    }

    if (startDate) {
      metrics = metrics.filter(m => m.timestamp >= startDate)
    }

    if (endDate) {
      metrics = metrics.filter(m => m.timestamp <= endDate)
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getSlowQueries(): PerformanceMetric[] {
    return [...this.slowQueries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getPerformanceStats(): {
    totalOperations: number
    averageDuration: number
    successRate: number
    slowQueryCount: number
    errorRate: number
  } {
    const metrics = Array.from(this.metrics.values())
    const totalOperations = metrics.length
    
    if (totalOperations === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        slowQueryCount: this.slowQueries.length,
        errorRate: 0
      }
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0)
    const successfulOperations = metrics.filter(m => m.success).length
    const errorOperations = metrics.filter(m => !m.success).length

    return {
      totalOperations,
      averageDuration: totalDuration / totalOperations,
      successRate: (successfulOperations / totalOperations) * 100,
      slowQueryCount: this.slowQueries.length,
      errorRate: (errorOperations / totalOperations) * 100
    }
  }

  // Query caching
  getCachedQuery(key: string): any | null {
    const cached = this.queryCache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp.getTime() > cached.ttl) {
      this.queryCache.delete(key)
      return null
    }

    return cached.result
  }

  setCachedQuery(key: string, result: any, ttl: number = 300000): void { // 5 minutes default
    this.queryCache.set(key, {
      key,
      result,
      timestamp: new Date(),
      ttl
    })
  }

  clearCache(): void {
    this.queryCache.clear()
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      
      // Cleanup expired cache entries
      for (const [key, cached] of this.queryCache) {
        if (now - cached.timestamp.getTime() > cached.ttl) {
          this.queryCache.delete(key)
        }
      }

      // Cleanup old metrics (keep last 24 hours)
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
      for (const [key, metric] of this.metrics) {
        if (metric.timestamp < oneDayAgo) {
          this.metrics.delete(key)
        }
      }
    }, 60000) // Run every minute
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Database connection pool simulation
export class DatabasePool {
  private connections: Map<string, { id: string; inUse: boolean; lastUsed: Date }> = new Map()
  private readonly maxConnections = 10

  async getConnection(): Promise<string> {
    // Find available connection
    for (const [id, conn] of this.connections) {
      if (!conn.inUse) {
        conn.inUse = true
        conn.lastUsed = new Date()
        return id
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.maxConnections) {
      const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.connections.set(id, {
        id,
        inUse: true,
        lastUsed: new Date()
      })
      return id
    }

    // Wait for connection to become available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const [id, conn] of this.connections) {
          if (!conn.inUse) {
            conn.inUse = true
            conn.lastUsed = new Date()
            clearInterval(checkInterval)
            resolve(id)
            return
          }
        }
      }, 100)
    })
  }

  releaseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.inUse = false
    }
  }

  getPoolStats(): {
    totalConnections: number
    activeConnections: number
    availableConnections: number
  } {
    const totalConnections = this.connections.size
    const activeConnections = Array.from(this.connections.values()).filter(c => c.inUse).length
    
    return {
      totalConnections,
      activeConnections,
      availableConnections: totalConnections - activeConnections
    }
  }
}

export const dbPool = new DatabasePool()

// ================================
// DATABASE PERFORMANCE CONFIGURATION
// ================================

interface DatabaseConfig {
  maxConnections: number
  connectionTimeout: number
  queryTimeout: number
  enableReadReplicas: boolean
  enableQueryLogging: boolean
  enableSlowQueryLogging: boolean
  slowQueryThreshold: number
  cacheConfig: {
    defaultTTL: number
    maxMemory: string
    evictionPolicy: string
  }
}

const dbConfig: DatabaseConfig = {
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '100'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  enableReadReplicas: process.env.DB_ENABLE_READ_REPLICAS === 'true',
  enableQueryLogging: process.env.NODE_ENV === 'development',
  enableSlowQueryLogging: true,
  slowQueryThreshold: parseInt(process.env.DB_SLOW_QUERY_THRESHOLD || '1000'),
  cacheConfig: {
    defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300'), // 5 minutes
    maxMemory: process.env.REDIS_MAX_MEMORY || '1gb',
    evictionPolicy: process.env.REDIS_EVICTION_POLICY || 'allkeys-lru'
  }
}

// ================================
// OPTIMIZED PRISMA CLIENT SETUP
// ================================

class OptimizedPrismaClient {
  private writeClient: PrismaClient
  private readClient: PrismaClient | null = null
  private cache: Map<string, any> = new Map() // In-memory cache replacing Redis
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map()

  constructor() {
    // Write client (primary database)
    this.writeClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: dbConfig.enableQueryLogging 
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' }
          ]
        : ['error'],
      errorFormat: 'pretty'
    })

    // Read replica client (if enabled)
    if (dbConfig.enableReadReplicas && process.env.DATABASE_READ_URL) {
      this.readClient = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_READ_URL
          }
        },
        log: ['error']
      })
    }

    // In-memory cache initialization (replacing Redis)
    this.cache = new Map()

    this.setupEventListeners()
    this.setupConnectionPooling()
  }

  private setupEventListeners() {
    if (dbConfig.enableQueryLogging) {
      this.writeClient.$on('query', (e: any) => {
        this.logQuery(e)
      })

      this.writeClient.$on('error', (e: any) => {
        console.error('Database Error:', e)
      })

      this.writeClient.$on('warn', (e: any) => {
        console.warn('Database Warning:', e)
      })
    }
  }

  private setupConnectionPooling() {
    // Connection pool optimization
    this.writeClient.$connect()
    
    if (this.readClient) {
      this.readClient.$connect()
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await this.disconnect()
      process.exit(0)
    })
  }

  private logQuery(event: any) {
    const queryHash = createHash('md5').update(event.query).digest('hex')
    const duration = event.duration

    // Track query statistics
    const existing = this.queryStats.get(queryHash)
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.avgTime = existing.totalTime / existing.count
    } else {
      this.queryStats.set(queryHash, {
        count: 1,
        totalTime: duration,
        avgTime: duration
      })
    }

    // Log slow queries
    if (duration > dbConfig.slowQueryThreshold) {
      console.warn(`Slow Query Detected (${duration}ms):`, {
        query: event.query,
        params: event.params,
        duration: `${duration}ms`
      })
    }
  }

  // ================================
  // INTELLIGENT QUERY ROUTING
  // ================================

  private getClient(operation: 'read' | 'write'): PrismaClient {
    if (operation === 'read' && this.readClient) {
      return this.readClient
    }
    return this.writeClient
  }

  // ================================
  // CACHING LAYER
  // ================================

  private generateCacheKey(operation: string, params: any): string {
    const paramsString = JSON.stringify(params, Object.keys(params).sort())
    return createHash('md5').update(`${operation}:${paramsString}`).digest('hex')
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = this.cache.get(key)
      if (!cached) return null
      
      // Check if expired
      if (cached.expiry && Date.now() > cached.expiry) {
        this.cache.delete(key)
        return null
      }
      
      return cached.data
    } catch (error) {
      console.warn('Cache get error:', error)
      return null
    }
  }

  private async setCache(key: string, data: any, ttl: number = dbConfig.cacheConfig.defaultTTL): Promise<void> {
    try {
      this.cache.set(key, {
        data,
        expiry: Date.now() + (ttl * 1000)
      })
    } catch (error) {
      console.warn('Cache set error:', error)
    }
  }

  private async invalidateCache(pattern: string): Promise<void> {
    try {
      // Simple pattern matching for in-memory cache
      const regex = new RegExp(pattern.replace('*', '.*'))
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error)
    }
  }

  // ================================
  // OPTIMIZED QUERY METHODS
  // ================================

  async findUnique<T>(
    model: string,
    params: any,
    options: { cache?: boolean; ttl?: number } = {}
  ): Promise<T | null> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(`${model}:findUnique`, params)

    try {
      // Try cache first
      if (options.cache !== false) {
        const cached = await this.getFromCache<T>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Execute query on read replica
      const client = this.getClient('read')
      const result = await (client as any)[model].findUnique(params)

      // Cache the result
      if (options.cache !== false && result) {
        await this.setCache(cacheKey, result, options.ttl)
      }

      return result
    } catch (error) {
      console.error(`Error in ${model}.findUnique:`, error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance(`${model}.findUnique`, duration)
    }
  }

  async findMany<T>(
    model: string,
    params: any,
    options: { cache?: boolean; ttl?: number } = {}
  ): Promise<T[]> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(`${model}:findMany`, params)

    try {
      // Try cache first
      if (options.cache !== false) {
        const cached = await this.getFromCache<T[]>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Execute query on read replica
      const client = this.getClient('read')
      const result = await (client as any)[model].findMany(params)

      // Cache the result
      if (options.cache !== false) {
        await this.setCache(cacheKey, result, options.ttl)
      }

      return result
    } catch (error) {
      console.error(`Error in ${model}.findMany:`, error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance(`${model}.findMany`, duration)
    }
  }

  async create<T>(
    model: string,
    params: any,
    options: { invalidatePatterns?: string[] } = {}
  ): Promise<T> {
    const startTime = performance.now()

    try {
      // Execute on write client
      const client = this.getClient('write')
      const result = await (client as any)[model].create(params)

      // Invalidate related cache entries
      if (options.invalidatePatterns) {
        for (const pattern of options.invalidatePatterns) {
          await this.invalidateCache(pattern)
        }
      }

      return result
    } catch (error) {
      console.error(`Error in ${model}.create:`, error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance(`${model}.create`, duration)
    }
  }

  async update<T>(
    model: string,
    params: any,
    options: { invalidatePatterns?: string[] } = {}
  ): Promise<T> {
    const startTime = performance.now()

    try {
      // Execute on write client
      const client = this.getClient('write')
      const result = await (client as any)[model].update(params)

      // Invalidate related cache entries
      if (options.invalidatePatterns) {
        for (const pattern of options.invalidatePatterns) {
          await this.invalidateCache(pattern)
        }
      }

      return result
    } catch (error) {
      console.error(`Error in ${model}.update:`, error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance(`${model}.update`, duration)
    }
  }

  async delete<T>(
    model: string,
    params: any,
    options: { invalidatePatterns?: string[] } = {}
  ): Promise<T> {
    const startTime = performance.now()

    try {
      // Execute on write client
      const client = this.getClient('write')
      const result = await (client as any)[model].delete(params)

      // Invalidate related cache entries
      if (options.invalidatePatterns) {
        for (const pattern of options.invalidatePatterns) {
          await this.invalidateCache(pattern)
        }
      }

      return result
    } catch (error) {
      console.error(`Error in ${model}.delete:`, error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance(`${model}.delete`, duration)
    }
  }

  // ================================
  // TRANSACTION SUPPORT
  // ================================

  async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>,
    options: { timeout?: number; isolationLevel?: string } = {}
  ): Promise<T> {
    const startTime = performance.now()

    try {
      return await this.writeClient.$transaction(fn, {
        timeout: options.timeout || dbConfig.queryTimeout,
        isolationLevel: options.isolationLevel as any
      })
    } catch (error) {
      console.error('Transaction error:', error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance('transaction', duration)
    }
  }

  // ================================
  // RAW QUERY SUPPORT WITH CACHING
  // ================================

  async executeRaw<T>(
    query: string,
    params: any[] = [],
    options: { cache?: boolean; ttl?: number } = {}
  ): Promise<T> {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey('raw', { query, params })

    try {
      // Try cache first
      if (options.cache !== false) {
        const cached = await this.getFromCache<T>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Execute raw query
      const client = this.getClient('read')
      const result = await client.$queryRaw`${query}`

      // Cache the result
      if (options.cache !== false) {
        await this.setCache(cacheKey, result, options.ttl)
      }

      return result as T
    } catch (error) {
      console.error('Raw query error:', error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance('raw', duration)
    }
  }

  // ================================
  // PERFORMANCE MONITORING
  // ================================

  private logQueryPerformance(operation: string, duration: number) {
    if (duration > dbConfig.slowQueryThreshold) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`)
    }
  }

  getQueryStats() {
    return Array.from(this.queryStats.entries()).map(([query, stats]) => ({
      query,
      ...stats
    }))
  }

  getTopSlowQueries(limit: number = 10) {
    return Array.from(this.queryStats.entries())
      .sort(([, a], [, b]) => b.avgTime - a.avgTime)
      .slice(0, limit)
      .map(([query, stats]) => ({ query, ...stats }))
  }

  async getCacheStats() {
    try {
      const cacheSize = this.cache.size
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 // MB
      
      return {
        cacheSize,
        memoryUsage: `${memoryUsage.toFixed(2)} MB`,
        connectedClients: 1 // In-memory cache
      }
    } catch (error) {
      console.warn('Cache stats error:', error)
      return null
    }
  }

  // ================================
  // CONNECTION MANAGEMENT
  // ================================

  async healthCheck(): Promise<{ database: boolean; cache: boolean }> {
    try {
      // Test database connection
      await this.writeClient.$queryRaw`SELECT 1`
      const dbHealthy = true

      // Test cache (in-memory is always available)
      const cacheHealthy = true

      return { database: dbHealthy, cache: cacheHealthy }
    } catch (error) {
      console.error('Health check failed:', error)
      return { database: false, cache: false }
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.writeClient.$disconnect()
      if (this.readClient) {
        await this.readClient.$disconnect()
      }
      this.cache.clear() // Clear in-memory cache
      console.log('Database connections closed gracefully')
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  // ================================
  // BULK OPERATIONS
  // ================================

  async bulkCreate<T>(
    model: string,
    data: any[],
    options: { batchSize?: number; skipDuplicates?: boolean } = {}
  ): Promise<{ count: number }> {
    const startTime = performance.now()
    const batchSize = options.batchSize || 1000

    try {
      let totalCreated = 0

      // Process in batches to avoid memory issues
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        const result = await (this.writeClient as any)[model].createMany({
          data: batch,
          skipDuplicates: options.skipDuplicates || false
        })
        totalCreated += result.count
      }

      return { count: totalCreated }
    } catch (error) {
      console.error(`Error in ${model}.bulkCreate:`, error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance(`${model}.bulkCreate`, duration)
    }
  }

  async bulkUpdate<T>(
    model: string,
    updates: Array<{ where: any; data: any }>,
    options: { batchSize?: number } = {}
  ): Promise<{ count: number }> {
    const startTime = performance.now()
    const batchSize = options.batchSize || 100

    try {
      let totalUpdated = 0

      // Process in batches using transactions
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        
        await this.transaction(async (prisma) => {
          for (const update of batch) {
            await (prisma as any)[model].updateMany({
              where: update.where,
              data: update.data
            })
            totalUpdated++
          }
        })
      }

      return { count: totalUpdated }
    } catch (error) {
      console.error(`Error in ${model}.bulkUpdate:`, error)
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.logQueryPerformance(`${model}.bulkUpdate`, duration)
    }
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

let optimizedDb: OptimizedPrismaClient | null = null

export function getOptimizedDb(): OptimizedPrismaClient {
  if (!optimizedDb) {
    optimizedDb = new OptimizedPrismaClient()
  }
  return optimizedDb
}

// ================================
// DATABASE MIGRATION UTILITIES
// ================================

class DatabaseMigrationUtils {
  private db: OptimizedPrismaClient

  constructor() {
    this.db = getOptimizedDb()
  }

  async createIndexes() {
    console.log('Creating performance indexes...')

    const indexes = [
      // Orders table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_status ON "orders" ("customerId", "status")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_date_range ON "orders" ("orderDate", "status")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_organization_date ON "orders" ("organizationId", "orderDate" DESC)',
      
      // Shipments table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_tracking ON "shipments" ("trackingNumber")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_status_date ON "shipments" ("status", "createdAt" DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_carrier_date ON "shipments" ("carrierId", "createdAt" DESC)',
      
      // Inventory table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_sku_warehouse ON "inventory_items" ("sku", "warehouseId")',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_low_stock ON "inventory_items" ("currentStock", "reorderPoint") WHERE "currentStock" <= "reorderPoint"',
      
      // Analytics indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tracking_events_shipment_date ON "tracking_events" ("shipmentId", "timestamp" DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_predictions_model_date ON "ai_predictions" ("modelId", "timestamp" DESC)',
      
      // Activity logs indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_activities_date ON "order_activities" ("orderId", "timestamp" DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipment_activities_date ON "shipment_activities" ("shipmentId", "timestamp" DESC)',
    ]

    for (const indexSql of indexes) {
      try {
        await this.db.executeRaw(indexSql)
        console.log(`✓ Created index: ${indexSql.split(' ')[5]}`)
      } catch (error) {
        console.warn(`⚠ Index creation warning: ${error}`)
      }
    }

    console.log('✅ Performance indexes created successfully')
  }

  async createPartitions() {
    console.log('Creating table partitions for large datasets...')

    const partitionQueries = [
      // Partition tracking_events by month
      `CREATE TABLE IF NOT EXISTS tracking_events_y2024m01 PARTITION OF tracking_events 
       FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')`,
      
      `CREATE TABLE IF NOT EXISTS tracking_events_y2024m02 PARTITION OF tracking_events 
       FOR VALUES FROM ('2024-02-01') TO ('2024-03-01')`,
      
      // Add more partitions as needed
    ]

    for (const query of partitionQueries) {
      try {
        await this.db.executeRaw(query)
        console.log(`✓ Created partition`)
      } catch (error) {
        console.warn(`⚠ Partition creation warning: ${error}`)
      }
    }

    console.log('✅ Table partitions created successfully')
  }

  async createViews() {
    console.log('Creating materialized views for analytics...')

    const views = [
      // Daily shipment statistics
      `CREATE MATERIALIZED VIEW IF NOT EXISTS daily_shipment_stats AS
       SELECT 
         DATE(s."createdAt") as date,
         s."carrierId",
         COUNT(*) as total_shipments,
         COUNT(*) FILTER (WHERE s."status" = 'DELIVERED') as delivered,
         COUNT(*) FILTER (WHERE s."status" = 'EXCEPTION') as exceptions,
         AVG(EXTRACT(EPOCH FROM (s."actualDelivery" - s."createdAt"))/3600) as avg_delivery_hours
       FROM "shipments" s
       WHERE s."createdAt" >= CURRENT_DATE - INTERVAL '90 days'
       GROUP BY DATE(s."createdAt"), s."carrierId"`,

      // Inventory turnover analysis
      `CREATE MATERIALIZED VIEW IF NOT EXISTS inventory_turnover AS
       SELECT 
         i."sku",
         i."name",
         i."warehouseId",
         i."currentStock",
         COALESCE(SUM(im."quantity") FILTER (WHERE im."type" = 'OUT'), 0) as total_sold,
         CASE 
           WHEN i."currentStock" > 0 THEN COALESCE(SUM(im."quantity") FILTER (WHERE im."type" = 'OUT'), 0) / NULLIF(i."currentStock", 0)
           ELSE 0 
         END as turnover_ratio
       FROM "inventory_items" i
       LEFT JOIN "inventory_movements" im ON i."id" = im."inventoryItemId" 
         AND im."timestamp" >= CURRENT_DATE - INTERVAL '365 days'
       GROUP BY i."id", i."sku", i."name", i."warehouseId", i."currentStock"`,

      // Customer performance metrics
      `CREATE MATERIALIZED VIEW IF NOT EXISTS customer_metrics AS
       SELECT 
         c."id",
         c."name",
         COUNT(DISTINCT o."id") as total_orders,
         SUM(o."total") as total_revenue,
         AVG(o."total") as avg_order_value,
         COUNT(DISTINCT s."id") as total_shipments,
         COUNT(DISTINCT s."id") FILTER (WHERE s."status" = 'DELIVERED') as delivered_shipments,
         CASE 
           WHEN COUNT(DISTINCT s."id") > 0 
           THEN (COUNT(DISTINCT s."id") FILTER (WHERE s."status" = 'DELIVERED'))::float / COUNT(DISTINCT s."id") * 100
           ELSE 0 
         END as delivery_success_rate
       FROM "customers" c
       LEFT JOIN "orders" o ON c."id" = o."customerId"
       LEFT JOIN "shipments" s ON o."id" = s."orderId"
       GROUP BY c."id", c."name"`
    ]

    for (const viewSql of views) {
      try {
        await this.db.executeRaw(viewSql)
        console.log(`✓ Created materialized view`)
      } catch (error) {
        console.warn(`⚠ View creation warning: ${error}`)
      }
    }

    console.log('✅ Materialized views created successfully')
  }

  async refreshViews() {
    console.log('Refreshing materialized views...')
    
    const views = ['daily_shipment_stats', 'inventory_turnover', 'customer_metrics']
    
    for (const view of views) {
      try {
        await this.db.executeRaw(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${view}`)
        console.log(`✓ Refreshed view: ${view}`)
      } catch (error) {
        console.warn(`⚠ View refresh warning: ${error}`)
      }
    }

    console.log('✅ Materialized views refreshed')
  }
}

// ================================
// EXPORTS
// ================================

export { OptimizedPrismaClient, DatabaseMigrationUtils, dbConfig }
export default getOptimizedDb 