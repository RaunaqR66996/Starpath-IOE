"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, XCircle } from "lucide-react"

interface DeliveryMetric {
  period: string
  onTime: number
  late: number
  total: number
  onTimePercentage: number
}

const mockMetrics: DeliveryMetric[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function OnTimeDeliveryReports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>On-Time Delivery Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockMetrics.map((metric, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{metric.period}</span>
              <Badge className={metric.onTimePercentage >= 95 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {metric.onTimePercentage}%
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-lg font-bold">{metric.onTime}</span>
                </div>
                <div className="text-gray-600">On-Time</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <XCircle className="h-4 w-4" />
                  <span className="text-lg font-bold">{metric.late}</span>
                </div>
                <div className="text-gray-600">Late</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-lg font-bold">{metric.total}</span>
                </div>
                <div className="text-gray-600">Total</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

