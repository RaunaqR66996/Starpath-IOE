"use client";

import React from "react";
import {
    LayoutGrid, ChevronRight, ChevronDown, ListFilter,
    FileText, Database, Box, PlayCircle, Settings,
    Building2, BarChart3, Users, Network, Factory, Briefcase,
    Truck, Map, FileCheck, Warehouse,
    Boxes, ArrowDownToLine, PackageCheck, ArrowUpFromLine, Users2, Leaf,
    Calendar, Radio, MoreHorizontal, ClipboardList,
    Clock, Shield, Hammer, Key, LayoutList, LineChart, Banknote, Workflow, Wrench, ShoppingCart, Package, Anchor, UploadCloud, QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanningNavigator } from "./planning/PlanningNavigator";
import { PlanningCalendarSidebar } from "./planning/PlanningCalendarSidebar";



interface SidebarProps {
    selectedActivity: string;
    activeSite: string;
    onSelectSite: (site: string) => void;
    activeTab: string;
    onSelectTab: (tab: string) => void;
    selectedPlanningNode?: string | null;
    onSelectPlanningNode?: (nodeId: string) => void;
    isHeatmapActive: boolean;
    onToggleHeatmap: () => void;
    heatmapMetric: 'density' | 'occupancy';
    onSelectHeatmapMetric: (metric: 'density' | 'occupancy') => void;
}

