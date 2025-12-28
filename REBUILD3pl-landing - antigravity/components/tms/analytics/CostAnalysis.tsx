"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"

interface CostMetric {
  period: string
  totalCost: number
  avgCostPerShipment: number
  trend: 'up' | 'down'
  change: number
}

const mockCosts: CostMetric[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function CostAnalysis() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Freight Cost Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockCosts.map((cost, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">{cost.period}</span>
              <div className="flex items-center gap-1">
                {cost.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${cost.trend === 'down' ? 'text-green-600' : 'text-red-600'}`}>
                  {cost.change > 0 ? '+' : ''}{cost.change}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-xl font-bold">${cost.totalCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg per Shipment</div>
                <div className="text-xl font-bold">${cost.avgCostPerShipment}</div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

