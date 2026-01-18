"use client";

import React, { useMemo, useEffect, useState } from "react";
import { X, LayoutGrid, Columns } from "lucide-react";
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
import { InventoryGrid } from "./erp/InventoryGrid";
import { getLiveInventory } from "@/app/actions/inventory-actions";
import { NetworkCommand } from "./NetworkCommand";

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

// Available views for the split editor selector
const AVAILABLE_VIEWS = [
    "Orders", "Customers", "Inventory", "Inventory Ledger", "Shipments", "Procurement", "Finance", "Sustainability",
    "CostMgmt", "HR", "TimeAtt", "SCM", "Production", "ProductionPlanning", "PLM", "CRM", "Sales", "Project", "Service", "GRC", "Admin", "Purchase", "Items", "JobTraveler",
    "TransportPlanning", "Route Planning", "Carrier", "FreightAudit", "Yard",
    "Receiving", "Picking", "Shipping", "Labor", "Control Tower", "Network Command"
];

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
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);

    // Split View State
    const [isSplit, setIsSplit] = useState(false);
    const [activeTabRight, setActiveTabRight] = useState<string | null>(null);

    // Initialize right tab when splitting
    useEffect(() => {
        if (isSplit && !activeTabRight) {
            setActiveTabRight(activeTab);
        }
    }, [isSplit, activeTab, activeTabRight]);

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
        const loadData = async (tab: string) => {
            if (tab === "Orders") {
                safeFetchJson('/api/orders').then(data => data && setOrders(data));
            }
            if (tab === "Customers" && customers.length === 0) {
                safeFetchJson('/api/customers').then(data => data && setCustomers(data));
            }
            if (tab === "Shipments" && shipments.length === 0) {
                safeFetchJson('/api/shipments').then(data => data && setShipments(data));
            }
            if (tab === "Inventory Ledger") {
                getLiveInventory().then(data => setInventoryItems(data));
            }
        };

        loadData(activeTab);
        if (isSplit && activeTabRight) {
            loadData(activeTabRight);
        }
    }, [activeTab, activeTabRight, isSplit]);

    const renderTabContent = (tab: string) => {
        if (tab === "Inventory") {
            return (
                <div className="h-full p-2">
                    <Warehouse3DScene layout={activeLayout} showHeatmap={isHeatmapActive} />
                </div>
            );
        }
        if (tab === "Inventory Ledger") {
            const mappedItems = inventoryItems.map(i => ({
                id: i.id,
                itemId: i.itemId,
                itemName: i.item?.name || "Unknown Item",
                sku: i.item?.sku || "UNKNOWN",
                locationId: i.locationId || i.binId || "Pending Putaway",
                warehouseId: i.warehouseId,
                quantity: i.quantity,
                status: i.status as any,
                updatedAt: i.updatedAt
            }));
            return <InventoryGrid items={mappedItems} />;
        }
        if (tab === "Shipments") {
            return (
                <div className="flex h-full flex-col p-2 gap-2 overflow-hidden">
                    <div className="h-1/2 border border-neutral-800 bg-neutral-900">
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
            );
        }
        if (tab === "Sustainability") return <SustainabilityWorkspace />;
        if (tab === "Control Tower") return <GlobalControlTower />;
        if (tab === "Network Command") return <NetworkCommand />;
        if (tab === "Orders") return <OrderGrid orders={orders} onRowClick={onOrderClick} />;
        if (tab === "Customers" || tab === "CRM") return <CustomerGrid customers={customers} />;
        if (tab === "Carriers") return <CarrierGrid />;
        if (tab === "Route Planning") return <LoadPlanner />;
        if (tab === "Finance") return <FinanceGrid />;
        if (tab === "ProductionPlanning") return <PlanningControlTower />;
        if (tab === "TransportPlanning") {
            return (
                <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
                    Transport Planning Module (Coming Soon)
                </div>
            );
        }
        if (tab === "Scheduling") return <MasterScheduler />;
        if (tab === "JobTraveler") return <JobTraveler />;
        if (tab === "Warehouse Ops") return <WMSOperations />;
        if (tab.startsWith("Order-")) return <OrderDetailView orderId={tab.replace("Order-", "")} />;
        if (tab.startsWith("Shipment-")) return <ShipmentDetailView shipmentId={tab.replace("Shipment-", "")} />;

        if (!tab) {
            return (
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
            );
        }

        return (
            <GenericFormView
                type={tab}
                {...getFormConfig(tab)}
            />
        );
    };

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] overflow-hidden">
            {/* Tab Row */}
            <div className="flex h-9 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] justify-between items-center pr-2">
                <div className="flex h-full overflow-x-auto no-scrollbar">
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

                {/* Editor Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsSplit(!isSplit)}
                        className={cn(
                            "rounded-sm p-1 hover:bg-neutral-800 transition-colors",
                            isSplit ? "text-[var(--accent-color)] bg-neutral-800" : "text-neutral-400"
                        )}
                        title="Split Editor Right (Ctrl+\)"
                    >
                        <Columns className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex">
                <div className={cn("flex-1 overflow-hidden transition-all", isSplit ? "w-1/2 border-r border-[var(--border-color)]" : "w-full")}>
                    {renderTabContent(activeTab)}
                </div>

                {isSplit && (
                    <div className="flex-1 overflow-hidden w-1/2 bg-[var(--bg-editor)]">
                        {/* Right Pane Header with Selector */}
                        <div className="flex h-9 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] px-2 items-center justify-between text-xs text-neutral-400">
                            <div className="flex items-center gap-2 w-full max-w-xs">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Right:</span>
                                <select
                                    className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-neutral-300 text-xs w-full focus:outline-none focus:border-[var(--accent-color)]"
                                    value={activeTabRight || ""}
                                    onChange={(e) => setActiveTabRight(e.target.value)}
                                >
                                    <option value="" disabled>Select View...</option>
                                    <optgroup label="Open Tabs">
                                        {tabs.map(t => <option key={t} value={t}>{t}</option>)}
                                    </optgroup>
                                    <optgroup label="All Views">
                                        {AVAILABLE_VIEWS.filter(v => !tabs.includes(v)).map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>
                        {renderTabContent(activeTabRight || "")}
                    </div>
                )}
            </div>
        </div>
    );
}
