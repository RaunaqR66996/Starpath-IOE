/**
 * Multi-Layer Caching Strategy for Hyper-Scale
 * L1 (Application) → L2 (Redis) → L3 (CDN)
 * 
 * Features:
 * - Write-through / Write-back
 * - Cache warming
 * - Intelligent invalidation
 * - Stampede protection
 * - Hit rate tracking
 */

import NodeCache from 'node-cache'
// import { createClient, RedisClientType } from 'redis'

export interface CacheOptions {
  ttl?: number
  useL1?: boolean
  useL2?: boolean
  useL3?: boolean
  namespace?: string
}

export interface CacheStats {
  l1Hits: number
  l2Hits: number
  l3Hits: number
  misses: number
  hitRate: number
  avgLatency: number
}

/**
 * Multi-Layer Cache Manager
 */
export class MultiLayerCache {
  private l1Cache: NodeCache // Application memory
  private l2Client: any // Mock Redis client
  private stats: CacheStats
  private ongoingFetches: Map<string, Promise<any>> // Stampede protection
  
  constructor(
    private l1Options = { stdTTL: 60, checkperiod: 120, maxKeys: 10000 },
    private l2Options = { url: process.env.REDIS_URL || 'redis://localhost:6379' }
  ) {
    // L1: Application cache (in-memory, per instance)
    this.l1Cache = new NodeCache(l1Options)
    
    // L2: Mock Redis client (Redis disabled)
    this.l2Client = {
      get: async () => null,
      set: async () => 'OK',
      connect: async () => {},
      disconnect: async () => {}
    }
    
    // Stats tracking
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      hitRate: 0,
      avgLatency: 0
    }
    
    // Stampede protection
    this.ongoingFetches = new Map()
    
    // Periodic stats calculation
    setInterval(() => this.calculateStats(), 10000)
  }
  
  /**
   * Get value from cache (tries L1 → L2 → L3 → Source)
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now()
    const { ttl = 3600, useL1 = true, useL2 = true, namespace = 'default' } = options
    const fullKey = this.buildKey(namespace, key)
    
    try {
      // L1: Application cache (fastest, 1-5ms)
      if (useL1) {
        const l1Value = this.l1Cache.get<T>(fullKey)
        if (l1Value !== undefined) {
          this.stats.l1Hits++
          this.recordLatency(Date.now() - startTime)
          return l1Value
        }
      }
      
      // L2: Redis cache (fast, 5-20ms)
      if (useL2) {
        const l2Value = await this.l2Client.get(fullKey)
        if (l2Value) {
          const parsed = JSON.parse(l2Value) as T
          this.stats.l2Hits++
          
          // Warm L1 cache
          if (useL1) {
            this.l1Cache.set(fullKey, parsed, ttl)
          }
          
          this.recordLatency(Date.now() - startTime)
          return parsed
        }
      }
      
      // L3: CDN would be handled at edge (CloudFlare Workers, etc.)
      // Not implemented here as it's infrastructure-level
      
      // Cache miss - fetch from source with stampede protection
      this.stats.misses++
      
      // Check if another request is already fetching this key
      let fetchPromise = this.ongoingFetches.get(fullKey)
      
      if (!fetchPromise) {
        // Start new fetch
        fetchPromise = fetcher()
        this.ongoingFetches.set(fullKey, fetchPromise)
        
        fetchPromise
          .then(async (value) => {
            // Store in all cache layers
            await this.set(fullKey, value, { ttl, useL1, useL2 })
            this.ongoingFetches.delete(fullKey)
          })
          .catch((error) => {
            console.error(`Failed to fetch ${fullKey}:`, error)
            this.ongoingFetches.delete(fullKey)
          })
      }
      
      const value = await fetchPromise
      this.recordLatency(Date.now() - startTime)
      return value
    } catch (error) {
      console.error(`Cache get error for ${fullKey}:`, error)
      this.recordLatency(Date.now() - startTime)
      throw error
    }
  }
  
  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = 3600, useL1 = true, useL2 = true, namespace = 'default' } = options
    const fullKey = this.buildKey(namespace, key)
    
    try {
      // Set in L1 (application cache)
      if (useL1) {
        this.l1Cache.set(fullKey, value, ttl)
      }
      
      // Set in L2 (Redis)
      if (useL2) {
        await this.l2Client.setEx(fullKey, ttl, JSON.stringify(value))
      }
    } catch (error) {
      console.error(`Cache set error for ${fullKey}:`, error)
    }
  }
  
  /**
   * Delete from cache
   */
  async delete(key: string, namespace = 'default'): Promise<void> {
    const fullKey = this.buildKey(namespace, key)
    
    try {
      // Delete from L1
      this.l1Cache.del(fullKey)
      
      // Delete from L2
      await this.l2Client.del(fullKey)
    } catch (error) {
      console.error(`Cache delete error for ${fullKey}:`, error)
    }
  }
  
  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string, namespace = 'default'): Promise<void> {
    const fullPattern = this.buildKey(namespace, pattern)
    
    try {
      // L1: Delete all keys matching pattern
      const l1Keys = this.l1Cache.keys().filter(k => k.includes(fullPattern))
      this.l1Cache.del(l1Keys)
      
      // L2: Use Redis SCAN to find and delete keys
      const stream = this.l2Client.scanIterator({ MATCH: `${fullPattern}*`, COUNT: 100 })
      for await (const key of stream) {
        await this.l2Client.del(key)
      }
    } catch (error) {
      console.error(`Cache invalidation error for ${fullPattern}:`, error)
    }
  }
  
  /**
   * Warm cache with data
   */
  async warm<T>(
    keys: string[],
    fetcher: (key: string) => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    console.log(`Warming cache with ${keys.length} keys...`)
    
    const promises = keys.map(async (key) => {
      try {
        const value = await fetcher(key)
        await this.set(key, value, options)
      } catch (error) {
        console.error(`Failed to warm cache for ${key}:`, error)
      }
    })
    
    await Promise.all(promises)
    console.log('Cache warming complete')
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }
  
  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      hitRate: 0,
      avgLatency: 0
    }
  }
  
  /**
   * Flush all cache layers
   */
  async flush(namespace?: string): Promise<void> {
    if (namespace) {
      await this.invalidatePattern('*', namespace)
    } else {
      // Flush L1
      this.l1Cache.flushAll()
      
      // Flush L2
      await this.l2Client.flushDb()
    }
  }
  
  /**
   * Close connections
   */
  async close(): Promise<void> {
    this.l1Cache.close()
    await this.l2Client.quit()
  }
  
  /**
   * Build cache key with namespace
   */
  private buildKey(namespace: string, key: string): string {
    return `${namespace}:${key}`
  }
  
  /**
   * Calculate cache statistics
   */
  private calculateStats(): void {
    const total = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits + this.stats.misses
    if (total > 0) {
      const hits = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits
      this.stats.hitRate = (hits / total) * 100
    }
  }
  
  /**
   * Record latency for tracking
   */
  private recordLatency(latency: number): void {
    const total = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits + this.stats.misses
    this.stats.avgLatency = ((this.stats.avgLatency * (total - 1)) + latency) / total
  }
}

