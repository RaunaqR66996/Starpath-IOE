"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Star } from "lucide-react"

interface PerformanceMetric {
  carrier: string
  onTimeDelivery: number
  rating: number
  shipments: number
  costPerShipment: number
  trend: 'up' | 'down'
}

const mockPerformance: PerformanceMetric[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CarrierPerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockPerformance.map((metric, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">{metric.carrier}</div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{metric.rating}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">On-Time Delivery</div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-lg">{metric.onTimeDelivery}%</span>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Shipments</div>
                <div className="font-medium text-lg">{metric.shipments.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-600">Avg Cost/Shipment</div>
                <div className="font-medium text-lg">${metric.costPerShipment}</div>
              </div>
              <div>
                <div className="text-gray-600">Performance</div>
                <Badge className={metric.onTimeDelivery >= 95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {metric.onTimeDelivery >= 95 ? 'Excellent' : 'Good'}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

