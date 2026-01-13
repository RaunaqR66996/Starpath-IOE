"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Play, TrendingUp } from "lucide-react"

export function RouteOptimization() {
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleOptimize = () => {
    setOptimizing(true)
    // TODO: Integrate with route optimization API
    setTimeout(() => {
      setResult({
        originalDistance: 1250,
        optimizedDistance: 980,
        savings: 270,
        stops: 8,
        estimatedTime: '6.5 hours'
      })
      setOptimizing(false)
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Optimization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Optimization Settings</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Minimize Distance</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex justify-between">
              <span>Time Windows</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex justify-between">
              <span>Traffic Avoidance</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
          </div>
        </div>

        <Button onClick={handleOptimize} disabled={optimizing} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          {optimizing ? 'Optimizing Route...' : 'Optimize Route'}
        </Button>

        {result && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-medium">Optimization Complete</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Original Distance</div>
                <div className="font-medium">{result.originalDistance} miles</div>
              </div>
              <div>
                <div className="text-gray-600">Optimized Distance</div>
                <div className="font-medium text-green-600">{result.optimizedDistance} miles</div>
              </div>
              <div>
                <div className="text-gray-600">Distance Saved</div>
                <div className="font-medium">{result.savings} miles</div>
              </div>
              <div>
                <div className="text-gray-600">Estimated Time</div>
                <div className="font-medium">{result.estimatedTime}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
