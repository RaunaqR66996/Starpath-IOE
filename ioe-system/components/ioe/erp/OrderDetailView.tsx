"use client";

import React, { useEffect, useState } from "react";
import { Order } from "@/lib/types";
import { Package, Truck, Clock, AlertCircle, FileText, MapPin, DollarSign, Building } from "lucide-react";
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
    const [activeTab, setActiveTab] = useState<"general" | "shipping" | "financials">("general");

    const fetchTasks = () => {
        fetch('/api/tasks')
            .then(res => res.json())
            .then(data => {
                const orderTasks = data.filter((t: any) => t.orderId === orderId);
                setTasks(orderTasks);
            });
    };

    const handleGenerateTasks = async () => {
        if (!order) return;

        const taskTypes = ['CREDIT_CHECK', 'PICK', 'PACK', 'SHIP_RELEASE'];

        for (const type of taskTypes) {
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
                            <span className="text-[var(--text-muted)]">•</span>
                            <span className="font-mono text-emerald-400">PO-998877</span>
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

            {/* Tab Navigation */}
            <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] px-6 pt-2 gap-4">
                {[
                    { id: "general", label: "General & Lines", icon: FileText },
                    { id: "shipping", label: "Shipping & Logistics", icon: Truck },
                    { id: "financials", label: "Financials & Tax", icon: DollarSign }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors",
                            activeTab === tab.id
                                ? "border-[var(--accent-color)] text-[var(--text-primary)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        )}
                    >
                        <tab.icon className="h-3 w-3" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">

                {/* General Tab */}
                {activeTab === "general" && (
                    <div className="grid grid-cols-3 gap-6">
                        {/* Header Info Block */}
                        <div className="col-span-3 grid grid-cols-4 gap-4 mb-2">
                            <div className="p-3 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Originating Site</label>
                                <div className="text-sm font-medium mt-1 flex items-center gap-2">
                                    <Building className="h-3 w-3 text-neutral-500" />
                                    USDISP
                                </div>
                            </div>
                            <div className="p-3 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Warehouse</label>
                                <div className="text-sm font-medium mt-1">NAL - North American Logistics</div>
                            </div>
                            <div className="p-3 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Order Date</label>
                                <div className="text-sm font-medium mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="p-3 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Req. Ship Date</label>
                                <div className="text-sm font-medium mt-1">{new Date(order.requestedDeliveryDate).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Main Line Items */}
                        <div className="col-span-2 space-y-6">
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] overflow-hidden">
                                <div className="bg-[var(--item-active-bg)] px-4 py-3 border-b border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] flex justify-between items-center">
                                    <span>Line Items</span>
                                    <span className="text-xs text-[var(--text-muted)]">{order.lines.length} Lines</span>
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
                                                    <div className="text-xs text-[var(--text-muted)]">Qty: {line.qtyOrdered} EA</div>
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

                        {/* Right Sidebar (Execution) */}
                        <div className="space-y-6">
                            {/* Execution Status */}
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
                                            Release to Warehouse
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
                                        Awaiting Release
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Shipping Tab */}
                {activeTab === "shipping" && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Truck className="h-3 w-3" /> Ship To Address
                            </h3>
                            <div className="text-sm font-mono text-[var(--text-primary)] space-y-1 p-3 bg-black/50 rounded border border-[var(--border-color)]">
                                <div className="text-xs text-[var(--text-muted)] mb-2">ID: 1 - Default Location</div>
                                <p>{order.destination.street}</p>
                                <p>{order.destination.city}, {order.destination.state} {order.destination.zip}</p>
                                <p className="text-[var(--text-muted)]">{order.destination.country}</p>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <input type="checkbox" checked readOnly className="rounded border-neutral-700 bg-neutral-900 text-blue-500" />
                                <span className="text-sm text-neutral-400">Ship Complete Only</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Truck className="h-3 w-3" /> Bill To Address
                            </h3>
                            <div className="text-sm font-mono text-[var(--text-primary)] space-y-1 p-3 bg-black/50 rounded border border-[var(--border-color)]">
                                <div className="text-xs text-[var(--text-muted)] mb-2">ID: BILLSHA-01 (Headquarters)</div>
                                <p>L'OREAL USA PRODUCTS, INC</p>
                                <p>ACCOUNTS PAYABLE</p>
                                <p>PO BOX 1529</p>
                                <p>BOUNTIFUL, UT 84011</p>
                            </div>
                        </div>

                        {order.shipmentId && (
                            <div className="col-span-2 rounded-xl border border-dotted border-[var(--border-color)] bg-[var(--bg-panel-header)] p-4">
                                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Freight Details</h3>
                                <div className="flex items-center gap-8">
                                    <div>
                                        <div className="text-[10px] text-[var(--text-muted)]">Carrier</div>
                                        <div className="text-sm font-medium">FEDEX FREIGHT</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[var(--text-muted)]">Pro Number</div>
                                        <div className="text-sm font-medium font-mono">PRO-9988776655</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-[var(--text-muted)]">Terms</div>
                                        <div className="text-sm font-medium">PREPAID</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Financials Tab */}
                {activeTab === "financials" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <div className="text-[10px] text-[var(--text-muted)] uppercase">Payment Terms</div>
                                <div className="text-lg font-medium">Net 30</div>
                            </div>
                            <div className="p-4 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <div className="text-[10px] text-[var(--text-muted)] uppercase">Currency</div>
                                <div className="text-lg font-medium">USD</div>
                            </div>
                            <div className="p-4 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <div className="text-[10px] text-[var(--text-muted)] uppercase">Tax Schedule</div>
                                <div className="text-lg font-medium">AVATAX-STD</div>
                            </div>
                            <div className="p-4 bg-[var(--item-active-bg)] rounded border border-[var(--border-color)]">
                                <div className="text-[10px] text-[var(--text-muted)] uppercase">Credit Status</div>
                                <div className="text-lg font-medium text-emerald-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    APPROVED
                                </div>
                            </div>
                        </div>

                        <div className="w-1/2 p-6 bg-[var(--bg-panel-header)] rounded border border-[var(--border-color)]">
                            <h3 className="text-sm font-bold border-b border-[var(--border-color)] pb-2 mb-4">Total Breakdown</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Subtotal</span>
                                    <span>${(order.totalValue * 0.9).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Freight (Est)</span>
                                    <span>${(order.totalValue * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Tax</span>
                                    <span>${(order.totalValue * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="border-t border-[var(--border-color)] pt-2 mt-2 flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>${order.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

