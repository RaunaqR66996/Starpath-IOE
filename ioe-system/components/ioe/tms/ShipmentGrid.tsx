"use client";

import React, { useState } from "react";
import { Shipment, ShipmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, Filter, Truck, MapPin, Calendar, ArrowRight } from "lucide-react";

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
            case "PLANNING": return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
            case "TENDERED": return "bg-blue-900/10 text-blue-400 border-blue-900/20";
            case "DISPATCHED": return "bg-indigo-900/10 text-indigo-400 border-indigo-900/20";
            case "IN_TRANSIT": return "bg-amber-900/10 text-amber-400 border-amber-900/20";
            case "ARRIVED": return "bg-emerald-900/10 text-emerald-400 border-emerald-900/20";
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
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Filter className="h-3 w-3" />
                    <span className="text-[10px] uppercase font-bold">Active Filters: None</span>
                </div>
            </div>

            {/* Header */}
            <div className="flex h-8 w-full items-center border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] font-medium text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                <div className="w-32 px-3">Shipment Ref</div>
                <div className="w-24 px-3 border-l border-[var(--border-color)]">Status</div>
                <div className="w-32 px-3 border-l border-[var(--border-color)]">Carrier</div>
                <div className="flex-1 px-3 border-l border-[var(--border-color)]">Route</div>
                <div className="w-28 px-3 border-l border-[var(--border-color)] text-right">Dates</div>
                <div className="w-24 px-3 border-l border-[var(--border-color)] text-right">Cost</div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {filteredShipments.map(ship => (
                    <div key={ship.id}
                        onClick={() => onRowClick?.(ship.id)}
                        className="flex h-10 w-full cursor-pointer items-center border-b border-[var(--border-color)] hover:bg-[var(--item-hover-bg)] transition-colors">
                        <div className="w-32 px-3 font-mono font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent-color)]">{ship.id}</div>
                        <div className="w-24 px-3">
                            <span className={cn(
                                "inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] uppercase font-bold",
                                getStatusColor(ship.status)
                            )}>
                                {ship.status}
                            </span>
                        </div>
                        <div className="w-32 px-3 flex items-center gap-2 text-[var(--text-primary)]">
                            <Truck className="h-3 w-3 text-[var(--text-muted)]" />
                            <span className="truncate">{ship.carrierId}</span>
                        </div>
                        <div className="flex-1 px-3 flex items-center gap-2 text-[var(--text-secondary)] text-[11px]">
                            <span className="truncate max-w-[100px]">{ship.origin.city}</span>
                            <ArrowRight className="h-3 w-3 text-[var(--text-muted)] flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{ship.destination.city}</span>
                        </div>
                        <div className="w-28 px-3 text-right font-mono text-[10px] text-[var(--text-muted)]">
                            {ship.eta ? new Date(ship.eta).toLocaleDateString() : 'TBD'}
                        </div>
                        <div className="w-24 px-3 text-right font-mono text-[var(--text-primary)]">
                            ${ship.cost.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
