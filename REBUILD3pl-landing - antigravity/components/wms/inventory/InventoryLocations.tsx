"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

interface Location {
  id: string
  locationCode: string
  zone: string
  type: string
  capacity: number
  utilization: number
  status: string
}

const mockLocations: Location[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function InventoryLocations({ siteId }: { siteId: string }) {
  const [locations] = useState<Location[]>(mockLocations)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Location Management</span>
        <Badge variant="outline" className="text-xs">{locations.length} Locations</Badge>
      </div>
      
      <div className="space-y-0.5">
        {locations.map((location) => (
          <div key={location.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{location.locationCode}</div>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {location.type}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">{location.utilization}%</div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {location.zone} • Capacity: {location.capacity} • Status: {location.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

