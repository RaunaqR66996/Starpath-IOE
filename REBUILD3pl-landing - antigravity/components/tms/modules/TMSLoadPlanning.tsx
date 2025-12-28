"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Truck,
  Settings,
  Play,
  RotateCcw,
  Upload,
  AlertTriangle,
  TrendingUp,
  Weight,
  Loader2
} from 'lucide-react'
import { LanePerformanceGraph } from '@/components/tms/LanePerformanceGraph'
import { LoadBuilder } from '@/components/tms/load-planning/LoadBuilder'
import { RouteOptimization } from '@/components/tms/load-planning/RouteOptimization'
import { MultiStopSequencing } from '@/components/tms/load-planning/MultiStopSequencing'
import { CapacityPlanning } from '@/components/tms/load-planning/CapacityPlanning'
import { EquipmentSelection } from '@/components/tms/load-planning/EquipmentSelection'
import { LoadConsolidation } from '@/components/tms/load-planning/LoadConsolidation'
import { getOrders } from '@/app/actions/orders'
import { createLoad } from '@/app/actions/tms'
import { toast } from 'sonner'
import { packTrailer } from '@/lib/engine/greedy-packer'
import { STANDARD_53FT_TRAILER, TrailerSpec, CargoItem, OptimizeResult } from '@/lib/types/trailer'

// Extended trailer type with id and name
interface ExtendedTrailerSpec extends TrailerSpec {
  id: string;
  name: string;
}

// Trailer presets for dynamic selection
const TRAILER_PRESETS: ExtendedTrailerSpec[] = [
  { ...STANDARD_53FT_TRAILER, id: '53ft-dry', name: '53ft Dry Van' },
  { ...STANDARD_53FT_TRAILER, id: '53ft-reefer', name: '53ft Reefer', height_ft: 8.5 },
  { ...STANDARD_53FT_TRAILER, id: '48ft-flatbed', name: '48ft Flatbed', length_ft: 48, height_ft: 8.0 },
  { ...STANDARD_53FT_TRAILER, id: '40ft-container', name: '40ft Container', length_ft: 40, width_ft: 8.0, height_ft: 8.5 }
];

