
import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Box, Truck, Clock, AlertTriangle, Layers, Activity, Map, Zap, Maximize2 } from "lucide-react";
import { EnhancedWarehouse3DScene } from "../../inventory/EnhancedWarehouse3DScene";
import { generateMockLayout } from "@/lib/warehouse-mock";

export function DigitalTwinEditor() {
    const layout = useMemo(() => generateMockLayout(), []);
    const [selectedBin, setSelectedBin] = useState<string>('');

    return (
        <div className="flex h-full flex-col bg-slate-950 text-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        3D Supply Chain Twin
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Real-time Spatial Decision System • Live Inventory & In-Transit Model
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
                        <Activity className="h-3 w-3" />
                        <span>System Live</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main 3D Viewport */}
                <div className="flex-1 relative bg-slate-900 m-4 rounded-xl border border-slate-800 overflow-hidden group">
                    <Canvas camera={{ position: [50, 60, 50], fov: 50 }}>
                        <EnhancedWarehouse3DScene
                            layout={{
                                ...layout,
                                bins: layout.bins ?? [],
                                racks: layout.racks.map(r => ({ ...r, length: r.length ?? 10, width: r.width ?? 2, height: r.height ?? 8, zone: r.zone ?? 'A', aisle: r.aisle ?? '1' })),
                                dockDoors: layout.dockDoors ?? [],
                                stagingLanes: layout.stagingLanes ?? [],
                            }}
                            selectedBinId={selectedBin}
                            highlightedBinIds={[]}
                            showHeatmap={true}
                            showLabels={false}
                            showPickPath={false}
                            showSafetyZones={true}
                            heatmapMode="fill"
                            onBinClick={setSelectedBin}
                            onBinHover={() => { }}
                            onCameraFocus={() => { }}
                            warehouseConfig={{
                                length: 120,
                                width: 80,
                                wallHeight: 12
                            }}
                        />
                        <OrbitControls />
                        <Environment preset="city" />
                    </Canvas>

                    {/* Overlay Stats */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                        <div className="p-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg w-48 shadow-xl">
                            <div className="text-[10px] uppercase text-slate-500 mb-1">Warehouse Fill Rate</div>
                            <div className="text-2xl font-mono font-bold text-emerald-400">84.2%</div>
                            <div className="text-xs text-slate-400">Zone B Critical</div>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 pointer-events-none">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Twin Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="w-80 border-l border-slate-800 bg-slate-900/30 flex flex-col">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-400" />
                            Live Events Stream
                        </h3>
                        <div className="space-y-3">
                            <EventCard
                                icon={<Truck className="h-4 w-4 text-amber-400" />}
                                title="Inbound Delay"
                                desc="Truck #892 delayed 45m due to traffic."
                                time="2m ago"
                            />
                            <EventCard
                                icon={<Box className="h-4 w-4 text-emerald-400" />}
                                title="Stock Arrival"
                                desc="Pallet #442 checked into Zone A-12."
                                time="12m ago"
                            />
                            <EventCard
                                icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
                                title="Damage Report"
                                desc="Rack C-04 sensor detected impact."
                                time="1h ago"
                            />
                        </div>
                    </div>

                    <div className="p-4 border-b border-slate-800 flex-1 overflow-auto">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Core Primitives</h3>
                        <div className="space-y-4">
                            <div className="bg-slate-950/50 p-3 rounded border border-slate-800 hover:border-cyan-500/30 transition-colors">
                                <div className="text-xs font-bold text-cyan-400 mb-1">Inventory as State</div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Modeling location, time, and confidence vectors instead of static numbers.
                                </p>
                            </div>
                            <div className="bg-slate-950/50 p-3 rounded border border-slate-800 hover:border-cyan-500/30 transition-colors">
                                <div className="text-xs font-bold text-cyan-400 mb-1">In-Transit Supply</div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Rolling safety stock dynamically adjusted by probabilistic ETA.
                                </p>
                            </div>
                            <div className="bg-slate-950/50 p-3 rounded border border-slate-800 hover:border-cyan-500/30 transition-colors">
                                <div className="text-xs font-bold text-cyan-400 mb-1">Continuous Replanning</div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Event-driven optimization triggered by live spatial telemetry.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EventCard({ icon, title, desc, time }: { icon: React.ReactNode, title: string, desc: string, time: string }) {
    return (
        <div className="flex gap-3 p-3 bg-slate-800/40 rounded border border-slate-700/50 hover:bg-slate-800/60 transition-colors cursor-pointer group">
            <div className="mt-0.5 group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">{title}</span>
                    <span className="text-[10px] text-slate-500">{time}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{desc}</p>
            </div>
        </div>
    );
}
