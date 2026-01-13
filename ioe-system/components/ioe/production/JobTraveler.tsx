"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle, Clock, AlertTriangle, User, QrCode } from 'lucide-react';

interface ProductionTask {
    id: string;
    orderNumber: string;
    item: string;
    operation: string;
    qty: number;
    completedQty: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
    duration: string;
    priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
}

const MOCK_TASKS: ProductionTask[] = [
    { id: 'T-101', orderNumber: 'MO-1001', item: 'Widget A', operation: 'CNC Milling', qty: 50, completedQty: 12, status: 'IN_PROGRESS', duration: '00:45:12', priority: 'HIGH' },
    { id: 'T-102', orderNumber: 'MO-1002', item: 'Widget B', operation: 'Assembly', qty: 200, completedQty: 0, status: 'PENDING', duration: '00:00:00', priority: 'NORMAL' },
    { id: 'T-103', orderNumber: 'MO-1004', item: 'Chassis Frame', operation: 'Painting', qty: 10, completedQty: 0, status: 'PENDING', duration: '00:00:00', priority: 'CRITICAL' },
];

export function JobTraveler() {
    const [selectedWc, setSelectedWc] = useState('WC-01: Main Assembly');
    const [tasks, setTasks] = useState(MOCK_TASKS);
    const [activeTask, setActiveTask] = useState<ProductionTask | null>(MOCK_TASKS[0]);

    const handleStart = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'IN_PROGRESS' } : t));
    };

    const handlePause = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'PAUSED' } : t));
    };

    const handleComplete = (id: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t));
    };

    return (
        <div className="h-full flex flex-col bg-[#0F172A] text-white">
            {/* Kiosk Header */}
            <div className="h-20 bg-[#1E293B] border-b border-white/10 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <User className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Operator: John Doe</h1>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Online • Shift 1</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-[#0F172A] px-4 py-2 rounded-lg border border-white/10">
                    <QrCode className="h-6 w-6 text-blue-400" />
                    <select
                        value={selectedWc}
                        onChange={(e) => setSelectedWc(e.target.value)}
                        className="bg-transparent text-lg font-medium outline-none text-slate-200"
                    >
                        <option>WC-01: Main Assembly</option>
                        <option>WC-02: CNC Machine A</option>
                        <option>WC-03: Paint Booth</option>
                    </select>
                </div>

                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-slate-200">14:32:05</div>
                    <div className="text-sm text-slate-500">Tue, Jan 12</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Task List (Left) */}
                <div className="w-1/3 bg-[#0F172A] border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <h2 className="text-slate-400 font-medium uppercase text-xs tracking-wider mb-1">Queue</h2>
                        <div className="text-xl font-bold">{tasks.filter(t => t.status !== 'COMPLETED').length} Jobs Pending</div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                onClick={() => setActiveTask(task)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${activeTask?.id === task.id
                                        ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                        : 'bg-[#1E293B] border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-sm text-slate-400">{task.orderNumber}</span>
                                    {task.priority === 'CRITICAL' && (
                                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">RUSH</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg mb-1">{task.operation}</h3>
                                <div className="text-slate-400 text-sm mb-3">{task.item}</div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className={`h-2 w-2 rounded-full ${task.status === 'IN_PROGRESS' ? 'bg-amber-400 animate-pulse' :
                                                task.status === 'COMPLETED' ? 'bg-green-400' : 'bg-slate-600'
                                            }`} />
                                        <span className="text-slate-300 font-medium">{task.status.replace('_', ' ')}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">Qty: {task.qty}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Task (Right) */}
                <div className="flex-1 bg-[#1E293B] p-8 flex flex-col justify-between">
                    {activeTask ? (
                        <>
                            {/* Header Info */}
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-4xl font-bold text-white mb-2">{activeTask.operation}</h2>
                                        <div className="text-2xl text-blue-400">{activeTask.item}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-6xl font-mono font-bold text-white tracking-widest">{activeTask.duration}</div>
                                        <div className="text-slate-400 mt-2 flex items-center justify-end gap-2">
                                            <Clock className="w-5 h-5" />
                                            Active Time
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Stats */}
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/10">
                                        <div className="text-slate-400 text-sm mb-2">Completion</div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-5xl font-bold text-white">{activeTask.completedQty}</span>
                                            <span className="text-2xl text-slate-500 mb-1">/ {activeTask.qty}</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full mt-4 overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-500"
                                                style={{ width: `${(activeTask.completedQty / activeTask.qty) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-white/10">
                                        <div className="text-slate-400 text-sm mb-2">Instructions</div>
                                        <ul className="text-slate-300 space-y-2 text-lg">
                                            <li className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded border border-slate-500 flex items-center justify-center shrink-0" />
                                                Verify material grade
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded border border-slate-500 flex items-center justify-center shrink-0" />
                                                Check tolerance (+/- 0.1mm)
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded border border-slate-500 flex items-center justify-center shrink-0" />
                                                Log scrap if any
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* BIG BUTTONS */}
                            <div className="grid grid-cols-3 gap-6 h-32">
                                <button
                                    onClick={() => handleStart(activeTask.id)}
                                    disabled={activeTask.status === 'IN_PROGRESS' || activeTask.status === 'COMPLETED'}
                                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-3 text-2xl font-bold shadow-lg transition-all active:scale-95"
                                >
                                    <Play className="w-8 h-8 fill-current" />
                                    START JOB
                                </button>

                                <button
                                    onClick={() => handlePause(activeTask.id)}
                                    disabled={activeTask.status !== 'IN_PROGRESS'}
                                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-3 text-2xl font-bold shadow-lg transition-all active:scale-95"
                                >
                                    <Pause className="w-8 h-8 fill-current" />
                                    PAUSE
                                </button>

                                <button
                                    onClick={() => handleComplete(activeTask.id)}
                                    disabled={activeTask.status === 'COMPLETED'}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-3 text-2xl font-bold shadow-lg transition-all active:scale-95"
                                >
                                    <CheckCircle className="w-8 h-8" />
                                    COMPLETE
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500">
                            <ArrowLeft className="w-16 h-16 mb-4 opacity-50" />
                            <div className="text-2xl font-medium">Select a job from the queue to begin</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ArrowLeft({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
    )
}
