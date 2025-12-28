"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { RotateCcw } from "lucide-react"

interface Return {
  id: string
  rmaNumber: string
  customer: string
  item: string
  quantity: number
  reason: string
  status: string
}

const mockReturns: Return[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function InboundReturns({ siteId }: { siteId: string }) {
  const [returns] = useState<Return[]>(mockReturns)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success'
      case 'PROCESSING': return 'secondary'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Returns Processing</span>
        <Badge variant="outline" className="text-xs">2 Active</Badge>
      </div>
      
      <div className="space-y-0.5">
        {returns.map((returnItem) => (
          <div key={returnItem.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <RotateCcw className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{returnItem.rmaNumber}</div>
                <Badge variant={getStatusVariant(returnItem.status) as any} className="text-xs px-1 py-0">
                  {returnItem.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">Qty: {returnItem.quantity}</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{returnItem.customer} • {returnItem.item} • {returnItem.reason}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

