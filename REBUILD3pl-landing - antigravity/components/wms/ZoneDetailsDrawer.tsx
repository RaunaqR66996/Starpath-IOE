"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Clock, AlertTriangle, CheckCircle, Truck, Unlink, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StagingZone, ZONE_COLORS } from '@/types/warehouse-zones'

interface ZoneDetailsDrawerProps {
  zone: StagingZone | null
  isOpen: boolean
  onClose: () => void
  onUnassignOrder: (orderId: string) => void
  onMarkLoaded: (orderId: string) => void
}

export function ZoneDetailsDrawer({
  zone,
  isOpen,
  onClose,
  onUnassignOrder,
  onMarkLoaded
}: ZoneDetailsDrawerProps) {
  if (!zone) return null

  const totalPallets = zone.orders.reduce((sum, order) => sum + order.palletCount, 0)
  const utilizationPercent = Math.round(zone.utilizationPercentage)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 border-l border-gray-200"
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: ZONE_COLORS[zone.state] }}
                />
                <h2 className="text-lg font-semibold">{zone.name}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Zone Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Zone Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Utilization Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilization</span>
                      <span className="font-medium">{utilizationPercent}%</span>
                    </div>
                    <Progress value={utilizationPercent} className="h-2" />
                    <div className="text-xs text-gray-500">
                      {totalPallets} / {zone.maxCapacity} pallets
                    </div>
                  </div>

                  {/* Zone State Badge */}
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline"
                      className="text-xs"
                      style={{ 
                        borderColor: ZONE_COLORS[zone.state],
                        color: ZONE_COLORS[zone.state]
                      }}
                    >
                      {zone.state.replace('-', ' ').toUpperCase()}
                    </Badge>
                    {zone.dockDoorId && (
                      <Badge variant="secondary" className="text-xs">
                        Dock {zone.dockDoorId}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Orders Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Assigned Orders</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {zone.orders.length} orders
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {zone.orders.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-500">No orders assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {zone.orders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onUnassign={() => onUnassignOrder(order.id)}
                          onMarkLoaded={() => onMarkLoaded(order.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Zone Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={zone.orders.length === 0}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Unassign All Orders
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={zone.orders.length === 0}
                  >
                    <Loader className="h-4 w-4 mr-2" />
                    Mark All Loaded
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Individual Order Card Component
function OrderCard({ 
  order, 
  onUnassign, 
  onMarkLoaded 
}: { 
  order: any
  onUnassign: () => void
  onMarkLoaded: () => void
}) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader className="h-3 w-3" />
      case 'loaded':
        return <CheckCircle className="h-3 w-3" />
      case 'shipped':
        return <Truck className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading':
        return 'bg-blue-100 text-blue-800'
      case 'loaded':
        return 'bg-green-100 text-green-800'
      case 'shipped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="border rounded-lg p-3 space-y-2">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-sm">{order.orderRef}</span>
        </div>
        <Badge 
          variant="outline" 
          className={`text-xs ${getStatusColor(order.status)}`}
        >
          <div className="flex items-center gap-1">
            {getStatusIcon(order.status)}
            {order.status}
          </div>
        </Badge>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <span className="font-medium">{order.palletCount}</span> pallets
        </div>
        <div>
          Priority: <span className="font-medium">{order.priority}</span>
        </div>
      </div>

      {/* ETA */}
      {order.eta && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          ETA: {order.eta}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={onUnassign}
        >
          <Unlink className="h-3 w-3 mr-1" />
          Unassign
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={onMarkLoaded}
          disabled={order.status === 'loaded' || order.status === 'shipped'}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Mark Loaded
        </Button>
      </div>
    </div>
  )
}






