"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Truck } from "lucide-react"

interface TrackingUpdate {
  timestamp: string
  location: string
  status: string
  description: string
}

export function RealTimeTracking() {
  const [updates, setUpdates] = useState<TrackingUpdate[]>([])
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    if (isTracking) {
      // TODO: Integrate with real-time tracking API/WebSocket
      const interval = setInterval(() => {
        setUpdates(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          location: 'Chicago, IL',
          status: 'in_transit',
          description: 'In transit to destination'
        }, ...prev].slice(0, 5))
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isTracking])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-Time Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Shipment SHIP-001</div>
              <div className="text-sm text-gray-600">Tracking: 1Z999AA1234567890</div>
            </div>
            <Badge className={isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {isTracking ? 'Live' : 'Stopped'}
            </Badge>
          </div>
        </div>

        {updates.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Live Updates</div>
            {updates.map((update, index) => (
              <div key={index} className="border rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{update.description}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{update.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{update.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsTracking(!isTracking)}
          className={`w-full py-2 rounded-lg text-sm font-medium ${
            isTracking
              ? 'bg-red-100 text-red-800 hover:bg-red-200'
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}
        >
          {isTracking ? 'Stop Tracking' : 'Start Live Tracking'}
        </button>
      </CardContent>
    </Card>
  )
}

