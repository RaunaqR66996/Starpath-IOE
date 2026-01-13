"use client";

import React, { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, AlertCircle, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePOModal } from "./CreatePOModal";
import { ReceivePOModal } from "./ReceivePOModal";
import { getPurchaseOrders } from "@/app/actions/procurement-actions";

interface PO {
    id: string;
    poNumber: string;
    supplierName: string;
    status: string;
    totalQty: number;
    totalCost: number;
    createdAt: string;
}

export function PurchaseOrderGrid() {
    const [orders, setOrders] = useState<PO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [receivePoId, setReceivePoId] = useState<string | null>(null);

    // Mock Fetch
    const fetchData = async () => {
        setLoading(true);
        const data = await getPurchaseOrders();
        setOrders(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex flex-col h-full bg-black text-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Procurement</h1>
                    <p className="text-neutral-500 text-sm">Manage suppliers and inbound purchase orders</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" /> Create PO
                </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <input
                        placeholder="Search POs, Suppliers, SKUs..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {['ALL', 'DRAFT', 'ISSUED', 'RECEIVED'].map((status) => (
                        <button key={status} className="px-3 py-1.5 rounded border border-neutral-800 text-xs font-medium hover:bg-neutral-800">
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border border-neutral-800 rounded-lg overflow-hidden flex-1 bg-neutral-900/10">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                        <tr>
                            <th className="px-4 py-3 font-medium">PO Number</th>
                            <th className="px-4 py-3 font-medium">Supplier</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium text-right">Qty</th>
                            <th className="px-4 py-3 font-medium text-right">Value</th>
                            <th className="px-4 py-3 font-medium">Created</th>
                            <th className="px-4 py-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-neutral-500">Loading procurement data...</td></tr>
                        ) : orders.map((po) => (
                            <tr key={po.id} className="hover:bg-neutral-900/40 transition-colors cursor-pointer group">
                                <td className="px-4 py-3 font-mono text-blue-400 group-hover:text-blue-300">{po.poNumber}</td>
                                <td className="px-4 py-3">{po.supplierName}</td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                                        po.status === "ISSUED" && "border-blue-900 bg-blue-900/20 text-blue-400",
                                        po.status === "PARTIAL" && "border-amber-900 bg-amber-900/20 text-amber-400",
                                        po.status === "RECEIVED" && "border-emerald-900 bg-emerald-900/20 text-emerald-400"
                                    )}>
                                        {po.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-mono">{po.totalQty}</td>
                                <td className="px-4 py-3 text-right font-mono text-neutral-400">${po.totalCost.toLocaleString()}</td>
                                <td className="px-4 py-3 text-neutral-500">{new Date(po.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    {(po.status === 'ISSUED' || po.status === 'PARTIAL') && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setReceivePoId(po.id); }}
                                            className="bg-emerald-800/50 hover:bg-emerald-800 text-emerald-300 text-[10px] px-2 py-1 rounded border border-emerald-800 transition-colors"
                                        >
                                            Receive
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <CreatePOModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        fetchData();
                        setShowCreateModal(false);
                    }}
                />
            )}

            {receivePoId && (
                <ReceivePOModal
                    poId={receivePoId}
                    onClose={() => setReceivePoId(null)}
                    onSuccess={() => {
                        fetchData();
                        setReceivePoId(null);
                    }}
                />
            )}
        </div>
    );
}
