"use client";

import React, { useEffect, useState } from "react";
import { Shipment } from "@/lib/types";
import { Loader2, Calendar, Map, Truck, DollarSign, Package, FileText, Clock, AlertTriangle, Scale, Ruler, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { optimizeRoute, OptimizedRoute } from "@/lib/route-optimizer";
import { DocumentGenerator } from "@/components/ioe/DocumentGenerator";

// Dynamic map
const ShipmentsMap = dynamic(() => import("../ShipmentsMap").then(mod => mod.ShipmentsMap), { ssr: false });

interface ShipmentDetailViewProps {
    shipmentId: string;
}

export function ShipmentDetailView({ shipmentId }: ShipmentDetailViewProps) {
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [routeData, setRouteData] = useState<OptimizedRoute | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "stops" | "financials">("overview");

    useEffect(() => {
        // Fetch shipment
        fetch(`/api/shipments/${shipmentId}`)
            .then(res => res.json())
            .then(async (data) => {
                setShipment(data);
                // Run optimization mock on client for now to get route segments
                if (data && data.origin && data.destination) {
                    const optimized = await optimizeRoute(data.origin, data.destination);
                    setRouteData(optimized);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [shipmentId]);

    if (loading) return <div className="flex h-full items-center justify-center text-neutral-500"><Loader2 className="animate-spin h-5 w-5 mr-2" /> Loading Shipment {shipmentId}...</div>;
    if (!shipment) return <div className="flex h-full items-center justify-center text-red-500">Shipment Not Found</div>;

    const mapPoints = [
        {
            id: shipment.id,
            origin: shipment.origin.coordinates || [-98, 38],
            destination: shipment.destination.coordinates || [-95, 38],
            label: shipment.id,
            color: '#3b82f6' // Blue
        }
    ];

    return (
        <div className="flex h-full w-full flex-col bg-black text-neutral-300">
            {/* Header */}
            <div className="flex h-14 flex-none items-center justify-between border-b border-neutral-800 px-6 bg-neutral-900/80 backdrop-blur">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-900/20 border border-blue-900/50 text-blue-500">
                        <Truck className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-3">
                            {shipment.id}
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                                shipment.status === 'PLANNING' ? "bg-blue-900/20 text-blue-400 border-blue-900/50" :
                                    shipment.status === 'IN_TRANSIT' ? "bg-amber-900/20 text-amber-400 border-amber-900/50" :
                                        "bg-emerald-900/20 text-emerald-400 border-emerald-900/50"
                            )}>{shipment.status}</span>
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono mt-0.5">
                            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Carrier: {shipment.carrierId || "UNASSIGNED"}</span>
                            <span>•</span>
                            <span>{shipment.serviceLevel}</span>
                            <span>•</span>
                            <span className="text-neutral-400">PRO#: {shipment.carrierId ? "998877665" : "---"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <DocumentGenerator type="BOL" data={shipment} label="View BOL" />
                    <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-medium rounded border border-neutral-700 transition-colors">
                        Tender Load
                    </button>
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold rounded shadow-lg shadow-blue-900/20 transition-colors">
                        Track Shipment
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-900/30 px-6 pt-2 gap-1">
                {[
                    { id: "overview", label: "Overview & Map" },
                    { id: "stops", label: "Stops & Route" },
                    { id: "financials", label: "Financials & Claims" }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-t border-x",
                            activeTab === tab.id
                                ? "bg-black border-neutral-800 text-white border-b-black relative -bottom-px"
                                : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-300"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex bg-black">

                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="flex-1 flex">
                        {/* Left Details */}
                        <div className="w-[400px] border-r border-neutral-800 flex flex-col overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-neutral-900/50 rounded border border-neutral-800">
                                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1.5">
                                            <Scale className="h-3 w-3" /> Total Weight
                                        </div>
                                        <div className="text-lg font-mono text-white">{shipment.totalWeight.toLocaleString()} <span className="text-xs text-neutral-600">lbs</span></div>
                                    </div>
                                    <div className="p-3 bg-neutral-900/50 rounded border border-neutral-800">
                                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1.5">
                                            <Ruler className="h-3 w-3" /> Cube / Vol
                                        </div>
                                        <div className="text-lg font-mono text-white">2,400 <span className="text-xs text-neutral-600">ft³</span></div>
                                    </div>
                                    <div className="p-3 bg-neutral-900/50 rounded border border-neutral-800">
                                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1.5">
                                            <Map className="h-3 w-3" /> Total Miles
                                        </div>
                                        <div className="text-lg font-mono text-white">{routeData ? routeData.totalDistance : '-'} <span className="text-xs text-neutral-600">mi</span></div>
                                    </div>
                                    <div className="p-3 bg-neutral-900/50 rounded border border-neutral-800">
                                        <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1 flex items-center gap-1.5">
                                            <Truck className="h-3 w-3" /> Equipment
                                        </div>
                                        <div className="text-lg font-mono text-white">53' VAN</div>
                                    </div>
                                </div>

                                {/* Reference Numbers */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 pb-2">References</h3>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                        <div>
                                            <div className="text-[10px] text-neutral-600 uppercase">Master BOL</div>
                                            <div className="font-mono text-neutral-300">BOL-2024-889</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-neutral-600 uppercase">Seal Number</div>
                                            <div className="font-mono text-neutral-300">SL-992811</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-neutral-600 uppercase">Trailer #</div>
                                            <div className="font-mono text-neutral-300">TLR-5521</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-neutral-600 uppercase">Pickup #</div>
                                            <div className="font-mono text-neutral-300">PK-112233</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tracking Status */}
                                <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <h3 className="text-xs font-bold text-emerald-500 uppercase">Live Tracking</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-500">Last Ping</span>
                                            <span className="text-neutral-300 font-mono">10 mins ago</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-500">Current Location</span>
                                            <span className="text-neutral-300">Passing Tulsa, OK</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-500">Speed</span>
                                            <span className="text-neutral-300 font-mono">62 mph</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-500">ETA Status</span>
                                            <span className="text-emerald-400 font-bold">ON TIME</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Map */}
                        <div className="flex-1 relative bg-neutral-900">
                            <ShipmentsMap shipments={mapPoints as any} />
                        </div>
                    </div>
                )}

                {/* Stops Tab */}
                {activeTab === "stops" && (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* Stop 1: Origin */}
                            <div className="relative pl-8 pb-8 border-l-2 border-neutral-800 last:border-0 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-black" />
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded w-fit mb-1 font-bold">PICKUP • STOP 1</div>
                                            <h3 className="text-lg font-bold text-white">{shipment.origin.city}, {shipment.origin.state}</h3>
                                            <p className="text-sm text-neutral-400">Warehouse Dock 42</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-neutral-500 uppercase font-bold">Scheduled</div>
                                            <div className="text-sm font-mono text-white">01/18/2026 08:00 AM</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs bg-black/30 p-3 rounded">
                                        <div>
                                            <span className="text-neutral-600 block">Activity</span>
                                            <span className="text-neutral-300">Live Load</span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-600 block">Handling Units</span>
                                            <span className="text-neutral-300">22 Pallets</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Gap */}
                            <div className="pl-8 pb-8 border-l-2 border-neutral-800">
                                <div className="text-xs text-neutral-500 font-mono pl-4 flex items-center gap-2">
                                    <div className="h-px bg-neutral-800 w-8" />
                                    {routeData ? `${routeData.totalDistance} miles transit` : 'In Transit'}
                                </div>
                            </div>

                            {/* Stop 2: Destination */}
                            <div className="relative pl-8 border-l-2 border-transparent">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-black" />
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded w-fit mb-1 font-bold">DELIVERY • STOP 2</div>
                                            <h3 className="text-lg font-bold text-white">{shipment.destination.city}, {shipment.destination.state}</h3>
                                            <p className="text-sm text-neutral-400">Receiving Door A-12</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-neutral-500 uppercase font-bold">Scheduled</div>
                                            <div className="text-sm font-mono text-white">01/20/2026 02:00 PM</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs bg-black/30 p-3 rounded">
                                        <div>
                                            <span className="text-neutral-600 block">Activity</span>
                                            <span className="text-neutral-300">Drop & Hook</span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-600 block">Strict Window</span>
                                            <span className="text-amber-500">YES (+/- 30 min)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financials Tab */}
                {activeTab === "financials" && (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-neutral-900 p-4 border border-neutral-800 rounded">
                                    <div className="text-[10px] text-neutral-500 uppercase font-bold">Total Cost</div>
                                    <div className="text-2xl font-mono text-white mt-1">${shipment.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                </div>
                                <div className="bg-neutral-900 p-4 border border-neutral-800 rounded">
                                    <div className="text-[10px] text-neutral-500 uppercase font-bold">Cost Per Mile</div>
                                    <div className="text-2xl font-mono text-white mt-1">$2.35</div>
                                </div>
                                <div className="bg-neutral-900 p-4 border border-neutral-800 rounded">
                                    <div className="text-[10px] text-neutral-500 uppercase font-bold">Margin Impact</div>
                                    <div className="text-2xl font-mono text-emerald-400 mt-1">4.2%</div>
                                </div>
                            </div>

                            <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Freight Bill Breakdown</h3>
                                    <span className="text-xs text-neutral-500 italic">Inv: FRE-22910</span>
                                </div>
                                <div className="divide-y divide-neutral-800">
                                    {[
                                        { item: "Linehaul Rate", amount: 2150.00 },
                                        { item: "Fuel Surcharge (FSC) @ 18%", amount: 387.00 },
                                        { item: "Accessorial: Driver Assist", amount: 150.00 },
                                        { item: "Accessorial: Detention (2 hrs)", amount: 100.00 },
                                        { item: "Toll Charges", amount: 45.50 },
                                    ].map((row, i) => (
                                        <div key={i} className="px-6 py-3 flex justify-between text-sm hover:bg-white/5">
                                            <span className="text-neutral-300">{row.item}</span>
                                            <span className="font-mono text-white">${row.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="px-6 py-4 flex justify-between text-base font-bold bg-neutral-950">
                                        <span className="text-white">Total Accepted Charges</span>
                                        <span className="font-mono text-emerald-400">${(2832.50).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 border border-dashed border-neutral-800 p-4 rounded text-center">
                                <div className="text-xs text-neutral-500 mb-2">No active freight claims or OS&D reports for this shipment.</div>
                                <button className="text-xs text-blue-400 hover:text-blue-300 font-bold underline">File a Claim</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
