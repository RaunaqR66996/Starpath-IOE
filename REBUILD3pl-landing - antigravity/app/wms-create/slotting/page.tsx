"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Warehouse3D } from "@/components/Warehouse3D"
import { WMSChat } from "@/components/WMSChat"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2 } from "lucide-react"
import { SlottingOptimization } from "@/components/wms/slotting/SlottingOptimization"

export default function WMSSlottingPage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('warehouse-001')

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
                  <h2 className="text-lg font-bold text-black">Slotting & Optimization</h2>
                  <p className="text-gray-600 font-medium text-xs">AI-Powered Slot Recommendations</p>
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
              <SlottingOptimization siteId={selectedSiteId} />
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

