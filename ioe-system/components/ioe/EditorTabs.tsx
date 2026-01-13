"use client";

import React, { useMemo, useEffect, useState } from "react";
import { X, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/stores/theme-store";

import dynamic from "next/dynamic";
import { OrderGrid } from "./erp/OrderGrid";
import { OrderDetailView } from "./erp/OrderDetailView";
import { CustomerGrid } from "./erp/CustomerGrid";
import { Customer, Shipment, Order } from "@/lib/types";
import { ShipmentGrid } from "./tms/ShipmentGrid";
import { CarrierGrid } from "./tms/CarrierGrid";
import { ShipmentDetailView } from "./tms/ShipmentDetailView";
import { LoadPlanner } from "./tms/LoadPlanner";
import { FinanceGrid } from "./finance/FinanceGrid";
import { MasterScheduler } from "./planning/MasterScheduler";
import { PlanningWorkspace } from "./planning/PlanningWorkspace";
import { PlanningControlTower } from "./planning/PlanningControlTower";
import { GlobalControlTower } from "./GlobalControlTower";
import { SustainabilityWorkspace } from "./sustainability/SustainabilityWorkspace";
import { GenericFormView, getFormConfig } from "./shared/GenericFormView";
import { WMSOperations } from "./wms/WMSOperations";
import { JobTraveler } from "./production/JobTraveler";

// Dynamic import for 3D Warehouse Scene (client-side only)
const Warehouse3DScene = dynamic(() => import("./Warehouse3DScene").then(mod => mod.Warehouse3DScene), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center bg-black text-neutral-500 text-[10px] animate-pulse font-mono uppercase tracking-widest">
            Initializing Spatial Core...
        </div>
    )
});

interface EditorTabsProps {
    tabs: string[];
    activeTab: string;
    activeSite: string;
    onSelectTab: (tab: string) => void;
    onCloseTab: (tab: string) => void;
    onOrderClick?: (orderId: string) => void;
    onShipmentClick?: (shipmentId: string) => void;
    isHeatmapActive: boolean;
    heatmapMetric: 'density' | 'occupancy';
    heatmapOpacity: number;
    onHeatmapOpacityChange: (opacity: number) => void;
}

// Dynamic import for Shipments Map (client-side only)
const ShipmentsMap = dynamic(() => import("./ShipmentsMap").then(mod => mod.ShipmentsMap), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center bg-black text-neutral-500 text-[10px] animate-pulse font-mono uppercase tracking-widest">
            Loading Global Transit Network...
        </div>
    )
});

