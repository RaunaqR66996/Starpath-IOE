'use client';

import React from 'react';
import {
    Check, ArrowRight, Zap, Target, Box,
    Database, Activity, ShieldAlert, FileText,
    ChevronRight, Save
} from 'lucide-react';

interface Step {
    id: number;
    name: string;
    description: string;
    icon: any;
    status: 'pending' | 'active' | 'completed';
}

const STEPS: Step[] = [
    { id: 1, name: 'Demand Signal', description: 'Consolidate Sales & Forecasts', icon: Target, status: 'completed' },
    { id: 2, name: 'MPS Netting', description: 'Master Production Schedule', icon: Activity, status: 'completed' },
    { id: 3, name: 'BOM Explosion', description: 'Recursive Multilevel Breakdown', icon: Zap, status: 'completed' },
    { id: 4, name: 'Inventory Net', description: 'Material Availability Check', icon: Box, status: 'completed' },
    { id: 5, name: 'Plan Order', description: 'Generate Purchase/Production', icon: Save, status: 'active' },
    { id: 6, name: 'RCCP Check', description: 'Rough Cut Capacity Planning', icon: Database, status: 'pending' },
    { id: 7, name: 'Exception Scan', description: 'Identify Bottlenecks', icon: ShieldAlert, status: 'pending' },
    { id: 8, name: 'Finite Schedule', description: 'Resource Constraint Check', icon: Activity, status: 'pending' },
    { id: 9, name: 'Human Review', description: 'Planner Conflict Resolution', icon: FileText, status: 'pending' },
    { id: 10, name: 'Execution Push', description: 'ERP Record Finalization', icon: Check, status: 'pending' },
];

export function PlanningWizard({ currentStep = 5 }) {
    return (
        <div className="w-full bg-[#1A1D24] border border-white/5 rounded-md p-4 mb-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center min-w-[1000px] justify-between px-2">
                {STEPS.map((step, idx) => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;
                    const Icon = step.icon;

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center gap-2 group cursor-pointer">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                                    ${isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                        isActive ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' :
                                            'bg-black/40 text-neutral-600 border border-white/5'}
                                `}>
                                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-500/80' : 'text-neutral-500'}`}>
                                        Step {step.id}
                                    </span>
                                    <span className={`text-[11px] whitespace-nowrap font-medium ${isActive ? 'text-neutral-100' : 'text-neutral-400 opacity-60'}`}>
                                        {step.name}
                                    </span>
                                </div>
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className="flex-1 px-2 mb-6">
                                    <div className={`h-[1px] w-full ${isCompleted ? 'bg-emerald-500/30' : 'bg-white/5'}`}></div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
