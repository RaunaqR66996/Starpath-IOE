"use client";

import React, { useState } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search, Filter, Plus, Truck, Loader2, PackageOpen } from "lucide-react";
import { CreateOrderModal } from "./CreateOrderModal";
import { OverseerModal } from "@/components/ioe/shared/OverseerModal";
import { useUIStore } from "@/lib/store/ui-store";
import { planShipment, releaseOrderToWarehouse } from "@/app/actions/orchestrator";

interface OrderGridProps {
    orders: Order[];
    onRowClick?: (orderId: string) => void;
}

export function OrderGrid({ orders, onRowClick }: OrderGridProps) {
    const [sortField, setSortField] = useState<keyof Order>("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [filterText, setFilterText] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [planningLoading, setPlanningLoading] = useState(false);
    const [releasingLoading, setReleasingLoading] = useState(false);

    // Overseer State
    const { isOverseerMode } = useUIStore();
    const [overseerTarget, setOverseerTarget] = useState<{ id: string, field: string, current: string } | null>(null);

    // Local state for orders to support optimistic UI updates from overrides
    // (In a real app, we'd invalidate the query/fetcher)
    const [localOrders, setLocalOrders] = useState(orders);

    // Sync props to local state if props change (simple version)
    React.useEffect(() => {
        setLocalOrders(orders);
    }, [orders]);

    const handleSort = (field: keyof Order) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedOrders = [...localOrders]
        .filter(order =>
            order.id.toLowerCase().includes(filterText.toLowerCase()) ||
            order.customerName.toLowerCase().includes(filterText.toLowerCase()) ||
            order.status.toLowerCase().includes(filterText.toLowerCase())
        )
        .sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (aVal === undefined || bVal === undefined) return 0;

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

    const toggleSelectAll = () => {
        if (selectedIds.size === sortedOrders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(sortedOrders.map(o => o.id)));
        }
    };

    const toggleSelectRow = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handlePlanShipment = async () => {
        if (selectedIds.size === 0) return;
        setPlanningLoading(true);
        const result = await planShipment(Array.from(selectedIds));
        setPlanningLoading(false);
        if (result.success) {
            setSelectedIds(new Set());
            window.location.reload();
        } else {
            alert("Failed to plan shipment");
        }
    };

    const handleReleaseToWms = async () => {
        if (selectedIds.size === 0) return;
        setReleasingLoading(true);
        // Process sequentially or in parallel? Parallel is fine for now
        for (const id of Array.from(selectedIds)) {
            await releaseOrderToWarehouse(id);
        }
        setReleasingLoading(false);
        setSelectedIds(new Set());
        window.location.reload();
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "DRAFT": return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
            case "CONFIRMED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "PLANNED": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
            case "RELEASED": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "PICKING": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
            case "SHIPPED": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
            case "IN_TRANSIT": return "bg-sky-500/10 text-sky-500 border-sky-500/20";
            case "DELIVERED": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "INVOICED": return "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
            default: return "bg-neutral-500/10 text-neutral-500";
        }
    };



    const handleOverseerOverride = (reason: string) => {
        if (!overseerTarget) return;

        console.log(`[OVERSEER AUDIT] User forced change on Order ${overseerTarget.id} [${overseerTarget.field}]. Reason: ${reason}`);

        // Optimistically update local state
        setLocalOrders(prev => prev.map(o => {
            if (o.id === overseerTarget.id) {
                // Determine new value - for demo we just cycle or set a specific "OVERRIDE" status
                // If it was DELIVERED, maybe we reset to CONFIRMED? 
                // Let's just prompt/simulate a toggle for now or set to "CRITICAL"
                // Ideally the Modal would ask for the *New Value*, but we simplified it.
                // Let's assume we are setting it to "PAUSED" or "OVERRIDE" for demo visual
                // Or better, let's just cycle it for the demo
                const newStatus = "CRITICAL_OVERRIDE" as any;
                return { ...o, status: newStatus };
            }
            return o;
        }));

        setOverseerTarget(null);
    };

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] text-xs text-[var(--text-primary)]">
            {/* Toolbar */}
            <div className="flex h-10 items-center justify-between border-b border-[var(--border-color)] px-3 bg-[var(--bg-panel-header)]">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 h-3 w-3 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search orders..."
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
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <>
                            <button
                                onClick={handleReleaseToWms}
                                disabled={releasingLoading}
                                className="flex h-7 items-center gap-1 rounded-sm bg-purple-600 px-2 text-white hover:bg-purple-500 font-medium disabled:opacity-50"
                            >
                                {releasingLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageOpen className="h-3 w-3" />}
                                <span>Release ({selectedIds.size})</span>
                            </button>
                            <button
                                onClick={handlePlanShipment}
                                disabled={planningLoading}
                                className="flex h-7 items-center gap-1 rounded-sm bg-blue-600 px-2 text-white hover:bg-blue-500 font-medium disabled:opacity-50"
                            >
                                {planningLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                                <span>Plan Ship ({selectedIds.size})</span>
                            </button>
                        </>
                    )}
                    <div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex h-7 items-center gap-1 rounded-sm bg-[var(--accent-color)] px-2 text-white hover:opacity-90 font-medium"
                        >
                            <Plus className="h-3 w-3" />
                            <span>Create</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="flex h-8 w-full items-center border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] font-medium text-[var(--text-secondary)]">
                <div className="w-8 flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="rounded border-[var(--border-color)] bg-[var(--bg-input)]"
                        checked={sortedOrders.length > 0 && selectedIds.size === sortedOrders.length}
                        onChange={toggleSelectAll}
                    />
                </div>
                <div className="w-32 px-3 cursor-pointer hover:text-[var(--text-primary)] flex items-center gap-1" onClick={() => handleSort("id")}>
                    Order ID {sortField === "id" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                </div>
                <div className="w-32 px-3 border-l border-[var(--border-color)]">Remote Ref</div>
                <div className="w-24 px-3 border-l border-[var(--border-color)]">Status</div>
                <div className="flex-1 px-3 border-l border-[var(--border-color)]">Customer</div>
                <div className="w-24 px-3 border-l border-[var(--border-color)] text-right">Value</div>
                <div className="w-32 px-3 border-l border-[var(--border-color)]">Date</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
                {sortedOrders.map((order) => (
                    <div
                        key={order.id}
                        className="group flex h-9 w-full cursor-pointer items-center border-b border-[var(--border-color)] hover:bg-[var(--item-hover-bg)]"
                        onClick={(e) => {
                            // Prevent row click if clicking checkbox 
                            if ((e.target as HTMLElement).tagName === "INPUT") return;
                            onRowClick?.(order.id);
                        }}
                    >
                        <div className="w-8 flex items-center justify-center">
                            <input
                                type="checkbox"
                                className="rounded border-[var(--border-color)] bg-[var(--bg-input)]"
                                checked={selectedIds.has(order.id)}
                                onChange={() => toggleSelectRow(order.id)}
                            />
                        </div>
                        <div className="w-32 px-3 font-mono text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] transition-colors">
                            {order.id}
                        </div>
                        <div className="w-32 px-3 font-mono text-[var(--text-muted)] text-[10px]">
                            {order.erpReference}
                        </div>
                        <div className="w-24 px-3">
                            <span
                                onClick={(e) => {
                                    if (isOverseerMode) {
                                        e.stopPropagation();
                                        setOverseerTarget({ id: order.id, field: "status", current: order.status });
                                    }
                                }}
                                className={cn(
                                    "inline-flex items-center rounded-none border px-1.5 py-0.5 text-[10px] uppercase font-medium transition-all",
                                    getStatusColor(order.status),
                                    isOverseerMode && "cursor-pointer hover:scale-105 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)] border-red-500/50"
                                )}>
                                {order.status}
                            </span>
                        </div>
                        <div className="flex-1 px-3 text-[var(--text-primary)]">
                            {order.customerName}
                        </div>
                        <div className="w-24 px-3 text-right font-mono text-[var(--text-secondary)]">
                            ${order.totalValue.toLocaleString()}
                        </div>
                        <div className="w-32 px-3 text-[var(--text-muted)] text-[10px]">
                            {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <CreateOrderModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        window.location.reload();
                    }}
                />
            )}

            <OverseerModal
                isOpen={!!overseerTarget}
                onClose={() => setOverseerTarget(null)}
                onConfirm={handleOverseerOverride}
                title={`Override Order ${overseerTarget?.id}`}
                description={`You are about to forcibly change the ${overseerTarget?.field} of this order. This will bypass all validation rules.`}
                originalValue={overseerTarget?.current}
                newValue="FORCED_UPDATE"
            />
        </div>
    );
}
