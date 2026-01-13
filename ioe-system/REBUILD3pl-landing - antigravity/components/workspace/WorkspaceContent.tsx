"use client"

import React from 'react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getBreadcrumbs } from '@/lib/workspace/navigation'
import { usePathname } from 'next/navigation'

interface WorkspaceContentProps {
  children: React.ReactNode
  workspaceName: string
  workspaceTitle: string
  className?: string
}

export function WorkspaceContent({
  children,
  workspaceName,
  workspaceTitle,
  className,
}: WorkspaceContentProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname || '', workspaceName, workspaceTitle)
  
  return (
    <div className={className || 'flex-1 flex flex-col h-full overflow-hidden'}>
      {/* Breadcrumbs */}
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-white">
        {children}
      </div>
    </div>
  )
}

