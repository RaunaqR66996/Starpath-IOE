"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Plus, 
  Search, 
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Settings
} from 'lucide-react'

export function TMSCarriers() {
  const [searchTerm, setSearchTerm] = useState('')

  const carriers = [
    {
      id: 'C001',
      name: 'FedEx Ground',
      type: 'Ground',
      status: 'active',
      rating: 4.8,
      onTimeDelivery: 96.2,
      avgCost: 245,
      coverage: ['US', 'Canada'],
      contact: {
        phone: '+1-800-463-3339',
        email: 'support@fedex.com'
      },
      performance: {
        shipments: 1247,
        onTime: 1200,
        late: 47,
        costSavings: 12.5
      }
    },
    {
      id: 'C002',
      name: 'UPS Ground',
      type: 'Ground',
      status: 'active',
      rating: 4.6,
      onTimeDelivery: 94.8,
      avgCost: 238,
      coverage: ['US', 'Mexico'],
      contact: {
        phone: '+1-800-742-5877',
        email: 'support@ups.com'
      },
      performance: {
        shipments: 892,
        onTime: 846,
        late: 46,
        costSavings: 8.3
      }
    },
    {
      id: 'C003',
      name: 'DHL Express',
      type: 'Express',
      status: 'active',
      rating: 4.9,
      onTimeDelivery: 98.5,
      avgCost: 445,
      coverage: ['Global'],
      contact: {
        phone: '+1-800-225-5345',
        email: 'support@dhl.com'
      },
      performance: {
        shipments: 234,
        onTime: 230,
        late: 4,
        costSavings: 5.2
      }
    },
    {
      id: 'C004',
      name: 'USPS Priority',
      type: 'Ground',
      status: 'inactive',
      rating: 4.2,
      onTimeDelivery: 92.1,
      avgCost: 189,
      coverage: ['US'],
      contact: {
        phone: '+1-800-275-8777',
        email: 'support@usps.com'
      },
      performance: {
        shipments: 456,
        onTime: 420,
        late: 36,
        costSavings: 15.8
      }
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`} 
      />
    ))
  }

  const filteredCarriers = carriers.filter(carrier =>
    carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carrier.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Carrier Management</h2>
          <p className="text-sm text-gray-600">Manage carrier relationships and performance</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search carriers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Carrier
          </Button>
        </div>
      </div>

      {/* Carrier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCarriers.map((carrier) => (
          <Card key={carrier.id} className="sp-shadow hover:sp-shadow-hover transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-heading font-semibold text-sp-text-strong">{carrier.name}</CardTitle>
                  <p className="text-sm text-sp-text-muted">{carrier.type} • {carrier.coverage.join(', ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(carrier.status)}>
                    {carrier.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Rating and Performance */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex">{getRatingStars(carrier.rating)}</div>
                    <span className="text-sm font-medium text-sp-text-strong">{carrier.rating}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-sp-text-strong">{carrier.onTimeDelivery}%</p>
                    <p className="text-xs text-sp-text-muted">On-time delivery</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-sp-accent">{carrier.performance.shipments}</p>
                    <p className="text-xs text-sp-text-muted">Total Shipments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-sp-state.success">{carrier.performance.onTime}</p>
                    <p className="text-xs text-sp-text-muted">On Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-sp-state.danger">{carrier.performance.late}</p>
                    <p className="text-xs text-sp-text-muted">Late</p>
                  </div>
                </div>

                {/* Cost and Savings */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-sp-text-strong">Avg Cost: ${carrier.avgCost}</p>
                    <p className="text-xs text-sp-text-muted">Per shipment</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-sp-state.success" />
                      <span className="text-sm font-medium text-sp-state.success">
                        {carrier.performance.costSavings}%
                      </span>
                    </div>
                    <p className="text-xs text-sp-text-muted">Cost savings</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{carrier.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{carrier.contact.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Get Quote
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    Track
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Carrier Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">4.6</p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">95.4%</p>
              <p className="text-sm text-gray-600">Overall On-Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">$279</p>
              <p className="text-sm text-gray-600">Average Cost</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">10.5%</p>
              <p className="text-sm text-gray-600">Cost Savings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





