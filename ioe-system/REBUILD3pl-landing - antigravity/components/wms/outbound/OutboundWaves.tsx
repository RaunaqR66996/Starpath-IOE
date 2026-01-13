"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface Wave {
  id: string
  waveNumber: string
  orderCount: number
  status: string
  priority: string
}

const mockWaves: Wave[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function OutboundWaves({ siteId }: { siteId: string }) {
  const [waves] = useState<Wave[]>(mockWaves)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success'
      case 'RELEASED': return 'secondary'
      case 'PLANNED': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Wave Planning</span>
        <Button size="sm" variant="outline" className="h-6 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          New Wave
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {waves.map((wave) => (
          <div key={wave.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{wave.waveNumber}</div>
                <Badge variant={getStatusVariant(wave.status) as any} className="text-xs px-1 py-0">
                  {wave.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{wave.orderCount} orders</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Priority: {wave.priority}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

