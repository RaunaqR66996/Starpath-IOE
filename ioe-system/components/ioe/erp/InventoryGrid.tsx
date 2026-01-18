"use client";

import React, { useState, useMemo } from "react";
import { InventoryItem, OrderLine } from "@/lib/types"; // We might need to extend InventoryItem
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search, Filter, AlertTriangle, ShieldAlert, Box, Database } from "lucide-react";

interface ExtendedInventoryItem {
    id: string;
    itemId: string;
    itemName: string;
    sku: string;
    locationId: string;
    warehouseId: string;
    quantity: number;
    status: "AVAILABLE" | "QC_HOLD" | "BLOCKED" | "DAMAGES";
    updatedAt: string;
}

interface InventoryGridProps {
    items: ExtendedInventoryItem[];
    onRowClick?: (id: string) => void;
}

export function InventoryGrid({ items, onRowClick }: InventoryGridProps) {
    const [sortField, setSortField] = useState<keyof ExtendedInventoryItem>("updatedAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [filterText, setFilterText] = useState("");

    const handleSort = (field: keyof ExtendedInventoryItem) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedItems = useMemo(() => {
        return [...items]
            .filter(item =>
                item.sku.toLowerCase().includes(filterText.toLowerCase()) ||
                item.itemName.toLowerCase().includes(filterText.toLowerCase()) ||
                item.locationId.toLowerCase().includes(filterText.toLowerCase())
            )
            .sort((a, b) => {
                const aVal = a[sortField];
                const bVal = b[sortField];
                if (aVal === undefined || bVal === undefined) return 0;
                if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
    }, [items, filterText, sortField, sortDirection]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "AVAILABLE": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "QC_HOLD": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "BLOCKED": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "DAMAGES": return "bg-red-900/10 text-red-700 border-red-900/20";
            default: return "bg-neutral-500/10 text-neutral-500";
        }
    };

    // Calculate Aggregates
    const stats = useMemo(() => {
        return {
            totalSku: new Set(items.map(i => i.sku)).size,
            totalQty: items.reduce((acc, i) => acc + i.quantity, 0),
            blockedQty: items.filter(i => i.status === 'BLOCKED' || i.status === 'DAMAGES').reduce((acc, i) => acc + i.quantity, 0),
            valueEstimate: items.reduce((acc, i) => acc + (i.quantity * 50), 0) // Mock $50 avg cost
        };
    }, [items]);

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] text-xs text-[var(--text-primary)]">
            {/* Toolbar */}
            <div className="flex h-10 items-center justify-between border-b border-[var(--border-color)] px-3 bg-[var(--bg-panel-header)]">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 h-3 w-3 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search SKU, Location..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-7 w-64 rounded-sm border border-[var(--border-color)] bg-[var(--bg-input)] pl-7 pr-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)] focus:outline-none"
                        />
                    </div>
                    <button className="flex h-7 items-center gap-1 rounded-sm border border-[var(--border-color)] px-2 hover:bg-[var(--item-hover-bg)] text-[var(--text-secondary)]">
                        <Filter className="h-3 w-3 text-[var(--text-muted)]" />
                        <span>Filter</span>
                    </button>
                </div>

                {/* Real Data Badge */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded text-emerald-500">
                        <Database className="h-3 w-3" />
                        <span className="font-mono font-medium">LIVE LEDGER CONNECTION</span>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex h-12 w-full items-center border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] px-4 gap-8">
                <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total SKUs</span>
                    <span className="text-lg font-mono font-medium text-[var(--text-primary)]">{stats.totalSku}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total Units</span>
                    <span className="text-lg font-mono font-medium text-[var(--text-primary)]">{stats.totalQty.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Blocked / Damaged
                    </span>
                    <span className="text-lg font-mono font-medium text-red-500">{stats.blockedQty.toLocaleString()}</span>
                </div>
                <div className="flex flex-col ml-auto text-right">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Inventory Value (Est)</span>
                    <span className="text-lg font-mono font-medium text-emerald-400">${stats.valueEstimate.toLocaleString()}</span>
                </div>
            </div>

            {/* Table Header */}
            <div className="flex h-8 w-full items-center border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] font-medium text-[var(--text-secondary)]">
                <div className="w-10 flex items-center justify-center">
                    <Box className="h-3 w-3" />
                </div>
                <div className="w-40 px-3 cursor-pointer hover:text-[var(--text-primary)] flex items-center gap-1" onClick={() => handleSort("sku")}>
                    SKU {sortField === "sku" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
                <div className="flex-1 px-3 border-l border-[var(--border-color)]">Description</div>
                <div className="w-32 px-3 border-l border-[var(--border-color)]" onClick={() => handleSort("locationId")}>
                    Location {sortField === "locationId" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
                <div className="w-24 px-3 border-l border-[var(--border-color)] text-right">Qty</div>
                <div className="w-32 px-3 border-l border-[var(--border-color)]">Status</div>
                <div className="w-32 px-3 border-l border-[var(--border-color)]">Last Updated</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
                {sortedItems.map((item) => (
                    <div
                        key={item.id}
                        className="group flex h-9 w-full cursor-pointer items-center border-b border-[var(--border-color)] hover:bg-[var(--item-hover-bg)]"
                        onClick={() => onRowClick?.(item.id)}
                    >
                        <div className="w-10 flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                            <div className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
                        </div>
                        <div className="w-40 px-3 font-mono text-[var(--accent-color)] group-hover:underline decoration-dotted underline-offset-4">
                            {item.sku}
                        </div>
                        <div className="flex-1 px-3 text-[var(--text-primary)] truncate">
                            {item.itemName}
                        </div>
                        <div className="w-32 px-3 font-mono text-[var(--text-secondary)] text-[10px]">
                            {item.locationId}
                        </div>
                        <div className="w-24 px-3 text-right font-mono text-[var(--text-primary)]">
                            {item.quantity}
                        </div>
                        <div className="w-32 px-3">
                            <span className={cn(
                                "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] uppercase font-medium border",
                                getStatusColor(item.status)
                            )}>
                                {item.status}
                            </span>
                        </div>
                        <div className="w-32 px-3 text-[var(--text-muted)] text-[10px]">
                            {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}

                {sortedItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-[var(--text-muted)]">
                        <Database className="h-8 w-8 mb-2 opacity-50" />
                        <span>No inventory records found.</span>
                    </div>
                )}
            </div>
        </div>
    );
}

