"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  MapPin,
  DollarSign,
  Users
} from 'lucide-react'

export function TMSDashboard() {
  const kpis = [
    {
      title: 'Active Shipments',
      value: '127',
      change: '+12%',
      trend: 'up',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Orders Today',
      value: '89',
      change: '+8%',
      trend: 'up',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'On-Time Delivery',
      value: '94.5%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Exceptions',
      value: '3',
      change: '-15%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'shipment',
      message: 'Shipment #TMS-001 delivered to New York',
      time: '2 minutes ago',
      status: 'delivered'
    },
    {
      id: 2,
      type: 'optimization',
      message: 'Route optimization completed for Zone A',
      time: '15 minutes ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'carrier',
      message: 'New carrier partner added: FastTrack Logistics',
      time: '1 hour ago',
      status: 'added'
    },
    {
      id: 4,
      type: 'exception',
      message: 'Delay alert: Shipment #TMS-045 running 2 hours late',
      time: '2 hours ago',
      status: 'warning'
    }
  ]

  const topCarriers = [
    { name: 'FedEx Ground', shipments: 45, onTime: 96.2, cost: '$2,340' },
    { name: 'UPS Ground', shipments: 38, onTime: 94.8, cost: '$2,180' },
    { name: 'USPS Priority', shipments: 28, onTime: 92.1, cost: '$1,890' },
    { name: 'DHL Express', shipments: 16, onTime: 98.5, cost: '$3,120' }
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    <div className="flex items-center mt-1">
                      <Badge 
                        variant={kpi.trend === 'up' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {kpi.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                    <Icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'delivered' ? 'bg-green-500' :
                    activity.status === 'completed' ? 'bg-blue-500' :
                    activity.status === 'added' ? 'bg-purple-500' :
                    'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Carriers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Carriers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCarriers.map((carrier, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{carrier.name}</p>
                    <p className="text-xs text-gray-500">{carrier.shipments} shipments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{carrier.onTime}% on-time</p>
                    <p className="text-xs text-gray-500">{carrier.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <Package className="h-6 w-6 text-blue-600 mb-2" />
              <p className="font-medium text-sm">Create Order</p>
              <p className="text-xs text-gray-500">New shipment order</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <Truck className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium text-sm">Track Shipment</p>
              <p className="text-xs text-gray-500">Real-time tracking</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <DollarSign className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium text-sm">Get Quote</p>
              <p className="text-xs text-gray-500">Rate comparison</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <MapPin className="h-6 w-6 text-orange-600 mb-2" />
              <p className="font-medium text-sm">Route Planning</p>
              <p className="text-xs text-gray-500">Optimize routes</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
