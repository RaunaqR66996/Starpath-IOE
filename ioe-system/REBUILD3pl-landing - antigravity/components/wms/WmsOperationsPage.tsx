"use client"

import { useState, useEffect, useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Warehouse3D } from "@/components/Warehouse3D"
import { WMSChat } from "@/components/WMSChat"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useStagingStore } from "@/lib/stores/stagingStore"
import { useLifecycleResource } from '@/hooks/use-lifecycle'
// import { InboundReceiving } from '@/components/wms/inbound/InboundReceiving'
import { InboundASN } from '@/components/wms/inbound/InboundASN'
import { InboundQC } from '@/components/wms/inbound/InboundQC'
import { InboundPutaway } from '@/components/wms/inbound/InboundPutaway'
import { InboundReturns } from '@/components/wms/inbound/InboundReturns'
import { InventoryTracking } from '@/components/wms/inventory/InventoryTracking'
import { InventoryCycleCount } from '@/components/wms/inventory/InventoryCycleCount'
import { InventoryAdjustments } from '@/components/wms/inventory/InventoryAdjustments'
import { InventoryReplenishment } from '@/components/wms/inventory/InventoryReplenishment'
import { InventoryLocations } from '@/components/wms/inventory/InventoryLocations'
import { OutboundOrders } from '@/components/wms/outbound/OutboundOrders'
import { OutboundWaves } from '@/components/wms/outbound/OutboundWaves'
import { OutboundPicking } from '@/components/wms/outbound/OutboundPicking'
import { OutboundPacking } from '@/components/wms/outbound/OutboundPacking'
import { OutboundShipping } from '@/components/wms/outbound/OutboundShipping'
import { TaskManagement } from '@/components/wms/tasks/TaskManagement'
import { LaborProductivity } from '@/components/wms/tasks/LaborProductivity'
import { WorkerAssignment } from '@/components/wms/tasks/WorkerAssignment'
import { SlottingOptimization } from '@/components/wms/slotting/SlottingOptimization'
import { YardManagement } from '@/components/wms/yard/YardManagement'
import { ReportsAnalytics } from '@/components/wms/reports/ReportsAnalytics'
import { ConfigMasterData } from '@/components/wms/config/ConfigMasterData'
import { ConfigUsers } from '@/components/wms/config/ConfigUsers'
import { ConfigSettings } from '@/components/wms/config/ConfigSettings'
import {
  Building2,
  MapPin,
  Package,
  Truck,
  AlertTriangle,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Loader2,
  Warehouse,
  ArrowUpDown,
  ArrowDownUp,
  Settings,
  Play,
  Square
} from 'lucide-react'

// Type definitions for WMS data
interface Receipt {
  id: string
  supplier: string
  poNumber: string
  quantity: number
  expectedDate: string
  status: string
}

interface InventoryItem {
  id: string
  sku: string
  description: string
  bin: string
  quantity: number
  available?: number
  reserved?: number
  status: string
  lastUpdated: string
}

interface Order {
  id: string
  orderNumber: string
  customer: string
  items: number
  totalQuantity: number
  estimatedShipDate: string
  createdAt: string
  status: string
  priority: string
}

type ModuleKey = 'dashboard' | 'inbound' | 'inventory' | 'outbound' | 'tasks' | 'slotting' | 'yard' | 'reports' | 'config' | 'analytics'
const WMS_ROUTE_MODULE_MAP: Record<string, ModuleKey> = {
  dashboard: 'dashboard',
  inbound: 'inbound',
  inventory: 'inventory',
  outbound: 'outbound',
  tasks: 'tasks',
  slotting: 'slotting',
  yard: 'yard',
  reports: 'reports',
  config: 'config',
  analytics: 'analytics',
  modules: 'inventory',
  'warehouse-overview': 'analytics',
}

interface KPIMetric {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
}

