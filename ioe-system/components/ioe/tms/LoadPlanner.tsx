"use client";

import React, { useState, useEffect } from "react";
import { Map, Truck, Play, RefreshCw, CheckCircle, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// Dynamic import for Map to avoid SSR issues
const ShipmentsMap = dynamic(() => import("../ShipmentsMap").then(mod => mod.ShipmentsMap), { ssr: false });

interface Shipment {
    id: string;
    origin: string;
    destination: string;
    totalWeight: number;
    status: string;
}

interface Route {
    id: string;
    name: string;
    totalDistance: number;
    totalCost: number;
    savings: number;
    stops: { location: string; type: string }[];
}

export function LoadPlanner() {
    const [unassigned, setUnassigned] = useState<Shipment[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [scenarioId, setScenarioId] = useState<string | null>(null);

    // Fetch Unassigned Shipments
    useEffect(() => {
        fetch('/api/tms/shipments?status=PLANNED') // PLANNED = Ready for optimization
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUnassigned(data);
            });
    }, []);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const runOptimization = async () => {
        if (selectedIds.size === 0) return;
        setIsOptimizing(true);
        try {
            const res = await fetch('/api/tms/optimization/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipmentIds: Array.from(selectedIds),
                    scenarioName: `Scenario ${new Date().toLocaleTimeString()}`
                })
            });
            const result = await res.json();
            if (result.success) {
                setScenarioId(result.scenarioId);
                // In a real app, we'd fetch the specific routes for this scenario.
                // For now, let's just mock the UI update or re-fetch all routes if we had an endpoint.
                // Let's assume we remove them from unassigned
                setUnassigned(prev => prev.filter(s => !selectedIds.has(s.id)));
                setSelectedIds(new Set());
                alert(`Optimization Complete! Saved $${result.savings.toFixed(2)}`);
            }
        } catch (e) {
            console.error(e);
            alert("Optimization failed");
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-editor)]">
            {/* Top: Map Visualization */}
            <div className="h-1/2 border-b border-[var(--border-color)] relative">
                <div className="absolute top-2 left-2 z-10 bg-black/80 text-white text-xs px-2 py-1 rounded border border-white/10">
                    Network Visualization
                </div>
                <ShipmentsMap shipments={unassigned.map(s => ({
                    id: s.id,
                    // Mock coords until we have geocoding
                    origin: [-98, 38],
                    destination: [-95, 38],
                    label: s.destination,
                    color: selectedIds.has(s.id) ? '#f59e0b' : '#3b82f6'
                }))} />
            </div>

            {/* Bottom: Planning Control */}
            <div className="flex-1 flex overflow-hidden">
                {/* Unassigned List */}
                <div className="w-1/3 border-r border-[var(--border-color)] flex flex-col">
                    <div className="h-8 flex items-center px-3 bg-[var(--bg-panel-header)] text-xs font-bold text-[var(--text-secondary)] justify-between">
                        <span>UNASSIGNED LOAD BOARD</span>
                        <span className="bg-blue-900 text-blue-200 px-1.5 rounded">{unassigned.length}</span>
                    </div>
                    <div className="flex-1 overflow-auto p-2 space-y-1">
                        {unassigned.map(s => (
                            <div
                                key={s.id}
                                onClick={() => toggleSelection(s.id)}
                                className={cn(
                                    "text-xs p-2 rounded border cursor-pointer flex justify-between items-center transition-all",
                                    selectedIds.has(s.id)
                                        ? "bg-amber-900/20 border-amber-500/50 text-amber-100"
                                        : "bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--text-secondary)]"
                                )}
                            >
                                <div>
                                    <div className="font-mono">{s.destination}</div>
                                    <div className="text-[10px] opacity-70">{s.totalWeight} lbs</div>
                                </div>
                                {selectedIds.has(s.id) && <CheckCircle size={14} className="text-amber-500" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div className="w-1/3 border-r border-[var(--border-color)] flex flex-col items-center justify-center p-6 space-y-4 bg-[var(--bg-surface)]">
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-white">Route Optimizer</h3>
                        <p className="text-xs text-[var(--text-secondary)]">Heuristic: Savings Algorithm (Clarke-Wright)</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-white">{selectedIds.size}</span>
                            <span>Orders</span>
                        </div>
                        <ArrowRight size={16} />
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-white">?</span>
                            <span>Routes</span>
                        </div>
                    </div>

                    <button
                        onClick={runOptimization}
                        disabled={isOptimizing || selectedIds.size === 0}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2 rounded-md font-bold text-sm transition-all shadow-lg",
                            isOptimizing
                                ? "bg-neutral-700 cursor-not-allowed text-neutral-400"
                                : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white hover:scale-105"
                        )}
                    >
                        {isOptimizing ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
                        {isOptimizing ? "Optimizing..." : "RUN OPTIMIZER"}
                    </button>

                    {scenarioId && <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Scenario Created</div>}
                </div>

                {/* Results List */}
                <div className="w-1/3 flex flex-col">
                    <div className="h-8 flex items-center px-3 bg-[var(--bg-panel-header)] text-xs font-bold text-[var(--text-secondary)]">
                        OPTIMIZED ROUTES
                    </div>
                    <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-xs italic p-4 text-center">
                        {scenarioId ? "Routes generated. Check 'Shipments' tab for update." : "Run optimization to see proposed routes."}
                    </div>
                </div>
            </div>
        </div>
    );
}
