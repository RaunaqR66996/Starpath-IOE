// AI Pick Pathing Component
// Displays AI-optimized pick paths with constraint validation

"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Route, 
  Clock, 
  Navigation, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  MapPin,
  Timer
} from 'lucide-react'
import { WmsAIAgents, PickPath } from '@/lib/ai/wms-ai-agents'

interface AIPickPathingProps {
  taskId: string
  items: Array<{
    binId: string
    coordinates: { x: number, y: number, z: number }
    itemId: string
    quantity: number
  }>
  onPathGenerated?: (path: PickPath) => void
  onPathApplied?: (path: PickPath) => void
}

export function AIPickPathing({ 
  taskId, 
  items, 
  onPathGenerated, 
  onPathApplied 
}: AIPickPathingProps) {
  const [pickPath, setPickPath] = useState<PickPath | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [constraints, setConstraints] = useState({
    aisleWidth: 3.0,
    forkliftTurnRadius: 2.5,
    blockedZones: [] as string[],
    oneWayAisles: [] as string[]
  })

  const aiAgents = new WmsAIAgents()

  // Generate AI pick path
  const generatePickPath = useCallback(async () => {
    if (!aiEnabled || items.length === 0) return

    try {
      setLoading(true)
      setError(null)

      const path = await aiAgents.generatePickPath(taskId, items, constraints)
      setPickPath(path)
      onPathGenerated?.(path)
    } catch (err) {
      console.error('Error generating pick path:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate pick path')
    } finally {
      setLoading(false)
    }
  }, [taskId, items, constraints, aiEnabled, onPathGenerated])

  // Apply pick path
  const handleApplyPath = useCallback(async () => {
    if (!pickPath) return

    try {
      // Apply the path (mock implementation)
      console.log('Applying pick path:', pickPath)
      onPathApplied?.(pickPath)
    } catch (err) {
      console.error('Error applying pick path:', err)
      setError(err instanceof Error ? err.message : 'Failed to apply pick path')
    }
  }, [pickPath, onPathApplied])

  // Generate path on items change
  useEffect(() => {
    if (items.length > 0) {
      generatePickPath()
    }
  }, [generatePickPath])

  if (!aiEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            AI Pick Pathing
          </CardTitle>
          <CardDescription>
            AI-powered pick path optimization is currently disabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setAiEnabled(true)}>
            <Route className="h-4 w-4 mr-2" />
            Enable AI Pathing
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          AI Pick Pathing
          {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          AI-optimized pick paths with constraint validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating optimal pick path...</p>
            </div>
          </div>
        ) : pickPath ? (
          <div className="space-y-4">
            {/* Path Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Distance</span>
                </div>
                <p className="text-lg font-bold">{pickPath.totalDistance.toFixed(1)}m</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Timer className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Time</span>
                </div>
                <p className="text-lg font-bold">{Math.round(pickPath.estimatedTime / 60)}min</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Route className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Efficiency</span>
                </div>
                <p className="text-lg font-bold">{Math.round(pickPath.efficiency * 100)}%</p>
              </div>
            </div>

            {/* Path Steps */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Pick Sequence</h4>
              <div className="space-y-1">
                {pickPath.path.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-background border rounded">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{step.binId}</span>
                        <Badge variant="outline" className="text-xs">
                          {step.itemId}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Qty: {step.quantity} • Est: {step.estimatedTime}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button 
                  size="sm"
                  onClick={handleApplyPath}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Path
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={generatePickPath}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setAiEnabled(false)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Disable AI
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <p className="text-sm text-muted-foreground">No pick path available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add items to generate an optimized pick path
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

