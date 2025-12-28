"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Box, CheckCircle2, Clock, PackageCheck } from "lucide-react"

interface PackingSlip {
  id: string
  slipNumber: string
  status: string
  order: {
    orderNumber: string
  }
  items: {
    id: string
    quantity: number
  }[]
}

export function OutboundPacking({ siteId }: { siteId: string }) {
  const [packingSlips, setPackingSlips] = useState<PackingSlip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSlips = async () => {
      try {
        const response = await fetch(`/api/wms/packing`)
        const data = await response.json()

        if (data.success && data.data) {
          setPackingSlips(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch packing slips:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSlips()
  }, [siteId])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success'
      case 'IN_PROGRESS': return 'secondary'
      case 'READY': return 'warning'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case 'IN_PROGRESS': return <Clock className="h-3 w-3 text-blue-500" />
      default: return <Box className="h-3 w-3 text-gray-500" />
    }
  }

  if (loading) {
    return <div className="text-xs text-gray-500 animate-pulse">Loading packing slips...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Packing Queue</span>
        <Badge variant="secondary" className="text-xs">{packingSlips.length} Active</Badge>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {packingSlips.length === 0 ? (
          <div className="text-xs text-gray-500 p-4 text-center border border-dashed rounded bg-gray-50">
            No active packing slips
          </div>
        ) : (
          packingSlips.map((slip) => {
            const totalItems = slip.items.reduce((sum, i) => sum + i.quantity, 0)

            return (
              <div key={slip.id} className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(slip.status)}
                    <span className="text-sm font-medium text-gray-900">{slip.slipNumber}</span>
                  </div>
                  <Badge variant={getStatusVariant(slip.status) as any} className="text-[10px] px-1.5 py-0 h-5">
                    {slip.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Order: <span className="font-medium text-gray-700">{slip.order.orderNumber}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-900">{totalItems} Items</div>
                    <div className="text-[10px] text-gray-500">Ready to Pack</div>
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

