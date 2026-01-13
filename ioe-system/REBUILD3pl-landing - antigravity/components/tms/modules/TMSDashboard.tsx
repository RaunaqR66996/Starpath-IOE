"use client"

import React, { useEffect, useState } from 'react'
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

interface DashboardData {
  activeShipments: number
  deliveriesToday: number
  recentActivity: Array<{
    id: string
    description: string
    timestamp: string
    shipmentNumber?: string
  }>
  onTimeDeliveryRate: number
}

export function TMSDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/tms/dashboard')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const kpis = [
    {
      title: 'Active Shipments',
      value: loading ? '...' : data?.activeShipments.toString() || '0',
      change: '+12%',
      trend: 'up',
      icon: Truck,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100'
    },
    {
      title: 'Deliveries Today',
      value: loading ? '...' : data?.deliveriesToday.toString() || '0',
      change: '+8%',
      trend: 'up',
      icon: Package,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100'
    },
    {
      title: 'On-Time Delivery',
      value: loading ? '...' : `${data?.onTimeDeliveryRate}%` || '0%',
      change: '+2.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100'
    },
    {
      title: 'Exceptions',
      value: '0',
      change: '-15%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100'
    }
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index} className="rounded-md border border-border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-sp-text-muted">{kpi.title}</p>
                    <p className="text-2xl font-semibold text-sp-text-strong">{kpi.value}</p>
                    <Badge
                      variant={kpi.trend === 'up' ? 'success' : 'danger'}
                      className="mt-1"
                    >
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className={`h-8 w-8 rounded-md ${kpi.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="rounded-md border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-sm text-gray-500">Loading activity...</div>
              ) : data?.recentActivity.length === 0 ? (
                <div className="text-sm text-gray-500">No recent activity</div>
              ) : (
                data?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm text-sp-text-strong">{activity.description}</p>
                      <p className="text-xs text-sp-text-muted">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                        {activity.shipmentNumber && ` • ${activity.shipmentNumber}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Carriers */}
        <Card className="rounded-md border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Carriers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-4">
              No carrier data available yet
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-md border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-border rounded-md hover:bg-slate-50 text-left transition-colors">
              <Package className="h-5 w-5 text-slate-600 mb-2" />
              <p className="font-medium text-sm">Create Order</p>
              <p className="text-xs text-sp-text-muted">New shipment order</p>
            </button>
            <button className="p-4 border border-border rounded-md hover:bg-slate-50 text-left transition-colors">
              <Truck className="h-5 w-5 text-slate-600 mb-2" />
              <p className="font-medium text-sm">Track Shipment</p>
              <p className="text-xs text-sp-text-muted">Real-time tracking</p>
            </button>
            <button className="p-4 border border-border rounded-md hover:bg-slate-50 text-left transition-colors">
              <DollarSign className="h-5 w-5 text-slate-600 mb-2" />
              <p className="font-medium text-sm">Get Quote</p>
              <p className="text-xs text-sp-text-muted">Rate comparison</p>
            </button>
            <button className="p-4 border border-border rounded-md hover:bg-slate-50 text-left transition-colors">
              <MapPin className="h-5 w-5 text-slate-600 mb-2" />
              <p className="font-medium text-sm">Route Planning</p>
              <p className="text-xs text-sp-text-muted">Optimize routes</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
