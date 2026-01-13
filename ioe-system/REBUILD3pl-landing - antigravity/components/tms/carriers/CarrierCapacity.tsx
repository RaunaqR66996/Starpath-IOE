"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Package, AlertTriangle } from "lucide-react"

interface CapacityInfo {
  carrier: string
  availableCapacity: number
  totalCapacity: number
  utilization: number
  status: string
}

const mockCapacity: CapacityInfo[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CarrierCapacity() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'limited': return 'bg-yellow-100 text-yellow-800'
      case 'full': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier Capacity Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockCapacity.map((capacity, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-500" />
                <span className="font-medium">{capacity.carrier}</span>
              </div>
              <Badge className={getStatusColor(capacity.status)}>
                {capacity.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available Capacity</span>
                <span className="font-medium">{capacity.availableCapacity.toLocaleString()} lbs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Capacity</span>
                <span className="font-medium">{capacity.totalCapacity.toLocaleString()} lbs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Utilization</span>
                <span className="font-medium">{capacity.utilization}%</span>
              </div>
              {capacity.utilization > 70 && (
                <div className="bg-yellow-50 p-2 rounded flex items-center gap-2 text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Capacity utilization is high. Consider alternative carriers.</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

