"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Warehouse3DScene } from "./Warehouse3DScene";
import * as THREE from 'three';
import { getLiveInventory } from "@/app/actions/inventory-actions";
import { getFleetStatus, AMRUnit, emergencyStopAll, dispatchRobot } from "@/app/actions/wcs-actions";
import { FleetManager } from "./FleetManager";
import { InventoryGrid } from "../erp/InventoryGrid";
import { Database, Box } from "lucide-react"; // Icons

// Base layout structure (Geometry)
const BASE_LAYOUT = {
    racks: Array.from({ length: 20 }, (_, i) => ({
        id: `RACK-${i}`,
        x: (i % 5) * 10 - 20,
        y: 0,
        z: Math.floor(i / 5) * 10 - 15,
        length: 8,
        width: 2.4,
        height: 4,
        zone: 'storage-a',
        aisle: `A${Math.floor(i / 5)}`
    })),
    dockDoors: [
        { id: 'DOCK-1', x: -50, y: 0, z: 30, length: 5, width: 5, height: 4, zone: 'inbound-a' },
        { id: 'DOCK-2', x: 50, y: 0, z: 30, length: 5, width: 5, height: 4, zone: 'outbound-a' },
        { id: 'INBOUND-DOCK', x: -30, y: 0, z: 45, length: 4, width: 4, height: 3, zone: 'inbound-a' }
    ],
    stagingLanes: [
        {
            id: 'STAGE-1',
            x: 0,
            y: 0,
            z: 30,
            length: 15,
            width: 5,
            height: 0.1,
            zone: 'staging',
            status: 'FILLING' as const,
            orders: [
                { orderNumber: 'ORD-001', status: 'READY', filledPallets: 5, requiredPallets: 5 },
                { orderNumber: 'ORD-002', status: 'FILLING', filledPallets: 2, requiredPallets: 4 },
                { orderNumber: 'ORD-003', status: 'EMPTY', filledPallets: 0, requiredPallets: 3 }
            ]
        }
    ]
};

