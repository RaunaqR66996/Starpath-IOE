"use client"

import React from 'react'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { TMSDashboard } from '@/components/tms/modules/TMSDashboard'
import { tmsWorkspaceConfig } from '../workspace-config'
import dynamic from 'next/dynamic'

// Dynamic import for map component (client-side only)
const SimpleMap = dynamic(() => import('@/components/SimpleMap'), { ssr: false })

export default function TMSDashboardPage() {
  const config = tmsWorkspaceConfig
  
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <WorkspaceSidebar config={config} />
      
      {/* Main Content */}
      <WorkspaceContent 
        workspaceName="tms"
        workspaceTitle="Transportation Management"
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 overflow-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">TMS Dashboard</h1>
          
          {/* Dashboard Component with Real API Integration */}
          <TMSDashboard />
          
          {/* Map View Section */}
          <div className="mt-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Live Map View</h2>
                <p className="text-sm text-gray-600">Real-time shipment tracking and vehicle locations</p>
              </div>
              <div className="h-[400px] bg-gray-100">
                <SimpleMap />
              </div>
            </div>
          </div>
        </div>
      </WorkspaceContent>
    </div>
  )
}

