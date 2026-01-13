"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Package, ShoppingCart, Loader2, RefreshCw } from "lucide-react";
import { getMRPRecommendations } from "@/app/actions/mrp-actions";
import { cn } from "@/lib/utils";

export function MRPDashboard() {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const calculate = async () => {
        setLoading(true);
        const data = await getMRPRecommendations();
        setRecommendations(data);
        setLoading(false);
    };

    useEffect(() => {
        calculate();
    }, []);

    return (
        <div className="flex flex-col h-full bg-black text-neutral-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Material Requirements (MRP)</h2>
                    <p className="text-neutral-500 text-xs">Automated shortage analysis based on open orders and current stock.</p>
                </div>
                <button
                    onClick={calculate}
                    disabled={loading}
                    className="flex items-center gap-2 text-xs bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 px-3 py-1.5 rounded transition-colors"
                >
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Refresh Analysis
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-neutral-500">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p className="text-sm font-medium animate-pulse">Analyzing demand & supply chains...</p>
                </div>
            ) : recommendations.length === 0 ? (
                <div className="flex-1 border border-dashed border-neutral-800 rounded-lg flex flex-col items-center justify-center p-12 text-center">
                    <div className="bg-emerald-900/20 p-4 rounded-full mb-4">
                        <Package className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-white font-medium mb-1">Stock Levels Healthy</h3>
                    <p className="text-neutral-500 text-sm max-w-xs">No imminent shortages detected for current open sales orders.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {recommendations.map((rec) => (
                        <div key={rec.itemId} className="group relative overflow-hidden bg-neutral-900/50 border border-neutral-800 hover:border-amber-500/50 rounded-lg transition-all">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />

                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-neutral-800 rounded">
                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{rec.sku}</span>
                                            <span className="text-[10px] uppercase bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono">Shortage</span>
                                        </div>
                                        <div className="text-xs text-neutral-500">{rec.name}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="grid grid-cols-3 gap-8 text-center">
                                        <div>
                                            <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Demand</div>
                                            <div className="text-sm font-mono text-white">{rec.qtyRequired}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Available</div>
                                            <div className="text-sm font-mono text-neutral-400">{rec.qtyOnHand + rec.qtyOnOrder}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-amber-500/80 uppercase font-bold mb-1">Gap</div>
                                            <div className="text-sm font-mono text-amber-500">-{rec.netShortage}</div>
                                        </div>
                                    </div>

                                    <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded text-xs font-bold hover:bg-neutral-200 transition-all">
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                        Create PO
                                    </button>
                                </div>
                            </div>

                            <div className="px-4 py-2 border-t border-neutral-800/50 bg-neutral-950/30 flex items-center justify-between text-[10px]">
                                <div className="flex gap-4">
                                    <span className="text-neutral-500">On-Hand: <span className="text-neutral-300">{rec.qtyOnHand}</span></span>
                                    <span className="text-neutral-500">Incoming: <span className="text-neutral-300">{rec.qtyOnOrder}</span></span>
                                </div>
                                <div className="text-neutral-600 italic">Source: Forecasted Production + Sales Demands</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
