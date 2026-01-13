"use client"

import React, { lazy, Suspense, ComponentType, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, RefreshCw, Zap } from 'lucide-react'

// ================================
// PERFORMANCE MONITORING
// ================================

interface LoadingMetrics {
  componentName: string
  loadTime: number
  cacheHit: boolean
  timestamp: number
  error?: string
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: LoadingMetrics[] = []
  private cache = new Map<string, { component: ComponentType<any>; timestamp: number }>()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  trackLoading(componentName: string, startTime: number, error?: string) {
    const loadTime = performance.now() - startTime
    const cacheHit = this.cache.has(componentName)
    
    this.metrics.push({
      componentName,
      loadTime,
      cacheHit,
      timestamp: Date.now(),
      error
    })

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Log slow loads
    if (loadTime > 1000) {
      console.warn(`Slow component load: ${componentName} took ${loadTime.toFixed(2)}ms`)
    }
  }

  getCachedComponent(componentName: string): ComponentType<any> | null {
    const cached = this.cache.get(componentName)
    if (cached) {
      // Check if cache is still valid (24 hours)
      if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return cached.component
      } else {
        this.cache.delete(componentName)
      }
    }
    return null
  }

  setCachedComponent(componentName: string, component: ComponentType<any>) {
    this.cache.set(componentName, {
      component,
      timestamp: Date.now()
    })
  }

  getMetrics(): LoadingMetrics[] {
    return [...this.metrics]
  }

  getAverageLoadTime(componentName?: string): number {
    const relevantMetrics = componentName 
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics
    
    if (relevantMetrics.length === 0) return 0
    
    const totalTime = relevantMetrics.reduce((sum, metric) => sum + metric.loadTime, 0)
    return totalTime / relevantMetrics.length
  }
}

// ================================
// LAZY LOADING UTILITIES
// ================================

interface LazyLoadOptions {
  fallback?: React.ComponentType
  errorBoundary?: boolean
  preload?: boolean
  priority?: 'high' | 'low'
  retryDelay?: number
  maxRetries?: number
}

export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string,
  options: LazyLoadOptions = {}
): ComponentType<T> {
  const {
    fallback: FallbackComponent = DefaultFallback,
    errorBoundary = true,
    preload = false,
    priority = 'low',
    retryDelay = 1000,
    maxRetries = 3
  } = options

  const monitor = PerformanceMonitor.getInstance()

  // Check cache first
  const cached = monitor.getCachedComponent(componentName)
  if (cached) {
    return cached as ComponentType<T>
  }

  const LazyComponent = lazy(async () => {
    const startTime = performance.now()
    let retryCount = 0

    const loadWithRetry = async (): Promise<{ default: ComponentType<T> }> => {
      try {
        const module = await importFn()
        monitor.trackLoading(componentName, startTime)
        monitor.setCachedComponent(componentName, module.default)
        return module
      } catch (error) {
        console.error(`Failed to load component ${componentName}:`, error)
        
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Retrying ${componentName} (${retryCount}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount))
          return loadWithRetry()
        }
        
        monitor.trackLoading(componentName, startTime, error instanceof Error ? error.message : 'Unknown error')
        throw error
      }
    }

    return loadWithRetry()
  })

  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    setTimeout(() => {
      importFn().catch(() => {}) // Preload but don't throw errors
    }, priority === 'high' ? 0 : 2000)
  }

  const WrappedComponent: ComponentType<T> = (props) => {
    if (errorBoundary) {
      return (
        <ErrorBoundary componentName={componentName}>
          <Suspense fallback={<FallbackComponent />}>
            <LazyComponent {...props} />
          </Suspense>
        </ErrorBoundary>
      )
    }

    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }

  WrappedComponent.displayName = `Lazy(${componentName})`
  return WrappedComponent
}

// ================================
// INTELLIGENT PREFETCHING
// ================================

interface PrefetchConfig {
  routes: Array<{
    path: string
    component: () => Promise<any>
    priority: number
    conditions?: () => boolean
  }>
  strategy: 'hover' | 'viewport' | 'idle' | 'immediate'
  maxConcurrent: number
  cacheTime: number
}

export class IntelligentPrefetcher {
  private static instance: IntelligentPrefetcher
  private config: PrefetchConfig
  private prefetched = new Set<string>()
  private loading = new Set<string>()
  private observer?: IntersectionObserver

  constructor(config: PrefetchConfig) {
    this.config = config
    this.setupIntersectionObserver()
  }

  static getInstance(config?: PrefetchConfig): IntelligentPrefetcher {
    if (!IntelligentPrefetcher.instance && config) {
      IntelligentPrefetcher.instance = new IntelligentPrefetcher(config)
    }
    return IntelligentPrefetcher.instance
  }

