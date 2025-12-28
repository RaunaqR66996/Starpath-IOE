"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Eye, 
  Search, 
  MapPin,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  CheckCircle,
  Navigation
} from 'lucide-react'

export function TMSTracking() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const shipments = [
    {
      id: 'SH001',
      trackingNumber: '1Z999AA1234567890',
      status: 'in_transit',
      origin: 'Dallas, TX',
      destination: 'New York, NY',
      currentLocation: 'Chicago, IL',
      progress: 65,
      estimatedDelivery: '2024-01-18 14:30',
      carrier: 'FedEx Ground',
      lastUpdate: '2024-01-17 08:45'
    },
    {
      id: 'SH002',
      trackingNumber: '794698317000',
      status: 'delivered',
      origin: 'Phoenix, AZ',
      destination: 'Chicago, IL',
      currentLocation: 'Chicago, IL',
      progress: 100,
      estimatedDelivery: '2024-01-16 16:20',
      carrier: 'UPS Ground',
      lastUpdate: '2024-01-16 16:20'
    },
    {
      id: 'SH003',
      trackingNumber: '9400100000000000000000',
      status: 'exception',
      origin: 'Columbus, OH',
      destination: 'Los Angeles, CA',
      currentLocation: 'Denver, CO',
      progress: 45,
      estimatedDelivery: '2024-01-19 12:00',
      carrier: 'USPS Priority',
      lastUpdate: '2024-01-17 10:30'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'exception': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit': return <Truck className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'exception': return <AlertTriangle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const filteredShipments = shipments.filter(shipment =>
    shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.destination.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Tracking Search */}
      <Card>
        <CardHeader>
          <CardTitle>Track Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter tracking number..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shipments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Shipments</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>

        {filteredShipments.map((shipment) => (
          <Card key={shipment.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(shipment.status)}
                      <span className="font-medium">{shipment.trackingNumber}</span>
                      <Badge className={getStatusColor(shipment.status)}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{shipment.carrier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{shipment.progress}% Complete</p>
                    <p className="text-xs text-gray-500">Last update: {shipment.lastUpdate}</p>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{shipment.origin}</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-300 relative">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${shipment.progress}%` }}
                    />
                    <div 
                      className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"
                      style={{ left: `${shipment.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="text-sm">{shipment.destination}</span>
                  </div>
                </div>

                {/* Current Location */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Current: {shipment.currentLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">ETA: {shipment.estimatedDelivery}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{shipment.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        shipment.status === 'delivered' ? 'bg-green-500' :
                        shipment.status === 'exception' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${shipment.progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Live Map
                  </Button>
                  {shipment.status === 'exception' && (
                    <Button size="sm" variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Live Tracking Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Live Tracking Map</p>
              <p className="text-sm text-gray-500">Real-time shipment locations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