export function Sidebar({
    selectedActivity,
    activeSite,
    onSelectSite,
    activeTab,
    onSelectTab,
    selectedPlanningNode,
    onSelectPlanningNode,
    isHeatmapActive,
    onToggleHeatmap,
    heatmapMetric,
    onSelectHeatmapMetric
}: SidebarProps) {
    return (
        <div className="flex h-full w-64 flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)]">
            <div className="flex h-9 items-center px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {selectedActivity}
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="py-2">
                    {selectedActivity === "explorer" && (
                        <ExplorerTree
                            activeSite={activeSite}
                            onSelectSite={onSelectSite}
                            activeTab={activeTab}
                            onSelectTab={onSelectTab}
                            isHeatmapActive={isHeatmapActive}
                            onToggleHeatmap={onToggleHeatmap}
                            heatmapMetric={heatmapMetric}
                            onSelectHeatmapMetric={onSelectHeatmapMetric}
                        />
                    )}
                    {selectedActivity === "planning" && (
                        <PlanningCalendarSidebar />
                    )}
                    {selectedActivity !== "explorer" && selectedActivity !== "planning" && (
                        <div className="px-4 py-8 text-center text-xs text-neutral-600">
                            Panel content for {selectedActivity}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ExplorerTree({
    activeSite,
    onSelectSite,
    activeTab,
    onSelectTab,
    isHeatmapActive,
    onToggleHeatmap,
    heatmapMetric,
    onSelectHeatmapMetric
}: {
    activeSite: string;
    onSelectSite: (site: string) => void;
    activeTab: string;
    onSelectTab: (tab: string) => void;
    isHeatmapActive: boolean;
    onToggleHeatmap: () => void;
    heatmapMetric: 'density' | 'occupancy';
    onSelectHeatmapMetric: (metric: 'density' | 'occupancy') => void;
}) {
    const sites = ["Kuehne Nagel East", "Los Angeles", "Texas"];
    // --- Navigation Structure ---
    const SYSTEM_MODULES = [
        {
            id: 'erp',
            label: 'ERP System',
            icon: Building2,
            children: [
                { id: 'Finance', label: 'Financial Mgmt', icon: BarChart3 },
                { id: 'CostMgmt', label: 'Cost Management', icon: Banknote }, // New
                { id: 'HR', label: 'Human Resources', icon: Users },
                { id: 'TimeAtt', label: 'Time & Attendance', icon: Clock }, // New
                { id: 'SCM', label: 'Supply Chain (SCM)', icon: Network },
                { id: 'Production', label: 'Manufacturing', icon: Factory },
                { id: 'ProductionPlanning', label: 'Production Planning', icon: Calendar }, // New Production Planning
                { id: 'JobTraveler', label: 'Job Traveler (Kiosk)', icon: QrCode }, // New
                { id: 'PLM', label: 'Product Lifecycle', icon: Workflow }, // New
                { id: 'Items', label: 'Item Master', icon: Package }, // New
                { id: 'CRM', label: 'CRM & Sales', icon: Briefcase },
                { id: 'Sales', label: 'Sales Orders', icon: FileText }, // New
                { id: 'Purchase', label: 'Purchase Orders', icon: ShoppingCart }, // New
                { id: 'Project', label: 'Project Mgmt', icon: LayoutList }, // New
                { id: 'Service', label: 'Service Mgmt', icon: Wrench }, // New
                { id: 'GRC', label: 'Risk & Compliance', icon: Shield }, // New
                { id: 'Admin', label: 'Admin & Security', icon: Key }, // New
                { id: 'Orders', label: 'Order Mgmt', icon: FileText },
            ]
        },
        {
            id: 'tms',
            label: 'TMS System',
            icon: Truck,
            children: [
                { id: 'TransportPlanning', label: 'Transport Planning', icon: Map }, // Renamed to avoid collision
                { id: 'Route Planning', label: 'Route Optimization', icon: Workflow }, // New
                { id: 'Shipments', label: 'Execution & Dispatch', icon: Box }, // Existing Shipments
                { id: 'Carriers', label: 'Carrier Mgmt', icon: Truck },
                { id: 'FreightAudit', label: 'Freight Audit', icon: FileCheck },
                { id: 'Yard', label: 'Yard Management', icon: Warehouse },
            ]
        },
        {
            id: 'wms',
            label: 'WMS System',
            icon: Warehouse,
            children: [
                { id: 'Warehouse Ops', label: 'Operations Console', icon: ClipboardList }, // Unified View
                { id: 'Inventory', label: 'Inventory Control', icon: Boxes }, // Existing Inventory
                { id: 'Receiving', label: 'Inbound / Receiving', icon: ArrowDownToLine },
                { id: 'Picking', label: 'Picking & Packing', icon: PackageCheck },
                { id: 'Shipping', label: 'Shipping / Outbound', icon: ArrowUpFromLine },
                { id: 'Labor', label: 'Labor Mgmt', icon: Users2 },
                { id: 'Sustainability', label: 'Sustainability', icon: Leaf }, // Moved here
            ]
        },
        {
            id: 'other',
            label: 'Other Tools',
            icon: MoreHorizontal,
            children: [
                { id: 'Scheduling', label: 'Master Scheduler', icon: Calendar },
                { id: 'Control Tower', label: 'Control Tower', icon: Radio },
            ]
        }
    ];

    const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
        'erp': true,
        'tms': true,
        'wms': true,
        'other': true
    });

    const toggleSection = (id: string) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-1 px-2 text-xs text-neutral-300">
            {/* Recursive / Nested Rendering */}
            {SYSTEM_MODULES.map((section) => (
                <div key={section.id} className="mb-1">
                    <div
                        className="flex h-7 cursor-pointer items-center gap-2 px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        onClick={() => toggleSection(section.id)}
                    >
                        {expandedSections[section.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{section.label}</span>
                    </div>

                    {expandedSections[section.id] && (
                        <div className="mt-0.5">
                            {section.children.map((child) => (
                                <div
                                    key={child.id}
                                    onClick={() => onSelectTab(child.id)}
                                    className={cn(
                                        "flex h-7 cursor-pointer items-center gap-2 px-6 ml-1 border-l border-transparent hover:bg-[var(--item-hover-bg)] transition-colors",
                                        activeTab === child.id
                                            ? "bg-[var(--item-active-bg)] text-[var(--text-primary)] font-medium border-l-[var(--accent-color)]"
                                            : "text-[var(--text-secondary)]"
                                    )}
                                >
                                    <child.icon className={cn("h-3.5 w-3.5", activeTab === child.id ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")} />
                                    <span className="truncate text-[11px]">{child.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            <TreeItem label="SITES" isOpen>
                <div className="py-1">
                    {sites.map((site) => (
                        <div
                            key={site}
                            onClick={() => onSelectSite(site)}
                            className={cn(
                                "flex h-7 cursor-pointer items-center gap-2 px-6 hover:bg-[var(--item-hover-bg)] transition-colors",
                                activeSite === site ? "bg-[var(--item-active-bg)] text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"
                            )}
                        >
                            <Database className={cn("h-3 w-3", activeSite === site ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")} />
                            <span className="truncate">{site}</span>
                        </div>
                    ))}
                </div>
            </TreeItem>

            {/*             <TreeItem label="EQUIPMENT" icon={Wrench}>
                <div className="py-1 space-y-1">
                    <div className="flex h-7 items-center gap-2 px-6 text-slate-400 hover:bg-slate-800 cursor-pointer transition-colors">
                        <span className="truncate">Forklifts</span>
                    </div>
                    <div className="flex h-7 items-center gap-2 px-6 text-slate-400 hover:bg-slate-800 cursor-pointer transition-colors">
                        <span className="truncate">Conveyors</span>
                    </div>
                </div>
            </TreeItem>

            <TreeItem
                label="HEAT MAP"
                icon={Activity}
                isOpen={isHeatmapActive}
                onClick={onToggleHeatmap}
                active={isHeatmapActive}
            >
                <div className="py-1 space-y-1">
                    <div
                        onClick={(e) => { e.stopPropagation(); onSelectHeatmapMetric('density'); if (!isHeatmapActive) onToggleHeatmap(); }}
                        className={cn(
                            "flex h-7 items-center gap-2 px-6 hover:bg-neutral-800 cursor-pointer transition-colors",
                            isHeatmapActive && heatmapMetric === 'density' ? "text-emerald-400 font-medium bg-neutral-800" : "text-neutral-400"
                        )}
                    >
                        <span className="truncate">Inventory Density</span>
                    </div>
                    <div
                        onClick={(e) => { e.stopPropagation(); onSelectHeatmapMetric('occupancy'); if (!isHeatmapActive) onToggleHeatmap(); }}
                        className={cn(
                            "flex h-7 items-center gap-2 px-6 hover:bg-neutral-800 cursor-pointer transition-colors",
                            isHeatmapActive && heatmapMetric === 'occupancy' ? "text-emerald-400 font-medium bg-neutral-800" : "text-neutral-400"
                        )}
                    >
                        <span className="truncate">Congestion / Occupancy</span>
                    </div>
                </div>
            </TreeItem> */}
        </div>
    );
}

function TreeItem({
    label,
    children,
    isOpen = false,
    isOpenIcon = false,
    icon: Icon,
    onClick,
    active = false,
}: {
    label: string;
    children?: React.ReactNode;
    isOpen?: boolean;
    isOpenIcon?: boolean;
    icon?: any;
    onClick?: () => void;
    active?: boolean;
}) {
    return (
        <div className="select-none">
            <div
                onClick={onClick}
                className={cn(
                    "flex h-6 cursor-pointer items-center gap-1 hover:bg-[var(--item-hover-bg)] focus:bg-[var(--item-active-bg)] focus:outline-none px-1",
                    active ? "text-[var(--accent-color)] font-medium" : "text-[var(--text-secondary)]"
                )}
            >
                {children ? (
                    (isOpen || isOpenIcon) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                ) : (
                    <div className="w-3" />
                )}
                {Icon && <Icon className={cn("h-3.5 w-3.5", active ? "text-[var(--accent-color)]" : "text-[var(--text-muted)]")} />}
                <span>{label}</span>
            </div>
            {(isOpen || isOpenIcon) && children && <div className="ml-3 border-l border-[var(--border-color)] pl-1">{children}</div>}
        </div>
    );
}
