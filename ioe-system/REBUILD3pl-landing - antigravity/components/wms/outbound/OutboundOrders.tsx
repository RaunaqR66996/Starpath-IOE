"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Play, Loader2, Box, Truck, CheckCircle } from "lucide-react"
import { getOutboundOrders, allocateOrder, pickOrder, packOrder, shipOrder } from "@/app/actions/wms"
import { toast } from "sonner"

interface Order {
  id: string
  orderNumber: string
  customer: string
  items: number
  status: string
  priority: string
}

export function OutboundOrders({ siteId }: { siteId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      const fetchedOrders = await getOutboundOrders(siteId)
      setOrders(fetchedOrders)
    } catch (error) {
      console.error('Failed to fetch orders', error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [siteId])

  const handleAction = async (orderId: string, action: 'allocate' | 'pick' | 'pack' | 'ship' | 'stage') => {
    setProcessingId(orderId)
    try {
      let result;
      switch (action) {
        case 'allocate':
          result = await allocateOrder(orderId)
          break
        case 'pick':
          const pickResponse = await fetch('/api/wms/picking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          })
          result = await pickResponse.json()
          break
        case 'pack':
          const packResponse = await fetch('/api/wms/packing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          })
          result = await packResponse.json()
          break
        case 'ship':
          result = await shipOrder(orderId)
          break
        case 'stage':
          // Move to staging (WMS → TMS handoff)
          const response = await fetch('/api/wms/stage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          })
          result = await response.json()
          break
      }

      if (result.success) {
        toast.success(action === 'stage' ? 'Order moved to staging! Ready for TMS.' : `Order ${action}ed successfully`)
        fetchOrders()
      } else {
        toast.error(`Failed to ${action} order`)
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'SHIPPED': return 'success'
      case 'PACKED': return 'default'
      case 'PICKED': return 'secondary'
      case 'ALLOCATED': return 'secondary'
      case 'CREATED': return 'warning'
      case 'STAGED': return 'secondary'
      case 'LOAD_PLANNED': return 'default'
      default: return 'default'
    }
  }

  const renderActionButton = (order: Order) => {
    if (processingId === order.id) {
      return (
        <Button size="sm" variant="ghost" disabled className="h-6 px-2">
          <Loader2 className="h-3 w-3 animate-spin" />
        </Button>
      )
    }

    switch (order.status) {
      case 'CREATED':
        return (
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleAction(order.id, 'allocate')}>
            <Play className="h-3 w-3 mr-1 text-blue-600" /> Allocate
          </Button>
        )
      case 'ALLOCATED':
        return (
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleAction(order.id, 'pick')}>
            <Package className="h-3 w-3 mr-1 text-orange-600" /> Pick
          </Button>
        )
      case 'STAGED':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <Truck className="h-3 w-3 mr-1" /> Staged for TMS
          </Badge>
        )
      case 'LOAD_PLANNED':
        return (
          <Badge variant="outline" className="text-indigo-600 border-indigo-200">
            <CheckCircle className="h-3 w-3 mr-1" /> In TMS
          </Badge>
        )
      case 'PICKED':
        return (
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleAction(order.id, 'pack')}>
            <Box className="h-3 w-3 mr-1 text-purple-600" /> Pack
          </Button>
        )
      case 'PACKED':
        return (
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs bg-orange-50 hover:bg-orange-100" onClick={() => handleAction(order.id, 'stage')}>
            <Truck className="h-3 w-3 mr-1 text-orange-600" /> Move to Staging
          </Button>
        )
      case 'SHIPPED':
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Completed
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Order Management</span>
        <Badge variant="outline" className="text-xs">{orders.length} Orders</Badge>
      </div>

      <div className="space-y-0.5">
        {orders.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-500">
            No orders found. Create one in TMS!
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Package className="h-3 w-3 text-gray-500" />
                  <div className="text-xs font-medium truncate">{order.orderNumber}</div>
                  <Badge variant={getStatusVariant(order.status) as any} className="text-xs px-1 py-0">
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 flex-shrink-0">{order.items} items</div>
                  {renderActionButton(order)}
                </div>
              </div>
              <div className="text-[10px] text-gray-400 mt-1">{order.customer} • Priority: {order.priority}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
