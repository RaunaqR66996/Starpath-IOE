"use client"

import React, { useState } from 'react'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { KPIDashboard } from '@/components/wms/KPIDashboard'
import { wmsWorkspaceConfig } from '../workspace-config'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

// Dynamic import for 3D warehouse (client-side only)
const Warehouse3DScene = dynamic(() => import('@/components/wms/Warehouse3DScene').then(mod => ({ default: mod.Warehouse3DScene })), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading 3D Warehouse...</div>
})

export default function WMSDashboardPage() {
  const config = wmsWorkspaceConfig
  const [selectedSiteId] = useState('default-site') // TODO: Get from context or props
  
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <WorkspaceSidebar config={config} />
      
      {/* Main Content */}
      <WorkspaceContent 
        workspaceName="wms"
        workspaceTitle="Warehouse Management"
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 overflow-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">WMS Dashboard</h1>
          
          {/* KPI Dashboard - Real API Integration */}
          <div className="mb-6">
            <KPIDashboard siteId={selectedSiteId} />
          </div>
          
          {/* 3D Warehouse View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-700" />
                  <span>3D Warehouse Visualization</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Interactive warehouse layout with real-time inventory
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] bg-gray-100">
                  <Warehouse3DScene warehouseId={selectedSiteId} />
                </div>
              </CardContent>
            </Card>
            
            {/* Active Tasks / Recent Activity */}
            <Card className="border border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle>Active Tasks</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Real-time warehouse operations
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-sm text-gray-500">
                  Task list will load from API: GET /api/wms/tasks?siteId={selectedSiteId}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WorkspaceContent>
    </div>
  )
}

