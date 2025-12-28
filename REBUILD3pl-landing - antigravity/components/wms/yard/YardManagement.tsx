"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Truck } from "lucide-react"

interface Trailer {
  id: string
  trailerNumber: string
  dockDoor: string
  status: string
  appointmentTime: string
}

const mockTrailers: Trailer[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function YardManagement({ siteId }: { siteId: string }) {
  const [trailers] = useState<Trailer[]>(mockTrailers)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'LOADING': return 'secondary'
      case 'CHECKED_IN': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Yard Management</span>
        <Badge variant="outline" className="text-xs">{trailers.length} Trailers</Badge>
      </div>
      
      <div className="space-y-0.5">
        {trailers.map((trailer) => (
          <div key={trailer.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Truck className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{trailer.trailerNumber}</div>
                <Badge variant={getStatusVariant(trailer.status) as any} className="text-xs px-1 py-0">
                  {trailer.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{trailer.dockDoor}</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Appointment: {trailer.appointmentTime}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

