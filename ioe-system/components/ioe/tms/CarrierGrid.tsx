"use client";

import React, { useState, useEffect } from "react";
import { Truck, Search, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Carrier {
    id: string;
    name: string;
    scac: string;
    mode: string;
    rating: number;
    status: string;
    _count?: { shipments: number };
}

export function CarrierGrid() {
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/tms/carriers')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCarriers(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load carriers", err);
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-editor)]">
            {/* Toolbar */}
            <div className="flex h-10 items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] px-2">
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-[var(--text-secondary)]" />
                    <input
                        className="h-full bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                        placeholder="Search carriers..."
                    />
                </div>
                <button className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">
                    <Plus className="h-3 w-3" />
                    Add Carrier
                </button>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-6 border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
                <div className="col-span-2">Name / SCAC</div>
                <div>Mode</div>
                <div>Rating</div>
                <div>Status</div>
                <div className="text-right">Shipments</div>
            </div>

            {/* Grid Body */}
            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">Loading carriers...</div>
                ) : carriers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)]">No carriers found.</div>
                ) : (
                    carriers.map((carrier) => (
                        <div
                            key={carrier.id}
                            className="group grid cursor-pointer grid-cols-6 items-center border-b border-[var(--border-color)] px-4 py-3 text-xs transition-colors hover:bg-[var(--item-hover-bg)]"
                        >
                            <div className="col-span-2">
                                <div className="font-medium text-white">{carrier.name}</div>
                                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{carrier.scac}</div>
                            </div>
                            <div className="flex items-center text-[var(--text-secondary)]">
                                <Truck className="mr-2 h-3 w-3 opacity-50" />
                                {carrier.mode}
                            </div>
                            <div className="flex items-center gap-0.5 text-amber-500">
                                <span className="text-[var(--text-primary)] mr-1">{carrier.rating.toFixed(1)}</span>
                                <Star size={10} fill="currentColor" strokeWidth={0} />
                            </div>
                            <div>
                                <span className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                                    carrier.status === 'ACTIVE' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                )}>
                                    {carrier.status}
                                </span>
                            </div>
                            <div className="text-right text-[var(--text-secondary)]">
                                {carrier._count?.shipments || 0}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
