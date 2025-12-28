"use client"

import React, { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTMS, TMSModule } from '@/lib/contexts/TMSContext'
import { TMSDashboard } from './modules/TMSDashboard'
import { TMSOrders } from './modules/TMSOrders'
import { TMSStagedOrders } from './modules/TMSStagedOrders'
import { TMSLoadPlanning } from './modules/TMSLoadPlanning'
import { TMSCarriers } from './modules/TMSCarriers'
import { TMSRates } from './modules/TMSRates'
import { TMSTracking } from './modules/TMSTracking'
import { TMSDocuments } from './modules/TMSDocuments'
import { TMSAudit } from './modules/TMSAudit'
import { TMSAnalytics } from './modules/TMSAnalytics'
import { TMSExceptions } from './modules/TMSExceptions'
import { TMSSettings } from './modules/TMSSettings'
import { TMSInvoices } from './modules/TMSInvoices'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface TMSModuleContainerProps {
  className?: string
}

const moduleComponents: Record<TMSModule, React.ComponentType<any>> = {
  dashboard: TMSDashboard,
  orders: TMSOrders,
  'staged-orders': TMSStagedOrders,
  'load-planning': TMSLoadPlanning,
  carriers: TMSCarriers,
  rates: TMSRates,
  tracking: TMSTracking,
  documents: TMSDocuments,
  audit: TMSAudit,
  analytics: TMSAnalytics,
  exceptions: TMSExceptions,
  settings: TMSSettings,
  invoices: TMSInvoices
}

export function TMSModuleContainer({ className = "" }: TMSModuleContainerProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { state, setModule } = useTMS()
  const { currentModule, isLoading, error } = state

  // Update module based on URL parameter
  useEffect(() => {
    const viewParam = searchParams?.get('view') as TMSModule | null
    let routeModule: TMSModule | null = null
    if (pathname?.startsWith('/tms3')) {
      const match = pathname.match(/^\/tms3\/([^/]+)(?:\/)?/)
      if (match) {
        const slug = match[1] as TMSModule
        if (moduleComponents[slug]) {
          routeModule = slug
        }
      }
    }
    const nextModule = viewParam || routeModule || 'dashboard'
    if (nextModule !== currentModule) {
      setModule(nextModule)
    }
  }, [pathname, searchParams, currentModule, setModule])

  const ModuleComponent = moduleComponents[currentModule]

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-sm text-gray-600">Loading {currentModule}...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-sm mb-2">Error loading module</div>
          <div className="text-xs text-gray-500">{error}</div>
        </div>
      </div>
    )
  }

  if (!ModuleComponent) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="text-gray-500 text-sm">Module not found: {currentModule}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full ${className}`}>
      <ErrorBoundary>
        <ModuleComponent />
      </ErrorBoundary>
    </div>
  )
}
