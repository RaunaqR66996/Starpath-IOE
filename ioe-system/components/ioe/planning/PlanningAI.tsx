import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Zap, Search, Activity, Box, Calendar, GitMerge } from "lucide-react";
import { validateDemand, checkMaterials, checkCapacity, generateSchedule, optimizeRouting } from "@/app/actions/planning-actions";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { ControlTowerWidget } from "./ControlTowerWidget";

interface PlanningAIProps {
    activeTab: string | null;
    className?: string;
}

export function PlanningAI({ activeTab, className }: PlanningAIProps) {
    const { openTab } = useWorkspaceStore();
    const [planningState, setPlanningState] = useState<'IDLE' | 'DEMAND' | 'CAPACITY' | 'MATERIALS' | 'ROUTING' | 'SCHEDULE' | 'DONE'>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);

    async function runAutoPlan() {
        setPlanningState('DEMAND');
        setLogs(["Starting B2B Auto-Plan Engine..."]);

        // 1. Demand (Forecasting)
        const dRes = await validateDemand();
        setLogs(prev => [...prev, `[DEMAND] ${dRes.message}: ${dRes.stats?.trend}`]);
        setPlanningState('CAPACITY');

        // 2. Capacity (Resource Assessment) - Swapped per B2B Best Practice
        const cRes = await checkCapacity();
        setLogs(prev => [...prev, `[CAPACITY] ${cRes.message}`]);
        setLogs(prev => [...prev, `[FIX] ${cRes.details}`]);
        setPlanningState('MATERIALS');

        // 3. Materials (MRP)
        const mRes = await checkMaterials();
        setLogs(prev => [...prev, `[MRP] ${mRes.message}`]);
        if (mRes.warning) setLogs(prev => [...prev, `[WARN] ${mRes.warning}`]);
        setPlanningState('ROUTING');

        // 4. Routing (Process Design) - NEW
        const rRes = await optimizeRouting();
        setLogs(prev => [...prev, `[ROUTING] ${rRes.message}`]);
        setLogs(prev => [...prev, `[CFG] ${rRes.details}`]);
        setPlanningState('SCHEDULE');

        // 5. Schedule (Sequencing)
        const sRes = await generateSchedule();
        setLogs(prev => [...prev, `[SUCCESS] Plan ${sRes.planId} Created.`]);
        setPlanningState('DONE');
    }

    return (
        <div className={`flex flex-col bg-[var(--bg-editor)] text-xs text-[var(--text-primary)] ${className || 'h-full'}`}>
            {/* Solver Interface (Active Mode) */}
            {planningState !== 'IDLE' && planningState !== 'DONE' && (
                <div className="p-4 bg-[var(--bg-panel-header)] border-b border-[var(--border-color)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                            <Zap size={14} className="text-purple-400 animate-pulse" />
                            Auto-Plan Engine
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                            RUNNING...
                        </div>
                    </div>

                    {/* Stage Indicators */}
                    <div className="flex justify-between items-center px-1">
                        {[
                            { id: 'DEMAND', icon: Search, label: 'Demand' },
                            { id: 'CAPACITY', icon: Activity, label: 'Capacity' },
                            { id: 'MATERIALS', icon: Box, label: 'MRP' },
                            { id: 'ROUTING', icon: GitMerge, label: 'Routing' },
                            { id: 'SCHEDULE', icon: Calendar, label: 'Schedule' }
                        ].map((s, i) => {
                            const stages = ['DEMAND', 'CAPACITY', 'MATERIALS', 'ROUTING', 'SCHEDULE', 'DONE'];
                            const isDone = stages.indexOf(planningState) > stages.indexOf(s.id);
                            const isActive = planningState === s.id;
                            const color = isDone ? 'text-emerald-500' : isActive ? 'text-blue-400 animate-bounce' : 'text-slate-600';

                            return (
                                <div key={s.id} className="flex flex-col items-center gap-1">
                                    <s.icon size={12} className={color} />
                                    <span className={`text-[9px] ${isActive ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>{s.label}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Console Logs */}
                    <div className="h-24 overflow-y-auto bg-black/40 rounded p-2 font-mono text-[10px] space-y-1 border border-slate-800">
                        {logs.map((log, i) => (
                            <div key={i} className="text-emerald-500/80 border-l-2 border-emerald-500/20 pl-1">
                                {'>'} {log}
                            </div>
                        ))}
                        <div className="animate-pulse text-blue-500">_</div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Actions */}
                <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Quick Actions</div>
                    <button
                        onClick={runAutoPlan}
                        disabled={planningState !== 'IDLE' && planningState !== 'DONE'}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded py-2 text-xs font-medium flex items-center justify-center gap-2 relative overflow-hidden group transition-all"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Zap size={14} fill="currentColor" />
                        {planningState === 'IDLE' || planningState === 'DONE' ? 'Run Auto-Plan' : 'Optimizing...'}
                    </button>
                </div>

                {/* Plan Summary */}
                <div className="space-y-2">
                    {planningState === 'DONE' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <ControlTowerWidget />
                        </div>
                    ) : (
                        <>
                            <div className="text-[10px] font-bold uppercase text-slate-500">Current Plan Status</div>
                            <div className="text-[11px] text-slate-500 italic px-1">
                                Run auto-plan to generate metrics.
                            </div>
                        </>
                    )}
                </div>

                {/* Detected Issues */}
                <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Detected Constraints</div>
                    {planningState === 'DONE' ? (
                        <div className="flex items-center gap-2 p-2 bg-emerald-900/10 rounded border border-emerald-900/30 text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span className="text-xs">Plan optimized. No critical violations found.</span>
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-500 italic px-1">
                            Run auto-plan to detect constraints.
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}

function ArrowRightIcon() {
    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
}

function DownloadIcon() {
    return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
}
