"use client"

import React from 'react'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { wmsWorkspaceConfig } from './workspace-config'

export default function WMSPage() {
  const config = wmsWorkspaceConfig
  
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
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Warehouse Management</h1>
          <p className="text-gray-600 mb-6">
            Manage inventory, receiving, putaway, picking, packing, and shipping operations.
          </p>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <a
              href="/wms/dashboard"
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard</h3>
              <p className="text-sm text-gray-600">
                View KPIs, 3D warehouse visualization, and active tasks
              </p>
            </a>
            
            <a
              href="/wms/receiving"
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Receiving</h3>
              <p className="text-sm text-gray-600">
                Process ASNs, scan items, and create receipts
              </p>
            </a>
            
            <a
              href="/wms/inventory"
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory</h3>
              <p className="text-sm text-gray-600">
                Track inventory levels, locations, and movements
              </p>
            </a>
          </div>
        </div>
      </WorkspaceContent>
    </div>
  )
}

