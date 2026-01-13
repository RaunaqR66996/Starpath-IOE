"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Warehouse3D } from "@/components/Warehouse3D"
import { WMSChat } from "@/components/WMSChat"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Package, Truck, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function WMSDashboardPage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('warehouse-001')
  
  const kpiMetrics = [
    { title: 'Total Inventory', value: '1,247', change: '+5.2%', trend: 'up', icon: <Package className="h-4 w-4" /> },
    { title: 'Active Orders', value: '23', change: '+12.5%', trend: 'up', icon: <Truck className="h-4 w-4" /> },
    { title: 'Pick Accuracy', value: '98.7%', change: '+0.3%', trend: 'up', icon: <CheckCircle className="h-4 w-4" /> },
    { title: 'Cycle Time', value: '2.3h', change: '-8.2%', trend: 'down', icon: <Clock className="h-4 w-4" /> },
  ]

  return (
    <DashboardLayout>
      <div className="h-screen bg-white">
        <div className="grid grid-cols-2 h-full">
          <div className="bg-white p-4 border border-gray-200 flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black">WMS Dashboard</h2>
                  <p className="text-gray-600 font-medium text-xs">Warehouse Overview & KPIs</p>
                </div>
              </div>
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="h-8 w-48 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse-001">KuehneNagel - East Warehouse - NY</SelectItem>
                  <SelectItem value="warehouse-002">L-Angeles - Dual West Warehouse - LA</SelectItem>
                  <SelectItem value="warehouse-003">Laredo - South Warehouse - TX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-white rounded-md shadow-sm flex-1 overflow-hidden">
              <Warehouse3D className="h-full" warehouseId={selectedSiteId} />
            </div>
          </div>
          
          <div className="bg-white p-3 border border-gray-200 flex flex-col">
            <ErrorBoundary>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Key Performance Indicators</h3>
                <div className="grid grid-cols-2 gap-2">
                  {kpiMetrics.map((metric, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-600 truncate">{metric.title}</p>
                            <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
                            <p className={`text-xs ${
                              metric.trend === 'up' ? 'text-green-600' : 
                              metric.trend === 'down' ? 'text-red-600' : 
                              'text-gray-500'
                            }`}>
                              {metric.change}
                            </p>
                          </div>
                          <div className="text-gray-400 flex-shrink-0">
                            {metric.icon}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ErrorBoundary>
            <div className="flex-shrink-0 mt-auto">
              <WMSChat className="h-48" context="wms" warehouseId={selectedSiteId} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

