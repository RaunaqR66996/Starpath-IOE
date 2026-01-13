"use client"

import { Suspense, useState, useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TMSProvider } from "@/lib/contexts/TMSContext"
import { TMSModuleContainer } from "@/components/tms/TMSModuleContainer"
import dynamic from 'next/dynamic'
import { MapControls } from "@/components/MapControls"
import { LoadOptimizerPanel } from "@/components/trailer3d/LoadOptimizerPanel"
import type { TMSModule } from "@/lib/contexts/TMSContext"
import {
  BarChart3,
  Activity,
  Layers,
  TrendingUp,
  MapPin,
  Settings,
  Package,
  Truck,
  Users,
  Navigation
} from "lucide-react"

// Dynamic import for map component
const SimpleMap = dynamic(() => import('@/components/SimpleMap'), { ssr: false })

// Component Views for Q3
const OverviewView = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Active Shipments</h3>
        </div>
        <p className="text-2xl font-bold text-blue-600">127</p>
        <p className="text-sm text-gray-600">Currently in transit</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Deliveries Today</h3>
        </div>
        <p className="text-2xl font-bold text-green-600">89</p>
        <p className="text-sm text-gray-600">Completed deliveries</p>
      </div>
    </div>
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Recent Activity</h3>
      <div className="space-y-2">
        <p className="text-sm">• Shipment #TMS-001 delivered to New York</p>
        <p className="text-sm">• Route optimization completed for Zone A</p>
        <p className="text-sm">• New carrier partner added: FastTrack Logistics</p>
      </div>
    </div>
  </div>
)

const AnalyticsView = () => (
  <div className="space-y-4">
    <div className="bg-purple-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold">Performance Metrics</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-sm text-gray-600">On-Time Delivery</p>
          <p className="text-xl font-bold text-purple-600">94.5%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Cost Efficiency</p>
          <p className="text-xl font-bold text-purple-600">87.2%</p>
        </div>
      </div>
    </div>
    <div className="bg-orange-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Weekly Trends</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Shipment Volume</span>
          <span className="text-sm font-medium text-green-600">+15%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Average Transit Time</span>
          <span className="text-sm font-medium text-red-600">-8%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Customer Satisfaction</span>
          <span className="text-sm font-medium text-green-600">+12%</span>
        </div>
      </div>
    </div>
  </div>
)

