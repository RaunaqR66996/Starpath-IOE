"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Layers, Zap, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductionPlanResult({ planData }: { planData?: any }) {
    const [activeTab, setActiveTab] = useState<'reconciliation' | 'schedule' | 'impact'>('reconciliation');

    // Default Fallback Data if AI doesn't provide structured JSON
    const data = planData || {
        summary: "Demand Signal (Customer MRP) → Execution Truth (IOE)",
        kpis: [
            { label: "Plan Efficiency", value: "94%", trend: "+12%" },
            { label: "Inventory Turn", value: "4.2x", trend: "+0.4" },
            { label: "Projected Stockouts", value: "0", trend: "Resolved" }
        ],
        jobs: [
            { id: "Job 1024", label: "Line A (Main Assembly)", status: "Overcap", start: 10, width: 40 },
            { id: "Relief Job 1024-B", label: "Line B (Auxiliary)", status: "OPTIMIZED", start: 55, width: 20 }
        ]
    };

    return (
        <div className="flex h-full flex-col bg-slate-950 text-slate-200 overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="text-yellow-400" size={20} />
                        Production Plan Generated
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        {data.summary || "Demand Signal (Customer MRP) → Execution Truth (IOE)"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                        <CheckCircle2 size={12} /> FEASIBLE
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Sidebar: Discrepancies */}
                <div className="w-80 border-r border-slate-800 bg-slate-900/30 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Constraint Analysis</h3>

                        <div className="space-y-3">
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="text-red-400 mt-0.5" size={14} />
                                    <div>
                                        <div className="text-sm font-medium text-red-200">Capacity Breach</div>
                                        <div className="text-xs text-slate-400 mt-1">Week 34 requires 120% capacity on Line A.</div>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-red-300 font-mono pl-6">
                                    Expected: 4,000 u<br />
                                    Capable: 3,200 u
                                </div>
                            </div>

                            <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                                <div className="flex items-start gap-2">
                                    <Layers className="text-yellow-400 mt-0.5" size={14} />
                                    <div>
                                        <div className="text-sm font-medium text-yellow-200">Material Shortage</div>
                                        <div className="text-xs text-slate-400 mt-1">Raw Material PCB-09 projected stockout.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-800">
                        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4">AI Validated Strategy</h3>
                        <div className="space-y-4">
                            <div className="relative pl-4 border-l-2 border-slate-700">
                                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                                <div className="text-xs text-slate-500 mb-1">Step 1</div>
                                <div className="text-sm text-slate-300">Shift 800u to Line B (Night Shift)</div>
                            </div>
                            <div className="relative pl-4 border-l-2 border-slate-700">
                                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                                <div className="text-xs text-slate-500 mb-1">Step 2</div>
                                <div className="text-sm text-slate-300">Expedite PO-992 with Supplier X</div>
                            </div>
                            <div className="relative pl-4 border-l-2 border-emerald-500/50">
                                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-900 animate-pulse" />
                                <div className="text-xs text-emerald-500 mb-1">Result</div>
                                <div className="text-sm text-white font-medium">100% On-Time Delivery Preserved</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main: Visual Schedule */}
                <div className="flex-1 flex flex-col bg-slate-950">
                    <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-800">
                        {['Reconciliation', 'Gantt View', 'Impact Analysis'].map(tab => (
                            <button
                                key={tab}
                                className={cn(
                                    "text-xs font-medium pb-2 border-b-2 transition-colors uppercase tracking-wide",
                                    activeTab === tab.toLowerCase().split(' ')[0]
                                        ? "border-emerald-500 text-emerald-400"
                                        : "border-transparent text-slate-500 hover:text-slate-300"
                                )}
                                onClick={() => setActiveTab(tab.toLowerCase().split(' ')[0] as any)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-8 overflow-y-auto">
                        {/* Placeholder for Gantt - keeping it simple css grid for now */}
                        <div className="w-full bg-slate-900 rounded-lg border border-slate-800 p-6 relative overflow-hidden">
                            {/* Grid Lines */}
                            <div className="absolute inset-x-0 top-12 bottom-0 flex justify-between px-6 pointer-events-none opacity-20">
                                {[...Array(6)].map((_, i) => <div key={i} className="w-px h-full bg-slate-500" />)}
                            </div>

                            {/* Header */}
                            <div className="flex justify-between px-6 mb-6 text-xs text-slate-500 font-mono">
                                <span>WK 33</span>
                                <span>WK 34</span>
                                <span>WK 35</span>
                                <span>WK 36</span>
                                <span>WK 37</span>
                                <span>WK 38</span>
                            </div>

                            {/* Bars */}
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-300 font-medium">Line A (Main Assembly)</div>
                                    <div className="h-8 w-full bg-slate-800 rounded-lg relative overflow-hidden">
                                        <div className="absolute left-[10%] w-[40%] h-full bg-blue-600/30 border border-blue-500/50 rounded flex items-center justify-center text-[10px] text-blue-200">
                                            Job 1024
                                        </div>
                                        <div className="absolute left-[55%] w-[30%] h-full bg-red-600/20 border border-red-500/50 rounded flex items-center justify-center text-[10px] text-red-300">
                                            Overcap
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-2">
                                        Line B (Auxiliary) <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px]">OPTIMIZED</span>
                                    </div>
                                    <div className="h-8 w-full bg-slate-800 rounded-lg relative overflow-hidden">
                                        <div className="absolute left-[55%] w-[20%] h-full bg-emerald-600/30 border border-emerald-500/50 rounded flex items-center justify-center text-[10px] text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                            Relief Job 1024-B
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                <div className="text-xs text-slate-500 mb-1">Plan Efficiency</div>
                                <div className="text-2xl font-bold text-white flex items-end gap-2">
                                    94% <span className="text-xs text-emerald-400 mb-1 flex items-center"><TrendingUp size={12} className="mr-0.5" /> +12%</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                <div className="text-xs text-slate-500 mb-1">Inventory Turn</div>
                                <div className="text-2xl font-bold text-white flex items-end gap-2">
                                    4.2x <span className="text-xs text-emerald-400 mb-1 flex items-center"><TrendingUp size={12} className="mr-0.5" /> +0.4</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                <div className="text-xs text-slate-500 mb-1">Projected Stockouts</div>
                                <div className="text-2xl font-bold text-white flex items-end gap-2">
                                    0 <span className="text-xs text-emerald-400 mb-1 flex items-center"><CheckCircle2 size={12} className="mr-0.5" /> Resolved</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductionPlanResult;
