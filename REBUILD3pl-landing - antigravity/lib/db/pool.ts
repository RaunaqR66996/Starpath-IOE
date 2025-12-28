import { PrismaClient } from '@prisma/client'
import { Pool, PoolConfig } from 'pg'

/**
 * PostgreSQL Connection Pool Configuration
 * Provides connection pooling for production database operations
 */

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'blueship_sync',
  user: process.env.DB_USER || 'blueship',
  password: process.env.DB_PASSWORD || process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'), // Maximum number of clients in the pool
  min: parseInt(process.env.DB_MIN_CONNECTIONS || '5'), // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // Close idle clients after 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'), // Timeout for new connections
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
  application_name: 'blueship-sync',
}

// Create connection pool
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    // If DATABASE_URL is provided, use it directly
    if (process.env.DATABASE_URL && !process.env.DB_HOST) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ...poolConfig,
        max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        min: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
      })
    } else {
      pool = new Pool(poolConfig)
    }

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })

    // Log pool events in development
    if (process.env.NODE_ENV === 'development') {
      pool.on('connect', () => {
        console.log('New client connected to database')
      })
      pool.on('acquire', () => {
        console.log('Client checked out from pool')
      })
      pool.on('release', () => {
        console.log('Client returned to pool')
      })
    }
  }
  return pool
}

/**
 * Get database connection pool statistics
 */
export async function getPoolStats() {
  if (!pool) {
    return null
  }

  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}

/**
 * Execute a query using the connection pool
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool()
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount })
    }
    
    return result.rows
  } catch (error) {
    console.error('Database query error', { text, error })
    throw error
  }
}

/**
 * Execute a transaction using the connection pool
 */
export async function transaction<T>(
  callback: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  try {
    const start = Date.now()
    const result = await query('SELECT 1 as health_check')
    const latency = Date.now() - start
    
    if (result && result.length > 0 && result[0].health_check === 1) {
      return { healthy: true, latency }
    }
    
    return { healthy: false, error: 'Health check query returned unexpected result' }
  } catch (error: any) {
    return { healthy: false, error: error.message || 'Database connection failed' }
  }
}

// Export pool instance for direct access if needed
export { pool }



