import React from "react";
import { BarChart3, TrendingUp, AlertTriangle, Package, Truck, Factory } from "lucide-react";

export function TimelineControlTower({ resolvedRisks = false }: { resolvedRisks?: boolean }) {
    const weeks = [
        { id: "W1", label: "Week 1", load: 85, risk: "low" },
        { id: "W2", label: "Week 2", load: 92, risk: "medium" },
        // If risks are resolved, W3 becomes healthy (green)
        { id: "W3", label: "Week 3", load: resolvedRisks ? 95 : 115, risk: resolvedRisks ? "low" : "high" },
        { id: "W4", label: "Week 4", load: 70, risk: "low" },
    ];

    return (
        <div className="flex h-full flex-col border-r border-slate-800 bg-[#08080a] w-72">
            <div className="p-4 border-b border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeline Horizon</div>
                <div className="text-sm font-semibold text-white">4-Week Lookahead</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Week Blocks */}
                {weeks.map((week) => (
                    <div key={week.id} className="relative pl-4 border-l-2 border-slate-800">
                        <div className={`absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full border-2 border-[#08080a] ${week.risk === 'high' ? 'bg-red-500' : week.risk === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}></div>

                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">{week.label}</span>
                            <span className={`text-[10px] font-mono ${week.risk === 'high' ? 'text-red-400' : 'text-slate-500'}`}>
                                {week.load}% Load
                            </span>
                        </div>

                        {/* Stats for the week */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <div className="flex items-center gap-1.5"><TrendingUp size={12} /> Demand</div>
                                <span className="text-white">12,450 units</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <div className="flex items-center gap-1.5"><Package size={12} /> On-Hand</div>
                                <span className="text-white">8,200 units</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <div className="flex items-center gap-1.5"><Truck size={12} /> In-Transit</div>
                                <span className="text-white">3,100 units</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1 mt-1">
                                <div className="flex items-center gap-1.5"><Factory size={12} /> Planned Prod</div>
                                <span className="text-blue-400">1,150 units</span>
                            </div>
                        </div>

                        {week.risk === 'high' && (
                            <div className="mt-2 text-[10px] bg-red-500/10 border border-red-500/20 text-red-300 p-1.5 rounded flex items-start gap-1.5">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                <span>Capacity breach detected. Requires 1500 unit offload or expedite.</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
