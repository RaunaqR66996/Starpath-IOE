"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditorTabsProps {
    tabs: string[];
    activeTab: string;
    onSelectTab: (tab: string) => void;
    onCloseTab: (tab: string) => void;
}

export function EditorTabs({ tabs, activeTab, onSelectTab, onCloseTab }: EditorTabsProps) {
    return (
        <div className="flex h-full flex-col bg-slate-900">
            {/* Tab Row */}
            <div className="flex h-9 border-b border-slate-700 bg-slate-900/80">
                {tabs.map((tab) => (
                    <div
                        key={tab}
                        onClick={() => onSelectTab(tab)}
                        className={cn(
                            "group flex h-full min-w-[120px] cursor-pointer items-center justify-between border-r border-slate-700 px-3 text-xs transition-colors",
                            activeTab === tab
                                ? "bg-slate-800 text-slate-100"
                                : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300"
                        )}
                    >
                        <span className="truncate">{tab}</span>
                        {tab !== "Orders" && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab);
                                }}
                                className="ml-2 rounded-sm p-0.5 opacity-0 hover:bg-slate-700 group-hover:opacity-100"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="max-w-full overflow-auto">
                    <DataTable tabName={activeTab} />
                </div>
            </ScrollArea>
        </div>
    );
}

function DataTable({ tabName }: { tabName: string }) {
    // Mock data for high-density enterprise table
    const rows = Array.from({ length: 20 });
    const cols = ["ID", "Reference", "Status", "Priority", "Destination", "Carrier", "Updated"];

    return (
        <div className="w-full rounded-none border border-slate-700 bg-slate-900 text-xs">
            <table className="w-full border-collapse">
                <thead className="bg-slate-800 text-slate-400">
                    <tr>
                        {cols.map((col) => (
                            <th key={col} className="border-b border-slate-700 px-3 py-2 text-left font-medium">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                    {rows.map((_, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                            <td className="px-3 py-2 text-slate-500">#{1000 + i}</td>
                            <td className="px-3 py-2 font-mono">BS-SYNC-{i * 7}</td>
                            <td className="px-3 py-2">
                                <span className="rounded-none border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase">
                                    Pending
                                </span>
                            </td>
                            <td className="px-3 py-2">Normal</td>
                            <td className="px-3 py-2">ORD-HUB-0{i % 4}</td>
                            <td className="px-3 py-2 text-slate-400">FEDEX_EXP</td>
                            <td className="px-3 py-2 text-[10px] text-slate-600">2025-12-28 16:00</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
