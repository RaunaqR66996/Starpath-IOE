"use client";

import React, { useEffect, useState } from 'react';
import {
    Activity,
    Globe,
    Truck,
    AlertTriangle,
    TrendingUp,
    ShieldCheck,
    Zap,
    Anchor,
    Box,
    Map as MapIcon
} from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: any;
    color: string;
}

const MetricCard = ({ label, value, trend, trendUp, icon: Icon, color }: MetricCardProps) => (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 flex items-start justify-between relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={48} />
        </div>
        <div>
            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Icon size={10} className={color.replace('text-', '')} />
                {label}
            </div>
            <div className="text-xl font-bold text-slate-200 tracking-tight">{value}</div>
            {trend && (
                <div className={`text-[10px] flex items-center gap-1 mt-1 ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {trendUp ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                    {trend}
                </div>
            )}
        </div>
    </div>
);

export function ControlTowerWidget() {
    const [currentTime, setCurrentTime] = useState<string>('');
    const [isLive, setIsLive] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full bg-[var(--bg-editor)] border-b border-[var(--border-color)] p-4 space-y-4">

            {/* Header / Status Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`h-2.5 w-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                        <div className={`absolute inset-0 rounded-full ${isLive ? 'bg-emerald-500/50 animate-ping' : ''}`} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200 leading-none">Global Logistics Control</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">IOE-NET / ACTIVE / {currentTime} UTC</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-1 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded flex items-center gap-1">
                        <Globe size={10} /> NETWORK ONLINE
                    </span>
                    <span className="px-2 py-1 bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 rounded flex items-center gap-1">
                        <ShieldCheck size={10} /> SECURE
                    </span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-3">
                <MetricCard
                    label="Active Shipments"
                    value="1,284"
                    trend="+4.2%"
                    trendUp={true}
                    icon={Truck}
                    color="text-blue-500"
                />
                <MetricCard
                    label="On-Time Delivery"
                    value="98.2%"
                    trend="+0.8%"
                    trendUp={true}
                    icon={Activity}
                    color="text-emerald-500"
                />
                <MetricCard
                    label="Pipeline Value"
                    value="$4.2M"
                    trend="+12%"
                    trendUp={true}
                    icon={Zap}
                    color="text-amber-500"
                />
                <MetricCard
                    label="Network Risk"
                    value="LOW"
                    trend="-2 Risks"
                    trendUp={false}
                    icon={AlertTriangle}
                    color="text-purple-500"
                />
            </div>

            {/* Map / Visualization Placeholder (Visual Control) */}
            <div className="h-32 bg-slate-900/50 rounded-lg border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center group">
                {/* Simulated Map Background Dots */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>

                {/* Radar Sweep Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -skew-x-12 animate-[shimmer_3s_infinite]" />

                <div className="z-10 text-center">
                    <MapIcon size={32} className="text-slate-600 mx-auto mb-2 opacity-50" />
                    <div className="text-xs font-medium text-slate-400">Live Geo-Spatial Tracking Active</div>
                    <div className="text-[10px] text-slate-600">Monitoring 142 Nodes across 3 Regions</div>
                </div>

                {/* Floating "Live" Markers */}
                <div className="absolute top-4 left-1/4 h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
                <div className="absolute bottom-6 right-1/3 h-1.5 w-1.5 bg-amber-500 rounded-full animate-ping [animation-delay:0.5s]" />
                <div className="absolute top-8 right-8 h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping [animation-delay:1.2s]" />
            </div>

            {/* Recent Alerts Ticker */}
            <div className="flex items-center gap-3 bg-slate-900/80 rounded border border-slate-800 px-3 py-1.5">
                <span className="text-[10px] font-bold text-rose-400 shrink-0 flex items-center gap-1">
                    <AlertTriangle size={10} /> NOTIFICATIONS
                </span>
                <div className="h-4 w-[1px] bg-slate-800" />
                <div className="overflow-hidden flex-1 relative h-4">
                    <div className="absolute animate-[slideUp_10s_infinite] flex flex-col gap-1 w-full">
                        <span className="text-[10px] text-slate-400 truncate">Shipment #SH-8821 delayed at Customs (Laredo, TX)</span>
                        <span className="text-[10px] text-slate-400 truncate">Inventory Level LOW for SKU: RE-TEST-1</span>
                        <span className="text-[10px] text-slate-400 truncate">New Purchase Order #PO-992 approved by Finance.</span>
                        <span className="text-[10px] text-slate-400 truncate">Weather integrity warning: Midwest Corridor.</span>
                    </div>
                </div>
            </div>

            {/* Ticker Animation Styles */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                @keyframes slideUp {
                    0%, 20% { transform: translateY(0); }
                    25%, 45% { transform: translateY(-25%); }
                    50%, 70% { transform: translateY(-50%); }
                    75%, 95% { transform: translateY(-75%); }
                    100% { transform: translateY(-100%); }
                }
            `}</style>
        </div>
    );
}