// Mock data for demonstration
const mockReceipts: Receipt[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

const mockInventory: InventoryItem[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

const mockOrders: Order[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

const kpiMetrics: KPIMetric[] = [
  { title: 'Total Inventory', value: '1,247', change: '+5.2%', trend: 'up', icon: <Package className="h-4 w-4" /> },
  { title: 'Active Orders', value: '23', change: '+12.5%', trend: 'up', icon: <Truck className="h-4 w-4" /> },
  { title: 'Pick Accuracy', value: '98.7%', change: '+0.3%', trend: 'up', icon: <CheckCircle className="h-4 w-4" /> },
  { title: 'Cycle Time', value: '2.3h', change: '-8.2%', trend: 'down', icon: <Clock className="h-4 w-4" /> },
]

// Inbound Tab Component
const InboundTab = ({ siteId, submodule }: { siteId: string; submodule?: string | null }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Render sub-modules based on query param
  if (submodule === 'receiving') {
    return <div className="p-4 text-sm text-gray-500">Inbound Receiving Module (Under Construction)</div>
  }
  if (submodule === 'asn') {
    return <InboundASN siteId={siteId} />
  }
  if (submodule === 'qc') {
    return <InboundQC siteId={siteId} />
  }
  if (submodule === 'putaway') {
    return <InboundPutaway siteId={siteId} />
  }
  if (submodule === 'returns') {
    return <InboundReturns siteId={siteId} />
  }

  const {
    data: receipts = mockReceipts,
    isLoading,
    error
  } = useLifecycleResource<Receipt[]>(
    ['wms', 'receiving', siteId],
    siteId ? `/api/wms/${siteId}/receiving?type=pending` : null,
    {
      fallbackData: mockReceipts,
      select: data =>
        Array.isArray(data)
          ? data.map((record: any) => ({
            id: record.id,
            supplier: record.supplier || record.supplierName || 'Unknown Supplier',
            poNumber: record.poNumber,
            quantity: record.expectedQuantity || record.expectedItems || 0,
            expectedDate: record.eta || new Date().toISOString(),
            status: record.status || 'scheduled'
          }))
          : mockReceipts
    }
  )

  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => {
      const matchesSearch =
        receipt.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [receipts, searchTerm, statusFilter])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'success'
      case 'ARRIVED': return 'secondary'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
          {error.message || 'Realtime data unavailable, showing cached snapshot.'}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Receipts (6)</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-5 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ARRIVED">Arrived</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
            Loading inbound receipts...
          </div>
        ) : (
          filteredReceipts.slice(0, 4).map((receipt) => (
            <div key={receipt.id} className="border border-gray-200 rounded p-1 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{receipt.supplier}</div>
                  <Badge variant={getStatusVariant(receipt.status) as any} className="text-xs px-1 py-0 capitalize">
                    {receipt.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 flex-shrink-0">{receipt.quantity}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Inventory Tab Component
const InventoryTab = ({ siteId, submodule }: { siteId: string; submodule?: string | null }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Render sub-modules based on query param
  if (submodule === 'tracking') {
    return <InventoryTracking siteId={siteId} />
  }
  if (submodule === 'cycle-count') {
    return <InventoryCycleCount siteId={siteId} />
  }
  if (submodule === 'adjustments') {
    return <InventoryAdjustments siteId={siteId} />
  }
  if (submodule === 'replenishment') {
    return <InventoryReplenishment siteId={siteId} />
  }
  if (submodule === 'locations') {
    return <InventoryLocations siteId={siteId} />
  }

  const {
    data: inventory = mockInventory,
    isLoading,
    error
  } = useLifecycleResource<InventoryItem[]>(
    ['wms', 'inventory', siteId],
    siteId ? `/api/wms/${siteId}/inventory` : null,
    {
      fallbackData: mockInventory,
      select: data =>
        Array.isArray(data)
          ? data.map((record: any) => ({
            id: record.id || `${record.binId}-${record.itemId}`,
            sku: record.sku || record.item?.sku || record.itemId,
            description: record.description || record.item?.description || 'Inventory Item',
            bin: record.bin || record.bin?.name || record.binId || 'Unknown Bin',
            quantity: record.quantity ?? record.lifecycle?.onHand ?? 0,
            available: record.available ?? record.availableQuantity ?? record.lifecycle?.available ?? 0,
            reserved: record.reserved ?? record.reservedQuantity ?? record.lifecycle?.reserved ?? 0,
            status: (record.status || record.lifecycle?.status || 'AVAILABLE').toUpperCase(),
            lastUpdated: record.updatedAt || new Date().toISOString()
          }))
          : mockInventory
    }
  )

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch =
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bin.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [inventory, searchTerm, statusFilter])

  const getInventoryVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success'
      case 'RESERVED': return 'secondary'
      case 'ALLOCATED': return 'default'
      case 'LOW_STOCK': return 'warning'
      case 'OUT_OF_STOCK': return 'danger'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
          {error.message || 'Realtime inventory unavailable, showing static snapshot.'}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Inventory (8)</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-5 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="ALLOCATED">Allocated</SelectItem>
            <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
            Loading inventory...
          </div>
        ) : (
          filteredInventory.slice(0, 4).map((item) => (
            <div key={item.id} className="border border-gray-200 rounded p-1 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-xs font-medium">{item.bin}</div>
                  <div className="text-xs text-sp-text-muted truncate">{item.sku}</div>
                  <Badge variant={getInventoryVariant(item.status) as any} className="text-xs px-1 py-0">
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-600">{item.quantity} units</div>
                  <div className="text-[10px] text-gray-400">
                    Avl {item.available ?? item.quantity} • Res {item.reserved ?? 0}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface TaskSummary {
  id: string
  referenceId?: string
  referenceType?: string
  status: string
  priority: string
  assignee?: string
  updatedAt?: string
}

const taskStatusActions: Record<string, { label: string; next: string; icon: React.ReactNode }> = {
  CREATED: { label: 'Start', next: 'IN_PROGRESS', icon: <Play className="h-3 w-3" /> },
  QUEUED: { label: 'Start', next: 'IN_PROGRESS', icon: <Play className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'Complete', next: 'COMPLETED', icon: <CheckCircle className="h-3 w-3" /> }
}

const OutboundTab = ({ siteId, submodule }: { siteId: string; submodule?: string | null }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Render sub-modules based on query param
  if (submodule === 'orders') {
    return <OutboundOrders siteId={siteId} />
  }
  if (submodule === 'waves') {
    return <OutboundWaves siteId={siteId} />
  }
  if (submodule === 'picking') {
    return <OutboundPicking siteId={siteId} />
  }
  if (submodule === 'packing') {
    return <OutboundPacking siteId={siteId} />
  }
  if (submodule === 'shipping') {
    return <OutboundShipping siteId={siteId} />
  }

  const { data: tasks = [], isLoading, error, refetch } = useLifecycleResource<TaskSummary[]>(
    ['wms', 'tasks', siteId],
    siteId ? `/api/wms/tasks?siteId=${siteId}` : null,
    {
      fallbackData: [],
      select: records =>
        Array.isArray(records)
          ? records.map((task: any) => ({
            id: task.id,
            referenceId: task.referenceId ?? task.id,
            referenceType: task.taskType,
            status: task.status,
            priority: (task.priority || 'normal').toLowerCase(),
            assignee: task.assignee,
            updatedAt: task.updatedAt
          }))
          : []
    }
  )

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.referenceType?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tasks, searchTerm, statusFilter])

  const getOrderStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'READY':
        return 'success'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'CREATED':
      case 'QUEUED':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'rush':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = async (taskId: string, nextStatus: string) => {
    setUpdatingTaskId(taskId)
    setUpdateError(null)
    try {
      const response = await fetch(`/api/wms/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      await refetch()
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update task')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-xs text-sp-text-muted">Loading tasks...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {(error || updateError) && (
        <div className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
          {updateError || error?.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-sp-text-strong">Tasks ({filteredTasks.length})</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-5 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        {filteredTasks.slice(0, 5).map(task => {
          const action = taskStatusActions[task.status]
          return (
            <div key={task.id} className="border border-border rounded-md p-2 hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-xs font-medium text-sp-text-strong">{task.referenceId}</div>
                  <Badge variant={getOrderStatusVariant(task.status) as any} className="text-xs px-1 py-0">
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={`text-xs px-1 py-0 ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <div className="text-[11px] text-sp-text-muted mr-2">
                    {task.referenceType || 'Task'} • {task.assignee || 'Unassigned'}
                  </div>
                  {action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-4 px-1 text-xs"
                      disabled={updatingTaskId === task.id}
                      onClick={() => handleStatusChange(task.id, action.next)}
                    >
                      {action.icon}
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-xs text-sp-text-muted mt-1">
                Updated {task.updatedAt ? new Date(task.updatedAt).toLocaleTimeString() : 'recently'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const AnalyticsTab = ({ siteId }: { siteId: string }) => {
  const { data, isLoading, error } = useLifecycleResource<any>(
    ['wms', 'analytics', siteId],
    siteId ? `/api/wms/staging/status?siteId=${siteId}` : null,
    { fallbackData: null, staleTime: 60_000 }
  )

  const derivedMetrics = useMemo(() => {
    if (!data?.summary) {
      return kpiMetrics
    }
    const summary = data.summary
    const utilization = summary.totalCapacity
      ? `${Math.round((summary.usedCapacity / summary.totalCapacity) * 100)}%`
      : '0%'
    return [
      {
        title: 'Staging Areas',
        value: summary.totalAreas.toString(),
        change: `${summary.usedCapacity}/${summary.totalCapacity} pallets used`,
        trend: 'neutral',
        icon: <Warehouse className="h-4 w-4" />
      },
      {
        title: 'Ready Loads',
        value: summary.readyLoads.toString(),
        change: 'Ready for TMS handoff',
        trend: summary.readyLoads > 0 ? 'up' : 'neutral',
        icon: <Truck className="h-4 w-4" />
      },
      {
        title: 'Utilization',
        value: utilization,
        change: 'Floor capacity',
        trend: summary.usedCapacity > 0 ? 'neutral' : 'down',
        icon: <BarChart3 className="h-4 w-4" />
      },
      {
        title: 'Assignments',
        value: data.stagingAreas?.reduce((sum: number, area: any) => sum + area.assignments.length, 0) ?? 0,
        change: 'Active allocations',
        trend: 'neutral',
        icon: <Activity className="h-4 w-4" />
      }
    ] as KPIMetric[]
  }, [data])

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-sp-text-strong">Analytics</span>
      {error && (
        <div className="text-[11px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
          {error.message}
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin mr-2" />
          Loading metrics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {derivedMetrics.slice(0, 4).map((metric, index) => (
              <div key={index} className="border border-border rounded-md p-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-sp-text-muted truncate">{metric.title}</p>
                    <p className="text-lg font-semibold text-sp-text-strong">{metric.value}</p>
                    <p
                      className={`text-xs ${metric.trend === 'up'
                          ? 'text-emerald-600'
                          : metric.trend === 'down'
                            ? 'text-red-600'
                            : 'text-sp-text-muted'
                        }`}
                    >
                      {metric.change}
                    </p>
                  </div>
                  <div className="text-slate-500 flex-shrink-0">{metric.icon}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-md p-2">
            <div className="text-xs text-sp-text-muted mb-2">Capacity Summary</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-sm font-semibold text-sp-text-strong">
                  {data?.summary?.readyLoads ?? 0}
                </div>
                <div className="text-xs text-sp-text-muted">Ready Loads</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-sp-text-strong">
                  {data?.summary?.usedCapacity ?? 0}
                </div>
                <div className="text-xs text-sp-text-muted">Units In Staging</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Main WMS Page Component
export function WmsOperationsPage({ initialModule = 'inbound' }: { initialModule?: ModuleKey }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [selectedSiteId, setSelectedSiteId] = useState<string>('warehouse-001')
  const moduleFromPath = useMemo(() => {
    if (!pathname) return null
    const match = pathname.match(/^\/wms-create\/([^/]+)(?:\/)?/)
    if (match) {
      const slug = match[1]
      return WMS_ROUTE_MODULE_MAP[slug] ?? null
    }
    // Handle root /wms-create route
    if (pathname === '/wms-create') {
      return 'inbound' as ModuleKey
    }
    return null
  }, [pathname])
  const moduleParam =
    (searchParams?.get('module') as ModuleKey | null) ??
    moduleFromPath ??
    initialModule
  const submoduleParam = searchParams?.get('submodule')
  const [activeModule, setActiveModule] = useState<ModuleKey>(moduleParam)
  const stagingStore = useStagingStore()

  useEffect(() => {
    if (moduleParam && moduleParam !== activeModule) {
      setActiveModule(moduleParam)
    }
  }, [moduleParam, activeModule])

  // Demo function to create a test staging order
  const createDemoStagingOrder = async () => {
    const orderNumber = `ORD-${Date.now()}`
    const result = stagingStore.allocateOrderToStaging(
      selectedSiteId,
      `order-${Date.now()}`,
      orderNumber,
      'SO',
      8,
      [
        { sku: 'SKU-001', name: 'Product A', qty: 100, uom: 'EA', palletQuantity: 50 }
      ],
      'CUST-001'
    )

    if (result && result.success) {
      alert(`Order ${orderNumber} allocated to staging area!\nStaging Area: ${result.stagingAreaId}`)
    } else {
      alert('Failed to allocate order to staging')
    }
  }

  const getWarehouseName = (warehouseId: string) => {
    switch (warehouseId) {
      case 'warehouse-001': return 'KuehneNagel - East Warehouse - NY'
      case 'warehouse-002': return 'L-Angeles - Dual West Warehouse - LA'
      case 'warehouse-003': return 'Laredo - South Warehouse - TX'
      default: return 'KuehneNagel - East Warehouse - NY'
    }
  }

  return (
    <DashboardLayout>
      <div>
        {/* 2-Quadrant Layout - No Scroll */}
        <div className="h-screen bg-white">
          <div className="grid grid-cols-2 h-full">

            {/* Q1: 3D Warehouse (Left Side) */}
            <div className="bg-white p-4 border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black">WMS - Warehouse Management</h2>
                    <p className="text-gray-600 font-medium text-xs">3D Warehouse Operations & Control</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={createDemoStagingOrder}
                  className="text-xs"
                >
                  🧪 Demo Order
                </Button>
              </div>

              <div className="bg-white rounded-md shadow-sm flex-1 overflow-hidden">
                <Warehouse3D className="h-full" warehouseId={selectedSiteId} />
              </div>
            </div>

            {/* Q2: WMS Operations (Right Side) */}
            <div className="bg-white p-3 border border-gray-200 flex flex-col">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
                <Warehouse className="h-3 w-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-900">Operations</span>
              </div>

              {/* Operations Section - Takes remaining space above chat */}
              <div className="flex-1 overflow-auto min-h-0 mb-3">
                {/* Warehouse Selection */}
                <div className="mb-2">
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger className="h-6 w-full text-xs border-gray-300 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse-001">
                        <div className="text-xs">
                          <div className="font-medium">KuehneNagel - East Warehouse - NY</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="warehouse-002">
                        <div className="text-xs">
                          <div className="font-medium">L-Angeles - Dual West Warehouse - LA</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="warehouse-003">
                        <div className="text-xs">
                          <div className="font-medium">Laredo - South Warehouse - TX</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Operations */}
                <Tabs value={activeModule} className="w-full flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-5 h-6 bg-gray-100 p-0.5">
                    <TabsTrigger value="inbound" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      In
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      Inv
                    </TabsTrigger>
                    <TabsTrigger value="outbound" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      Out
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger value="config" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      Config
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-auto mt-1">
                    <ErrorBoundary>
                      <TabsContent value="inbound" className="mt-0">
                        <InboundTab siteId={selectedSiteId} submodule={submoduleParam} />
                      </TabsContent>
                      <TabsContent value="inventory" className="mt-0">
                        <InventoryTab siteId={selectedSiteId} submodule={submoduleParam} />
                      </TabsContent>
                      <TabsContent value="outbound" className="mt-0">
                        <OutboundTab siteId={selectedSiteId} submodule={submoduleParam} />
                      </TabsContent>
                      <TabsContent value="analytics" className="mt-0">
                        <AnalyticsTab siteId={selectedSiteId} />
                      </TabsContent>
                      <TabsContent value="tasks" className="mt-0">
                        {submoduleParam === 'management' && <TaskManagement siteId={selectedSiteId} />}
                        {submoduleParam === 'labor' && <LaborProductivity siteId={selectedSiteId} />}
                        {submoduleParam === 'assignment' && <WorkerAssignment siteId={selectedSiteId} />}
                        {!submoduleParam && <TaskManagement siteId={selectedSiteId} />}
                      </TabsContent>
                      <TabsContent value="slotting" className="mt-0">
                        <SlottingOptimization siteId={selectedSiteId} />
                      </TabsContent>
                      <TabsContent value="yard" className="mt-0">
                        <YardManagement siteId={selectedSiteId} />
                      </TabsContent>
                      <TabsContent value="reports" className="mt-0">
                        <ReportsAnalytics siteId={selectedSiteId} />
                      </TabsContent>
                      <TabsContent value="config" className="mt-0">
                        {submoduleParam === 'master-data' && <ConfigMasterData siteId={selectedSiteId} />}
                        {submoduleParam === 'users' && <ConfigUsers siteId={selectedSiteId} />}
                        {submoduleParam === 'settings' && <ConfigSettings siteId={selectedSiteId} />}
                        {!submoduleParam && <ConfigMasterData siteId={selectedSiteId} />}
                      </TabsContent>
                    </ErrorBoundary>
                  </div>
                </Tabs>
              </div>

              {/* WMS Chat Bar - Fixed at bottom */}
              <div className="flex-shrink-0">
                <WMSChat
                  className="h-48"
                  context="wms"
                  warehouseId={selectedSiteId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default WmsOperationsPage