  private setupIntersectionObserver() {
    if (typeof window === 'undefined') return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const path = entry.target.getAttribute('data-prefetch-path')
            if (path) {
              this.prefetchRoute(path)
            }
          }
        })
      },
      { rootMargin: '50px' }
    )
  }

  prefetchRoute(path: string) {
    if (this.prefetched.has(path) || this.loading.has(path)) {
      return
    }

    const route = this.config.routes.find(r => r.path === path)
    if (!route) return

    // Check conditions
    if (route.conditions && !route.conditions()) {
      return
    }

    // Check concurrent limit
    if (this.loading.size >= this.config.maxConcurrent) {
      return
    }

    this.loading.add(path)

    route.component()
      .then(() => {
        this.prefetched.add(path)
        console.log(`✓ Prefetched: ${path}`)
      })
      .catch((error) => {
        console.warn(`✗ Prefetch failed: ${path}`, error)
      })
      .finally(() => {
        this.loading.delete(path)
      })
  }

  prefetchOnHover(element: HTMLElement, path: string) {
    let timeoutId: NodeJS.Timeout

    const handleMouseEnter = () => {
      timeoutId = setTimeout(() => {
        this.prefetchRoute(path)
      }, 100) // Small delay to avoid excessive prefetching
    }

    const handleMouseLeave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  observeForPrefetch(element: HTMLElement, path: string) {
    if (!this.observer) return

    element.setAttribute('data-prefetch-path', path)
    this.observer.observe(element)

    return () => {
      this.observer?.unobserve(element)
    }
  }

  prefetchIdle() {
    if (typeof window === 'undefined') return

    const prefetchNext = () => {
      const unprefetched = this.config.routes
        .filter(route => !this.prefetched.has(route.path) && !this.loading.has(route.path))
        .sort((a, b) => b.priority - a.priority)

      if (unprefetched.length > 0 && this.loading.size < this.config.maxConcurrent) {
        this.prefetchRoute(unprefetched[0].path)
        
        // Schedule next prefetch
        requestIdleCallback(() => {
          prefetchNext()
        }, { timeout: 5000 })
      }
    }

    requestIdleCallback(() => {
      prefetchNext()
    }, { timeout: 2000 })
  }
}

// ================================
// ROUTE DEFINITIONS WITH LAZY LOADING
// ================================

export const lazyRoutes = {
  // Dashboard routes
  Dashboard: createLazyComponent(
    () => import('@/app/dashboard/page'),
    'Dashboard',
    { preload: true, priority: 'high' }
  ),
  
  AnalyticsAdvanced: createLazyComponent(
    () => import('@/app/analytics-advanced/page'),
    'AnalyticsAdvanced',
    { priority: 'high' }
  ),

  // Order management routes
  Orders: createLazyComponent(
    () => import('@/app/orders/page'),
    'Orders'
  ),
  
  OrderDetails: createLazyComponent(
    () => import('@/app/orders/[id]/page'),
    'OrderDetails'
  ),
  
  OrderCreate: createLazyComponent(
    () => import('@/app/orders/create/page'),
    'OrderCreate'
  ),
  
  OrderProcess: createLazyComponent(
    () => import('@/app/orders/[id]/process/page'),
    'OrderProcess'
  ),

  // Shipment routes
  Shipments: createLazyComponent(
    () => import('@/app/shipments/page'),
    'Shipments'
  ),
  
  ShipmentDetails: createLazyComponent(
    () => import('@/app/shipments/[id]/page'),
    'ShipmentDetails'
  ),
  
  ShipmentCreate: createLazyComponent(
    () => import('@/app/shipments/create/page'),
    'ShipmentCreate'
  ),
  
  ShipmentTracking: createLazyComponent(
    () => import('@/app/tracking/page'),
    'ShipmentTracking'
  ),

  // Inventory routes
  Inventory: createLazyComponent(
    () => import('@/app/inventory/page'),
    'Inventory'
  ),

  // AI Agent routes
  AIAgent: createLazyComponent(
    () => import('@/app/ai-agent/page'),
    'AIAgent',
    { priority: 'high' }
  ),

  // Settings routes
  Settings: createLazyComponent(
    () => import('@/app/settings/page'),
    'Settings'
  ),
  
  SettingsBilling: createLazyComponent(
    () => import('@/app/settings/billing/page'),
    'SettingsBilling'
  ),
  
  SettingsERPIntegration: createLazyComponent(
    () => import('@/app/settings/erp-integration/page'),
    'SettingsERPIntegration'
  ),

  // Analytics routes
  Analytics: createLazyComponent(
    () => import('@/app/analytics/page'),
    'Analytics'
  ),
  
  ERPIntegration: createLazyComponent(
    () => import('@/app/erp-integration/page'),
    'ERPIntegration'
  ),

  // Integration routes
  Integrations: createLazyComponent(
    () => import('@/app/integrations/page'),
    'Integrations'
  ),
  
  ERPSync: createLazyComponent(
    () => import('@/app/erp-sync/page'),
    'ERPSync'
  ),

  // User management
  Users: createLazyComponent(
    () => import('@/app/users/page'),
    'Users'
  ),


  // Invoice management
  Invoices: createLazyComponent(
    () => import('@/app/invoices/page'),
    'Invoices'
  ),
  
  InvoiceDetails: createLazyComponent(
    () => import('@/app/invoices/[id]/page'),
    'InvoiceDetails'
  ),
  
  InvoiceCreate: createLazyComponent(
    () => import('@/app/invoices/create/page'),
    'InvoiceCreate'
  ),

  // NFC and Technology routes
  NFCManagement: createLazyComponent(
    () => import('@/app/nfc-management/page'),
    'NFCManagement'
  ),
  
  NFCTechnology: createLazyComponent(
    () => import('@/app/nfc-technology/page'),
    'NFCTechnology'
  ),
  
  NFCTransfers: createLazyComponent(
    () => import('@/app/nfc-transfers/page'),
    'NFCTransfers'
  ),

  // Demo and Testing routes
  PostmanDemo: createLazyComponent(
    () => import('@/app/postman-demo/page'),
    'PostmanDemo'
  ),
  
  MockERP: createLazyComponent(
    () => import('@/app/mock-erp/page'),
    'MockERP'
  ),

  // Document processing
  PDFToSalesOrder: createLazyComponent(
    () => import('@/app/pdf-to-sales-order/page'),
    'PDFToSalesOrder'
  ),
  
  // Workflow routes
  POWorkflow: createLazyComponent(
    () => import('@/app/po-workflow/page'),
    'POWorkflow'
  ),

  // Control Tower
  ControlTower: createLazyComponent(
    () => import('@/app/control-tower/page'),
    'ControlTower',
    { priority: 'high' }
  ),

  // Mobile App
  MobileApp: createLazyComponent(
    () => import('@/app/mobile-app/page'),
    'MobileApp'
  )
}

