"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
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
import { useLifecycleResource } from '@/hooks/use-lifecycle'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Package, CheckCircle, Clock, Truck, BarChart3, Activity, Warehouse } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

export type WMSTabType = 'inbound' | 'inventory' | 'outbound' | 'analytics' | 'tasks' | 'slotting' | 'yard' | 'reports' | 'config'

interface WMSTabContainerProps {
  activeTab: WMSTabType
  siteId: string
}

// Mock data interfaces
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

interface KPIMetric {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
}

const kpiMetrics: KPIMetric[] = [
  { title: 'Total Inventory', value: '1,247', change: '+5.2%', trend: 'up', icon: <Package className="h-4 w-4" /> },
  { title: 'Active Orders', value: '23', change: '+12.5%', trend: 'up', icon: <Truck className="h-4 w-4" /> },
  { title: 'Pick Accuracy', value: '98.7%', change: '+0.3%', trend: 'up', icon: <CheckCircle className="h-4 w-4" /> },
  { title: 'Cycle Time', value: '2.3h', change: '-8.2%', trend: 'down', icon: <Clock className="h-4 w-4" /> },
]

// Inbound Tab Component with API integration
const InboundTabContent = ({ siteId, submodule }: { siteId: string; submodule: string | null }) => {
  const [statusFilter, setStatusFilter] = useState('all')

  // Render sub-modules based on query param
  if (submodule === 'asn') return <InboundASN siteId={siteId} />
  if (submodule === 'qc') return <InboundQC siteId={siteId} />
  if (submodule === 'putaway') return <InboundPutaway siteId={siteId} />
  if (submodule === 'returns') return <InboundReturns siteId={siteId} />

  // Default: show receipts list
  const {
    data: receipts = [],
    isLoading,
    error
  } = useLifecycleResource<Receipt[]>(
    ['wms', 'receiving', siteId],
    siteId ? `/api/wms/${siteId}/receiving?type=pending` : null,
    {
      fallbackData: [],
      select: data =>
        Array.isArray(data)
          ? data.map((record: any) => ({
            id: record.id,
            supplier: record.supplier || record.supplierName || 'Unknown Supplier',
            poNumber: record.poNumber || 'N/A',
            quantity: record.expectedQuantity || record.expectedItems || 0,
            expectedDate: record.eta || new Date().toISOString(),
            status: record.status || 'scheduled'
          }))
          : []
    }
  )

  const filteredReceipts = useMemo(() => {
    return receipts.filter(receipt => 
      statusFilter === 'all' || receipt.status === statusFilter
    )
  }, [receipts, statusFilter])

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
        <span className="text-xs font-medium text-gray-900">Receipts ({filteredReceipts.length})</span>
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

// Inventory Tab Component with API integration
const InventoryTabContent = ({ siteId, submodule }: { siteId: string; submodule: string | null }) => {
  const [statusFilter, setStatusFilter] = useState('all')

  // Render sub-modules based on query param
  if (submodule === 'tracking') return <InventoryTracking siteId={siteId} />
  if (submodule === 'cycle-count') return <InventoryCycleCount siteId={siteId} />
  if (submodule === 'adjustments') return <InventoryAdjustments siteId={siteId} />
  if (submodule === 'replenishment') return <InventoryReplenishment siteId={siteId} />
  if (submodule === 'locations') return <InventoryLocations siteId={siteId} />

  const {
    data: inventory = [],
    isLoading,
    error
  } = useLifecycleResource<InventoryItem[]>(
    ['wms', 'inventory', siteId],
    siteId ? `/api/wms/${siteId}/inventory` : null,
    {
      fallbackData: [],
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
          : []
    }
  )

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      statusFilter === 'all' || item.status === statusFilter
    )
  }, [inventory, statusFilter])

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
        <span className="text-xs font-medium text-gray-900">Inventory ({filteredInventory.length})</span>
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

// Outbound Tab Component - use OutboundOrders component
const OutboundTabContent = ({ siteId, submodule }: { siteId: string; submodule: string | null }) => {
  // Render sub-modules based on query param
  if (submodule === 'orders') return <OutboundOrders siteId={siteId} />
  if (submodule === 'waves') return <OutboundWaves siteId={siteId} />
  if (submodule === 'picking') return <OutboundPicking siteId={siteId} />
  if (submodule === 'packing') return <OutboundPacking siteId={siteId} />
  if (submodule === 'shipping') return <OutboundShipping siteId={siteId} />

  // Default: show OutboundOrders component
  return <OutboundOrders siteId={siteId} />
}

// Analytics Tab Component with API integration
const AnalyticsTabContent = ({ siteId }: { siteId: string }) => {
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

// Tasks Tab Component
const TasksTabContent = ({ siteId, submodule }: { siteId: string; submodule: string | null }) => {
  if (submodule === 'management') return <TaskManagement siteId={siteId} />
  if (submodule === 'labor') return <LaborProductivity siteId={siteId} />
  if (submodule === 'assignment') return <WorkerAssignment siteId={siteId} />
  
  // Default: show TaskManagement
  return <TaskManagement siteId={siteId} />
}

// Config Tab Component
const ConfigTabContent = ({ siteId, submodule }: { siteId: string; submodule: string | null }) => {
  if (submodule === 'master-data') return <ConfigMasterData siteId={siteId} />
  if (submodule === 'users') return <ConfigUsers siteId={siteId} />
  if (submodule === 'settings') return <ConfigSettings siteId={siteId} />
  
  // Default: show ConfigMasterData
  return <ConfigMasterData siteId={siteId} />
}

export function WMSTabContainer({ activeTab, siteId }: WMSTabContainerProps) {
  const searchParams = useSearchParams()
  const submodule = searchParams?.get('submodule')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inbound':
        return <InboundTabContent siteId={siteId} submodule={submodule} />
      case 'inventory':
        return <InventoryTabContent siteId={siteId} submodule={submodule} />
      case 'outbound':
        return <OutboundTabContent siteId={siteId} submodule={submodule} />
      case 'analytics':
        return <AnalyticsTabContent siteId={siteId} />
      case 'tasks':
        return <TasksTabContent siteId={siteId} submodule={submodule} />
      case 'slotting':
        return <SlottingOptimization siteId={siteId} />
      case 'yard':
        return <YardManagement siteId={siteId} />
      case 'reports':
        return <ReportsAnalytics siteId={siteId} />
      case 'config':
        return <ConfigTabContent siteId={siteId} submodule={submodule} />
      default:
        return <InboundTabContent siteId={siteId} submodule={submodule} />
    }
  }

  return (
    <ErrorBoundary>
      {renderTabContent()}
    </ErrorBoundary>
  )
}


