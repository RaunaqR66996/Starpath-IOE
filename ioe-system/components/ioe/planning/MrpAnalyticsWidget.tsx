'use client';

import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Cell
} from 'recharts';
import { AlertTriangle, TrendingUp, Package, ShoppingCart, ArrowRight } from 'lucide-react';

interface MrpDataPoint {
    itemId: string;
    sku: string;
    name: string;
    stock: number;
    incoming: number;
    demand: number;
    shortage: number;
    suggestion: string;
}

interface MrpAnalyticsWidgetProps {
    data: MrpDataPoint[];
}

export function MrpAnalyticsWidget({ data }: MrpAnalyticsWidgetProps) {
    const [simulatedItems, setSimulatedItems] = useState<Set<string>>(new Set());

    // Transform data for the chart
    const chartData = data.slice(0, 10).map(item => {
        const isSimulated = simulatedItems.has(item.itemId);
        // If simulated, we add the shortage as "Incoming"
        const effectiveIncoming = isSimulated ? item.incoming + item.shortage : item.incoming;
        const coverage = item.demand > 0 ? ((item.stock + effectiveIncoming) / item.demand) * 100 : 100;

        return {
            name: item.sku,
            Inventory: item.stock,
            Incoming: effectiveIncoming,
            Demand: item.demand,
            Shortage: item.shortage,
            Coverage: coverage,
            isSimulated,
            fullItem: item
        };
    });

    const handleSimulatePO = (itemId: string) => {
        const newSet = new Set(simulatedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSimulatedItems(newSet);
    };

    if (!data || data.length === 0) {
        return (
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 text-sm italic flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" />
                    <span>No production shortages detected. All systems nominal.</span>
                </div>
            </div>
        );
    }

    const criticalCount = data.filter(i => i.shortage > 0).length;

    return (
        <div className="w-full bg-black/40 border border-neutral-800 rounded-xl overflow-hidden mt-2 mb-4 backdrop-blur-sm shadow-xl">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white tracking-tight">Production Health Monitor</span>
                        {criticalCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 animate-pulse">
                                {criticalCount} CRITICAL
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                        <span>AI Analysis Horizon: 14 Days</span>
                        <span className="w-1 h-1 rounded-full bg-neutral-600" />
                        <span>Confidence: 98%</span>
                    </div>
                </div>
                <div className="p-1.5 bg-neutral-800 rounded-lg">
                    <TrendingUp className="text-emerald-400" size={14} />
                </div>
            </div>

            {/* Chart Area */}
            <div className="p-4 h-64 w-full bg-gradient-to-b from-neutral-900/50 to-transparent">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                        barSize={32}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#737373', fontSize: 10, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fill: '#737373', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-neutral-900 border border-neutral-700 p-2.5 rounded shadow-2xl">
                                            <p className="text-xs font-bold text-white mb-2">{d.fullItem.name}</p>
                                            <div className="space-y-1 text-[11px]">
                                                <div className="flex justify-between gap-4 text-emerald-400"><span>On Hand:</span> <span>{d.Inventory}</span></div>
                                                <div className="flex justify-between gap-4 text-blue-400"><span>Inbound:</span> <span>{d.Incoming}</span></div>
                                                <div className="flex justify-between gap-4 text-red-400 font-medium border-t border-neutral-800 pt-1 mt-1"><span>Demand:</span> <span>{d.Demand}</span></div>
                                                {d.Shortage > 0 && <div className="text-red-500 font-bold mt-1">Shortage: -{d.Shortage}</div>}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '15px', color: '#a3a3a3' }} />

                        {/* Supply Stack */}
                        <Bar dataKey="Inventory" stackId="supply" fill="#059669" radius={[0, 0, 4, 4]} name="Stock" animationDuration={1000} />
                        <Bar
                            dataKey="Incoming"
                            stackId="supply"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            name="Inbound"
                            animationDuration={1500}
                        >
                            {
                                chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.isSimulated ? '#8b5cf6' : '#3b82f6'} stroke={entry.isSimulated ? '#fff' : 'none'} strokeWidth={1} />
                                ))
                            }
                        </Bar>

                        {/* Demand Line - Rendered as a Bar for comparison but transparent with border */}
                        <Bar dataKey="Demand" fill="transparent" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" radius={[4, 4, 0, 0]} name="Demand" />

                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Action List */}
            <div className="bg-neutral-900 border-t border-neutral-800 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-2">
                    {data.slice(0, 5).map((item, idx) => {
                        const isSimulated = simulatedItems.has(item.itemId);
                        const severity = item.shortage > 0 ? (item.shortage / item.demand > 0.5 ? 'critical' : 'warning') : 'ok';

                        return (
                            <div key={idx} className="group flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-md ${severity === 'critical' ? 'bg-red-500/10 text-red-500' : severity === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {severity !== 'ok' ? <AlertTriangle size={14} /> : <Package size={14} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-neutral-200">{item.name}</span>
                                            <span className="text-[10px] text-neutral-600 bg-neutral-900 px-1 rounded">{item.sku}</span>
                                        </div>
                                        <div className="text-[10px] text-neutral-500 mt-0.5">
                                            {severity === 'ok' ? (
                                                <span className="text-emerald-600">Healthy coverage</span>
                                            ) : (
                                                <span className={severity === 'critical' ? 'text-red-400' : 'text-amber-400'}>
                                                    Short by {item.shortage} units
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {item.shortage > 0 && (
                                    <button
                                        onClick={() => handleSimulatePO(item.itemId)}
                                        className={`px-3 py-1.5 rounded text-[10px] font-medium flex items-center gap-1.5 transition-all ${isSimulated
                                            ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_10px_rgba(147,51,234,0.3)]'
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                            }`}
                                    >
                                        {isSimulated ? (
                                            <>
                                                <span>Planned</span>
                                                <CheckCircle size={10} />
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={10} />
                                                <span>Draft PO</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                {data.filter(i => i.shortage > 0).length > 0 && (
                    <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-[10px]">
                        <span className="text-neutral-500">
                            {simulatedItems.size} orders staged for review
                        </span>
                        <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline">
                            Open Workbench <ArrowRight size={10} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Icon helper
function CheckCircle({ className, size = 14 }: { className?: string, size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    )
}
