'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SensorFusionFrame } from '@/lib/simulation/types';
import { useLiveTelemetry } from '@/lib/hardware/use-telemetry';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Brain, Scan, Eye, Radio, AlertTriangle, WifiOff } from 'lucide-react';

/**
 * ForkliftStream Component (Hardware-Ready)
 * Connects to the /api/ingest/v1/stream endpoint.
 * Shows "OFFLINE" if no hardware is pushing data.
 */
export function ForkliftStream() {
    const { online, frame } = useLiveTelemetry(100); // Poll every 100ms

    // --- OFFLINE STATE ---
    if (!online || !frame) {
        return (
            <div className="flex flex-col gap-4 w-full h-full bg-neutral-950 p-4 border border-neutral-800 rounded-xl relative overflow-hidden">
                {/* Header (Dimmed) */}
                <div className="flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-neutral-600" />
                        <h2 className="text-lg font-mono font-bold text-neutral-500">LIVE FEED: SIGNAL LOST</h2>
                    </div>
                </div>

                {/* Offline Visual */}
                <div className="relative w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 flex flex-col items-center justify-center gap-3">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] opacity-10" />
                    <WifiOff className="w-12 h-12 text-neutral-600" />
                    <div className="text-center">
                        <div className="text-neutral-400 font-mono font-bold">NO HARDWARE CONNECTION</div>
                        <div className="text-neutral-600 text-xs font-mono mt-1">
                            Waiting for telemetry on port 3000...
                        </div>
                    </div>
                </div>

                {/* Empty Debug Cards */}
                <div className="grid grid-cols-3 gap-2 h-32 opacity-30 pointer-events-none grayscale">
                    <DebugCard title="Perception Head" icon={Eye} color="text-emerald-400"><span /></DebugCard>
                    <DebugCard title="Geometry Head" icon={Scan} color="text-blue-400"><span /></DebugCard>
                    <DebugCard title="Flow Head" icon={Brain} color="text-purple-400"><span /></DebugCard>
                </div>
            </div>
        );
    }

    // --- ONLINE STATE (Real Data) ---
    return (
        <div className="flex flex-col gap-4 w-full h-full bg-neutral-950 p-4 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                    <h2 className="text-lg font-mono font-bold text-neutral-100">LIVE FEED: {frame.deviceId || 'UNKNOWN'}</h2>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="font-mono text-xs border-emerald-500 text-emerald-400">
                        LATENCY: {frame.status.fusionLatencyMs.toFixed(1)}ms
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs border-blue-500 text-blue-400">
                        CONFIDENCE: {((frame.objects[0]?.confidence || 0) * 100).toFixed(0)}%
                    </Badge>
                </div>
            </div>

            {/* Main Viewport: "Augmented Reality" */}
            <div className="relative w-full aspect-video bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">

                {/* 1. Background: Simulated Video Feed (Gradient for now) */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-900 to-black opacity-50" />

                {/* 2. Neural Overlays (Bounding Boxes) */}
                {frame.objects.map((obj) => (
                    <motion.div
                        key={obj.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1, x: obj.boundingBox.center.x * 20, y: obj.boundingBox.center.z * 10 }} // Mock projection
                        className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-sm flex flex-col items-center justify-center"
                        style={{
                            width: '100px',
                            height: '80px',
                            left: '40%',
                            top: '40%'
                        }}
                    >
                        <div className="absolute -top-6 left-0 bg-emerald-500 text-black text-[10px] font-bold px-1 py-0.5 rounded-t-sm">
                            {obj.classId.toUpperCase()} {(obj.confidence * 100).toFixed(0)}%
                        </div>
                        {obj.confidence < 0.8 && (
                            <AlertTriangle className="w-6 h-6 text-yellow-500 animate-bounce" />
                        )}
                    </motion.div>
                ))}

                {/* 3. HUD Layer */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-1 font-mono text-xs text-emerald-500/80">
                    <div>POS: [{frame.pose.position.x.toFixed(2)}, {frame.pose.position.z.toFixed(2)}]</div>
                    <div>VOXELS: {frame.voxels.length} Active</div>
                </div>

            </div>

            {/* "HydraNet" Heads Debugger */}
            <div className="grid grid-cols-3 gap-2 h-32">
                <DebugCard title="Perception Head" icon={Eye} color="text-emerald-400">
                    <div className="space-y-1">
                        {frame.objects.map(o => (
                            <div key={o.id} className="flex justify-between text-[10px] border-b border-neutral-800 pb-1">
                                <span>{o.classId}</span>
                                <span className={o.confidence > 0.9 ? 'text-emerald-500' : 'text-yellow-500'}>
                                    {o.confidence.toFixed(2)}
                                </span>
                            </div>
                        ))}
                        {frame.objects.length === 0 && <span className="text-neutral-600 italic">No Objects</span>}
                    </div>
                </DebugCard>

                <DebugCard title="Geometry Head (Voxel)" icon={Scan} color="text-blue-400">
                    <div className="flex flex-wrap gap-0.5">
                        {frame.voxels.slice(0, 40).map((v, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-[1px]"
                                style={{
                                    backgroundColor: `rgba(96, 165, 250, ${v.occupancyProbability})`
                                }}
                            />
                        ))}
                    </div>
                    <div className="mt-2 text-[10px] text-neutral-500">
                        Grid Resolution: 0.2m
                    </div>
                </DebugCard>

                <DebugCard title="Flow Head (Motion)" icon={Brain} color="text-purple-400">
                    <div className="text-[10px] text-neutral-400">
                        Predicting trajectories...
                    </div>
                    {/* Visualization of predicted paths could go here */}
                    <div className="mt-2 h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[45%] animate-pulse" />
                    </div>
                    <div className="mt-1 text-[10px] text-purple-500">Processing Time: 12ms</div>
                </DebugCard>
            </div>
        </div>
    );
}

function DebugCard({ title, icon: Icon, color, children }: { title: string, icon: any, color: string, children: React.ReactNode }) {
    return (
        <Card className="bg-neutral-900 border-neutral-800 p-2 overflow-hidden flex flex-col">
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
                <Icon className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                {children}
            </div>
        </Card>
    )
}
