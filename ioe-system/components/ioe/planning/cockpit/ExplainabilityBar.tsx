import React from "react";
import { Brain, Sparkles, AlertCircle, History, Info } from "lucide-react";

export function ExplainabilityBar() {
    return (
        <div className="flex h-12 items-center justify-between border-b border-white/5 px-6 bg-[#050505]">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Brain className="h-5 w-5 text-purple-400" />
                        <Sparkles className="h-2 w-2 text-white absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-white tracking-wide">AI PLANNER COCKPIT</div>
                        <div className="text-[10px] text-purple-400/80 font-mono">AUTOPILOT: SEMI-ACTIVE</div>
                    </div>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-neutral-400">Context:</span>
                    <span className="text-[10px] text-white">Demand Spike W3 + Inbound Slip (Supplier X)</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 text-[10px] text-neutral-400 hover:text-white transition-colors">
                    <History className="h-3 w-3" />
                    <span>Changes vs Last Run</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 text-[10px] text-neutral-400 hover:text-white transition-colors">
                    <Info className="h-3 w-3" />
                    <span>View Assumptions</span>
                </button>
                <div className="h-4 w-px bg-white/10" />
                <div className="text-[10px] font-mono text-neutral-500">
                    LAST SOLVE: 14s AGO
                </div>
            </div>
        </div>
    );
}
