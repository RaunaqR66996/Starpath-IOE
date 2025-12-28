"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Truck, Clock, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react'
import { StagingZone, ZoneOrder } from '@/types/warehouse-zones'
import { ZONE_COLORS } from '@/types/warehouse-zones'
import toast from 'react-hot-toast'

interface OrderAssignmentDemoProps {
  zones: StagingZone[]
  availableOrders: ZoneOrder[]
  onAssignOrder: (zoneId: string, orderId: string) => void
  onUnassignOrder: (zoneId: string, orderId: string) => void
}

export function OrderAssignmentDemo({
  zones,
  availableOrders,
  onAssignOrder,
  onUnassignOrder
}: OrderAssignmentDemoProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [selectedOrderId, setSelectedOrderId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAssignOrder = () => {
    if (!selectedZoneId || !selectedOrderId) {
      toast.error('Please select both a zone and an order')
      return
    }

    onAssignOrder(selectedZoneId, selectedOrderId)
    toast.success(`Order assigned to ${zones.find(z => z.id === selectedZoneId)?.name}`)
    
    // Reset selections
    setSelectedOrderId('')
  }

  const handleUnassignOrder = (zoneId: string, orderId: string) => {
    onUnassignOrder(zoneId, orderId)
    toast.success('Order unassigned from zone')
  }

  const getZoneUtilization = (zone: StagingZone) => {
    const totalPallets = zone.orders.reduce((sum, order) => sum + order.palletCount, 0)
    return Math.round((totalPallets / zone.maxCapacity) * 100)
  }

  const getZoneStatusIcon = (state: StagingZone['state']) => {
    switch (state) {
      case 'active':
        return <Truck className="h-3 w-3" />
      case 'loaded':
        return <CheckCircle className="h-3 w-3" />
      case 'over-capacity':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Order Assignment Demo</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Assignment Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Zone Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Select Zone</label>
                  <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose zone..." />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ZONE_COLORS[zone.state] }}
                            />
                            {zone.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">Select Order</label>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            {order.orderRef} ({order.palletCount} pallets)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAssignOrder}
                disabled={!selectedZoneId || !selectedOrderId}
                className="w-full h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Assign Order to Zone
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone Status Overview */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Zone Status</h4>
          <div className="space-y-1">
            {zones.map((zone) => {
              const utilization = getZoneUtilization(zone)
              const totalOrders = zone.orders.length
              
              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 bg-white border rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ZONE_COLORS[zone.state] }}
                    />
                    <span className="font-medium">{zone.name}</span>
                    {getZoneStatusIcon(zone.state)}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {totalOrders} orders
                    </Badge>
                    <span className="text-gray-500">{utilization}%</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Available Orders */}
        {availableOrders.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Available Orders</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-blue-600" />
                    <span className="font-medium">{order.orderRef}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {order.palletCount} pallets
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        order.priority === 'high' ? 'border-red-300 text-red-700' :
                        order.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-green-300 text-green-700'
                      }`}
                    >
                      {order.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong>Demo Instructions:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Click "Order Assignment Demo" to expand controls</li>
            <li>Select a zone and an available order</li>
            <li>Click "Assign Order to Zone" to see the zone change color</li>
            <li>Click on the zone in the 3D view to see order details</li>
            <li>Use the zone details drawer to manage orders</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}