export function InventoryWorkspace({ activeSite = "Texas" }: { activeSite?: string }) {
    const [selectedBinId, setSelectedBinId] = useState('');
    const [highlightedBinIds, setHighlightedBinIds] = useState<string[]>([]);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [liveInventory, setLiveInventory] = useState<any[]>([]);
    const [fleet, setFleet] = useState<AMRUnit[]>([]);
    const [loading, setLoading] = useState(true);

    // View Mode State: "3d" | "ledger"
    const [viewMode, setViewMode] = useState<"3d" | "ledger">("3d");

    const fetchData = React.useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const [inv, robots] = await Promise.all([
                getLiveInventory(),
                getFleetStatus()
            ]);
            setLiveInventory(inv);
            setFleet(robots);
        } catch (e) {
            console.error("Polling error:", e);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [activeSite]);

    useEffect(() => {
        // Initial Fetch
        fetchData(true);

        // Poll every 5 seconds for "Live Sync" effect (Wedge Demo)
        const interval = setInterval(() => fetchData(false), 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleDispatch = async (id: string) => {
        // Mock a dispatch to a random area
        await dispatchRobot(id, Math.random() * 50 - 25, Math.random() * 50 - 25);
    };

    const handleStop = async () => {
        await emergencyStopAll();
        setFleet(prev => prev.map(r => ({ ...r, status: 'IDLE' })));
    };

    // Merge Live Inventory into Bins
    const fullLayout = useMemo(() => {
        // Filter inventory for the active site
        const siteInventory = liveInventory.filter(inv =>
            // Case-insensitive match or contains
            inv.warehouseId && inv.warehouseId.toLowerCase().includes(activeSite.toLowerCase())
        );

        // ... (rest of the mapping code stays same)
        const bins = Array.from({ length: 120 }, (_, i) => {
            const id = i < 100 ? `BIN-${i}` : (i < 110 ? `RECV-STAGE-0${i - 100}` : `QC-AREA-${i - 110}`);
            let x = (i % 10) * 5 - 25;
            let z = Math.floor(i / 10) * 5 - 25;
            let zone = i < 30 ? 'storage-a' : i < 60 ? 'inbound-a' : 'outbound-a';
            if (i >= 100) {
                x = (i - 100) * 6 - 30;
                z = 40;
                zone = 'receiving';
            }
            // Use siteInventory instead of global liveInventory
            const items = siteInventory.filter(inv => inv.locationId === id);
            const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
            const fillPercentage = Math.min(100, (totalQty / 1000) * 100);
            return {
                id, x, y: 1, z, length: 1.2, width: 1.0, height: 2.0, zone,
                aisle: i < 100 ? `A${Math.floor(i / 10)}` : 'RECV',
                bay: `${i % 10}`, level: '1', capacity: 1000, fillPercentage,
                contents: items.map(inv => ({ sku: inv.item.sku, name: inv.item.name, qty: inv.quantity, lot: 'N/A' })),
                lastActivity: items.length > 0 ? items[0].updatedAt : new Date().toISOString()
            };
        });
        return { ...BASE_LAYOUT, bins };
    }, [liveInventory, activeSite]);

    const handleBinClick = (binId: string) => setSelectedBinId(binId);
    const handleBinHover = (binId: string | null) => setHighlightedBinIds(binId ? [binId] : []);
    const handleStagingClick = (laneId: string) => console.log('Staging lane clicked:', laneId);

    // Map Inventory for Grid
    const gridItems = useMemo(() => {
        return liveInventory
            .filter(inv => !activeSite || (inv.warehouseId && inv.warehouseId.toLowerCase().includes(activeSite.toLowerCase())))
            .map(i => ({
                id: i.id,
                itemId: i.itemId,
                itemName: i.item?.name || "Unknown Item",
                sku: i.item?.sku || "UNKNOWN",
                locationId: i.locationId || i.binId || "Pending Putaway",
                warehouseId: i.warehouseId,
                quantity: i.quantity,
                status: i.status as any,
                updatedAt: i.updatedAt
            }));
    }, [liveInventory, activeSite]);

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#0a0a0a] relative">
            {/* Controls Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-4 shadow-2xl">
                <div className="text-[10px] font-black text-white uppercase tracking-[4px] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    Neural Warehouse v1.0
                </div>

                {/* View Switcher */}
                <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                    <button
                        onClick={() => setViewMode("3d")}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === "3d" ? "bg-emerald-600 text-white shadow-lg" : "text-neutral-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Box className="w-3 h-3" />
                        Twin
                    </button>
                    <button
                        onClick={() => setViewMode("ledger")}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === "ledger" ? "bg-emerald-600 text-white shadow-lg" : "text-neutral-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Database className="w-3 h-3" />
                        Ledger
                    </button>
                </div>

                {viewMode === "3d" && (
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={showHeatmap}
                            onChange={(e) => setShowHeatmap(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Inventory Heatmap</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex relative overflow-hidden">
                {viewMode === "3d" ? (
                    <>
                        {/* @ts-ignore */}
                        <Warehouse3DScene
                            layout={fullLayout}
                            selectedBinId={selectedBinId}
                            highlightedBinIds={highlightedBinIds}
                            showHeatmap={showHeatmap}
                            showLabels={true}
                            showPickPath={false}
                            fleet={fleet}
                            onBinClick={handleBinClick}
                            onBinHover={handleBinHover}
                            onStagingClick={handleStagingClick}
                        />

                        {/* Right Side: WCS Command Console (only in 3D) */}
                        <div className="w-[320px] p-4 h-full relative z-10 pointer-events-none">
                            <div className="h-full pointer-events-auto">
                                <FleetManager
                                    fleet={fleet}
                                    onDispatch={handleDispatch}
                                    onStop={handleStop}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 h-full overflow-hidden bg-[var(--bg-editor)] p-4 pt-20"> {/* pt-20 to clear absolute overlay */}
                        <InventoryGrid items={gridItems} />
                    </div>
                )}
            </div>
        </div>
    );
}
