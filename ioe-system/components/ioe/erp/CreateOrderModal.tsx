"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createOrder } from "@/app/actions/order-actions";

interface CreateOrderModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateOrderModal({ onClose, onSuccess }: CreateOrderModalProps) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);

        const result = await createOrder(formData);
        setLoading(false);

        if (result.success) {
            onSuccess();
            onClose();
        } else {
            alert("Failed to create order");
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[400px] rounded-lg border border-neutral-800 bg-neutral-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                    <h2 className="text-sm font-bold text-white">Create New Order</h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400">Customer Name</label>
                        <select name="customerName" className="w-full rounded bg-black border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                            <option value="Acme Corp">Acme Corp</option>
                            <option value="Globex Inc">Globex Inc</option>
                            <option value="Soylent Corp">Soylent Corp</option>
                            <option value="Initech">Initech</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-400">SKU</label>
                            <input name="itemId" defaultValue="SKU-1001" className="w-full rounded bg-black border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-400">Quantity</label>
                            <input name="qty" type="number" defaultValue="10" className="w-full rounded bg-black border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400">Priority</label>
                        <select name="priority" className="w-full rounded bg-black border border-neutral-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white">Cancel</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50"
                        >
                            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                            Create Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
