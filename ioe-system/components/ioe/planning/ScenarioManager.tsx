import React, { useState } from 'react';
import {
    GitBranch, GitCommit, Play, RefreshCw,
    AlertTriangle, Check, X, ArrowRight,
    TrendingUp, BarChart3, History
} from 'lucide-react';

import { cn } from "@/lib/utils";

interface Scenario {
    id: string;
    name: string;
    description: string;
    status: 'DRAFT' | 'SIMULATING' | 'COMPLETED';
    changes: {
        type: 'CAPACITY' | 'DEMAND' | 'DEMAND_SPIKE' | 'MACHINE_DOWN';
        description: string;
    }[];
    impact?: {
        serviceLevelDelta: number;
        costDelta: number;
        utilizationDelta: number;
    };
}

export function ScenarioManager() {
    const [scenarios, setScenarios] = useState<Scenario[]>([
        {
            id: 'SC-001',
            name: 'Machine 1 Breakdown',
            description: 'Simulate 48h downtime on WC-01',
            status: 'COMPLETED',
            changes: [
                { type: 'MACHINE_DOWN', description: 'WC-01 Capacity = 0 (48h)' }
            ],
            impact: {
                serviceLevelDelta: -4.2,
                costDelta: 12500,
                utilizationDelta: 8.5
            }
        },
        {
            id: 'SC-002',
            name: 'Rush Order: Tesla',
            description: 'Insert high priority order for 5k units',
            status: 'DRAFT',
            changes: [
                { type: 'DEMAND_SPIKE', description: 'Add 5,000 unit demand for Item A' }
            ]
        }
    ]);

    const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

    const handleRunSimulation = (id: string) => {
        setScenarios(prev => prev.map(s =>
            s.id === id ? { ...s, status: 'SIMULATING' } : s
        ));

        // Mock simulation delay
        setTimeout(() => {
            setScenarios(prev => prev.map(s =>
                s.id === id ? {
                    ...s,
                    status: 'COMPLETED',
                    impact: {
                        serviceLevelDelta: (Math.random() * 5) - 2,
                        costDelta: Math.floor(Math.random() * 50000),
                        utilizationDelta: (Math.random() * 10) - 5
                    }
                } : s
            ));
        }, 2000);
    };

    return (
        <div className="h-full flex flex-col bg-[#0F1116] text-slate-300 p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <GitBranch className="text-purple-500" />
                        Scenario Manager
                    </h2>
                    <p className="text-slate-500">Run "What-If" simulations to analyze plan resilience.</p>
                </div>
                <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-medium flex items-center gap-2">
                    <History size={16} /> New Scenario
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scenario List */}
                <div className="space-y-4">
                    {scenarios.map(scenario => (
                        <div
                            key={scenario.id}
                            className={cn(
                                "border rounded-lg p-4 transition-all cursor-pointer",
                                activeScenarioId === scenario.id
                                    ? "bg-slate-800 border-purple-500 shadow-lg shadow-purple-900/20"
                                    : "bg-slate-900 border-slate-700 hover:bg-slate-800"
                            )}
                            onClick={() => setActiveScenarioId(scenario.id)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-8 w-8 rounded flex items-center justify-center",
                                        scenario.status === 'COMPLETED' ? "bg-emerald-900/30 text-emerald-400" :
                                            scenario.status === 'SIMULATING' ? "bg-blue-900/30 text-blue-400 animate-pulse" :
                                                "bg-slate-800 text-slate-400"
                                    )}>
                                        <GitCommit size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{scenario.name}</h3>
                                        <p className="text-xs text-slate-500">{scenario.description}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                    scenario.status === 'COMPLETED' ? "bg-emerald-900/20 text-emerald-400" :
                                        scenario.status === 'SIMULATING' ? "bg-blue-900/20 text-blue-400" :
                                            "bg-slate-800 text-slate-500"
                                )}>
                                    {scenario.status}
                                </span>
                            </div>

                            {/* Changes List */}
                            <div className="bg-black/30 rounded p-2 mb-3 space-y-1">
                                {scenario.changes.map((change, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                                        <ArrowRight size={12} className="text-slate-600" />
                                        <span>{change.description}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions / Results */}
                            {scenario.status === 'DRAFT' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRunSimulation(scenario.id); }}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
                                >
                                    <Play size={12} /> Run Simulation
                                </button>
                            )}

                            {scenario.status === 'SIMULATING' && (
                                <div className="w-full py-2 bg-slate-800/50 text-slate-400 text-center text-xs font-mono rounded border border-slate-700 flex items-center justify-center gap-2">
                                    <RefreshCw size={12} className="animate-spin" /> Calculating Impacts...
                                </div>
                            )}

                            {scenario.status === 'COMPLETED' && scenario.impact && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                        <div className="text-[10px] text-slate-500 uppercase">Svc Level</div>
                                        <div className={cn("text-sm font-bold", scenario.impact.serviceLevelDelta >= 0 ? "text-emerald-400" : "text-red-400")}>
                                            {scenario.impact.serviceLevelDelta > 0 ? '+' : ''}{scenario.impact.serviceLevelDelta.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                        <div className="text-[10px] text-slate-500 uppercase">Cost</div>
                                        <div className={cn("text-sm font-bold", scenario.impact.costDelta <= 0 ? "text-emerald-400" : "text-red-400")}>
                                            {scenario.impact.costDelta > 0 ? '+' : ''}${scenario.impact.costDelta.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-center">
                                        <div className="text-[10px] text-slate-500 uppercase">Util %</div>
                                        <div className="text-sm font-bold text-blue-400">
                                            {scenario.impact.utilizationDelta > 0 ? '+' : ''}{scenario.impact.utilizationDelta.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Impact Analysis Details Placeholer */}
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <BarChart3 className="h-16 w-16 text-slate-800 mb-4" />
                    <h3 className="text-xl font-bold text-slate-600 mb-2">Impact Analysis</h3>
                    <p className="text-slate-500 max-w-sm">Select a scenario to view detailed comparative charts (Gantt delta, Inventory usage, etc.).</p>
                </div>
            </div>
        </div>
    );
}
