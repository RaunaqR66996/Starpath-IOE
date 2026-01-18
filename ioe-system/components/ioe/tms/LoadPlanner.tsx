"use client";

import React, { useState, useEffect } from "react";
import { Map, Truck, Play, RefreshCw, CheckCircle, ArrowRight, Calendar, Users, Battery, DollarSign } from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { Shipment } from "@/lib/types"; // Correct import

// Dynamic import for Map to avoid SSR issues
const ShipmentsMap = dynamic(() => import("../ShipmentsMap").then(mod => mod.ShipmentsMap), { ssr: false });

export function LoadPlanner() {
    const [unassigned, setUnassigned] = useState<Shipment[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [scenarioId, setScenarioId] = useState<string | null>(null);

    // Fetch Unassigned Shipments
    const fetchShipments = React.useCallback(() => {
        fetch('/api/tms/shipments?status=PLANNING') // Corrected status
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUnassigned(data);
            })
            .catch(err => console.error("Poll Error:", err));
    }, []);

    useEffect(() => {
        fetchShipments();
        const interval = setInterval(fetchShipments, 5000);
        return () => clearInterval(interval);
    }, [fetchShipments]);

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
            // Simulated delay for effect
            await new Promise(r => setTimeout(r, 1500));
            setScenarioId(`SCN-${Math.floor(Math.random() * 10000)}`);
            setUnassigned(prev => prev.filter(s => !selectedIds.has(s.id)));
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-editor)] text-[var(--text-primary)]">
            {/* Top: Operational Dashboard */}
            <div className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] flex items-center px-4 justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[var(--accent-color)]" /> Dispatcher Workbench
                    </h2>
                    <div className="h-4 w-px bg-[var(--border-color)]" />
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-emerald-500" />
                            <span className="text-[var(--text-secondary)]">Drivers: <span className="text-white font-mono font-bold">12/15</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Truck className="h-3 w-3 text-blue-500" />
                            <span className="text-[var(--text-secondary)]">Power Units: <span className="text-white font-mono font-bold">8 Available</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-amber-500" />
                            <span className="text-[var(--text-secondary)]">Spot Rate: <span className="text-white font-mono font-bold">$2.45/mi</span></span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={runOptimization}
                    disabled={isOptimizing || selectedIds.size === 0}
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all shadow-lg",
                        isOptimizing
                            ? "bg-neutral-700 cursor-not-allowed text-neutral-400"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                    )}
                >
                    {isOptimizing ? <RefreshCw className="animate-spin h-3 w-3" /> : <Play className="h-3 w-3" fill="currentColor" />}
                    {isOptimizing ? "Optimizing Network..." : "Run Selection Optimizer"}
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Planning Board */}
                <div className="w-[300px] border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-surface)]">
                    <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Unplanned Orders</span>
                            <span className="bg-red-900/30 text-red-400 border border-red-900/50 px-1.5 rounded text-[10px]">{unassigned.length}</span>
                        </div>
                        <input
                            placeholder="Filter by City, ID..."
                            className="w-full bg-[var(--bg-editor)] border border-[var(--border-color)] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {unassigned.map(s => (
                            <div
                                key={s.id}
                                onClick={() => toggleSelection(s.id)}
                                className={cn(
                                    "p-3 rounded border cursor-pointer transition-all group",
                                    selectedIds.has(s.id)
                                        ? "bg-blue-900/20 border-blue-500/50 text-blue-100" // tweaked color
                                        : "bg-[var(--bg-editor)] border-[var(--border-color)] hover:border-neutral-600"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="text-[10px] font-bold text-white group-hover:text-blue-400 transition-colors">{s.id}</div>
                                    <div className="text-[10px] font-mono text-[var(--text-muted)]">234 mi</div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                                    <span className="truncate max-w-[80px]">{s.origin.city}</span>
                                    <ArrowRight className="h-3 w-3 text-[var(--text-muted)] flex-shrink-0" />
                                    <span className="truncate max-w-[80px]">{s.destination.city}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[10px] bg-neutral-800 px-1.5 rounded text-neutral-400">{s.totalWeight} lbs</span>
                                    {selectedIds.has(s.id) && <CheckCircle className="h-3 w-3 text-blue-500" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle: Map Visualization */}
                <div className="flex-1 flex flex-col border-r border-[var(--border-color)] relative bg-black">
                    <ShipmentsMap shipments={unassigned.map(s => ({
                        id: s.id,
                        origin: s.origin.coordinates || [-98, 38],
                        destination: s.destination.coordinates || [-95, 38],
                        label: s.destination.city,
                        color: selectedIds.has(s.id) ? '#3b82f6' : '#525252'
                    }))} />

                    {/* Floating Info Panel */}
                    {selectedIds.size > 0 && (
                        <div className="absolute bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur border border-neutral-800 p-4 rounded-lg flex justify-between items-center shadow-2xl">
                            <div>
                                <div className="text-xs text-neutral-500 uppercase font-bold">Selected Load</div>
                                <div className="text-lg font-bold text-white flex gap-2 items-center">
                                    {selectedIds.size} Shipments <span className="text-neutral-600">|</span> <span className="font-mono text-emerald-400">42,500 lbs</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-neutral-500 uppercase font-bold">Est Cost</div>
                                <div className="text-lg font-mono text-white">$1,240.00</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Dock & Execution */}
                <div className="w-[300px] flex flex-col bg-[var(--bg-surface)]">
                    <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Dock Schedule (Today)</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {/* Time Grid Mockup */}
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16].map(hour => (
                            <div key={hour} className="flex h-16 border-b border-[var(--border-color)] last:border-0 relative">
                                <div className="w-12 text-[10px] text-[var(--text-muted)] py-2 border-r border-[var(--border-color)] text-center">
                                    {hour}:00
                                </div>
                                <div className="flex-1 relative p-1">
                                    {hour === 9 && (
                                        <div className="absolute top-1 left-1 right-4 bottom-1 bg-amber-900/20 border border-amber-900/50 rounded flex items-center px-2 text-[10px] text-amber-500 font-bold overflow-hidden truncate">
                                            ORD-1002 (Live Load)
                                        </div>
                                    )}
                                    {hour === 14 && (
                                        <div className="absolute top-1 left-1 right-4 bottom-1 bg-blue-900/20 border border-blue-900/50 rounded flex items-center px-2 text-[10px] text-blue-500 font-bold overflow-hidden truncate">
                                            RMA-992 (Inspection)
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-editor)]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Active Scenarios</span>
                        </div>
                        {scenarioId ? (
                            <div className="bg-emerald-900/10 border border-emerald-900/30 rounded p-2 text-xs text-emerald-400 flex justify-between">
                                <span>{scenarioId}</span>
                                <span className="font-bold">SAVED 12%</span>
                            </div>
                        ) : (
                            <div className="text-[10px] text-[var(--text-muted)] italic text-center py-2">No active scenarios</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

