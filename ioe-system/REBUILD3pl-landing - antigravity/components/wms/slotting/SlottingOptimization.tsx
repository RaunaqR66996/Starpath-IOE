"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Crosshair } from "lucide-react"

interface SlotRecommendation {
  id: string
  sku: string
  currentLocation: string
  recommendedLocation: string
  reason: string
}

const mockRecommendations: SlotRecommendation[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function SlottingOptimization({ siteId }: { siteId: string }) {
  const [recommendations] = useState<SlotRecommendation[]>(mockRecommendations)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-900">Slotting & Optimization</span>
        <Button size="sm" variant="outline" className="h-6 text-xs">
          <Crosshair className="h-3 w-3 mr-1" />
          Optimize
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {recommendations.map((rec) => (
          <div key={rec.id} className="border border-gray-200 rounded p-2 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Crosshair className="h-3 w-3 text-gray-500" />
                <div className="text-xs font-medium truncate">{rec.sku}</div>
              </div>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">
              {rec.currentLocation} → {rec.recommendedLocation} • {rec.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

