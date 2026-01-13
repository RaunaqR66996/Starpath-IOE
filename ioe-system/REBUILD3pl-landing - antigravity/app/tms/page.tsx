"use client"

import React from 'react'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { tmsWorkspaceConfig } from './workspace-config'

export default function TMSPage() {
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
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transportation Management</h1>
          <p className="text-gray-600 mb-6">
            Manage shipments, carriers, load planning, and transportation operations.
          </p>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <a
              href="/tms/dashboard"
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600">
                View KPIs, shipment analytics, and real-time tracking
              </p>
            </a>
            
            <a
              href="/tms/shipment"
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shipments</h3>
              <p className="text-sm text-gray-600">
                Create and manage shipments, track deliveries
              </p>
            </a>
            
            <a
              href="/tms/load-plan"
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Load Planning</h3>
              <p className="text-sm text-gray-600">
                Optimize load planning with 3D visualization
              </p>
            </a>
          </div>
        </div>
      </WorkspaceContent>
    </div>
  )
}

