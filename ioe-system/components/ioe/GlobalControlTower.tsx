"use client";

import React, { useState, useEffect } from "react";
import { ShipmentsMap, ShipmentMapData } from "./ShipmentsMap";
import { TopologyGraph } from "./TopologyGraph";
import {
    Globe, Server, Zap, Shield,
    AlertCircle, TrendingUp, ArrowRightLeft,
    Database, Activity, Map as MapIcon, Loader2, Leaf, Siren
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authorizeInventoryTransfer } from "@/app/actions/transfer-actions";
import { getSystemHealth, SystemHealth, NodeStatus, Alert } from "@/app/actions/ops-command";

export function GlobalControlTower() {
    const [view, setView] = useState<'map' | 'topology'>('map');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [loadingTransfer, setLoadingTransfer] = useState(false);
    const [transferStatus, setTransferStatus] = useState<string | null>(null);

    // Live Data State
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const data = await getSystemHealth();
            setHealth(data);
            setLoading(false);
        }
        fetchData();

        // Poll every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleTransfer = async () => {
        setLoadingTransfer(true);
        const res = await authorizeInventoryTransfer('la', 'laredo', 'SKU-101', 4500);
        if (res.success) {
            setTransferStatus(res.message || "Transfer Authorized");
            setTimeout(() => setTransferStatus(null), 5000);
        }
        setLoadingTransfer(false);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-black text-white font-mono text-xs">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-blue-500" />
                INITIALIZING GLOBAL COMMAND...
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] text-[var(--text-primary)]">
            {/* Header / Command Strip */}
            <div className="flex h-12 items-center justify-between border-b border-[var(--border-color)] px-6 bg-[var(--bg-panel-header)]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-400 animate-pulse" />
                        <span className="text-sm font-bold tracking-tight">GLOBAL OPERATIONS COMMAND v5.0</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex bg-white/5 p-1 rounded-lg">
                        <button
                            onClick={() => setView('map')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold transition-all",
                                view === 'map' ? "bg-white/10 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                            )}>
                            <MapIcon className="h-3 w-3" /> MAP
                        </button>
                        <button
                            onClick={() => setView('topology')}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold transition-all",
                                view === 'topology' ? "bg-white/10 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"
                            )}>
                            <Activity className="h-3 w-3" /> TOPOLOGY
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 text-[10px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full", health?.nodes.length ? "bg-emerald-500" : "bg-red-500")} />
                            {health?.nodes.length} NODES ONLINE
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {health?.metrics.activeShipments} SHP IN-TRANSIT
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400/80">
                            <Leaf className="h-3 w-3" /> NET ZERO TRACKING
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main View Area */}
                <div className="flex-1 relative border-r border-white/5">
                    {view === 'map' ? (
                        <ShipmentsMap shipments={health?.activeShipmentsData || []} />
                    ) : (
                        <TopologyGraph nodes={health?.nodes || []} links={health?.links || []} />
                    )}
                </div>


                {/* Right Sidebar: Intelligence & Alerts */}
                <div className="w-[380px] flex flex-col bg-[#050505] overflow-y-auto">
                    {/* Active Alerts Panel */}
                    {health?.alerts && health.alerts.length > 0 && (
                        <div className="p-6 border-b border-white/5 space-y-3 bg-red-950/10">
                            <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                                <Siren className="h-3 w-3 animate-pulse" /> Critical Alerts ({health.alerts.length})
                            </div>
                            <div className="space-y-2">
                                {health.alerts.map(alert => (
                                    <div key={alert.id} className="p-2 border border-red-500/20 bg-red-500/10 rounded text-[10px] text-red-200">
                                        <div className="flex justify-between font-bold mb-1">
                                            <span>{alert.domain}</span>
                                            <span>{alert.severity}</span>
                                        </div>
                                        {alert.message}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rebalancing Panel */}
                    <div className="p-6 border-b border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                                <ArrowRightLeft className="h-3 w-3 text-blue-400" /> Rebalancing AI
                            </h3>
                            <Shield className="h-3 w-3 text-emerald-500 opacity-50" />
                        </div>

                        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-600/20">
                                    <TrendingUp className="h-4 w-4 text-blue-400" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-bold text-white leading-none">Optimize Stock Allocation</div>
                                    <div className="text-[10px] text-neutral-400 leading-relaxed">
                                        Detecting <strong>Stock-out risk</strong> in Laredo based on {health?.metrics.openOrders} open orders.
                                    </div>
                                </div>
                            </div>
                            {transferStatus ? (
                                <div className="flex items-center gap-2 p-2 bg-emerald-500/20 border border-emerald-500/50 rounded text-emerald-400 text-[10px] font-mono">
                                    <CheckCircle2 className="h-3 w-3" /> {transferStatus}
                                </div>
                            ) : (
                                <button
                                    onClick={handleTransfer}
                                    disabled={loadingTransfer}
                                    className="w-full py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-950/20 flex items-center justify-center gap-2 disabled:bg-neutral-800"
                                >
                                    {loadingTransfer ? <Loader2 className="h-3 w-3 animate-spin" /> : "AUTHORIZE TRANSFER ORDER"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Site Health Monitor */}
                    <div className="p-6 space-y-4">
                        <h3 className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2">
                            <Database className="h-3 w-3" /> Global Site Health
                        </h3>

                        <div className="space-y-2">
                            {health?.nodes.map(node => (
                                <div
                                    key={node.id}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer group",
                                        selectedNode === node.id
                                            ? "bg-white/5 border-white/20"
                                            : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                    )}
                                    onClick={() => setSelectedNode(node.id)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                node.status === 'HEALTHY' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                    node.status === 'BUSY' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                            )} />
                                            <span className="text-xs font-bold text-white uppercase">{node.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-neutral-500">{node.loadPct}% LOAD</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[8px] text-neutral-500 uppercase mb-0.5">Inventory</div>
                                            <div className="text-[10px] font-mono text-white">{(node.inventoryCount || 0).toLocaleString()} SKUs</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-neutral-500 uppercase mb-0.5">Stability</div>
                                            <div className="text-[10px] font-mono text-emerald-400">99.8%</div>
                                        </div>
                                    </div>

                                    {/* Action Reveal on Hover */}
                                    <div className="mt-3 overflow-hidden h-0 group-hover:h-8 transition-all flex items-center gap-2">
                                        <button className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded text-[8px] font-bold uppercase transition-colors">
                                            Switch Node
                                        </button>
                                        <button className="px-1.5 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors">
                                            <Server className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Global Events */}
                    <div className="mt-auto p-6 bg-white/[0.02] border-t border-white/5">
                        <div className="text-[8px] text-neutral-600 font-mono uppercase tracking-[3px] mb-3">System Log</div>
                        <div className="space-y-2">
                            {[
                                { t: '14:32', m: 'Route TRFR-001 re-optimized (+12m)' },
                                { t: '14:15', m: 'NJ Node entered Maintenance mode' },
                                { t: '13:58', m: 'LA Backup Sync Successful' }
                            ].map((evt, i) => (
                                <div key={i} className="flex gap-3 text-[9px] font-mono">
                                    <span className="text-neutral-700">{evt.t}</span>
                                    <span className="text-neutral-500">{evt.m}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
