"use client";

import React, { useState, useEffect } from "react";
import { runProductionPlan } from "@/app/actions/planning-actions";
import { getAssetHealthMonitor, AssetHealth, scheduleMaintenance } from "@/app/actions/maintenance-actions";
import {
    Calendar, Clock, AlertTriangle, CheckCircle2,
    BarChart3, RefreshCcw, Settings2, Play,
    Layers, Cpu, Activity, X, Plus, Box
} from "lucide-react";
import { cn } from "@/lib/utils";

import { ScenarioManager } from "@/components/ioe/planning/ScenarioManager";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";

export function PlanningWorkspace() {
    // Global Tab Store
    const { tabs, activeTabId, setActiveTab, closeTab } = useWorkspaceStore();
    const activeTab = tabs.find(t => t.id === activeTabId);

    // Legacy State (Planning Engine)
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Initial Data Load
    useEffect(() => {
        async function init() {
            setLoading(true);
            const [planRes] = await Promise.all([runProductionPlan()]);
            setResult(planRes);
            setLoading(false);
        }
        init();
    }, []);

    const handleRunPlan = async () => {
        setLoading(true);
        await runProductionPlan();
        setLoading(false);
    };

    return (
        <div className="flex h-full flex-col bg-[#050505] text-neutral-300">
            {/* Toolbar & Tabs */}
            <div className="flex h-10 items-center border-b border-white/5 bg-black px-2 gap-2">
                {/* Tab List */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "group flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-medium cursor-pointer border-b-2 transition-all min-w-[120px]",
                                activeTabId === tab.id
                                    ? "bg-[#0F1116] text-white border-blue-500"
                                    : "text-neutral-500 hover:text-neutral-300 border-transparent hover:bg-white/5"
                            )}
                        >
                            <span className="truncate max-w-[100px]">{tab.title}</span>
                            {tab.closable !== false && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex-1" />

                {/* Action Buttons */}
                <div className="flex items-center gap-2 px-2 border-l border-white/10">
                    <button
                        onClick={handleRunPlan}
                        disabled={loading}
                        title="Re-run Engine"
                        className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                    >
                        <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <div className="text-[10px] text-neutral-600 font-mono">
                        {tabs.length} OPEN
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[#0F1116]">


                {activeTab?.type === 'LOAD_GRAPH' && (
                    <div className="h-full flex items-center justify-center flex-col gap-4">
                        <BarChart3 size={48} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-white">Capacity Load: {activeTab.title}</h2>
                        <p className="text-neutral-500">Interactive Load Graph for {activeTab.data?.id || 'Resource'}</p>
                    </div>
                )}

                {activeTab?.type === 'GANTT' && (
                    <div className="h-full flex items-center justify-center flex-col gap-4">
                        <Calendar size={48} className="text-purple-500" />
                        <h2 className="text-xl font-bold text-white">Order Schedule: {activeTab.title}</h2>
                        <p className="text-neutral-500">Gantt Details for {activeTab.data?.id}</p>
                    </div>
                )}

                {activeTab?.type === 'LOAD_GRAPH' && (
                    <div className="h-full flex items-center justify-center flex-col gap-4">
                        <BarChart3 size={48} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-white">Capacity Load: {activeTab.title}</h2>
                        <p className="text-neutral-500">Utilization Graph for {activeTab.data?.id || activeTab.title}</p>
                    </div>
                )}

                {activeTab?.type === 'ITEM_DETAIL' && (
                    <div className="h-full flex items-center justify-center flex-col gap-4">
                        <Box size={48} className="text-emerald-500" />
                        <h2 className="text-xl font-bold text-white">Item Master: {activeTab.title}</h2>
                        <p className="text-neutral-500">Inventory & BOM for {activeTab.data?.id || activeTab.title}</p>
                    </div>
                )}

                {activeTab?.type === 'SCENARIO_MANAGER' && <ScenarioManager />}

                {!activeTab && (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-600">
                        <Layers size={48} className="mb-4 opacity-20" />
                        <p>No tabs open.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

