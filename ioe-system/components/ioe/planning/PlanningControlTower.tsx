'use client';

import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, LineChart, Line, ComposedChart
} from 'recharts';
import {
    AlertTriangle, CheckCircle, TrendingUp, Package,
    ArrowRight, RefreshCw, Calendar, Filter, Download, Shield, Zap,
    Activity, Target, ShieldCheck
} from 'lucide-react';
import { runSanityCheckAction } from '@/app/actions/planning-actions';
import { SanityReport } from '@/lib/planning/sanity-service';
import { PlanningWizard } from './PlanningWizard';
import { PlanningExceptionList } from './PlanningExceptionList';

interface MrpResult {
    itemId: string;
    sku: string;
    name: string;
    stock: number;
    incoming: number;
    demand: number;
    shortage: number;
    cost: number;
    suggestion: string;
    dependentDemand?: number;
    lifecycleStatus?: string;
}

export function PlanningControlTower() {
    const [data, setData] = useState<MrpResult[]>([]);
    const [runId, setRunId] = useState<string | null>(null);
    const [runState, setRunState] = useState<any>(null);
    const [sanityReport, setSanityReport] = useState<SanityReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState<'SHORTAGES' | 'ALL'>('SHORTAGES');
    const [viewMode, setViewMode] = useState<'EXCEPTIONS' | 'SANITY'>('EXCEPTIONS');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mrpRes, sanityRes] = await Promise.all([
                fetch('/api/planning/mrp').then(r => r.json()),
                runSanityCheckAction()
            ]);

            if (mrpRes.results) {
                setData(mrpRes.results);
                setRunId(mrpRes.runId);
                setRunState(mrpRes.runState);
            }
            if (sanityRes.success) {
                setSanityReport(sanityRes.data || null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const criticalItems = data.filter(i => i.shortage > 0);
    const totalInventoryValue = data.reduce((acc, i) => acc + (i.stock * (i.cost || 0)), 0);
    const shortageValue = criticalItems.reduce((acc, i) => acc + (i.shortage * (i.cost || 0)), 0);

    return (
        <div className="h-full w-full bg-[#0F1116] text-neutral-300 flex flex-col overflow-hidden">
            {/* IOE Header */}
            <div className="h-12 shrink-0 border-b border-white/5 flex items-center justify-between px-4 bg-[#0F1116]/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <Zap size={16} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-neutral-100 tracking-tight">Planner's Cockpit</h1>
                        <p className="text-[10px] text-neutral-500 font-mono uppercase">System: IOE-PLAN-CORE-V1</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Engine Active</span>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-all shadow-lg active:scale-95 shadow-blue-600/20"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        Run Re-calculation
                    </button>
                </div>
            </div>

            {/* Main Operational Surface */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.05),transparent_50%)]">

                {/* 10-Step Deterministic Pipeline Visualizer */}
                <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3 ml-1">Deterministic Planning Pipeline</h2>
                <PlanningWizard currentStep={runState?.status === 'COMPLETED' ? 10 : 5} />

                {/* Top KPI Cluster */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                    <KpiCard
                        title="Material Shortage"
                        value={`$${(shortageValue / 1000).toFixed(1)}k`}
                        trend={`${criticalItems.length} Skus at risk`}
                        trendColor="text-red-400"
                        icon={<AlertTriangle className="text-red-500" size={16} />}
                        accent="border-l-red-500"
                    />
                    <KpiCard
                        title="Inventory Asset"
                        value={`$${(totalInventoryValue / 1000).toFixed(1)}k`}
                        trend="Live Valuation"
                        trendColor="text-neutral-500"
                        icon={<TrendingUp className="text-emerald-500" size={16} />}
                        accent="border-l-emerald-500"
                    />
                    <KpiCard
                        title="Capacity Load"
                        value="84%"
                        trend="2 Bottlenecks detected"
                        trendColor="text-amber-400"
                        icon={<Activity className="text-amber-500" size={16} />}
                        accent="border-l-amber-500"
                    />
                    <KpiCard
                        title="Plan Efficiency"
                        value="92.4%"
                        trend="Target: 95%"
                        trendColor="text-blue-400"
                        icon={<Target className="text-blue-500" size={16} />}
                        accent="border-l-blue-500"
                    />
                </div>

                <div className="grid grid-cols-12 gap-4 h-[500px]">
                    {/* Resolution Center (Exceptions) */}
                    <div className="col-span-4 bg-[#1A1D24]/80 backdrop-blur-sm border border-white/5 rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-2">
                                <Shield className="text-blue-400" size={16} />
                                <h3 className="font-bold text-xs text-neutral-200 uppercase tracking-wider">Resolution Center</h3>
                            </div>
                            <div className="flex bg-black/30 rounded-lg p-1 border border-white/5">
                                <button
                                    onClick={() => setViewMode('EXCEPTIONS')}
                                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${viewMode === 'EXCEPTIONS' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    Exceptions
                                </button>
                                <button
                                    onClick={() => setViewMode('SANITY')}
                                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${viewMode === 'SANITY' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    Sanity
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {viewMode === 'EXCEPTIONS' ? (
                                <PlanningExceptionList exceptions={runState?.exceptions || []} />
                            ) : (
                                <SanityHealthView report={sanityReport} />
                            )}
                        </div>
                    </div>

                    {/* Simulation Engine (Charts) */}
                    <div className="col-span-8 bg-[#1A1D24]/80 backdrop-blur-sm border border-white/5 rounded-xl p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-sm text-neutral-100 uppercase tracking-wider">Net Requirement Simulation</h3>
                                <p className="text-[10px] text-neutral-500">Visualizing Stock Evolution vs Demand Signals</p>
                            </div>
                            <div className="flex bg-black/40 rounded-full p-1 border border-white/5 shadow-inner">
                                <button
                                    onClick={() => setSelectedView('SHORTAGES')}
                                    className={`px-6 py-1.5 rounded-full text-[11px] font-bold transition-all ${selectedView === 'SHORTAGES' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    Risks
                                </button>
                                <button
                                    onClick={() => setSelectedView('ALL')}
                                    className={`px-6 py-1.5 rounded-full text-[11px] font-bold transition-all ${selectedView === 'ALL' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                                >
                                    Fleet View
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={selectedView === 'SHORTAGES' ? criticalItems : data}>
                                    <defs>
                                        <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#262626" vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="sku"
                                        tick={{ fill: '#737373', fontSize: 10, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#737373', fontSize: 10, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ color: '#94a3b8' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px', fontWeight: 600, textTransform: 'uppercase' }} />
                                    <Bar
                                        dataKey="stock"
                                        name="Available Inventory"
                                        fill="#3b82f6"
                                        barSize={40}
                                        radius={[4, 4, 0, 0]}
                                        className="shadow-2xl"
                                    />
                                    <Line
                                        type="step"
                                        dataKey="demand"
                                        name="Projected Demand"
                                        stroke="#f43f5e"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#1A1D24' }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Expanded Inventory Grid */}
                <div className="mt-4 bg-[#1A1D24]/80 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                        <h3 className="font-bold text-xs text-neutral-300 uppercase tracking-widest">Detail Supply Chain Analysis</h3>
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                        <table className="w-full text-left text-xs text-neutral-400 border-collapse">
                            <thead className="bg-[#1e293b]/50 text-neutral-500 font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 border-b border-white/5">SKU / Item</th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right font-mono">Stock</th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right font-mono">Inbound</th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right font-mono text-purple-400">Dependent</th>
                                    <th className="px-6 py-4 border-b border-white/5 text-right font-mono text-red-500">Shortage</th>
                                    <th className="px-6 py-4 border-b border-white/5">Lifecycle</th>
                                    <th className="px-6 py-4 border-b border-white/5">Suggested Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.map((item, i) => (
                                    <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-neutral-200">{item.sku}</div>
                                            <div className="text-[10px] text-neutral-500 truncate max-w-[200px]">{item.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-neutral-300">{item.stock}</td>
                                        <td className="px-6 py-4 text-right font-mono text-blue-400">{item.incoming}</td>
                                        <td className="px-6 py-4 text-right font-mono text-purple-400/80">{item.dependentDemand || 0}</td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold ${item.shortage > 0 ? 'text-red-500' : 'text-neutral-600'}`}>
                                            {item.shortage || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.lifecycleStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                                                item.lifecycleStatus === 'PHASE_OUT' ? 'bg-amber-500/10 text-amber-400' :
                                                    item.lifecycleStatus === 'DESIGN' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-neutral-500/10 text-neutral-400'
                                                }`}>
                                                {item.lifecycleStatus || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.shortage > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold text-[9px] uppercase tracking-tighter">
                                                        {item.suggestion}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-emerald-500/40 font-bold text-[9px] uppercase">Balanced</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, trend, trendColor, icon, accent }: any) {
    return (
        <div className={`bg-[#1A1D24]/80 backdrop-blur-sm border border-white/5 border-l-4 ${accent} p-4 rounded-xl flex flex-col justify-between h-24 hover:bg-[#1A1D24] transition-all group cursor-default shadow-lg`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">{title}</span>
                <div className="bg-black/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-xl font-bold text-neutral-100 tracking-tight">{value}</div>
                <div className={`text-[10px] font-bold ${trendColor} uppercase tracking-tighter mt-0.5`}>
                    {trend}
                </div>
            </div>
        </div>
    );
}

function SanityHealthView({ report }: { report: SanityReport | null }) {
    if (!report) return <div className="text-center py-10 text-neutral-600 text-[10px] animate-pulse uppercase tracking-widest font-bold">Scanning System...</div>;

    return (
        <div className="space-y-3">
            <div className="mb-4 p-3 rounded-lg bg-[#0F1116] border border-white/5 flex items-center justify-between">
                <div>
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block mb-0.5 tracking-widest">Global Integrity</span>
                    <span className={`text-xs font-bold ${report.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'}`}>
                        DATABASE {report.status === 'PASS' ? '100% HEALTHY' : 'NEEDS ATTENTION'}
                    </span>
                </div>
                <div className={`p-2 rounded-full ${report.status === 'PASS' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    <ShieldCheck size={16} className={report.status === 'PASS' ? 'text-emerald-500' : 'text-red-500'} />
                </div>
            </div>
            {report.issues.map((issue, idx) => (
                <div key={idx} className="bg-black/20 p-3 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className={issue.severity === 'FAIL' ? 'text-red-500' : 'text-amber-500'} />
                        <span className="text-[10px] font-bold text-neutral-300 uppercase">{issue.entityType} Alert</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mb-2 leading-relaxed">{issue.message}</p>
                    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded text-[10px] text-emerald-400 font-bold border border-emerald-500/10">
                        <ArrowRight size={10} /> FIX: {issue.fix}
                    </div>
                </div>
            ))}
        </div>
    );
}

