"use client";

import React, { useState } from "react";
import { Shipment, ShipmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, Filter, Truck, MapPin } from "lucide-react";

interface ShipmentGridProps {
    shipments: Shipment[];
    onRowClick?: (id: string) => void;
}

export function ShipmentGrid({ shipments, onRowClick }: ShipmentGridProps) {
    const [filterText, setFilterText] = useState("");

    const filteredShipments = shipments.filter(s =>
        s.id.toLowerCase().includes(filterText.toLowerCase()) ||
        s.carrierId.toLowerCase().includes(filterText.toLowerCase())
    );

    const getStatusColor = (status: ShipmentStatus) => {
        switch (status) {
            case "PLANNING": return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
            case "TENDERED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "DISPATCHED": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
            case "IN_TRANSIT": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "ARRIVED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            default: return "bg-neutral-500/10 text-neutral-500";
        }
    };

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] text-xs text-[var(--text-secondary)]">
            {/* Toolbar */}
            <div className="flex h-10 items-center justify-between border-b border-[var(--border-color)] px-3 bg-[var(--bg-panel-header)]">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 h-3 w-3 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search shipments..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-7 w-64 rounded-sm border border-[var(--border-color)] bg-[var(--bg-input)] pl-7 pr-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)] focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex h-8 w-full items-center border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] font-medium text-[var(--text-muted)]">
                <div className="w-32 px-3">Shipment ID</div>
                <div className="w-24 px-3 border-l border-[var(--border-color)]">Status</div>
                <div className="w-32 px-3 border-l border-[var(--border-color)]">Carrier</div>
                <div className="flex-1 px-3 border-l border-[var(--border-color)]">Route</div>
                <div className="w-24 px-3 border-l border-[var(--border-color)] text-right">Cost</div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {filteredShipments.map(ship => (
                    <div key={ship.id}
                        onClick={() => onRowClick?.(ship.id)}
                        className="flex h-10 w-full cursor-pointer items-center border-b border-[var(--border-color)] hover:bg-[var(--item-hover-bg)]">
                        <div className="w-32 px-3 font-mono text-[var(--text-secondary)] hover:text-[var(--accent-color)]">{ship.id}</div>
                        <div className="w-24 px-3">
                            <span className={cn(
                                "inline-flex items-center rounded-none border px-1.5 py-0.5 text-[10px] uppercase font-medium",
                                getStatusColor(ship.status)
                            )}>
                                {ship.status}
                            </span>
                        </div>
                        <div className="w-32 px-3 flex items-center gap-2 text-[var(--text-primary)]">
                            <Truck className="h-3 w-3 text-[var(--text-muted)]" />
                            <span>{ship.carrierId}</span>
                        </div>
                        <div className="flex-1 px-3 flex items-center gap-2 text-[var(--text-secondary)]">
                            <MapPin className="h-3 w-3" />
                            {ship.origin.city} <span className="text-[var(--text-muted)]">→</span> {ship.destination.city}
                        </div>
                        <div className="w-24 px-3 text-right font-mono text-[var(--text-muted)]">
                            ${ship.cost.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
