"use client";

import React, { useState, useEffect } from "react";
import {
    Leaf, Wind, Droplets, Sun,
    BarChart3, FileText, Globe,
    Zap, Trash2, Award, TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSustainabilityMetrics, SustainabilityMetrics } from "@/app/actions/sustainability-actions";
import { DocumentGenerator } from "../DocumentGenerator";

export function SustainabilityWorkspace() {
    const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSustainabilityMetrics().then(m => {
            setMetrics(m);
            setLoading(false);
        });
    }, []);

    if (loading) return (
        <div className="flex h-full items-center justify-center bg-black">
            <Leaf className="h-8 w-8 animate-pulse text-emerald-500" />
        </div>
    );

    return (
        <div className="flex h-full flex-col bg-[#020202] text-neutral-300">
            {/* Command Header */}
            <div className="flex h-12 items-center justify-between border-b border-white/5 px-6 bg-black">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-emerald-400">
                        <Leaf className="h-4 w-4" />
                        <span className="text-sm font-bold tracking-tight text-white uppercase">ESG COMMAND CENTER</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <DocumentGenerator type="SUSTAINABILITY_REPORT" data={{}} label="Export Q4 ESG Report" />
                </div>
            </div>

            <div className="flex-1 p-8 grid grid-cols-12 gap-6 overflow-y-auto">
                {/* Global Metrics Panel */}
                <div className="col-span-12 grid grid-cols-4 gap-4">
                    {[
                        { label: 'CO2 Footprint', val: `${(metrics?.totalCarbonKg || 0).toLocaleString()} kg`, sub: '-5.2% vs Last Mo', icon: Wind, color: 'text-sky-400' },
                        { label: 'Renewable Energy', val: `${metrics?.greenEnergyPercent}%`, sub: 'Target: 80% by 2026', icon: Sun, color: 'text-amber-400' },
                        { label: 'Net Zero Offset', val: `${(metrics?.offsetCredits || 0).toLocaleString()} tons`, sub: 'Gold Standard Certified', icon: Globe, color: 'text-emerald-400' },
                        { label: 'Waste Recycled', val: `${(metrics?.wasteRecycledKg || 0).toLocaleString()} kg`, sub: 'Circular Economy: 92%', icon: Trash2, color: 'text-purple-400' },
                    ].map((m, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <m.icon className="h-12 w-12" />
                            </div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={cn("p-2 rounded-lg bg-white/5", m.color)}>
                                    <m.icon className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{m.label}</span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{m.val}</div>
                            <div className="text-[10px] text-emerald-400 font-mono italic">{m.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Left: Energy Matrix */}
                <div className="col-span-8 bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Advanced Emission Tracking</h2>
                            <p className="text-xs text-neutral-500 mt-1">Real-time carbon intensity analysis across terrestrial and aerial logistics.</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-emerald-500/50" />
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-8 items-end h-[300px]">
                        {[
                            { name: 'Jan', air: 80, truck: 40, offset: 20 },
                            { name: 'Feb', air: 70, truck: 45, offset: 25 },
                            { name: 'Mar', air: 60, truck: 35, offset: 30 },
                            { name: 'Apr', air: 55, truck: 38, offset: 35 },
                            { name: 'May', air: 50, truck: 30, offset: 40 },
                            { name: 'Jun', air: 45, truck: 28, offset: 45 },
                        ].map((month, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                <div className="w-full h-full flex items-end gap-1 px-2">
                                    <div className="flex-1 bg-red-500/20 border-t-2 border-red-500/40 rounded-t-sm" style={{ height: `${month.air}%` }} />
                                    <div className="flex-1 bg-blue-500/20 border-t-2 border-blue-500/40 rounded-t-sm" style={{ height: `${month.truck}%` }} />
                                    <div className="flex-1 bg-emerald-500/20 border-t-2 border-emerald-500/40 rounded-t-sm" style={{ height: `${month.offset}%` }} />
                                </div>
                                <span className="text-[10px] text-neutral-500 font-mono">{month.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500/40" /><span className="text-[10px] uppercase">Air Freight</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500/40" /><span className="text-[10px] uppercase">Road Logistics</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/40" /><span className="text-[10px] uppercase">Verified Offsets</span></div>
                    </div>
                </div>

                {/* Right: Certifications & Impact */}
                <div className="col-span-4 flex flex-col gap-6">
                    <div className="bg-emerald-500 p-8 rounded-3xl text-emerald-950 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                        <Award className="h-10 w-10 mb-4" />
                        <div className="text-2xl font-black uppercase leading-none mb-2">GOLD RATED NODE</div>
                        <p className="text-xs font-bold opacity-80 mb-6">StarPath Laredo Hub has achieved Carbon Neutrality Certification for H1 2025.</p>
                        <button className="w-full py-3 bg-emerald-950 text-emerald-300 text-[10px] font-black rounded-xl hover:bg-black transition-colors">
                            VIEW CERTIFICATES
                        </button>
                    </div>

                    <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
                        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="h-4 w-4 text-emerald-400" /> Site Efficiency
                        </h3>
                        <div className="space-y-6">
                            {[
                                { name: 'Water Usage', val: 88, unit: 'L/sqft', icon: Droplets },
                                { name: 'Solar Yield', val: 94, unit: 'kWh/d', icon: Sun },
                                { name: 'Grid Draw', val: 12, unit: 'kW', icon: Zap },
                            ].map((s, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-white font-bold">{s.name}</span>
                                        <span className="text-neutral-500">{s.val} {s.unit}</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500/40 rounded-full" style={{ width: `${s.val}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
