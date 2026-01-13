"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Warehouse3D } from "@/components/Warehouse3D"
import { WMSChat } from "@/components/WMSChat"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useStagingStore } from "@/lib/stores/stagingStore"
import { WMSTabContainer, WMSTabType } from "@/components/wms/WMSTabContainer"
import {
  Building2,
  Loader2,
  Warehouse
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

// Main WMS Page Component
function WMSCreatePage() {
  const searchParams = useSearchParams()
  const [selectedSiteId, setSelectedSiteId] = useState<string>('warehouse-001')
  const moduleParam = (searchParams?.get('module') || 'inbound') as WMSTabType
  const [activeModule, setActiveModule] = useState<WMSTabType>(moduleParam)
  const stagingStore = useStagingStore()

  // Fetch warehouses from API
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/warehouse')
        if (!response.ok) return []
        const data = await response.json()
        return data.data || []
      } catch (error) {
        console.error('Failed to fetch warehouses:', error)
        return []
      }
    }
  })

  useEffect(() => {
    if (moduleParam !== activeModule) {
      setActiveModule(moduleParam)
    }
  }, [moduleParam, activeModule])

  // TODO: Replace with real order creation from database/API

  return (
    <DashboardLayout>
      <div>
        {/* 2-Quadrant Layout - No Scroll */}
        <div className="h-screen bg-white">
          <div className="grid grid-cols-2 h-full">

            {/* Q1: 3D Warehouse (Left Side) */}
            <div className="bg-white p-4 border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black">WMS - Warehouse Management</h2>
                    <p className="text-gray-600 font-medium text-xs">3D Warehouse Operations & Control</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-md shadow-sm flex-1 overflow-hidden">
                <Warehouse3D className="h-full" warehouseId={selectedSiteId} />
              </div>
            </div>

            {/* Q2: WMS Operations (Right Side) */}
            <div className="bg-white p-3 border border-gray-200 flex flex-col">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
                <Warehouse className="h-3 w-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-900">Operations</span>
              </div>

              {/* Operations Section - Takes remaining space above chat */}
              <div className="flex-1 overflow-auto min-h-0 mb-3">
                {/* Warehouse Selection */}
                <div className="mb-2">
                  <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                    <SelectTrigger className="h-6 w-full text-xs border-gray-300 px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {warehousesLoading ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-3 w-3 animate-spin mr-2 inline" />
                          Loading warehouses...
                        </SelectItem>
                      ) : warehouses.length === 0 ? (
                        <SelectItem value="none" disabled>No warehouses found</SelectItem>
                      ) : (
                        warehouses.map((wh: any) => (
                          <SelectItem key={wh.id} value={wh.warehouseCode}>
                            <div className="text-xs">
                              <div className="font-medium">{wh.warehouseName}</div>
                              {wh.externalId && (
                                <div className="text-gray-500 text-[10px]">ERPNext: {wh.externalId}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Operations Tabs */}
                <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as WMSTabType)} className="w-full flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 h-6 bg-gray-100 p-0.5">
                    <TabsTrigger value="inbound" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      In
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      Inv
                    </TabsTrigger>
                    <TabsTrigger value="outbound" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      Out
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="text-xs h-5 px-1 data-[state=active]:bg-white">
                      Data
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-auto mt-1">
                    <ErrorBoundary>
                      <TabsContent value="inbound" className="mt-0">
                        <WMSTabContainer activeTab="inbound" siteId={selectedSiteId} />
                      </TabsContent>
                      <TabsContent value="inventory" className="mt-0">
                        <WMSTabContainer activeTab="inventory" siteId={selectedSiteId} />
                      </TabsContent>
                      <TabsContent value="outbound" className="mt-0">
                        <WMSTabContainer activeTab="outbound" siteId={selectedSiteId} />
                      </TabsContent>
                      <TabsContent value="analytics" className="mt-0">
                        <WMSTabContainer activeTab="analytics" siteId={selectedSiteId} />
                      </TabsContent>
                    </ErrorBoundary>
                  </div>
                </Tabs>
              </div>

              {/* WMS Chat Bar - Fixed at bottom */}
              <div className="flex-shrink-0">
                <WMSChat
                  className="h-48"
                  context="wms"
                  warehouseId={selectedSiteId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default WMSCreatePage