// ================================
// FALLBACK COMPONENTS
// ================================

const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-sm text-muted-foreground">Loading component...</p>
    </div>
  </div>
)

const TableFallback: React.FC = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const DashboardFallback: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
)

// ================================
// ERROR BOUNDARY
// ================================

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; componentName: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in component ${this.props.componentName}:`, error, errorInfo)
    
    // Track error in performance monitor
    const monitor = PerformanceMonitor.getInstance()
    monitor.trackLoading(this.props.componentName, 0, error.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Component Error</AlertTitle>
              <AlertDescription>
                Failed to load {this.props.componentName}. 
                {this.state.error?.message && (
                  <div className="mt-2 text-sm">
                    Error: {this.state.error.message}
                  </div>
                )}
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// ================================
// PERFORMANCE MONITOR COMPONENT
// ================================

export const PerformanceMonitorDisplay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState<LoadingMetrics[]>([])
  const monitor = PerformanceMonitor.getInstance()

  useEffect(() => {
    if (isOpen) {
      setMetrics(monitor.getMetrics())
    }
  }, [isOpen, monitor])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Zap className="h-4 w-4 mr-2" />
        Perf
      </Button>

      {isOpen && (
        <Card className="fixed bottom-16 right-4 w-96 max-h-96 overflow-auto z-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 font-medium border-b pb-1">
                <span>Component</span>
                <span>Load Time</span>
                <span>Cached</span>
              </div>
              {metrics.slice(-10).map((metric, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <span className="truncate">{metric.componentName}</span>
                  <span className={metric.loadTime > 1000 ? 'text-red-600' : 'text-green-600'}>
                    {metric.loadTime.toFixed(0)}ms
                  </span>
                  <span>{metric.cacheHit ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ================================
// HOOKS
// ================================

export const usePrefetch = () => {
  const router = useRouter()
  const pathname = usePathname()

  const prefetch = useCallback((path: string) => {
    router.prefetch(path)
  }, [router])

  useEffect(() => {
    // Auto-prefetch related routes based on current path
    const currentRoute = Object.entries(lazyRoutes).find(([name, component]) => 
      pathname.includes(name.toLowerCase())
    )

    if (currentRoute) {
      // Prefetch related routes
      const relatedRoutes = getRelatedRoutes(pathname)
      relatedRoutes.forEach(route => {
        setTimeout(() => prefetch(route), Math.random() * 2000)
      })
    }
  }, [pathname, prefetch])

  return { prefetch }
}

function getRelatedRoutes(currentPath: string): string[] {
  const routes: Record<string, string[]> = {
    '/orders': ['/orders/create', '/shipments', '/customers'],
    '/shipments': ['/orders', '/tracking'],
    '/inventory': ['/orders', '/shipments', '/analytics'],
    '/dashboard': ['/analytics', '/orders', '/shipments'],
    '/analytics': ['/dashboard', '/ai-agent']
  }

  for (const [path, related] of Object.entries(routes)) {
    if (currentPath.includes(path)) {
      return related
    }
  }

  return []
}

export { createLazyComponent, IntelligentPrefetcher, PerformanceMonitor }
export default lazyRoutes 