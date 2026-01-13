"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Package, MapPin, Clock, CheckCircle2 } from "lucide-react"

interface TrackingEvent {
  timestamp: string
  location: string
  status: string
  description: string
}

const mockTrackingEvents: TrackingEvent[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function OrderTracking() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingData, setTrackingData] = useState<any>(null)

  const handleTrack = () => {
    if (trackingNumber) {
      // TODO: Integrate with tracking API
      setTrackingData({
        orderNumber: 'ORD-001',
        status: 'in_transit',
        currentLocation: 'Chicago, IL',
        estimatedDelivery: '2024-01-18 14:00',
        events: mockTrackingEvents
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'in_transit': return 'bg-blue-100 text-blue-800'
      case 'picked_up': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter order number or tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
          />
          <Button onClick={handleTrack}>
            <Search className="h-4 w-4 mr-2" />
            Track
          </Button>
        </div>

        {trackingData && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">{trackingData.orderNumber}</span>
                </div>
                <Badge className={getStatusColor(trackingData.status)}>
                  {trackingData.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>Current Location: {trackingData.currentLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Estimated Delivery: {trackingData.estimatedDelivery}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Tracking History</h4>
              <div className="space-y-3">
                {trackingData.events.map((event: TrackingEvent, index: number) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      {index < trackingData.events.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{event.description}</span>
                        <span className="text-xs text-gray-500">{event.timestamp}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{event.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
