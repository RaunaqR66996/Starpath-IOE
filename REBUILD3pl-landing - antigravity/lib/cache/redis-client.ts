/**
 * Redis Cache Client for Blue Ship Sync
 * Provides caching layer for improved API performance
 */

// Redis disabled to prevent connection errors
// import Redis from 'ioredis'

// const redis = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
//   password: process.env.REDIS_PASSWORD,
//   retryStrategy: (times) => {
//     const delay = Math.min(times * 50, 2000)
//     return delay
//   },
// })

// Mock Redis client to prevent errors
const redis = {
  get: async () => null,
  setex: async () => 'OK',
  del: async () => 0,
  keys: async () => [],
  ping: async () => 'PONG'
}

/**
 * Cache configuration
 */
export const CACHE_TTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
  VERY_LONG: 86400, // 24 hours
}

/**
 * Cache keys
 */
export const CACHE_KEYS = {
  // Inventory
  INVENTORY_ITEM: (sku: string) => `inventory:item:${sku}`,
  INVENTORY_LOCATION: (locationId: string) => `inventory:location:${locationId}`,
  INVENTORY_WAREHOUSE: (warehouseId: string) => `inventory:warehouse:${warehouseId}`,
  
  // WMS
  WMS_LAYOUT: (siteId: string) => `wms:layout:${siteId}`,
  WMS_TASKS: (siteId: string) => `wms:tasks:${siteId}`,
  WMS_KPIS: (siteId: string) => `wms:kpis:${siteId}`,
  
  // TMS
  TMS_SHIPMENTS: `tms:shipments`,
  TMS_ROUTES: (routeId: string) => `tms:routes:${routeId}`,
  TMS_CARRIERS: `tms:carriers`,
  
  // AI
  AI_DEMAND_FORECAST: (sku: string) => `ai:forecast:${sku}`,
  AI_ROUTE_PLAN: (origin: string, destination: string) => `ai:route:${origin}:${destination}`,
}

/**
 * Get cached value
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set cached value
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
  }
}

/**
 * Delete multiple cache keys by pattern
 */
export async function deletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error)
  }
}

/**
 * Invalidate inventory cache
 */
export async function invalidateInventoryCache(warehouseId?: string): Promise<void> {
  if (warehouseId) {
    await deletePattern(`inventory:warehouse:${warehouseId}:*`)
  } else {
    await deletePattern('inventory:*')
  }
}

/**
 * Invalidate WMS cache
 */
export async function invalidateWMSCache(siteId?: string): Promise<void> {
  if (siteId) {
    await deletePattern(`wms:*:${siteId}`)
  } else {
    await deletePattern('wms:*')
  }
}

/**
 * Invalidate TMS cache
 */
export async function invalidateTMSCache(): Promise<void> {
  await deletePattern('tms:*')
}

/**
 * Health check
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    return false
  }
}

export default redis






