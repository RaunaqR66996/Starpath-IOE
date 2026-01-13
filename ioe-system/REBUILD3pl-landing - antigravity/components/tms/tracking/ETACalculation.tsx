"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, TrendingUp } from "lucide-react"

interface ETAInfo {
  shipmentId: string
  currentLocation: string
  destination: string
  originalETA: string
  updatedETA: string
  delay: number
  reason: string
}

const mockETAs: ETAInfo[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function ETACalculation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ETA Calculation & Updates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockETAs.map((eta) => (
          <div key={eta.shipmentId} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{eta.shipmentId}</span>
              <Badge className={eta.delay > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {eta.delay > 0 ? `+${eta.delay} min` : `${eta.delay} min`}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="h-3 w-3" />
                <span>{eta.currentLocation} → {eta.destination}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span>Original: {eta.originalETA}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-gray-400" />
                <span>Updated: {eta.updatedETA}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Reason: {eta.reason}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

