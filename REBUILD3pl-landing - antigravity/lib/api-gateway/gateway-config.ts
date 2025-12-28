/**
 * Modern API Gateway Configuration
 * Enterprise-grade API Gateway for TMS/WMS Microservices
 * 
 * Features:
 * - GraphQL Federation
 * - REST API routing
 * - Rate limiting
 * - Authentication/Authorization
 * - Request/Response transformation
 * - Caching
 * - Load balancing
 */

export interface ServiceEndpoint {
  name: string
  url: string
  version: string
  protocol: 'http' | 'https' | 'grpc' | 'websocket'
  healthCheck: string
  timeout: number
  retries: number
  circuitBreaker: {
    enabled: boolean
    failureThreshold: number
    timeout: number
    resetTimeout: number
  }
}

export interface RateLimitConfig {
  enabled: boolean
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: any) => string
  handler?: (req: any, res: any) => void
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  keyGenerator?: (req: any) => string
  invalidationPattern?: string[]
}

export interface AuthConfig {
  enabled: boolean
  type: 'jwt' | 'oauth2' | 'api-key' | 'basic'
  jwtSecret?: string
  jwtAlgorithm?: string
  oauth2Config?: {
    authorizationURL: string
    tokenURL: string
    clientID: string
    clientSecret: string
  }
  apiKeyHeader?: string
  basicAuthRealm?: string
}

export interface RouteConfig {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
  service: string
  target: string
  auth: boolean
  rateLimit?: RateLimitConfig
  cache?: CacheConfig
  transform?: {
    request?: (req: any) => any
    response?: (res: any) => any
  }
  validation?: {
    body?: any
    query?: any
    params?: any
  }
}

/**
 * API Gateway Configuration
 */