export function TMSLoadPlanning() {
  const searchParams = useSearchParams()
  const submoduleParam = searchParams?.get('submodule')

  // Render sub-modules based on query param
  if (submoduleParam === 'builder') return <LoadBuilder />
  if (submoduleParam === 'route-optimization') return <RouteOptimization />
  if (submoduleParam === 'multi-stop') return <MultiStopSequencing />
  if (submoduleParam === 'capacity') return <CapacityPlanning />
  if (submoduleParam === 'equipment') return <EquipmentSelection />
  if (submoduleParam === 'consolidation') return <LoadConsolidation />

  const [optimizationResult, setOptimizationResult] = useState<OptimizeResult | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [stagedOrders, setStagedOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [selectedTrailer, setSelectedTrailer] = useState<ExtendedTrailerSpec>(TRAILER_PRESETS[0])

  useEffect(() => {
    const fetchStagedOrders = async () => {
      try {
        const response = await fetch('/api/tms/staged-orders')
        const data = await response.json()

        if (data.success) {
          // Map StagingItem to a structure compatible with the rest of the component
          // or update the component to use StagingItem. 
          // Let's update the component to handle StagingItem structure in the loop below.
          setStagedOrders(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch orders", error)
        toast.error("Failed to load staged orders")
      } finally {
        setLoadingOrders(false)
      }
    }
    fetchStagedOrders()
  }, [])

  const handleOptimize = async () => {
    if (stagedOrders.length === 0) {
      toast.error("No staged orders available to optimize")
      return
    }

    setIsOptimizing(true)

    try {
      // 1. Prepare Cargo Items from Orders
      const cargoItems: CargoItem[] = []

      stagedOrders.forEach(stagingItem => {
        const order = stagingItem.order
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            // Create individual cargo items based on quantity
            for (let i = 0; i < item.quantity; i++) {
              cargoItems.push({
                id: `${item.sku}-${i + 1}`,
                l: item.length || 1, // Default dimensions if missing
                w: item.width || 1,
                h: item.height || 1,
                weight_lbs: item.weight || 1,
                stackable: true, // Default
                orientations: [[0, 1, 2], [1, 0, 2]]
              })
            }
          })
        }
      })

      if (cargoItems.length === 0) {
        toast.error("Orders have no items to pack!")
        setIsOptimizing(false)
        return
      }

      // 2. Run Real Optimization
      // Use requestAnimationFrame to ensure UI updates before heavy computation
      await new Promise<void>(resolve => {
        setTimeout(() => {
          const result = packTrailer(cargoItems, selectedTrailer)
          setOptimizationResult(result)

          if (result.unplaced.length > 0) {
            toast.warning(`${result.unplaced.length} items could not be placed`)
          } else {
            toast.success(`Optimized ${result.placed.length} items successfully`)
          }
          resolve()
        }, 100)
      })

      // 3. Create Load Plan
      const response = await fetch('/api/tms/load-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: stagedOrders.map(o => o.order.id),
          equipmentType: selectedTrailer.name
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Load Plan ${result.data.planNumber} created!`)
        setStagedOrders([]) // Clear staged orders
      } else {
        toast.error('Failed to save load plan')
      }

    } catch (error) {
      console.error("Optimization failed", error)
      toast.error("Optimization failed")
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleClear = () => {
    setOptimizationResult(null)
  }

  return (
    <div className="space-y-3 h-full overflow-hidden">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Load Planning & Optimization</h2>
          <p className="text-sm text-gray-600">AI-powered 3D load optimization for maximum efficiency</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Cargo
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Constraints
          </Button>
          <Button
            size="sm"
            onClick={handleOptimize}
            disabled={isOptimizing || stagedOrders.length === 0}
          >
            {isOptimizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            {isOptimizing ? 'Optimizing...' : 'Optimize Load'}
          </Button>
          {optimizationResult && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cargo List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Staged Orders ({stagedOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {loadingOrders ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
              ) : stagedOrders.length === 0 ? (
                <div className="text-center text-gray-500 py-4 text-sm">No staged orders found. Allocate orders in WMS first.</div>
              ) : (
                stagedOrders.map((stagingItem) => (
                  <div key={stagingItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{stagingItem.order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{stagingItem.order.customer?.name || 'Unknown Customer'}</p>
                      <p className="text-xs text-gray-400">{stagingItem.order.items?.length || 0} items</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">{stagingItem.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trailer Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Trailer Specs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-gray-500">Length</p>
                  <p className="font-medium">{selectedTrailer.length_ft} ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Width</p>
                  <p className="font-medium">{selectedTrailer.width_ft} ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="font-medium">{selectedTrailer.height_ft} ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Weight</p>
                  <p className="font-medium">{selectedTrailer.max_gvw_lbs.toLocaleString()} lbs</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Axle Configuration</p>
                <div className="space-y-2">
                  {selectedTrailer.axles && selectedTrailer.axles.map((axle, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>Axle {i + 1} ({axle.type})</span>
                      <span className="text-gray-500">@ {axle.pos_ft} ft</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {optimizationResult ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{Math.round(optimizationResult.utilization_pct)}%</p>
                    <p className="text-xs text-gray-600">Utilization</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    {/* Stability score is not in OptimizeResult, calculating simple one */}
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((1 - Math.abs(optimizationResult.cog[0] - selectedTrailer.length_ft / 2) / (selectedTrailer.length_ft / 2)) * 100)}
                    </p>
                    <p className="text-xs text-gray-600">Stability Score</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items Placed</span>
                    <span className="font-medium text-green-600">{optimizationResult.placed.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Items Unplaced</span>
                    <span className="font-medium text-red-600">{optimizationResult.unplaced.length}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Center of Gravity</p>
                  <div className="text-xs text-gray-600">
                    X: {optimizationResult.cog[0].toFixed(1)}ft,
                    Y: {optimizationResult.cog[1].toFixed(1)}ft,
                    Z: {optimizationResult.cog[2].toFixed(1)}ft
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">Click "Optimize Load" to start</p>
                <p className="text-xs text-gray-500 mt-1">AI will calculate optimal placement and create a shipment.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lane Performance Graph */}
      <LanePerformanceGraph />

      {/* Axle Load Distribution */}
      {optimizationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Weight className="h-5 w-5" />
              Axle Load Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimizationResult.axle_loads.map((axle, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">Axle {axle.axle_index + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{Math.round(axle.load_lbs).toLocaleString()} lbs</span>
                      <span>{Math.round(axle.percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${axle.percentage >= 100 ? 'bg-red-500' :
                          axle.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(axle.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-xs text-gray-500 text-right">
                    Max: {axle.limit_lbs.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
