"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Plus } from "lucide-react"

interface Adjustment {
  id: string
  adjustmentNumber: string
  location: string
  item: string
  quantity: number
  reason: string
  status: string
}

const mockAdjustments: Adjustment[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function InventoryAdjustments({ siteId }: { siteId: string }) {
  const [adjustments] = useState<Adjustment[]>(mockAdjustments)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'PENDING': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Inventory Adjustments</span>
        <Button size="sm" variant="outline" className="h-6 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          New Adjustment
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {adjustments.map((adj) => (
          <div key={adj.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{adj.adjustmentNumber}</div>
                <Badge variant={getStatusVariant(adj.status) as any} className="text-xs px-1 py-0">
                  {adj.status}
                </Badge>
              </div>
              <div className={`text-xs flex-shrink-0 ${adj.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {adj.quantity > 0 ? '+' : ''}{adj.quantity}
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{adj.location} • {adj.item} • {adj.reason}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