const TrackingView = () => (
  <div className="space-y-4">
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Live Vehicle Tracking</h3>
      </div>
      <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Interactive Map View</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-3 border rounded-lg">
        <h4 className="font-medium text-sm">Vehicle Status</h4>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Active</span>
            <span className="text-green-600">24</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Idle</span>
            <span className="text-yellow-600">6</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Maintenance</span>
            <span className="text-red-600">2</span>
          </div>
        </div>
      </div>
      <div className="bg-white p-3 border rounded-lg">
        <h4 className="font-medium text-sm">Driver Status</h4>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs">
            <span>On Duty</span>
            <span className="text-green-600">28</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Available</span>
            <span className="text-blue-600">12</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Off Duty</span>
            <span className="text-gray-600">8</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const ConfigurationView = () => (
  <div className="space-y-4">
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold">System Configuration</h3>
      </div>
      <div className="space-y-3 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Auto-route optimization</span>
          <div className="w-10 h-5 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Real-time notifications</span>
          <div className="w-10 h-5 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Maintenance alerts</span>
          <div className="w-10 h-5 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
    <div className="bg-yellow-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-2">Quick Settings</h3>
      <div className="space-y-2">
        <button className="w-full text-left p-2 hover:bg-yellow-100 rounded text-sm">
          Update carrier preferences
        </button>
        <button className="w-full text-left p-2 hover:bg-yellow-100 rounded text-sm">
          Configure delivery windows
        </button>
        <button className="w-full text-left p-2 hover:bg-yellow-100 rounded text-sm">
          Set notification rules
        </button>
      </div>
    </div>
  </div>
)

const TMS_ROUTE_VIEW_MAP: Record<string, TMSModule> = {
  dashboard: 'dashboard',
  orders: 'orders',
  'load-planning': 'load-planning',
  carriers: 'carriers',
  rates: 'rates',
  tracking: 'tracking',
  documents: 'documents',
  audit: 'audit',
  analytics: 'analytics',
  exceptions: 'exceptions',
  settings: 'settings',
  invoices: 'invoices',
}

function TMSPageContent({ initialView = 'dashboard' }: { initialView?: TMSModule }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const viewFromPath = useMemo(() => {
    if (!pathname) return null
    const match = pathname.match(/^\/tms3\/([^/]+)(?:\/)?/)
    if (match) {
      return TMS_ROUTE_VIEW_MAP[match[1]] ?? null
    }
    return null
  }, [pathname])
  const currentView = (searchParams?.get('view') as TMSModule) || viewFromPath || initialView
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11')
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')
  const [weatherLayer, setWeatherLayer] = useState<'none' | 'precipitation' | 'temperature' | 'clouds' | 'wind'>('none')

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Dashboard Overview'
      case 'orders':
        return 'Orders & Shipments Management'
      case 'load-planning':
        return 'Load Planning & Optimization'
      case 'carriers':
        return 'Carrier Management'
      case 'rates':
        return 'Rate Quotes & Tendering'
      case 'tracking':
        return 'Tracking & Visibility'
      case 'documents':
        return 'Document Center'
      case 'audit':
        return 'Freight Audit & Billing'
      case 'analytics':
        return 'Analytics & Reports'
      case 'exceptions':
        return 'Exception Handling'
      case 'settings':
        return 'System Settings'
      case 'invoices':
        return 'Invoices & Billing'
      default:
        return 'TMS Dashboard'
    }
  }

  return (
    <DashboardLayout>
      <div>
        {/* Enhanced 2-Quadrant Layout - No Scroll */}
        <div className="h-screen bg-white flex flex-col">
          
          {/* Top Section: Map Visualization - 60% height */}
          <div className="h-[60%] bg-white p-4 border-b border-gray-200 flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black">TMS - Transportation Management</h2>
                  <p className="text-gray-600 font-medium text-xs">Live Tracking & Route Planning</p>
                </div>
              </div>
            </div>

            {/* Map Controls - Outside the map */}
            <div className="bg-gray-50 rounded-lg p-2 mb-2 flex-shrink-0">
              <MapControls
                onTrackShipment={(trackingNumber) => {
                  console.log('Tracking:', trackingNumber)
                  // Add tracking logic here
                }}
                onClearSelection={() => {
                  console.log('Clear selection')
                  // Add clear logic here
                }}
                onFitAll={() => {
                  console.log('Fit all')
                  // Add fit all logic here
                }}
                onStyleChange={(style) => {
                  setMapStyle(style)
                }}
                onViewModeChange={(mode) => {
                  setViewMode(mode)
                }}
                onWeatherChange={(weather) => {
                  setWeatherLayer(weather as 'none' | 'precipitation' | 'temperature' | 'clouds' | 'wind')
                }}
              />
            </div>

            {/* Map Container - Full width */}
            <div className="bg-white rounded-md shadow-sm flex-1 overflow-hidden">
              <div className="h-full w-full rounded-md overflow-hidden">
                <SimpleMap mapStyle={mapStyle} viewMode={viewMode} weatherLayer={weatherLayer} />
              </div>
            </div>
          </div>

          {/* Bottom Section: Module Content + Load Optimizer - 40% height */}
          <div className="h-[40%] grid grid-cols-[70%_30%] border-t border-gray-200">
            
            {/* Left: Module Content Area - 70% width */}
            <div className="bg-white p-4 border-r border-gray-200 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-black mb-1">TMS</h2>
                  <p className="text-gray-600 font-medium text-xs">{getViewTitle()}</p>
                </div>
                <Layers className="h-5 w-5 text-black" />
              </div>

              <div className="bg-white rounded-md p-3 shadow-sm flex-1 overflow-auto">
                <TMSProvider>
                  <TMSModuleContainer />
                </TMSProvider>
              </div>
            </div>

            {/* Right: Load Optimizer Panel - 30% width */}
            <div className="bg-white p-4 border-l border-gray-200 flex flex-col">
              <LoadOptimizerPanel />
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

function TMSPage({ initialView = 'dashboard' }: { initialView?: TMSModule }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TMSPageContent initialView={initialView} />
    </Suspense>
  )
}

export { TMSPage }

export default function TMSDashboardPage() {
  return <TMSPage initialView="dashboard" />
}