export const apiGatewayConfig = {
  // Service Registry
  services: [
    {
      name: 'tms-service',
      url: process.env.TMS_SERVICE_URL || 'http://localhost:3001',
      version: 'v1',
      protocol: 'https',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 10000,
        resetTimeout: 30000
      }
    },
    {
      name: 'wms-service',
      url: process.env.WMS_SERVICE_URL || 'http://localhost:3002',
      version: 'v1',
      protocol: 'https',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 10000,
        resetTimeout: 30000
      }
    },
    {
      name: 'orders-service',
      url: process.env.ORDERS_SERVICE_URL || 'http://localhost:3003',
      version: 'v1',
      protocol: 'https',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 10000,
        resetTimeout: 30000
      }
    },
    {
      name: 'inventory-service',
      url: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004',
      version: 'v1',
      protocol: 'https',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 10000,
        resetTimeout: 30000
      }
    },
    {
      name: 'planning-service',
      url: process.env.PLANNING_SERVICE_URL || 'http://localhost:3005',
      version: 'v1',
      protocol: 'https',
      healthCheck: '/health',
      timeout: 10000,
      retries: 2,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        timeout: 15000,
        resetTimeout: 60000
      }
    },
    {
      name: 'ai-ml-service',
      url: process.env.AI_ML_SERVICE_URL || 'http://localhost:8000',
      version: 'v1',
      protocol: 'https',
      healthCheck: '/health',
      timeout: 30000,
      retries: 1,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 3,
        timeout: 30000,
        resetTimeout: 120000
      }
    },
    {
      name: 'robotics-service',
      url: process.env.ROBOTICS_SERVICE_URL || 'http://localhost:8080',
      version: 'v1',
      protocol: 'grpc',
      healthCheck: '/health',
      timeout: 3000,
      retries: 5,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 10,
        timeout: 5000,
        resetTimeout: 15000
      }
    }
  ] as ServiceEndpoint[],

  // Authentication Configuration
  auth: {
    enabled: true,
    type: 'jwt',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtAlgorithm: 'HS256',
    jwtExpiresIn: '24h',
    refreshTokenExpiresIn: '7d'
  } as AuthConfig,

  // Global Rate Limiting
  globalRateLimit: {
    enabled: true,
    windowMs: 60000, // 1 minute
    maxRequests: 1000, // 1000 requests per minute per IP
    keyGenerator: (req: any) => req.ip,
    handler: (req: any, res: any) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: 60
      })
    }
  } as RateLimitConfig,

  // Route Configuration
  routes: [
    // TMS Routes
    {
      path: '/api/tms/shipments',
      method: 'GET',
      service: 'tms-service',
      target: '/shipments',
      auth: true,
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
        keyGenerator: (req: any) => `tms:shipments:${req.query.status || 'all'}`
      }
    },
    {
      path: '/api/tms/routes/optimize',
      method: 'POST',
      service: 'tms-service',
      target: '/routes/optimize',
      auth: true,
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 10 // Expensive operation
      }
    },
    {
      path: '/api/tms/carriers',
      method: 'GET',
      service: 'tms-service',
      target: '/carriers',
      auth: true,
      cache: {
        enabled: true,
        ttl: 600 // 10 minutes
      }
    },

    // WMS Routes
    {
      path: '/api/wms/:siteId/layout',
      method: 'GET',
      service: 'wms-service',
      target: '/:siteId/layout',
      auth: true,
      cache: {
        enabled: true,
        ttl: 300
      }
    },
    {
      path: '/api/wms/:siteId/inventory',
      method: 'GET',
      service: 'wms-service',
      target: '/:siteId/inventory',
      auth: true,
      cache: {
        enabled: true,
        ttl: 60 // Real-time data, short cache
      }
    },
    {
      path: '/api/wms/:siteId/tasks',
      method: 'GET',
      service: 'wms-service',
      target: '/:siteId/tasks',
      auth: true
    },
    {
      path: '/api/wms/:siteId/robotics/status',
      method: 'GET',
      service: 'robotics-service',
      target: '/status',
      auth: true,
      cache: {
        enabled: true,
        ttl: 5 // Very short cache for robotics
      }
    },

    // Orders Routes
    {
      path: '/api/orders',
      method: 'GET',
      service: 'orders-service',
      target: '/orders',
      auth: true,
      cache: {
        enabled: true,
        ttl: 60
      }
    },
    {
      path: '/api/orders',
      method: 'POST',
      service: 'orders-service',
      target: '/orders',
      auth: true,
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 100
      }
    },
    {
      path: '/api/orders/:id/allocate',
      method: 'POST',
      service: 'orders-service',
      target: '/orders/:id/allocate',
      auth: true
    },

    // Inventory Routes
    {
      path: '/api/inventory',
      method: 'GET',
      service: 'inventory-service',
      target: '/inventory',
      auth: true,
      cache: {
        enabled: true,
        ttl: 120
      }
    },
    {
      path: '/api/inventory/optimize',
      method: 'POST',
      service: 'ai-ml-service',
      target: '/inventory/optimize',
      auth: true,
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 5 // Very expensive ML operation
      }
    },

    // Planning Routes
    {
      path: '/api/planning/forecast',
      method: 'POST',
      service: 'ai-ml-service',
      target: '/planning/forecast',
      auth: true,
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 10
      }
    },
    {
      path: '/api/planning/optimize',
      method: 'POST',
      service: 'planning-service',
      target: '/optimize',
      auth: true
    },

    // AI/ML Routes
    {
      path: '/api/ml/predict/demand',
      method: 'POST',
      service: 'ai-ml-service',
      target: '/predict/demand',
      auth: true,
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 20
      }
    },
    {
      path: '/api/ml/optimize/route',
      method: 'POST',
      service: 'ai-ml-service',
      target: '/optimize/route',
      auth: true,
      rateLimit: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 10
      }
    },
    {
      path: '/api/ml/detect/anomaly',
      method: 'POST',
      service: 'ai-ml-service',
      target: '/detect/anomaly',
      auth: true
    }
  ] as RouteConfig[],

  // CORS Configuration
  cors: {
    enabled: true,
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  // Request/Response Transformation
  transforms: {
    // Add request ID to all requests
    addRequestId: true,
    
    // Add timing information
    addTiming: true,
    
    // Transform error responses
    errorTransform: (error: any) => ({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: error.requestId
      }
    }),
    
    // Transform success responses
    successTransform: (data: any, req: any) => ({
      data,
      meta: {
        requestId: req.id,
        timestamp: new Date().toISOString(),
        version: 'v1'
      }
    })
  },

  // Circuit Breaker Global Config
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,
    timeout: 10000,
    resetTimeout: 30000,
    monitoringPeriod: 10000
  },

  // Retry Policy
  retry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
    exponentialBackoff: true
  },

  // Timeout Configuration
  timeouts: {
    global: 30000,
    perService: {
      'tms-service': 5000,
      'wms-service': 5000,
      'orders-service': 5000,
      'inventory-service': 5000,
      'planning-service': 10000,
      'ai-ml-service': 30000,
      'robotics-service': 3000
    }
  },

  // Health Check Configuration
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,
    unhealthyThreshold: 3,
    healthyThreshold: 2
  },

  // Logging Configuration
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    includeRequest: true,
    includeResponse: true,
    excludePaths: ['/health', '/metrics'],
    sensitiveHeaders: ['authorization', 'cookie', 'x-api-key']
  },

  // Metrics Configuration
  metrics: {
    enabled: true,
    endpoint: '/metrics',
    includeDefaultMetrics: true,
    customMetrics: [
      'http_requests_total',
      'http_request_duration_seconds',
      'http_request_size_bytes',
      'http_response_size_bytes',
      'circuit_breaker_state',
      'cache_hit_rate',
      'rate_limit_exceeded_total'
    ]
  },

  // Tracing Configuration
  tracing: {
    enabled: true,
    serviceName: 'api-gateway',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    samplingRate: 0.1, // 10% sampling
    tags: {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    }
  }
}

export default apiGatewayConfig










