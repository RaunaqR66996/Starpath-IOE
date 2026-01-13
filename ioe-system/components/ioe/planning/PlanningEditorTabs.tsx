import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEditor } from "./editors/CalendarEditor";



interface PlanningTab {
    id: string;
    label: string;
    closable?: boolean;
}

interface PlanningEditorTabsProps {
    tabs: PlanningTab[];
    activeTab: string | null;
    onSelectTab: (tabId: string) => void;
    onCloseTab: (tabId: string) => void;
}

export function PlanningEditorTabs({ tabs, activeTab, onSelectTab, onCloseTab }: PlanningEditorTabsProps) {
    if (tabs.length === 0) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-900 text-slate-600 text-sm">
                Select a planning node to begin
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-slate-900">
            {/* Tab Bar */}
            <div className="flex items-center gap-px bg-slate-950 border-b border-slate-700 overflow-x-auto">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs border-r border-slate-700 cursor-pointer whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-slate-900 text-slate-200"
                                : "bg-slate-950 text-slate-400 hover:bg-slate-900/50"
                        )}
                    >
                        <span>{tab.label}</span>
                        {tab.closable !== false && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }}
                                className="hover:bg-slate-700 rounded p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab && (
                    <PlanningEditorContent tabId={activeTab} />
                )}
            </div>
        </div>
    );
}

function PlanningEditorContent({ tabId }: { tabId: string }) {
    // Route to appropriate editor based on tab ID
    const getEditorComponent = () => {

        // Placeholder tables for now
        if (tabId.includes("forecast")) {
            return <TablePlaceholder title="Forecast Editor" />;
        }
        if (tabId.includes("production-schedule")) {
            return <TablePlaceholder title="Production Master Schedule" />;
        }
        if (tabId.includes("purchase-plan")) {
            return <TablePlaceholder title="MRP Netting / Supply Plan" />;
        }
        if (tabId.includes("safety-stock") || tabId.includes("replenishment")) {
            return <TablePlaceholder title="Inventory Projection" />;
        }
        if (tabId.includes("labor") || tabId.includes("lines-docks")) {
            return <TablePlaceholder title="Capacity Plan" />;
        }
        if (tabId.includes("wave-planning")) {
            return <TablePlaceholder title="Wave Plan" />;
        }
        if (tabId.includes("route-plan") || tabId.includes("carrier-plan")) {
            return <TablePlaceholder title="Route Plan" />;
        }
        if (tabId.includes("load-optimizer")) {
            return <LoadOptimizerPlaceholder />;
        }
        if (tabId.includes("excel")) {
            return <ExcelEditorPlaceholder />;
        }
        if (tabId.includes("scenarios")) {
            return <TablePlaceholder title="Scenario Compare" />;
        }
        if (tabId.includes("approvals")) {
            return <TablePlaceholder title="Plan Release" />;
        }
        if (tabId.includes("calendars")) {
            return <CalendarEditor tabId={tabId} />;
        }


        return <TablePlaceholder title={tabId} />;
    };

    return getEditorComponent();
}

function TablePlaceholder({ title }: { title: string }) {
    return (
        <div className="h-full bg-slate-900 p-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</div>
            <div className="border border-slate-700 rounded">
                <table className="w-full text-xs">
                    <thead className="bg-slate-800 border-b border-slate-700">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Column 1</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Column 2</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Column 3</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Column 4</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                                <td className="px-3 py-1.5 text-slate-300">Data {i + 1}</td>
                                <td className="px-3 py-1.5 text-slate-300">Value</td>
                                <td className="px-3 py-1.5 text-slate-300">123</td>
                                <td className="px-3 py-1.5 text-slate-300">Active</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LoadOptimizerPlaceholder() {
    return (
        <div className="h-full bg-slate-900 flex flex-col">
            <div className="flex gap-px bg-slate-950 border-b border-slate-700">
                <div className="px-3 py-1.5 text-xs bg-slate-900 text-slate-200 border-r border-slate-700">3D Load View</div>
                <div className="px-3 py-1.5 text-xs bg-slate-950 text-slate-400 border-r border-slate-700">2D Floorplan</div>
                <div className="px-3 py-1.5 text-xs bg-slate-950 text-slate-400">Load Sequence</div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-600 text-sm">
                Live Load Optimizer - 3D View Placeholder
            </div>
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-950 border-t border-slate-700 text-xs">
                <span className="text-slate-400">Weight: <span className="text-slate-200">12,450 lbs</span></span>
                <span className="text-slate-400">Cube: <span className="text-slate-200">82%</span></span>
                <span className="text-slate-400">Axle Balance: <span className="text-emerald-400">Good</span></span>
                <span className="text-slate-400">Stability: <span className="text-emerald-400">Pass</span></span>
                <span className="text-slate-400">Violations: <span className="text-slate-200">0</span></span>
            </div>
        </div>
    );
}

function ExcelEditorPlaceholder() {
    return (
        <div className="h-full bg-slate-900 flex flex-col">
            <div className="flex gap-px bg-slate-950 border-b border-slate-700">
                <div className="px-3 py-1.5 text-xs bg-slate-900 text-slate-200 border-r border-slate-700">Sheet1</div>
                <div className="px-3 py-1.5 text-xs bg-slate-950 text-slate-400 border-r border-slate-700">Sheet2</div>
            </div>
            <div className="flex-1 overflow-auto p-4">
                <TablePlaceholder title="Excel Grid" />
            </div>
        </div>
    );
}
