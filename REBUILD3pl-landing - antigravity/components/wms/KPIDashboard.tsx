// KPI Dashboard Component
// Real-time warehouse performance metrics and KPIs

"use client"

import { useState, useEffect, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Package,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  BarChart3
} from 'lucide-react'

interface KPIDashboardProps {
  siteId: string
  onRefresh?: () => void
}

interface KPIData {
  dockToStock: {
    current: number
    target: number
    trend: 'up' | 'down' | 'stable'
  }
  pickAccuracy: {
    current: number
    target: number
    trend: 'up' | 'down' | 'stable'
  }
  pickRate: {
    current: number
    target: number
    trend: 'up' | 'down' | 'stable'
  }
  onTimeDelivery: {
    current: number
    target: number
    trend: 'up' | 'down' | 'stable'
  }
  activeTasks: {
    pending: number
    inProgress: number
    completed: number
  }
  inventory: {
    totalItems: number
    available: number
    allocated: number
    damaged: number
  }
  throughput: {
    ordersToday: number
    ordersThisWeek: number
    peakHour: string
  }
}

export const KPIDashboard = memo(({ siteId, onRefresh }: KPIDashboardProps) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true)
        // Mock KPI data - replace with real API call
        const mockData: KPIData = {
          dockToStock: {
            current: 4.2,
            target: 4.0,
            trend: 'down'
          },
          pickAccuracy: {
            current: 98.5,
            target: 99.0,
            trend: 'down'
          },
          pickRate: {
            current: 45,
            target: 50,
            trend: 'up'
          },
          onTimeDelivery: {
            current: 96.2,
            target: 98.0,
            trend: 'up'
          },
          activeTasks: {
            pending: 12,
            inProgress: 8,
            completed: 156
          },
          inventory: {
            totalItems: 2847,
            available: 2456,
            allocated: 234,
            damaged: 12
          },
          throughput: {
            ordersToday: 89,
            ordersThisWeek: 567,
            peakHour: '2:00 PM'
          }
        }

        setKpiData(mockData)
        setLastUpdated(new Date())
        setIsConnected(true)
      } catch (error) {
        console.error('Error fetching KPIs:', error)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchKPIs, 30000)
    return () => clearInterval(interval)
  }, [siteId])

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-blue-600'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!kpiData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">Failed to load KPI data</p>
        <button
          onClick={onRefresh}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="h-4 w-4 inline mr-2" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Live data</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Offline</span>
            </>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dock to Stock */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Dock to Stock</span>
              </div>
              {getTrendIcon(kpiData.dockToStock.trend)}
            </div>
            <div className="text-2xl font-bold mb-1">
              {kpiData.dockToStock.current}h
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target: {kpiData.dockToStock.target}h</span>
              <Badge variant={kpiData.dockToStock.current <= kpiData.dockToStock.target ? 'default' : 'danger'}>
                {kpiData.dockToStock.current <= kpiData.dockToStock.target ? 'On Target' : 'Over Target'}
              </Badge>
            </div>
            <Progress
              value={(kpiData.dockToStock.target / kpiData.dockToStock.current) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Pick Accuracy */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Pick Accuracy</span>
              </div>
              {getTrendIcon(kpiData.pickAccuracy.trend)}
            </div>
            <div className="text-2xl font-bold mb-1">
              {kpiData.pickAccuracy.current}%
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target: {kpiData.pickAccuracy.target}%</span>
              <Badge variant={kpiData.pickAccuracy.current >= kpiData.pickAccuracy.target ? 'default' : 'danger'}>
                {kpiData.pickAccuracy.current >= kpiData.pickAccuracy.target ? 'On Target' : 'Below Target'}
              </Badge>
            </div>
            <Progress
              value={kpiData.pickAccuracy.current}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Pick Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Pick Rate</span>
              </div>
              {getTrendIcon(kpiData.pickRate.trend)}
            </div>
            <div className="text-2xl font-bold mb-1">
              {kpiData.pickRate.current}/hr
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target: {kpiData.pickRate.target}/hr</span>
              <Badge variant={kpiData.pickRate.current >= kpiData.pickRate.target ? 'default' : 'danger'}>
                {kpiData.pickRate.current >= kpiData.pickRate.target ? 'On Target' : 'Below Target'}
              </Badge>
            </div>
            <Progress
              value={(kpiData.pickRate.current / kpiData.pickRate.target) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* On-Time Delivery */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">On-Time Delivery</span>
              </div>
              {getTrendIcon(kpiData.onTimeDelivery.trend)}
            </div>
            <div className="text-2xl font-bold mb-1">
              {kpiData.onTimeDelivery.current}%
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Target: {kpiData.onTimeDelivery.target}%</span>
              <Badge variant={kpiData.onTimeDelivery.current >= kpiData.onTimeDelivery.target ? 'default' : 'danger'}>
                {kpiData.onTimeDelivery.current >= kpiData.onTimeDelivery.target ? 'On Target' : 'Below Target'}
              </Badge>
            </div>
            <Progress
              value={kpiData.onTimeDelivery.current}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-medium">{kpiData.activeTasks.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">In Progress</span>
                <span className="font-medium">{kpiData.activeTasks.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-medium text-green-600">{kpiData.activeTasks.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Items</span>
                <span className="font-medium">{kpiData.inventory.totalItems.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="font-medium text-green-600">{kpiData.inventory.available.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Allocated</span>
                <span className="font-medium text-blue-600">{kpiData.inventory.allocated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Damaged</span>
                <span className="font-medium text-red-600">{kpiData.inventory.damaged.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Throughput */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Throughput
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="font-medium">{kpiData.throughput.ordersToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-medium">{kpiData.throughput.ordersThisWeek}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Peak Hour</span>
                <span className="font-medium">{kpiData.throughput.peakHour}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Connection</span>
                <Badge variant={isConnected ? 'default' : 'danger'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Update</span>
                <span className="font-medium text-xs">{lastUpdated.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Site ID</span>
                <span className="font-medium text-xs">{siteId}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})

