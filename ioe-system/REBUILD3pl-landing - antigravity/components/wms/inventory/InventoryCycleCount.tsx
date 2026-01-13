"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, Plus } from "lucide-react"

interface CycleCount {
  id: string
  countNumber: string
  location: string
  scheduledDate: string
  status: string
  variance: number
}

const mockCycleCounts: CycleCount[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function InventoryCycleCount({ siteId }: { siteId: string }) {
  const [counts] = useState<CycleCount[]>(mockCycleCounts)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success'
      case 'IN_PROGRESS': return 'secondary'
      case 'SCHEDULED': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Cycle Counting</span>
        <Button size="sm" variant="outline" className="h-6 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          New Count
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {counts.map((count) => (
          <div key={count.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="text-xs font-medium truncate">{count.countNumber}</div>
                <Badge variant={getStatusVariant(count.status) as any} className="text-xs px-1 py-0">
                  {count.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{count.location}</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              Scheduled: {count.scheduledDate} {count.variance !== 0 && `• Variance: ${count.variance}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

