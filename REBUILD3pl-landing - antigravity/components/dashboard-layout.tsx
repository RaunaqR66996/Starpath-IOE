import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import {
  IconLogout,
  IconX,
  IconTruck,
  IconClipboardList,
  IconRoute,
  IconBuildingWarehouse,
  IconChevronDown,
  IconChevronRight,
  IconDashboard,
  IconChartBar,
  IconMap,
  IconSettings,
  IconPackage,
  IconTruckDelivery,
  IconFileText,
  IconReceipt,
  IconAlertTriangle,
  IconUsers,
  IconCurrencyDollar,
  IconEye,
  IconFileInvoice,
  IconReportAnalytics,
  IconAlertCircle,
  IconChecklist,
  IconArrowDownToArc,
  IconRefresh,
  IconMapPin,
  IconTarget,
  IconFileReport,
  IconDatabase,
  IconShield,
  IconEdit,
  IconBox,
  IconCpu
} from "@tabler/icons-react"

export function DashboardLayout({
  children,
  title,
  description,
  kpiChips,
}: {
  children: React.ReactNode
  title?: string
  description?: string
  kpiChips?: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tms3DropdownOpen, setTms3DropdownOpen] = useState(false)
  const [tmsOrdersDropdownOpen, setTmsOrdersDropdownOpen] = useState(false)
  const [tmsLoadPlanningDropdownOpen, setTmsLoadPlanningDropdownOpen] = useState(false)
  const [tmsCarriersDropdownOpen, setTmsCarriersDropdownOpen] = useState(false)
  const [tmsRatesDropdownOpen, setTmsRatesDropdownOpen] = useState(false)
  const [tmsTrackingDropdownOpen, setTmsTrackingDropdownOpen] = useState(false)
  const [tmsDocumentsDropdownOpen, setTmsDocumentsDropdownOpen] = useState(false)
  const [tmsAuditDropdownOpen, setTmsAuditDropdownOpen] = useState(false)
  const [tmsAnalyticsDropdownOpen, setTmsAnalyticsDropdownOpen] = useState(false)
  const [tmsExceptionsDropdownOpen, setTmsExceptionsDropdownOpen] = useState(false)
  const [tmsSettingsDropdownOpen, setTmsSettingsDropdownOpen] = useState(false)
  const [wmsDropdownOpen, setWmsDropdownOpen] = useState(false)
  const [inboundDropdownOpen, setInboundDropdownOpen] = useState(false)
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false)
  const [outboundDropdownOpen, setOutboundDropdownOpen] = useState(false)
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false)
  const [configDropdownOpen, setConfigDropdownOpen] = useState(false)
  const pathname = usePathname()

  // Keep related dropdowns open when navigating within their sections
  const inTMS = pathname?.startsWith("/tms")
  const inTMSOrders = pathname?.startsWith("/tms3/orders")
  const inTMSLoadPlanning = pathname?.startsWith("/tms3/load-planning")
  const inTMSCarriers = pathname?.startsWith("/tms3/carriers")
  const inTMSRates = pathname?.startsWith("/tms3/rates")
  const inTMSTracking = pathname?.startsWith("/tms3/tracking")
  const inTMSDocuments = pathname?.startsWith("/tms3/documents")
  const inTMSAudit = pathname?.startsWith("/tms3/audit")
  const inTMSAnalytics = pathname?.startsWith("/tms3/analytics")
  const inTMSExceptions = pathname?.startsWith("/tms3/exceptions")
  const inTMSSettings = pathname?.startsWith("/tms3/settings")
  const inWMS = pathname?.startsWith("/wms") || pathname?.startsWith("/wms-create") || pathname?.startsWith("/warehouse-overview")
  const inInbound = pathname?.startsWith("/wms-create/inbound")
  const inInventory = pathname?.startsWith("/wms-create/inventory")
  const inOutbound = pathname?.startsWith("/wms-create/outbound")
  const inTasks = pathname?.startsWith("/wms-create/tasks")
  const inConfig = pathname?.startsWith("/wms-create/config")

  useEffect(() => {
    setTms3DropdownOpen(!!inTMS)
    setTmsOrdersDropdownOpen(!!inTMSOrders)
    setTmsLoadPlanningDropdownOpen(!!inTMSLoadPlanning)
    setTmsCarriersDropdownOpen(!!inTMSCarriers)
    setTmsRatesDropdownOpen(!!inTMSRates)
    setTmsTrackingDropdownOpen(!!inTMSTracking)
    setTmsDocumentsDropdownOpen(!!inTMSDocuments)
    setTmsAuditDropdownOpen(!!inTMSAudit)
    setTmsAnalyticsDropdownOpen(!!inTMSAnalytics)
    setTmsExceptionsDropdownOpen(!!inTMSExceptions)
    setTmsSettingsDropdownOpen(!!inTMSSettings)
  }, [inTMS, inTMSOrders, inTMSLoadPlanning, inTMSCarriers, inTMSRates, inTMSTracking, inTMSDocuments, inTMSAudit, inTMSAnalytics, inTMSExceptions, inTMSSettings])

  useEffect(() => {
    setWmsDropdownOpen(!!inWMS)
  }, [inWMS])

  useEffect(() => {
    setInboundDropdownOpen(!!inInbound)
    setInventoryDropdownOpen(!!inInventory)
    setOutboundDropdownOpen(!!inOutbound)
    setTaskDropdownOpen(!!inTasks)
    setConfigDropdownOpen(!!inConfig)
  }, [inInbound, inInventory, inOutbound, inTasks, inConfig])

  // Function to check if a menu item is active
  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    // For other paths, check exact match or nested routes (with /)
    if (path !== "/dashboard") {
      return pathname === path || pathname?.startsWith(path + "/")
    }
    return false
  }

  // Function to get the class for a menu item
  const getMenuItemClass = (path: string) => {
    const baseClass = "uber-nav-item"
    const activeClass = "uber-nav-item active"

    return isActive(path) ? activeClass : baseClass
  }

  const getSubMenuItemClass = (path: string) => {
    const baseClass =
      "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
    const activeClass = "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
    return isActive(path) ? `${baseClass} ${activeClass}` : baseClass
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-black font-inter">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 transform uber-sidebar text-gray-800 dark:text-white transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/blueship-logo-new.png" alt="StarPath" width={40} height={40} />
            <span className="text-sm font-semibold">StarPath</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <IconX className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        <nav className="flex flex-col gap-1.5 p-3 overflow-y-auto flex-1 min-h-0">
          <Link href="/dashboard" className={getMenuItemClass("/dashboard")}>
            <IconClipboardList className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          {/* TMS 3 with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setTms3DropdownOpen(!tms3DropdownOpen)}
              className={`${getMenuItemClass("/tms3")} w-full justify-between`}
            >
              <div className="flex items-center gap-3">
                <IconRoute className="h-5 w-5" />
                <span>TMS</span>
              </div>
              {tms3DropdownOpen ? (
                <IconChevronDown className="h-4 w-4" />
              ) : (
                <IconChevronRight className="h-4 w-4" />
              )}
            </button>

            {tms3DropdownOpen && (
              <div className="ml-8 mt-1 space-y-0.5">
                <Link
                  href="/tms3/dashboard"
                  className={getSubMenuItemClass("/tms3/dashboard")}
                >
                  <IconDashboard className="h-4 w-4" />
                  <span>Dashboard Overview</span>
                </Link>

                <Link
                  href="/tms"
                  className={getSubMenuItemClass("/tms")}
                >
                  <IconCpu className="h-4 w-4" />
                  <span>TMS Pro</span>
                </Link>

                {/* Orders & Shipments with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsOrdersDropdownOpen(!tmsOrdersDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/orders")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconPackage className="h-4 w-4" />
                      <span>Orders & Shipments</span>
                    </div>
                    {tmsOrdersDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsOrdersDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/orders" className={getSubMenuItemClass("/tms3/orders")}>
                        <IconPackage className="h-3 w-3" />
                        <span>Order Management</span>
                      </Link>
                      <Link href="/tms3/orders?submodule=entry" className={getSubMenuItemClass("/tms3/orders")}>
                        <IconEdit className="h-3 w-3" />
                        <span>Order Entry</span>
                      </Link>
                      <Link href="/tms3/orders?submodule=import" className={getSubMenuItemClass("/tms3/orders")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Order Import</span>
                      </Link>
                      <Link href="/tms3/orders?submodule=consolidation" className={getSubMenuItemClass("/tms3/orders")}>
                        <IconBox className="h-3 w-3" />
                        <span>Order Consolidation</span>
                      </Link>
                      <Link href="/tms3/orders?submodule=shipment-creation" className={getSubMenuItemClass("/tms3/orders")}>
                        <IconTruckDelivery className="h-3 w-3" />
                        <span>Shipment Creation</span>
                      </Link>
                      <Link href="/tms3/orders?submodule=tracking" className={getSubMenuItemClass("/tms3/orders")}>
                        <IconEye className="h-3 w-3" />
                        <span>Order Tracking</span>
                      </Link>
                      <Link href="/tms3/orders?submodule=modification" className={getSubMenuItemClass("/tms3/orders")}>
                        <IconEdit className="h-3 w-3" />
                        <span>Order Modification</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Load Planning with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsLoadPlanningDropdownOpen(!tmsLoadPlanningDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/load-planning")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconTruckDelivery className="h-4 w-4" />
                      <span>Load Planning</span>
                    </div>
                    {tmsLoadPlanningDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsLoadPlanningDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/load-planning" className={getSubMenuItemClass("/tms3/load-planning")}>
                        <IconTruckDelivery className="h-3 w-3" />
                        <span>Load Optimizer</span>
                      </Link>
                      <Link href="/tms3/load-planning?submodule=builder" className={getSubMenuItemClass("/tms3/load-planning")}>
                        <IconPackage className="h-3 w-3" />
                        <span>Load Builder</span>
                      </Link>
                      <Link href="/tms3/load-planning?submodule=route-optimization" className={getSubMenuItemClass("/tms3/load-planning")}>
                        <IconRoute className="h-3 w-3" />
                        <span>Route Optimization</span>
                      </Link>
                      <Link href="/tms3/load-planning?submodule=multi-stop" className={getSubMenuItemClass("/tms3/load-planning")}>
                        <IconMapPin className="h-3 w-3" />
                        <span>Multi-Stop Sequencing</span>
                      </Link>
                      <Link href="/tms3/load-planning?submodule=capacity" className={getSubMenuItemClass("/tms3/load-planning")}>
                        <IconChartBar className="h-3 w-3" />
                        <span>Capacity Planning</span>
                      </Link>
                      <Link href="/tms3/load-planning?submodule=equipment" className={getSubMenuItemClass("/tms3/load-planning")}>
                        <IconTruck className="h-3 w-3" />
                        <span>Equipment Selection</span>
                      </Link>
                      <Link href="/tms3/load-planning?submodule=consolidation" className={getSubMenuItemClass("/tms3/load-planning")}>
                        <IconBox className="h-3 w-3" />
                        <span>Load Consolidation</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Carrier Management with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsCarriersDropdownOpen(!tmsCarriersDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/carriers")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconUsers className="h-4 w-4" />
                      <span>Carrier Management</span>
                    </div>
                    {tmsCarriersDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsCarriersDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/carriers" className={getSubMenuItemClass("/tms3/carriers")}>
                        <IconUsers className="h-3 w-3" />
                        <span>Carrier Directory</span>
                      </Link>
                      <Link href="/tms3/carriers?submodule=onboarding" className={getSubMenuItemClass("/tms3/carriers")}>
                        <IconUsers className="h-3 w-3" />
                        <span>Carrier Onboarding</span>
                      </Link>
                      <Link href="/tms3/carriers?submodule=contracts" className={getSubMenuItemClass("/tms3/carriers")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Carrier Contracts</span>
                      </Link>
                      <Link href="/tms3/carriers?submodule=performance" className={getSubMenuItemClass("/tms3/carriers")}>
                        <IconChartBar className="h-3 w-3" />
                        <span>Carrier Performance</span>
                      </Link>
                      <Link href="/tms3/carriers?submodule=capacity" className={getSubMenuItemClass("/tms3/carriers")}>
                        <IconTruck className="h-3 w-3" />
                        <span>Carrier Capacity</span>
                      </Link>
                      <Link href="/tms3/carriers?submodule=portal" className={getSubMenuItemClass("/tms3/carriers")}>
                        <IconEye className="h-3 w-3" />
                        <span>Carrier Portal</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Rate Management with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsRatesDropdownOpen(!tmsRatesDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/rates")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconCurrencyDollar className="h-4 w-4" />
                      <span>Rate Management</span>
                    </div>
                    {tmsRatesDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsRatesDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/rates" className={getSubMenuItemClass("/tms3/rates")}>
                        <IconCurrencyDollar className="h-3 w-3" />
                        <span>Rate Shopping</span>
                      </Link>
                      <Link href="/tms3/rates?submodule=contract-rates" className={getSubMenuItemClass("/tms3/rates")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Contract Rates</span>
                      </Link>
                      <Link href="/tms3/rates?submodule=spot-rates" className={getSubMenuItemClass("/tms3/rates")}>
                        <IconCurrencyDollar className="h-3 w-3" />
                        <span>Spot Rates</span>
                      </Link>
                      <Link href="/tms3/rates?submodule=negotiation" className={getSubMenuItemClass("/tms3/rates")}>
                        <IconEdit className="h-3 w-3" />
                        <span>Rate Negotiation</span>
                      </Link>
                      <Link href="/tms3/rates?submodule=tendering" className={getSubMenuItemClass("/tms3/rates")}>
                        <IconChecklist className="h-3 w-3" />
                        <span>Tendering</span>
                      </Link>
                      <Link href="/tms3/rates?submodule=audit" className={getSubMenuItemClass("/tms3/rates")}>
                        <IconReceipt className="h-3 w-3" />
                        <span>Rate Audit</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Tracking & Visibility with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsTrackingDropdownOpen(!tmsTrackingDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/tracking")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconEye className="h-4 w-4" />
                      <span>Tracking & Visibility</span>
                    </div>
                    {tmsTrackingDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsTrackingDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/tracking" className={getSubMenuItemClass("/tms3/tracking")}>
                        <IconEye className="h-3 w-3" />
                        <span>Real-Time Tracking</span>
                      </Link>
                      <Link href="/tms3/tracking?submodule=gps" className={getSubMenuItemClass("/tms3/tracking")}>
                        <IconMapPin className="h-3 w-3" />
                        <span>GPS Tracking</span>
                      </Link>
                      <Link href="/tms3/tracking?submodule=eta" className={getSubMenuItemClass("/tms3/tracking")}>
                        <IconTarget className="h-3 w-3" />
                        <span>ETA Calculation</span>
                      </Link>
                      <Link href="/tms3/tracking?submodule=milestones" className={getSubMenuItemClass("/tms3/tracking")}>
                        <IconChecklist className="h-3 w-3" />
                        <span>Milestone Tracking</span>
                      </Link>
                      <Link href="/tms3/tracking?submodule=alerts" className={getSubMenuItemClass("/tms3/tracking")}>
                        <IconAlertTriangle className="h-3 w-3" />
                        <span>Exception Alerts</span>
                      </Link>
                      <Link href="/tms3/tracking?submodule=customer-portal" className={getSubMenuItemClass("/tms3/tracking")}>
                        <IconEye className="h-3 w-3" />
                        <span>Customer Portal</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Document Management with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsDocumentsDropdownOpen(!tmsDocumentsDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/documents")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconFileText className="h-4 w-4" />
                      <span>Document Center</span>
                    </div>
                    {tmsDocumentsDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsDocumentsDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/documents" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Document Management</span>
                      </Link>
                      <Link href="/tms3/documents?submodule=bol" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconFileText className="h-3 w-3" />
                        <span>BOL Generation</span>
                      </Link>
                      <Link href="/tms3/documents?submodule=pod" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconChecklist className="h-3 w-3" />
                        <span>POD Capture</span>
                      </Link>
                      <Link href="/tms3/documents?submodule=labels" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Label Generation</span>
                      </Link>
                      <Link href="/tms3/documents?submodule=manifest" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Manifest Generation</span>
                      </Link>
                      <Link href="/tms3/documents?submodule=customs" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Customs Docs</span>
                      </Link>
                      <Link href="/tms3/documents?submodule=storage" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconDatabase className="h-3 w-3" />
                        <span>Document Storage</span>
                      </Link>
                      <Link href="/tms3/documents?submodule=edi" className={getSubMenuItemClass("/tms3/documents")}>
                        <IconFileText className="h-3 w-3" />
                        <span>EDI Documents</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Freight Audit with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsAuditDropdownOpen(!tmsAuditDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/audit")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconReceipt className="h-4 w-4" />
                      <span>Freight Audit</span>
                    </div>
                    {tmsAuditDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsAuditDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/audit" className={getSubMenuItemClass("/tms3/audit")}>
                        <IconReceipt className="h-3 w-3" />
                        <span>Invoice Matching</span>
                      </Link>
                      <Link href="/tms3/audit?submodule=disputes" className={getSubMenuItemClass("/tms3/audit")}>
                        <IconAlertTriangle className="h-3 w-3" />
                        <span>Dispute Management</span>
                      </Link>
                      <Link href="/tms3/audit?submodule=payments" className={getSubMenuItemClass("/tms3/audit")}>
                        <IconCurrencyDollar className="h-3 w-3" />
                        <span>Payment Processing</span>
                      </Link>
                      <Link href="/tms3/audit?submodule=allocation" className={getSubMenuItemClass("/tms3/audit")}>
                        <IconChartBar className="h-3 w-3" />
                        <span>Cost Allocation</span>
                      </Link>
                      <Link href="/tms3/audit?submodule=gl-coding" className={getSubMenuItemClass("/tms3/audit")}>
                        <IconFileInvoice className="h-3 w-3" />
                        <span>GL Coding</span>
                      </Link>
                      <Link href="/tms3/audit?submodule=approvals" className={getSubMenuItemClass("/tms3/audit")}>
                        <IconChecklist className="h-3 w-3" />
                        <span>Approval Workflows</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Analytics & Reports with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsAnalyticsDropdownOpen(!tmsAnalyticsDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/analytics")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconReportAnalytics className="h-4 w-4" />
                      <span>Analytics & Reports</span>
                    </div>
                    {tmsAnalyticsDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsAnalyticsDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/analytics" className={getSubMenuItemClass("/tms3/analytics")}>
                        <IconDashboard className="h-3 w-3" />
                        <span>KPI Dashboard</span>
                      </Link>
                      <Link href="/tms3/analytics?submodule=cost-analysis" className={getSubMenuItemClass("/tms3/analytics")}>
                        <IconCurrencyDollar className="h-3 w-3" />
                        <span>Cost Analysis</span>
                      </Link>
                      <Link href="/tms3/analytics?submodule=carrier-performance" className={getSubMenuItemClass("/tms3/analytics")}>
                        <IconUsers className="h-3 w-3" />
                        <span>Carrier Performance</span>
                      </Link>
                      <Link href="/tms3/analytics?submodule=on-time-delivery" className={getSubMenuItemClass("/tms3/analytics")}>
                        <IconTarget className="h-3 w-3" />
                        <span>On-Time Delivery</span>
                      </Link>
                      <Link href="/tms3/analytics?submodule=spend-analysis" className={getSubMenuItemClass("/tms3/analytics")}>
                        <IconCurrencyDollar className="h-3 w-3" />
                        <span>Freight Spend</span>
                      </Link>
                      <Link href="/tms3/analytics?submodule=custom-reports" className={getSubMenuItemClass("/tms3/analytics")}>
                        <IconFileReport className="h-3 w-3" />
                        <span>Custom Reports</span>
                      </Link>
                      <Link href="/tms3/analytics?submodule=export" className={getSubMenuItemClass("/tms3/analytics")}>
                        <IconFileText className="h-3 w-3" />
                        <span>Data Export</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Exception Management with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsExceptionsDropdownOpen(!tmsExceptionsDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/exceptions")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconAlertCircle className="h-4 w-4" />
                      <span>Exception Handling</span>
                    </div>
                    {tmsExceptionsDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsExceptionsDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/exceptions" className={getSubMenuItemClass("/tms3/exceptions")}>
                        <IconAlertTriangle className="h-3 w-3" />
                        <span>Exception Detection</span>
                      </Link>
                      <Link href="/tms3/exceptions?submodule=workflow" className={getSubMenuItemClass("/tms3/exceptions")}>
                        <IconChecklist className="h-3 w-3" />
                        <span>Exception Workflow</span>
                      </Link>
                      <Link href="/tms3/exceptions?submodule=delays" className={getSubMenuItemClass("/tms3/exceptions")}>
                        <IconTarget className="h-3 w-3" />
                        <span>Delay Tracking</span>
                      </Link>
                      <Link href="/tms3/exceptions?submodule=claims" className={getSubMenuItemClass("/tms3/exceptions")}>
                        <IconAlertTriangle className="h-3 w-3" />
                        <span>Damage Claims</span>
                      </Link>
                      <Link href="/tms3/exceptions?submodule=resolution" className={getSubMenuItemClass("/tms3/exceptions")}>
                        <IconChecklist className="h-3 w-3" />
                        <span>Resolution Tracking</span>
                      </Link>
                      <Link href="/tms3/exceptions?submodule=root-cause" className={getSubMenuItemClass("/tms3/exceptions")}>
                        <IconChartBar className="h-3 w-3" />
                        <span>Root Cause Analysis</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* System Settings with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTmsSettingsDropdownOpen(!tmsSettingsDropdownOpen)}
                    className={`${getSubMenuItemClass("/tms3/settings")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconSettings className="h-4 w-4" />
                      <span>System Settings</span>
                    </div>
                    {tmsSettingsDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {tmsSettingsDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link href="/tms3/settings" className={getSubMenuItemClass("/tms3/settings")}>
                        <IconSettings className="h-3 w-3" />
                        <span>System Configuration</span>
                      </Link>
                      <Link href="/tms3/settings?submodule=integrations" className={getSubMenuItemClass("/tms3/settings")}>
                        <IconDatabase className="h-3 w-3" />
                        <span>Integration Settings</span>
                      </Link>
                      <Link href="/tms3/settings?submodule=edi" className={getSubMenuItemClass("/tms3/settings")}>
                        <IconFileText className="h-3 w-3" />
                        <span>EDI Settings</span>
                      </Link>
                      <Link href="/tms3/settings?submodule=notifications" className={getSubMenuItemClass("/tms3/settings")}>
                        <IconAlertCircle className="h-3 w-3" />
                        <span>Notification Settings</span>
                      </Link>
                      <Link href="/tms3/settings?submodule=users" className={getSubMenuItemClass("/tms3/settings")}>
                        <IconUsers className="h-3 w-3" />
                        <span>User Management</span>
                      </Link>
                      <Link href="/tms3/settings?submodule=carrier-preferences" className={getSubMenuItemClass("/tms3/settings")}>
                        <IconTruck className="h-3 w-3" />
                        <span>Carrier Preferences</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* WMS with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setWmsDropdownOpen(!wmsDropdownOpen)}
              className={`${getMenuItemClass("/wms-create")} w-full justify-between`}
            >
              <div className="flex items-center gap-3">
                <IconBuildingWarehouse className="h-5 w-5" />
                <span>WMS</span>
              </div>
              {wmsDropdownOpen ? (
                <IconChevronDown className="h-4 w-4" />
              ) : (
                <IconChevronRight className="h-4 w-4" />
              )}
            </button>

            {wmsDropdownOpen && (
              <div className="ml-8 mt-1 space-y-0.5">
                <Link
                  href="/wms-create/dashboard"
                  className={getSubMenuItemClass("/wms-create/dashboard")}
                >
                  <IconDashboard className="h-4 w-4" />
                  <span>Dashboard Overview</span>
                </Link>

                <Link
                  href="/wms"
                  className={getSubMenuItemClass("/wms")}
                >
                  <IconCpu className="h-4 w-4" />
                  <span>WMS Pro</span>
                </Link>

                {/* Inbound Operations with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setInboundDropdownOpen(!inboundDropdownOpen)}
                    className={`${getSubMenuItemClass("/wms-create/inbound")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconPackage className="h-4 w-4" />
                      <span>Inbound Operations</span>
                    </div>
                    {inboundDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {inboundDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link
                        href="/wms-create/inbound?submodule=receiving"
                        className={getSubMenuItemClass("/wms-create/inbound")}
                      >
                        <IconPackage className="h-3 w-3" />
                        <span>Receiving</span>
                      </Link>
                      <Link
                        href="/wms-create/inbound?submodule=asn"
                        className={getSubMenuItemClass("/wms-create/inbound")}
                      >
                        <IconFileText className="h-3 w-3" />
                        <span>ASN Processing</span>
                      </Link>
                      <Link
                        href="/wms-create/inbound?submodule=qc"
                        className={getSubMenuItemClass("/wms-create/inbound")}
                      >
                        <IconChecklist className="h-3 w-3" />
                        <span>Quality Control</span>
                      </Link>
                      <Link
                        href="/wms-create/inbound?submodule=putaway"
                        className={getSubMenuItemClass("/wms-create/inbound")}
                      >
                        <IconArrowDownToArc className="h-3 w-3" />
                        <span>Putaway</span>
                      </Link>
                      <Link
                        href="/wms-create/inbound?submodule=returns"
                        className={getSubMenuItemClass("/wms-create/inbound")}
                      >
                        <IconRefresh className="h-3 w-3" />
                        <span>Returns</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Inventory Management with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setInventoryDropdownOpen(!inventoryDropdownOpen)}
                    className={`${getSubMenuItemClass("/wms-create/inventory")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconClipboardList className="h-4 w-4" />
                      <span>Inventory Management</span>
                    </div>
                    {inventoryDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {inventoryDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link
                        href="/wms-create/inventory?submodule=tracking"
                        className={getSubMenuItemClass("/wms-create/inventory")}
                      >
                        <IconClipboardList className="h-3 w-3" />
                        <span>Inventory Tracking</span>
                      </Link>
                      <Link
                        href="/wms-create/inventory?submodule=cycle-count"
                        className={getSubMenuItemClass("/wms-create/inventory")}
                      >
                        <IconClipboardList className="h-3 w-3" />
                        <span>Cycle Counting</span>
                      </Link>
                      <Link
                        href="/wms-create/inventory?submodule=adjustments"
                        className={getSubMenuItemClass("/wms-create/inventory")}
                      >
                        <IconEdit className="h-3 w-3" />
                        <span>Adjustments</span>
                      </Link>
                      <Link
                        href="/wms-create/inventory?submodule=replenishment"
                        className={getSubMenuItemClass("/wms-create/inventory")}
                      >
                        <IconRefresh className="h-3 w-3" />
                        <span>Replenishment</span>
                      </Link>
                      <Link
                        href="/wms-create/inventory?submodule=locations"
                        className={getSubMenuItemClass("/wms-create/inventory")}
                      >
                        <IconMapPin className="h-3 w-3" />
                        <span>Location Management</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Outbound Operations with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOutboundDropdownOpen(!outboundDropdownOpen)}
                    className={`${getSubMenuItemClass("/wms-create/outbound")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconTruckDelivery className="h-4 w-4" />
                      <span>Outbound Operations</span>
                    </div>
                    {outboundDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {outboundDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link
                        href="/wms-create/outbound?submodule=orders"
                        className={getSubMenuItemClass("/wms-create/outbound")}
                      >
                        <IconPackage className="h-3 w-3" />
                        <span>Order Management</span>
                      </Link>
                      <Link
                        href="/wms-create/outbound?submodule=waves"
                        className={getSubMenuItemClass("/wms-create/outbound")}
                      >
                        <IconChartBar className="h-3 w-3" />
                        <span>Wave Planning</span>
                      </Link>
                      <Link
                        href="/wms-create/outbound?submodule=picking"
                        className={getSubMenuItemClass("/wms-create/outbound")}
                      >
                        <IconPackage className="h-3 w-3" />
                        <span>Picking</span>
                      </Link>
                      <Link
                        href="/wms-create/outbound?submodule=packing"
                        className={getSubMenuItemClass("/wms-create/outbound")}
                      >
                        <IconBox className="h-3 w-3" />
                        <span>Packing</span>
                      </Link>
                      <Link
                        href="/wms-create/outbound?submodule=shipping"
                        className={getSubMenuItemClass("/wms-create/outbound")}
                      >
                        <IconTruckDelivery className="h-3 w-3" />
                        <span>Shipping</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Task & Labor Management with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setTaskDropdownOpen(!taskDropdownOpen)}
                    className={`${getSubMenuItemClass("/wms-create/tasks")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconChecklist className="h-4 w-4" />
                      <span>Task & Labor Management</span>
                    </div>
                    {taskDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {taskDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link
                        href="/wms-create/tasks?submodule=management"
                        className={getSubMenuItemClass("/wms-create/tasks")}
                      >
                        <IconChecklist className="h-3 w-3" />
                        <span>Task Management</span>
                      </Link>
                      <Link
                        href="/wms-create/tasks?submodule=labor"
                        className={getSubMenuItemClass("/wms-create/tasks")}
                      >
                        <IconUsers className="h-3 w-3" />
                        <span>Labor Productivity</span>
                      </Link>
                      <Link
                        href="/wms-create/tasks?submodule=assignment"
                        className={getSubMenuItemClass("/wms-create/tasks")}
                      >
                        <IconUsers className="h-3 w-3" />
                        <span>Worker Assignment</span>
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  href="/wms-create/slotting"
                  className={getSubMenuItemClass("/wms-create/slotting")}
                >
                  <IconTarget className="h-4 w-4" />
                  <span>Slotting & Optimization</span>
                </Link>

                <Link
                  href="/wms-create/yard"
                  className={getSubMenuItemClass("/wms-create/yard")}
                >
                  <IconTruck className="h-4 w-4" />
                  <span>Yard Management</span>
                </Link>

                <Link
                  href="/wms-create/reports"
                  className={getSubMenuItemClass("/wms-create/reports")}
                >
                  <IconFileReport className="h-4 w-4" />
                  <span>Reports & Analytics</span>
                </Link>

                {/* Configuration with Nested Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setConfigDropdownOpen(!configDropdownOpen)}
                    className={`${getSubMenuItemClass("/wms-create/config")} w-full justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <IconSettings className="h-4 w-4" />
                      <span>Configuration</span>
                    </div>
                    {configDropdownOpen ? (
                      <IconChevronDown className="h-3 w-3" />
                    ) : (
                      <IconChevronRight className="h-3 w-3" />
                    )}
                  </button>
                  {configDropdownOpen && (
                    <div className="ml-6 mt-1 space-y-0.5">
                      <Link
                        href="/wms-create/config?submodule=master-data"
                        className={getSubMenuItemClass("/wms-create/config")}
                      >
                        <IconDatabase className="h-3 w-3" />
                        <span>Master Data</span>
                      </Link>
                      <Link
                        href="/wms-create/config?submodule=users"
                        className={getSubMenuItemClass("/wms-create/config")}
                      >
                        <IconUsers className="h-3 w-3" />
                        <span>Users & Roles</span>
                      </Link>
                      <Link
                        href="/wms-create/config?submodule=settings"
                        className={getSubMenuItemClass("/wms-create/config")}
                      >
                        <IconSettings className="h-3 w-3" />
                        <span>System Settings</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              <IconLogout className="mr-2 h-5 w-5" />
              Log out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-56">
        <main className="p-2 lg:p-3 bg-white dark:bg-black text-gray-900 dark:text-white min-h-screen">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs />
          </div>

          {title && (
            <div className="flex items-center justify-between mb-1">
              <h1 className="uber-heading-1 text-gray-900 dark:text-white">
                {title}
              </h1>
              {kpiChips && (
                <div className="flex items-center gap-2">
                  {kpiChips}
                </div>
              )}
            </div>
          )}
          {description && <p className="uber-text-large mb-2 text-gray-600 dark:text-gray-400">{description}</p>}
          <div className="uber-animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
