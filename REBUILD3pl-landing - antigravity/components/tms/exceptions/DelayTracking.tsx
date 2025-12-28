"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle } from "lucide-react"

interface Delay {
  id: string
  shipmentId: string
  originalETA: string
  updatedETA: string
  delayMinutes: number
  reason: string
  status: string
}

const mockDelays: Delay[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function DelayTracking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delay Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockDelays.map((delay) => (
          <div key={delay.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{delay.shipmentId}</span>
              </div>
              <Badge className={delay.delayMinutes > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                {delay.delayMinutes > 0 ? `+${delay.delayMinutes} min` : `${delay.delayMinutes} min`}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-gray-600">Original ETA: {delay.originalETA}</div>
              <div className="text-gray-600">Updated ETA: {delay.updatedETA}</div>
              <div className="flex items-center gap-1 text-yellow-800 bg-yellow-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">Reason: {delay.reason}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

