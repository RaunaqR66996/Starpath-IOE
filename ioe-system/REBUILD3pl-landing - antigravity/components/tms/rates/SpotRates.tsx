"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock } from "lucide-react"

interface SpotRate {
  id: string
  lane: string
  carrier: string
  rate: number
  validUntil: string
  marketTrend: 'up' | 'down' | 'stable'
}

const mockSpotRates: SpotRate[]    = [] // TODO: Fetch from API // TODO: Fetch from API // TODO: Fetch from API

export function SpotRates() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spot Market Rates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockSpotRates.map((spot) => (
          <div key={spot.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">{spot.lane}</div>
              <div className="flex items-center gap-2">
                {spot.marketTrend === 'down' && (
                  <Badge className="bg-green-100 text-green-800">
                    <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                    Down
                  </Badge>
                )}
                {spot.marketTrend === 'up' && (
                  <Badge className="bg-red-100 text-red-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Up
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{spot.carrier}</div>
              <div className="text-right">
                <div className="text-xl font-bold">${spot.rate.toFixed(2)}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Valid until {spot.validUntil}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