export function EditorTabs({
    tabs,
    activeTab,
    activeSite,
    onSelectTab,
    onCloseTab,
    onOrderClick,
    onShipmentClick,
    isHeatmapActive,
    heatmapMetric,
    heatmapOpacity,
    onHeatmapOpacityChange
}: EditorTabsProps) {
    const { theme } = useThemeStore();
    const activeLayout = useMemo(() => {
        try {
            if (activeSite === "Kuehne Nagel East") return require("@/lib/layouts/kuehne-nagel-east.json");
            if (activeSite === "Los Angeles") return require("@/lib/layouts/l-angeles-west.json");
            if (activeSite === "Texas") return require("@/lib/layouts/laredo-south.json");
            return {};
        } catch (e) {
            console.error("Failed to load layout for site:", activeSite, e);
            return {};
        }
    }, [activeSite]);

    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);

    const safeFetchJson = async (url: string) => {
        try {
            const res = await fetch(url);
            const contentType = res.headers.get("content-type");

            if (!res.ok) {
                const text = await res.text();
                console.error(`Fetch error [${url}]: ${res.status} ${res.statusText}`, text.slice(0, 200));
                return null;
            }

            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error(`Received non-JSON response from [${url}]:`, text.slice(0, 200));
                return null;
            }

            return await res.json();
        } catch (err) {
            console.error(`Fetch exception [${url}]:`, err);
            return null;
        }
    }

    useEffect(() => {
        if (activeTab === "Orders") {
            safeFetchJson('/api/orders').then(data => data && setOrders(data));
        }
        if (activeTab === "Customers" && customers.length === 0) {
            safeFetchJson('/api/customers').then(data => data && setCustomers(data));
        }
        if (activeTab === "Shipments" && shipments.length === 0) {
            safeFetchJson('/api/shipments').then(data => data && setShipments(data));
        }
    }, [activeTab]);

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] overflow-hidden">
            {/* Tab Row */}
            <div className="flex h-9 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]">
                {tabs.map((tab) => (
                    <div
                        key={tab}
                        onClick={() => onSelectTab(tab)}
                        className={cn(
                            "group flex h-full min-w-[120px] cursor-pointer items-center justify-between border-r border-[var(--border-color)] px-3 text-xs transition-colors",
                            activeTab === tab
                                ? "bg-[var(--bg-editor)] text-[var(--accent-color)] border-t-2 border-t-[var(--accent-color)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--item-hover-bg)] hover:text-[var(--text-primary)]"
                        )}
                    >
                        <span className="truncate">{tab}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloseTab(tab);
                            }}
                            className={cn(
                                "ml-2 rounded-sm p-0.5 hover:bg-neutral-800",
                                activeTab === tab ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "Inventory" ? (
                    <div className="h-full p-2">
                        <Warehouse3DScene layout={activeLayout} showHeatmap={isHeatmapActive} />
                    </div>
                ) : activeTab === "Shipments" ? (
                    <div className="flex h-full flex-col p-2 gap-2 overflow-hidden">
                        <div className="h-1/2 border border-neutral-800 bg-neutral-900">
                            {/* Map View of all Shipments */}
                            <ShipmentsMap shipments={shipments.map(s => ({
                                id: s.id,
                                origin: s.origin.coordinates || [-98, 38],
                                destination: s.destination.coordinates || [-95, 38],
                                label: s.id,
                                color: '#3b82f6'
                            }))} />
                        </div>
                        <div className="flex-1 overflow-y-auto border border-neutral-800">
                            <ShipmentGrid shipments={shipments} onRowClick={onShipmentClick} />
                        </div>
                    </div>
                ) : activeTab === "Sustainability" ? (
                    <SustainabilityWorkspace />
                ) : activeTab === "Control Tower" ? (
                    <GlobalControlTower />
                ) : activeTab === "Orders" ? (
                    <OrderGrid orders={orders} onRowClick={onOrderClick} />
                ) : activeTab === "Customers" || activeTab === "CRM" ? ( // Reuse Customer Grid for CRM
                    <CustomerGrid customers={customers} />
                ) : activeTab === "Carriers" ? (
                    <CarrierGrid />
                ) : activeTab === "Route Planning" ? ( // Optimization UI
                    <LoadPlanner />
                ) : activeTab === "Finance" ? (
                    <FinanceGrid />
                ) : activeTab === "ProductionPlanning" ? (
                    <PlanningControlTower />
                ) : activeTab === "TransportPlanning" ? (
                    <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
                        Transport Planning Module (Coming Soon)
                    </div>
                ) : activeTab === "Scheduling" ? (
                    <MasterScheduler />
                ) : activeTab === "JobTraveler" ? (
                    <JobTraveler />
                ) : activeTab === "Warehouse Ops" ? (
                    <WMSOperations />
                ) : activeTab.startsWith("Order-") ? (
                    <OrderDetailView orderId={activeTab.replace("Order-", "")} />
                ) : activeTab.startsWith("Shipment-") ? (
                    <ShipmentDetailView shipmentId={activeTab.replace("Shipment-", "")} />
                ) : !activeTab ? (
                    <div className="flex h-full flex-col items-center justify-center text-[var(--text-muted)]">
                        <div className={cn("mb-6", theme === 'light' ? "opacity-40" : "opacity-80")}>
                            <img
                                src="/starpath-ship-logo.png"
                                alt="Logo"
                                className="h-40 w-40 object-contain"
                            />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white mb-2">StarPath</h1>
                        <h3 className="text-lg font-medium text-[var(--text-secondary)]">No Item Selected</h3>
                        <p className="text-xs mt-1 max-w-xs text-center">Select an item from the sidebar to view its details or open a new form.</p>
                    </div>
                ) : (
                    // Fallback for new ERP/TMS/WMS modules that don't have dedicated non-form views yet
                    <GenericFormView
                        {...getFormConfig(activeTab)}
                    />
                )}
            </div>
        </div>
    );
}
