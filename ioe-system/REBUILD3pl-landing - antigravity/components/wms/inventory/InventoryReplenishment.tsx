"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { RotateCcw } from "lucide-react"

interface Replenishment {
  id: string
  taskNumber: string
  fromLocation: string
  toLocation: string
  item: string
  quantity: number
  status: string
}

const mockReplenishments: Replenishment[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function InventoryReplenishment({ siteId }: { siteId: string }) {
  const [replenishments] = useState<Replenishment[]>(mockReplenishments)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success'
      case 'IN_PROGRESS': return 'secondary'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Replenishment</span>
        <Badge variant="outline" className="text-xs">2 Active</Badge>
      </div>
      
      <div className="space-y-0.5">
        {replenishments.map((rep) => (
          <div key={rep.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <RotateCcw className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{rep.taskNumber}</div>
                <Badge variant={getStatusVariant(rep.status) as any} className="text-xs px-1 py-0">
                  {rep.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">Qty: {rep.quantity}</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {rep.item} • {rep.fromLocation} → {rep.toLocation}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

