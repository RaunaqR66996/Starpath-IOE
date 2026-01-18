
import React, { useState } from 'react';
import {
    Calendar, LayoutGrid, BarChart3, ChevronLeft, ChevronRight,
    MoreHorizontal, Filter, Download, Plus, Settings, Play, Database
} from 'lucide-react';

// Mock Data removed
const WORK_CENTERS: any[] = [];
const MOCK_ORDERS: any[] = [];

import { importProductionPlan } from "@/app/actions/excel-import";
import { useRef } from "react";
import { toast } from "sonner";

export function MasterScheduler() {
    const [viewMode, setViewMode] = useState<'GANTT' | 'GRID' | 'LOAD'>('GANTT');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        toast.promise(importProductionPlan(formData), {
            loading: 'Importing Plan from Excel...',
            success: (data) => data.success ? data.message : 'Import Failed',
            error: 'Failed to upload file'
        });

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0D12] text-slate-200">
            {/* Header / Toolbar */}
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#0F1116]">
                <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={16} className="text-purple-400" />
                        Master Production Schedule
                    </div>
                    <div className="h-4 w-px bg-slate-700" />
                    <div className="flex bg-slate-900 rounded p-1 gap-1">
                        <button
                            onClick={() => setViewMode('GANTT')}
                            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-2 transition-colors ${viewMode === 'GANTT' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Calendar size={12} /> Gantt
                        </button>
                        <button
                            onClick={() => setViewMode('GRID')}
                            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-2 transition-colors ${viewMode === 'GRID' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <LayoutGrid size={12} /> Excel Grid
                        </button>
                        <button
                            onClick={() => setViewMode('LOAD')}
                            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-2 transition-colors ${viewMode === 'LOAD' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            <BarChart3 size={12} /> Load Graph
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".xlsx,.csv"
                    />
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors">
                        <Filter size={12} /> Filter
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors"
                    >
                        <Database size={12} /> Import Excel
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors">
                        <Play size={12} fill="currentColor" /> Release Firm
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'GANTT' && <GanttView />}
                {viewMode === 'GRID' && <ExcelGridView />}
                {viewMode === 'LOAD' && <LoadGraphView />}
            </div>

            {/* Footer Status */}
            <div className="h-8 border-t border-slate-800 bg-[#0F1116] flex items-center justify-between px-4 text-[10px] text-slate-500">
                <div className="flex gap-4">
                    <span>Horizon: <b>4 Weeks</b></span>
                    <span>Frozen Period: <b>3 Days</b></span>
                    <span>Total Orders: <b>142</b></span>
                </div>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> System Healthy</span>
                </div>
            </div>
        </div>
    );
}

function GanttView() {
    return (
        <div className="absolute inset-0 overflow-auto p-4">
            {/* Timeline Header */}
            <div className="flex ml-48 border-b border-slate-800 mb-2">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="flex-1 min-w-[80px] text-center border-l border-slate-800/50 text-[10px] text-slate-500 py-1">
                        Jan {20 + i}
                    </div>
                ))}
            </div>

            {/* Rows */}
            <div className="space-y-4">
                {WORK_CENTERS.map(wc => (
                    <div key={wc.id} className="flex group">
                        {/* Resource Header */}
                        <div className="w-48 shrink-0 pr-4">
                            <div className="font-medium text-xs text-slate-300">{wc.name}</div>
                            <div className="text-[10px] text-slate-600">{wc.type} • {wc.id}</div>
                        </div>

                        {/* Timeline Lane */}
                        <div className="flex-1 relative h-10 bg-slate-900/30 border border-slate-800/50 rounded flex items-center px-1">
                            {/* Mock Blocks */}
                            <div className="absolute left-[10%] w-[120px] h-7 bg-blue-600/20 border border-blue-500/50 rounded text-[10px] text-blue-300 flex items-center justify-center cursor-move hover:bg-blue-600/30 transition-colors">
                                Job #10292
                            </div>
                            <div className="absolute left-[35%] w-[80px] h-7 bg-purple-600/20 border border-purple-500/50 rounded text-[10px] text-purple-300 flex items-center justify-center cursor-move hover:bg-purple-600/30 transition-colors">
                                Maint.
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ExcelGridView() {
    return (
        <div className="absolute inset-0 overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        {['Order #', 'Item', 'Qty', 'Status', 'Start Date', 'End Date', 'Work Center', 'Priority'].map(h => (
                            <th key={h} className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-800 border-r border-slate-800/50">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs">
                    {MOCK_ORDERS.map((order, i) => (
                        <tr key={order.id} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="px-4 py-2 font-mono text-purple-400">{order.id}</td>
                            <td className="px-4 py-2 text-slate-300">{order.item}</td>
                            <td className="px-4 py-0">
                                <input className="bg-transparent border border-transparent hover:border-slate-700 focus:border-blue-500 rounded px-1 py-1 w-20 text-right outline-none transition-colors" defaultValue={order.qty} />
                            </td>
                            <td className="px-4 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${order.status === 'Released' ? 'bg-emerald-500/10 text-emerald-400' :
                                    order.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                                        'bg-slate-700 text-slate-400'
                                    }`}>{order.status}</span>
                            </td>
                            <td className="px-4 py-2 text-slate-400">{order.start}</td>
                            <td className="px-4 py-2 text-slate-400">{order.end}</td>
                            <td className="px-4 py-2 text-slate-400">WC-0{(i % 3) + 1}</td>
                            <td className="px-4 py-2 text-slate-400">Normal</td>
                        </tr>
                    ))}
                    {/* Empty Rows for "Excel Feel" */}
                    {Array.from({ length: 15 }).map((_, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 h-8">
                            <td className="border-r border-slate-800/50"></td>
                            <td className="border-r border-slate-800/50"></td>
                            <td className="border-r border-slate-800/50"></td>
                            <td className="border-r border-slate-800/50"></td>
                            <td className="border-r border-slate-800/50"></td>
                            <td className="border-r border-slate-800/50"></td>
                            <td className="border-r border-slate-800/50"></td>
                            <td className="border-r border-slate-800/50"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}


function LoadGraphView() {
    return (
        <div className="p-8 h-full flex items-center justify-center text-slate-500 flex-col gap-4">
            <div className="w-full max-w-4xl h-64 flex items-end justify-between gap-4 px-4 border-b border-l border-slate-700">
                {/* Mock Bars */}
                {/* No Data */}
                {[].map((h, i) => (
                    <div key={i} className="w-full bg-slate-800 relative group">
                        <div
                            style={{ height: `${h}%` }}
                            className="w-full absolute bottom-0 transition-all duration-500 bg-blue-600"
                        />
                        <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px]">D{i + 1}</div>
                    </div>
                ))}
            </div>
            <p>Capacity Utilization (10-Day Horizon)</p>
        </div>
    )
}
