"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Package, Truck, TrendingUp } from "lucide-react"

export function CapacityPlanning() {
  const capacityData = {
    totalCapacity: 80000,
    usedCapacity: 62500,
    availableCapacity: 17500,
    utilization: 78.1,
    shipments: 45,
    trailers: 12
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity Planning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Total Capacity</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {capacityData.totalCapacity.toLocaleString()} lbs
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="font-medium">Available</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {capacityData.availableCapacity.toLocaleString()} lbs
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Capacity Utilization</span>
            <span className="font-medium">{capacityData.utilization}%</span>
          </div>
          <Progress value={capacityData.utilization} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Active Shipments</div>
            <div className="font-medium text-lg">{capacityData.shipments}</div>
          </div>
          <div>
            <div className="text-gray-600">Trailers in Use</div>
            <div className="font-medium text-lg">{capacityData.trailers}</div>
          </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-800">
              Capacity utilization is optimal. Consider adding trailers if volume increases.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

