"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, Truck, DollarSign, Clock } from "lucide-react"

interface KPI {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
}

const kpis: KPI[] = [
  { title: 'On-Time Delivery', value: '94.5%', change: '+2.1%', trend: 'up', icon: <Clock className="h-5 w-5" /> },
  { title: 'Total Shipments', value: '1,247', change: '+12%', trend: 'up', icon: <Truck className="h-5 w-5" /> },
  { title: 'Cost per Shipment', value: '$279', change: '-5.2%', trend: 'down', icon: <DollarSign className="h-5 w-5" /> },
  { title: 'Active Orders', value: '89', change: '+8%', trend: 'up', icon: <Package className="h-5 w-5" /> },
]

export function KPIDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {kpis.map((kpi, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-600 text-sm">{kpi.title}</div>
                <div className="text-gray-400">{kpi.icon}</div>
              </div>
              <div className="text-2xl font-bold mb-1">{kpi.value}</div>
              <div className={`text-xs flex items-center gap-1 ${
                kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{kpi.change}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

