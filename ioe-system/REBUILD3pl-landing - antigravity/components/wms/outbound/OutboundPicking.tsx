"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Package, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface PickList {
  id: string
  pickListNumber: string
  status: string
  order: {
    orderNumber: string
  }
  items: {
    id: string
    item: {
      sku: string
      name: string
    }
    quantity: number
    pickedQuantity: number
    binLocation: string
  }[]
}

export function OutboundPicking({ siteId }: { siteId: string }) {
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/wms/picking`)
        const data = await response.json()

        if (data.success && data.data) {
          setPickLists(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch pick lists:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [siteId])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success'
      case 'IN_PROGRESS': return 'secondary'
      case 'ASSIGNED': return 'warning'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case 'IN_PROGRESS': return <Clock className="h-3 w-3 text-blue-500" />
      default: return <Package className="h-3 w-3 text-gray-500" />
    }
  }

  if (loading) {
    return <div className="text-xs text-gray-500 animate-pulse">Loading pick lists...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Picking Queue</span>
        <Badge variant="secondary" className="text-xs">{pickLists.length} Active</Badge>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {pickLists.length === 0 ? (
          <div className="text-xs text-gray-500 p-4 text-center border border-dashed rounded bg-gray-50">
            No active pick lists
          </div>
        ) : (
          pickLists.map((list) => {
            const totalQty = list.items.reduce((sum, i) => sum + i.quantity, 0)
            const pickedQty = list.items.reduce((sum, i) => sum + i.pickedQuantity, 0)
            const progress = Math.round((pickedQty / totalQty) * 100) || 0

            return (
              <div key={list.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(list.status)}
                    <span className="text-sm font-medium text-gray-900">{list.pickListNumber}</span>
                  </div>
                  <Badge variant={getStatusVariant(list.status) as any} className="text-[10px] px-1.5 py-0 h-5">
                    {list.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Order: <span className="font-medium text-gray-700">{list.order.orderNumber}</span></div>
                    <div className="text-xs text-gray-500">{list.items.length} Items • {totalQty} Units</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-900">{progress}%</div>
                    <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

