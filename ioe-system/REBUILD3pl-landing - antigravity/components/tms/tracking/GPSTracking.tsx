"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation, MapPin, Signal } from "lucide-react"

interface Vehicle {
  id: string
  vehicleNumber: string
  driver: string
  location: string
  speed: number
  status: string
  lastUpdate: string
}

const mockVehicles: Vehicle[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function GPSTracking() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>GPS/Telematics Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockVehicles.map((vehicle) => (
          <div key={vehicle.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{vehicle.vehicleNumber}</span>
              </div>
              <Badge className={vehicle.status === 'moving' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {vehicle.status}
              </Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="h-3 w-3" />
                <span>{vehicle.location}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Signal className="h-3 w-3 text-gray-400" />
                  <span>{vehicle.speed} mph</span>
                </div>
                <div className="text-gray-500">{vehicle.driver}</div>
                <div className="text-gray-500">{vehicle.lastUpdate}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

