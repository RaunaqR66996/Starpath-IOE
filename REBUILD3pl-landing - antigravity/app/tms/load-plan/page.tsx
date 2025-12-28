"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { WorkspaceContent } from '@/components/workspace/WorkspaceContent'
import { tmsWorkspaceConfig } from '../workspace-config'
import { LoadOptimizerPanel } from '@/components/trailer3d/LoadOptimizerPanel'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function LoadPlanPage() {
  const router = useRouter()

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <WorkspaceSidebar config={tmsWorkspaceConfig} />
      <WorkspaceContent workspaceName="tms" workspaceTitle="Transportation Management" className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/tms')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to TMS
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Load Planning</h1>
            <p className="text-sm text-gray-600 mt-1">
              Optimize load planning with 3D visualization and AI-powered algorithms
            </p>
          </div>
          
          <div className="h-[calc(100vh-200px)]">
            <LoadOptimizerPanel />
          </div>
        </div>
      </WorkspaceContent>
    </div>
  )
}

