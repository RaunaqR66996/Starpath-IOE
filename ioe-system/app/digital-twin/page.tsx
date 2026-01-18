'use client';

import React, { useEffect, useState } from 'react';
import { ForkliftStream } from '@/components/digital-twin/ForkliftStream';
import { Warehouse3DScene } from '@/components/ioe/inventory/Warehouse3DScene';
import { generateMockLayout, Layout } from '@/lib/warehouse-mock';
import { Button } from '@/components/ui/button';
import { Maximize2, Settings, Zap } from 'lucide-react';

export default function LiveOrchestrationView() {
    const [layout, setLayout] = useState<Layout | null>(null);
    const [fleet, setFleet] = useState<any[]>([]);

    // Initialize Layout & Robots
    useEffect(() => {
        // 1. Generate Static Map
        const mockLayout = generateMockLayout();
        setLayout(mockLayout);

        // 2. No Mock Robots - Waiting for Real Telemetry
        setFleet([]);
    }, []);

    return (
        <div className="w-full h-screen bg-black text-white overflow-hidden flex flex-col">
            {/* Header */}
            <header className="h-14 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-950">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h1 className="font-mono text-sm font-bold tracking-widest text-neutral-200">
                        DIGITAL TWIN <span className="text-emerald-500">///</span> LIVE ORCHESTRATION
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="h-8 text-neutral-400 hover:text-white">
                        <Settings className="w-4 h-4 mr-2" /> CONFIG
                    </Button>
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                        <Zap className="w-3 h-3 mr-2" /> CONNECT ROBOTS
                    </Button>
                </div>
            </header>

            {/* Main Grid Layout */}
            <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">

                {/* Left Panel: 3D Twin (Real Scene) */}
                <section className="col-span-8 bg-neutral-900 relative border-r border-neutral-800 overflow-hidden">
                    {layout ? (
                        <div className="w-full h-full">
                            <Warehouse3DScene
                                layout={layout}
                                fleet={fleet}
                                showLabels={true}
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-500 font-mono text-xs">
                            LOADING SECTOR MAP...
                        </div>
                    )}

                    {/* Overlay Controls */}
                    <div className="absolute bottom-6 left-6 flex gap-2 pointer-events-none">
                        {['RGB', 'DEPTH', 'VOXEL', 'THERMAL'].map(mode => (
                            <button key={mode} className="pointer-events-auto px-3 py-1 bg-black/50 backdrop-blur border border-neutral-700 text-[10px] font-mono hover:bg-emerald-500/20 hover:border-emerald-500 transition-colors text-white">
                                {mode}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Right Panel: Feed & Telemetry */}
                <section className="col-span-4 bg-neutral-950 flex flex-col border-l border-neutral-800">

                    {/* Top: Live Camera Feed from Forklift */}
                    <div className="flex-1 p-4 border-b border-neutral-900 h-2/3 flex flex-col">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <span className="text-xs font-mono text-neutral-500">ACTIVE FEED</span>
                            <Maximize2 className="w-3 h-3 text-neutral-600 cursor-pointer hover:text-white" />
                        </div>
                        {/* The Component we just built */}
                        <div className="flex-1 min-h-0">
                            <ForkliftStream />
                        </div>
                    </div>

                    {/* Bottom: Event Log / Alerts */}
                    <div className="h-1/3 p-4 bg-neutral-950 overflow-y-auto">
                        <h3 className="text-xs font-mono text-neutral-500 mb-3 sticky top-0 bg-neutral-950 pb-2">SYSTEM ALERTS</h3>
                        <div className="space-y-2 font-mono text-[10px]">
                            <div className="flex items-center gap-2 text-yellow-500">
                                <span>14:32:01</span>
                                <span>[WARN] GHOST OBJECT DETECTED (CONF: 65%)</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <span>14:31:58</span>
                                <span>[INFO] PALLET #492 VERIFIED (CONF: 98%)</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-600">
                                <span>14:31:45</span>
                                <span>[SYS] VOXEL GRID OPTIMIZED (14ms)</span>
                            </div>
                        </div>
                    </div>

                </section>
            </main>
        </div>
    );
}
