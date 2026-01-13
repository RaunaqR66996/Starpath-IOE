"use client";

import React, { useEffect, useState } from "react";
import { Shipment } from "@/lib/types";
import { Loader2, Calendar, Map, Truck, DollarSign, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { optimizeRoute, OptimizedRoute } from "@/lib/route-optimizer";
import { DocumentGenerator } from "@/components/ioe/DocumentGenerator";
import { Shield, Zap, Info, ChevronDown } from "lucide-react";

// Dynamic map
const ShipmentsMap = dynamic(() => import("../ShipmentsMap").then(mod => mod.ShipmentsMap), { ssr: false });

interface ShipmentDetailViewProps {
    shipmentId: string;
}

export function ShipmentDetailView({ shipmentId }: ShipmentDetailViewProps) {
    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [routeData, setRouteData] = useState<OptimizedRoute | null>(null);

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
            <div className="flex h-12 flex-none items-center justify-between border-b border-neutral-800 px-4 bg-neutral-900/50">
                <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-500" />
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-wide">{shipment.id}</h1>
                        <div className="text-[10px] text-neutral-500 font-mono">
                            {shipment.carrierId} • {shipment.serviceLevel}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-neutral-800 rounded border border-neutral-700">
                        STATUS: <span className="text-blue-400">{shipment.status}</span>
                    </span>
                </div>
            </div>

            {/* Content Split */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Details */}
                <div className="w-1/3 flex flex-col border-r border-neutral-800 overflow-y-auto">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-px bg-neutral-800">
                        <div className="bg-black p-4">
                            <div className="text-[10px] text-neutral-500 uppercase">Cost</div>
                            <div className="text-lg font-mono text-white mt-1">${shipment.cost.toLocaleString()}</div>
                        </div>
                        <div className="bg-black p-4">
                            <div className="text-[10px] text-neutral-500 uppercase">Weight</div>
                            <div className="text-lg font-mono text-white mt-1">{shipment.totalWeight}kg</div>
                        </div>
                        <div className="bg-black p-4">
                            <div className="text-[10px] text-neutral-500 uppercase">ETA</div>
                            <div className="text-lg font-mono text-white mt-1">
                                {routeData ? new Date(routeData.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                            </div>
                        </div>
                        <div className="bg-black p-4">
                            <div className="text-[10px] text-neutral-500 uppercase">Distance</div>
                            <div className="text-lg font-mono text-white mt-1">{routeData ? `${routeData.totalDistance} km` : '-'}</div>
                        </div>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Route Timeline */}
                        <div>
                            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                                <Map className="h-3 w-3 text-neutral-500" /> ROUTE PLAN
                            </h3>
                            <div className="space-y-4 border-l border-neutral-800 ml-1.5 pl-4 relative">
                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-black" />
                                    <div className="text-xs font-medium text-white">{shipment.origin.city}, {shipment.origin.state}</div>
                                    <div className="text-[10px] text-neutral-500 mt-0.5">Origin</div>
                                </div>

                                {routeData?.segments.map((seg, i) => (
                                    <div key={i} className="py-2">
                                        <div className="text-[10px] text-neutral-400 bg-neutral-900 p-2 rounded border border-neutral-800 font-mono">
                                            {seg.instruction}
                                            <div className="mt-1 text-emerald-500">{seg.distance} km • {Math.round(seg.duration)} min</div>
                                        </div>
                                    </div>
                                ))}

                                <div className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-black" />
                                    <div className="text-xs font-medium text-white">{shipment.destination.city}, {shipment.destination.state}</div>
                                    <div className="text-[10px] text-neutral-500 mt-0.5">Destination</div>
                                </div>
                            </div>
                        </div>

                        {/* Carrier Services & Labels */}
                        <div className="border-t border-neutral-800 pt-6 mt-6">
                            <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="h-3 w-3 text-amber-500" /> CARRIER SERVICES
                            </h3>

                            <div className="space-y-2">
                                {[
                                    { id: 'UPS', name: 'UPS Ground', rate: 142.50, time: '2 Days', best: true },
                                    { id: 'FEDEX', name: 'FedEx Express', rate: 215.00, time: '1 Day', best: false },
                                    { id: 'DHL', name: 'DHL Saver', rate: 189.20, time: '3 Days', best: false }
                                ].map((carrier) => (
                                    <div
                                        key={carrier.id}
                                        className={cn(
                                            "p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all",
                                            shipment.carrierId === carrier.id
                                                ? "bg-blue-600/10 border-blue-500"
                                                : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded bg-black border border-neutral-800">
                                                <Truck className="h-3 w-3" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-white">{carrier.name}</div>
                                                <div className="text-[8px] text-neutral-500">{carrier.time} Transit</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-mono font-bold text-white">${carrier.rate.toFixed(2)}</div>
                                            {carrier.best && <div className="text-[7px] text-emerald-400 font-bold tracking-tighter uppercase">Cheapest</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-col gap-2">
                                <DocumentGenerator type="SHIPPING_LABEL" data={shipment} label="View Shipping Label" />
                                <DocumentGenerator type="BOL" data={shipment} label="Bill of Lading" />
                                <button className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-bold hover:bg-neutral-700 transition-colors">
                                    <Shield className="h-3 w-3 text-blue-400" />
                                    Insure Shipment (+$12.00)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Map */}
                <div className="flex-1 relative bg-neutral-900 border-l border-neutral-800">
                    <ShipmentsMap shipments={mapPoints as any} />
                    {/* Overlay stats */}
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur border border-neutral-800 p-2 rounded text-[10px] font-mono text-green-400">
                        LIVE TRACKING ACTIVE
                    </div>
                </div>
            </div>
        </div>
    );
}
