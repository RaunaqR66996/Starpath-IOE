import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { ExplainabilityBar } from "./cockpit/ExplainabilityBar";
import { TimelineControlTower } from "./cockpit/TimelineControlTower";
import { AIActionQueue } from "./cockpit/AIActionQueue";
import { EnhancedWarehouse3DScene } from "../inventory/EnhancedWarehouse3DScene";
import { generateMockLayout } from "@/lib/warehouse-mock";

export function PlanMode() {
    // Generate layout once
    const layout = useMemo(() => generateMockLayout(), []);
    const [hasResolvedRisks, setHasResolvedRisks] = useState(false);

    return (
        <div className="flex h-full flex-col bg-black text-white overflow-hidden">
            {/* Top: Reasoning & Context */}
            <ExplainabilityBar />

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Planning Horizon */}
                <TimelineControlTower resolvedRisks={hasResolvedRisks} />

                {/* Center: The Reality (User's World) */}
                <div className="flex-1 relative bg-black/50 border-x border-white/5">
                    <Canvas camera={{ position: [50, 60, 50], fov: 50 }}>
                        <EnhancedWarehouse3DScene
                            layout={{
                                ...layout,
                                bins: layout.bins || [],
                                racks: layout.racks.map(r => ({
                                    ...r,
                                    length: r.length ?? 10,
                                    width: r.width ?? 2,
                                    height: r.height ?? 8,
                                    zone: r.zone ?? 'A',
                                    aisle: r.aisle ?? '1'
                                })),
                                dockDoors: layout.dockDoors || [],
                                stagingLanes: layout.stagingLanes || []
                            }}
                            // Default Interactive Props
                            selectedBinId=""
                            highlightedBinIds={hasResolvedRisks ? [] : ["bin-101", "bin-102"]} // Highlight problematic bins if risks exist
                            showHeatmap={!hasResolvedRisks} // Show heatmap only when risks exist (simulated)
                            showLabels={false}
                            showPickPath={false}
                            showSafetyZones={true}
                            heatmapMode="fill"
                            onBinClick={() => { }}
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

                    {/* Overlay Title */}
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur px-4 py-2 rounded-lg border border-white/10 pointer-events-none">
                        <div className="text-[10px] font-bold text-neutral-500 uppercase">Live Reality Twin</div>
                        <div className="text-xs text-white">
                            {hasResolvedRisks ? 'Zone B • Optimized' : 'Zone B • Picking Active (Congested)'}
                        </div>
                    </div>
                </div>

                {/* Right: The Engine (Actions) */}
                <AIActionQueue onActionComplete={() => setHasResolvedRisks(true)} />
            </div>
        </div>
    );
}
