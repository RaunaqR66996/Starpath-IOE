"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Share2 } from "lucide-react"

export function CustomerPortal() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingData, setTrackingData] = useState<any>(null)

  const handleTrack = () => {
    if (trackingNumber) {
      // TODO: Integrate with customer portal API
      setTrackingData({
        orderNumber: 'ORD-001',
        status: 'in_transit',
        currentLocation: 'Chicago, IL',
        estimatedDelivery: '2024-01-18 14:00',
        carrier: 'FedEx Ground'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Visibility Portal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter tracking number"
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
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{trackingData.orderNumber}</div>
                <div className="text-sm text-gray-600">{trackingData.carrier}</div>
              </div>
              <Badge className={trackingData.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {trackingData.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div>Current Location: {trackingData.currentLocation}</div>
              <div>Estimated Delivery: {trackingData.estimatedDelivery}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

