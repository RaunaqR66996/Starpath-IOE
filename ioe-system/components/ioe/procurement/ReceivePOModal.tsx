"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, Package } from "lucide-react";
import { receivePurchaseOrder } from "@/app/actions/receiving-actions";
import { getPurchaseOrder } from "@/app/actions/procurement-actions";
import { cn } from "@/lib/utils";

interface ReceivePOModalProps {
    poId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function ReceivePOModal({ poId, onClose, onSuccess }: ReceivePOModalProps) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [po, setPo] = useState<any>(null);
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
    const [targetLocation, setTargetLocation] = useState("INBOUND-DOCK");

    useEffect(() => {
        getPurchaseOrder(poId).then(data => {
            if (data) {
                setPo(data);
                // Initialize default receive quantities (Remaining qty)
                const initialQtys: Record<string, number> = {};
                data.lines.forEach((line: any) => {
                    const remaining = Math.max(0, line.qtyOrdered - line.qtyReceived);
                    if (remaining > 0) {
                        initialQtys[line.itemId] = remaining;
                    }
                });
                setReceivedQuantities(initialQtys);
            }
            setLoading(false);
        });
    }, [poId]);

    const handleQtyChange = (itemId: string, val: string) => {
        const qty = parseInt(val) || 0;
        setReceivedQuantities(prev => ({ ...prev, [itemId]: qty }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Construct items payload
            const itemsToReceive = Object.entries(receivedQuantities)
                .filter(([_, qty]) => qty > 0)
                .map(([itemId, qty]) => ({
                    itemId,
                    qty,
                    locationId: targetLocation
                }));

            if (itemsToReceive.length === 0) {
                alert("Please enter at least one quantity to receive.");
                setSubmitting(false);
                return;
            }

            const result = await receivePurchaseOrder(poId, itemsToReceive);

            if (result.success) {
                onSuccess();
                onClose();
            } else {
                alert("Failed: " + result.error);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        );
    }

    if (!po) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[600px] rounded-lg border border-neutral-800 bg-neutral-900 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 bg-neutral-950 rounded-t-lg">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-400" />
                            Receive PO: {po.poNumber}
                        </h2>
                        <span className="text-xs text-neutral-500">{po.supplier.name}</span>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700/50">
                        <label className="text-xs font-medium text-neutral-400 block mb-1">Target Location</label>
                        <select
                            value={targetLocation}
                            onChange={(e) => setTargetLocation(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white w-full focus:outline-none focus:border-blue-500"
                        >
                            <option value="INBOUND-DOCK">INBOUND-DOCK</option>
                            <option value="RECV-STAGE-01">RECV-STAGE-01</option>
                            <option value="QC-AREA">QC-AREA</option>
                        </select>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-neutral-500 border-b border-neutral-800 uppercase bg-neutral-950/30">
                            <tr>
                                <th className="px-2 py-2">Item / SKU</th>
                                <th className="px-2 py-2 text-right">Ordered</th>
                                <th className="px-2 py-2 text-right">Received</th>
                                <th className="px-2 py-2 text-right">To Receive</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {po.lines.map((line: any) => {
                                const remaining = Math.max(0, line.qtyOrdered - line.qtyReceived);
                                const isFullyReceived = remaining === 0;

                                return (
                                    <tr key={line.id} className={cn("hover:bg-neutral-800/30", isFullyReceived ? "opacity-50" : "")}>
                                        <td className="px-2 py-3">
                                            <div className="font-medium text-neutral-200">{line.item.sku}</div>
                                            <div className="text-[10px] text-neutral-500">{line.item.name}</div>
                                        </td>
                                        <td className="px-2 py-3 text-right font-mono text-neutral-400">{line.qtyOrdered}</td>
                                        <td className="px-2 py-3 text-right font-mono text-green-400">{line.qtyReceived}</td>
                                        <td className="px-2 py-3 text-right">
                                            <input
                                                type="number"
                                                min="0"
                                                max={remaining}
                                                disabled={isFullyReceived}
                                                value={receivedQuantities[line.itemId] || 0}
                                                onChange={(e) => handleQtyChange(line.itemId, e.target.value)}
                                                className="w-20 bg-black border border-neutral-700 rounded px-2 py-1 text-right text-white focus:outline-none focus:border-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-neutral-800 bg-neutral-950 rounded-b-lg flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 rounded bg-blue-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                        Confirm Receipt
                    </button>
                </div>
            </div>
        </div>
    );
}
