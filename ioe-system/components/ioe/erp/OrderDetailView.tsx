"use client";

import React, { useEffect, useState } from "react";
import { Order } from "@/lib/types";
import { ChevronLeft, Package, Truck, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentGenerator } from "@/components/ioe/DocumentGenerator";
import { generateInvoice } from "@/app/actions/invoice-actions";
import { Loader2, CreditCard } from "lucide-react";

interface OrderDetailViewProps {
    orderId: string;
}

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
    const [order, setOrder] = useState<Order | null>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = () => {
        // Mock fetch for now as we might not have the filter implemented on API side yet
        // In reality: fetch(`/api/tasks?orderId=${orderId}`)
        // For now I'll just fetch all and filter client side or assume mock
        fetch('/api/tasks')
            .then(res => res.json())
            .then(data => {
                // Filter for this order (hack until API supports filter)
                const orderTasks = data.filter((t: any) => t.orderId === orderId);
                setTasks(orderTasks);
            });
    };

    const handleGenerateTasks = async () => {
        if (!order) return;

        const taskTypes = ['CREDIT_CHECK', 'PICK', 'PACK', 'SHIP_RELEASE'];

        for (const type of taskTypes) {
            // Create specific params for Pick tasks
            const extra = type === 'PICK' && order.lines.length > 0
                ? { itemId: order.lines[0].itemId, qty: order.lines[0].qtyOrdered, locationId: 'A-01-01' }
                : {};

            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    orderId: order.id,
                    priority: order.priority,
                    ...extra
                })
            });
        }
        fetchTasks();
    };

    const handleGenerateInvoice = async () => {
        if (!order) return;
        setLoading(true);
        const res = await generateInvoice(order.id);
        if (res.success) {
            // Re-fetch order to get invoice
            const fresh = await fetch(`/api/orders/${orderId}`).then(r => r.json());
            setOrder(fresh);
        }
        setLoading(false);
    };


    useEffect(() => {
        setLoading(true);
        fetch(`/api/orders/${orderId}`)
            .then(res => {
                if (!res.ok) throw new Error("Not found");
                return res.json();
            })
            .then(data => {
                setOrder(data);
                fetchTasks();
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [orderId]);

    if (loading) {
        return <div className="flex h-full items-center justify-center text-neutral-500">Loading Order {orderId}...</div>;
    }

    if (!order) {
        return <div className="flex h-full items-center justify-center text-red-500">Order not found.</div>;
    }

    return (
        <div className="flex h-full flex-col bg-[var(--bg-editor)] text-[var(--text-primary)]">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-[var(--border-color)] px-6 bg-[var(--bg-panel-header)]">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--item-active-bg)] text-[var(--text-muted)]">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">{order.id}</h1>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span>{order.customerName}</span>
                            <span className="text-[var(--text-muted)]">•</span>
                            <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <DocumentGenerator type="PICK_SLIP" data={order} label="Pick Slip" />
                    <DocumentGenerator type="PACKING_SLIP" data={order} label="Pack Slip" />
                    <DocumentGenerator type="COC" data={order} label="Compliance Cert" />

                    {order.invoice ? (
                        <DocumentGenerator type="INVOICE" data={order.invoice} label="Invoice" />
                    ) : (
                        <button
                            onClick={handleGenerateInvoice}
                            disabled={loading || order.status !== 'SHIPPED'}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                order.status === 'SHIPPED'
                                    ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                                    : "bg-[var(--item-active-bg)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]"
                            )}
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                            Generate Invoice
                        </button>
                    )}

                    <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ml-2",
                        order.status === "DRAFT" && "border-[var(--border-color)] bg-[var(--item-active-bg)] text-[var(--text-muted)]",
                        order.status === "CONFIRMED" && "border-blue-900 bg-blue-950/20 text-blue-400",
                        order.status === "SHIPPED" && "border-emerald-900 bg-emerald-950/20 text-emerald-400",
                    )}>
                        {order.status}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-6">

                    {/* Main Info */}
                    <div className="col-span-2 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                                <div className="text-xs text-[var(--text-muted)] mb-1">Total Value</div>
                                <div className="text-xl font-mono text-[var(--text-primary)]">${order.totalValue.toLocaleString()}</div>
                            </div>
                            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                                <div className="text-xs text-[var(--text-muted)] mb-1">Total Weight</div>
                                <div className="text-xl font-mono text-[var(--text-primary)]">{order.totalWeight} kg</div>
                            </div>
                            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                                <div className="text-xs text-[var(--text-muted)] mb-1">Priority</div>
                                <div className={cn("text-xl font-bold", order.priority === "HIGH" ? "text-amber-500" : "text-[var(--text-muted)]")}>
                                    {order.priority}
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] overflow-hidden">
                            <div className="bg-[var(--item-active-bg)] px-4 py-3 border-b border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)]">
                                Line Items
                            </div>
                            <div>
                                {order.lines.map((line) => (
                                    <div key={line.lineNumber} className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3 last:border-0 hover:bg-[var(--item-hover-bg)]">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-[var(--item-active-bg)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                                                {line.lineNumber}
                                            </div>
                                            <div>
                                                <div className="text-sm text-[var(--text-primary)] font-medium">{line.itemId}</div>
                                                <div className="text-xs text-[var(--text-muted)]">Qty: {line.qtyOrdered}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono text-[var(--text-secondary)]">${line.unitPrice}</div>
                                            <div className="text-xs text-emerald-500 font-medium">Allocated: {line.qtyAllocated}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        {/* Destination */}
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Truck className="h-3 w-3" /> Destination
                            </h3>
                            <div className="text-sm text-[var(--text-secondary)] space-y-1">
                                <p>{order.destination.street}</p>
                                <p>{order.destination.city}, {order.destination.state} {order.destination.zip}</p>
                                <p className="text-[var(--text-muted)]">{order.destination.country}</p>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Timeline
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)]">Requested Delivery</div>
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        {new Date(order.requestedDeliveryDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-[var(--text-muted)]">Created At</div>
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipment Info */}
                        {order.shipmentId && (
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Truck className="h-3 w-3" /> Shipment
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[10px] text-[var(--text-muted)]">Assigned Shipment</div>
                                        <div className="text-sm font-mono text-blue-400 cursor-pointer underline hover:text-blue-300"
                                            onClick={() => window.open(`/shipments/${order.shipmentId}`, '_blank')}>
                                            {/* Note: In a real app we would use a router or context to open the tab */}
                                            {order.shipmentId}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)] italic">
                                        Click to view shipment details
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Execution Tasks */}
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle className="h-3 w-3" /> Execution
                                </h3>
                                {tasks.length === 0 && (
                                    <button
                                        onClick={handleGenerateTasks}
                                        className="text-[10px] bg-emerald-900/50 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded hover:bg-emerald-900"
                                    >
                                        Start
                                    </button>
                                )}
                            </div>

                            {tasks.length > 0 ? (
                                <div className="space-y-2">
                                    {tasks.map((task, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded bg-[var(--item-hover-bg)] border border-[var(--border-color)]">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full",
                                                    task.status === 'COMPLETED' ? "bg-emerald-500" :
                                                        task.status === 'IN_PROGRESS' ? "bg-amber-500" : "bg-[var(--text-muted)]"
                                                )} />
                                                <span className="text-xs text-[var(--text-secondary)] font-mono">{task.type}</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--text-muted)]">{task.status}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[10px] text-[var(--text-muted)] italic py-2 text-center">
                                    No active tasks
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