/**
 * Cache-Aside Pattern (Lazy Loading)
 */
export async function cacheAside<T>(
  cache: MultiLayerCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl = 3600
): Promise<T> {
  return cache.get(key, fetcher, { ttl })
}

/**
 * Write-Through Pattern (Write to cache + DB)
 */
export async function writeThrough<T>(
  cache: MultiLayerCache,
  key: string,
  value: T,
  writer: (value: T) => Promise<void>,
  ttl = 3600
): Promise<void> {
  // Write to database first
  await writer(value)
  
  // Then update cache
  await cache.set(key, value, { ttl })
}

/**
 * Write-Behind Pattern (Write to cache first, DB async)
 */
export async function writeBehind<T>(
  cache: MultiLayerCache,
  key: string,
  value: T,
  writer: (value: T) => Promise<void>,
  ttl = 3600
): Promise<void> {
  // Update cache immediately
  await cache.set(key, value, { ttl })
  
  // Write to database asynchronously
  writer(value).catch(error => {
    console.error('Write-behind failed:', error)
  })
}

/**
 * Read-Through Pattern (Cache handles fetching)
 */
export async function readThrough<T>(
  cache: MultiLayerCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl = 3600
): Promise<T> {
  return cache.get(key, fetcher, { ttl })
}

/**
 * Refresh-Ahead Pattern (Proactive cache refresh)
 */
export async function refreshAhead<T>(
  cache: MultiLayerCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl = 3600,
  refreshThreshold = 0.8 // Refresh when 80% of TTL elapsed
): Promise<T> {
  const value = await cache.get(key, fetcher, { ttl })
  
  // Schedule refresh before expiration
  const refreshTime = ttl * refreshThreshold * 1000
  setTimeout(async () => {
    try {
      const newValue = await fetcher()
      await cache.set(key, newValue, { ttl })
    } catch (error) {
      console.error('Refresh-ahead failed:', error)
    }
  }, refreshTime)
  
  return value
}

/**
 * Singleton instance
 */
let cacheInstance: MultiLayerCache | null = null

export function getCache(): MultiLayerCache {
  if (!cacheInstance) {
    cacheInstance = new MultiLayerCache()
  }
  return cacheInstance
}

export default MultiLayerCache



