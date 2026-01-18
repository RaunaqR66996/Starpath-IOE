"use client";

import React, { useState } from "react";
import { X, Loader2, Calendar, MapPin, DollarSign, FileText } from "lucide-react";
import { createOrder } from "@/app/actions/order-actions";
import { cn } from "@/lib/utils";

interface CreateOrderModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateOrderModal({ onClose, onSuccess }: CreateOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "shipping" | "financials">("general");

    const [formState, setFormState] = useState({
        customerName: "Acme Corp",
        poNumber: "",
        shipRelease: true,
        orderDate: new Date().toISOString().split('T')[0],
        warehouse: "NAL - North American Logistics",
        shipTo: "Default Location",
        terms: "Net 30",
        originatingSite: "USDISP",
        itemId: "SKU-1001",
        qty: 10,
        priority: "NORMAL",
        lcr: "",
        externalOrder: false
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // Handle checkboxes safely
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormState(prev => ({
            ...prev,
            [name]: checked !== undefined ? checked : value
        }));
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        // Map simplified state to FormData for the server action
        const formData = new FormData();
        Object.entries(formState).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

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
            <div className="w-[800px] h-[600px] flex flex-col rounded-lg border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex h-12 items-center justify-between border-b border-neutral-800 px-4 bg-neutral-800/50">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-wide">New Customer Order</h2>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-800 bg-black/20 px-4 pt-2 gap-1">
                    {[
                        { id: "general", label: "General & Lines" },
                        { id: "shipping", label: "Shipping & Address" },
                        { id: "financials", label: "Financials & Tax" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "px-4 py-2 text-xs font-medium rounded-t-md transition-colors",
                                activeTab === tab.id
                                    ? "bg-neutral-800 text-white border-t border-x border-neutral-700 relative -bottom-px"
                                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">

                    {/* General Tab */}
                    {activeTab === "general" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Customer</label>
                                    <select
                                        name="customerName"
                                        value={formState.customerName}
                                        onChange={handleInputChange}
                                        className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="Acme Corp">Acme Corp</option>
                                        <option value="Globex Inc">Globex Inc</option>
                                        <option value="Soylent Corp">Soylent Corp</option>
                                        <option value="Initech">Initech</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Cust PO</label>
                                    <input
                                        name="poNumber"
                                        value={formState.poNumber}
                                        onChange={handleInputChange}
                                        placeholder="PO-0000..."
                                        className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none placeholder:text-neutral-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Order Type</label>
                                    <select className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                                        <option>Regular Order</option>
                                        <option>Consignment</option>
                                        <option>Transfer</option>
                                        <option>Return (RMA)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Order Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
                                        <input
                                            type="date"
                                            name="orderDate"
                                            value={formState.orderDate}
                                            onChange={handleInputChange}
                                            className="w-full rounded bg-black border border-neutral-700 pl-8 pr-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Req. Ship Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
                                        <input
                                            type="date"
                                            className="w-full rounded bg-black border border-neutral-700 pl-8 pr-2 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Warehouse</label>
                                    <select
                                        name="warehouse"
                                        value={formState.warehouse}
                                        onChange={handleInputChange}
                                        className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="NAL - North American Logistics">NAL - North American Logistics</option>
                                        <option value="EUR - Rotterdam Central">EUR - Rotterdam Central</option>
                                        <option value="APAC - Singapore Hub">APAC - Singapore Hub</option>
                                    </select>
                                </div>
                            </div>

                            {/* Line Items Section - Simplified for Demo */}
                            <div className="rounded border border-neutral-800 bg-neutral-950 p-4 space-y-4">
                                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 pb-2">Line Details</h3>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-4 space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-neutral-500">Item / SKU</label>
                                        <input
                                            name="itemId"
                                            value={formState.itemId}
                                            onChange={handleInputChange}
                                            className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-neutral-500">Qty</label>
                                        <input
                                            type="number"
                                            name="qty"
                                            value={formState.qty}
                                            onChange={handleInputChange}
                                            className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none text-right"
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-neutral-500">UOM</label>
                                        <select className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                                            <option>EA (Each)</option>
                                            <option>CS (Case)</option>
                                            <option>PL (Pallet)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-3 space-y-1.5">
                                        <label className="text-[10px] uppercase font-bold text-neutral-500">Allocated</label>
                                        <input disabled value="0" className="w-full rounded bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-500 text-right cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shipping Tab */}
                    {activeTab === "shipping" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Shipto ID</label>
                                    <div className="flex gap-2">
                                        <input
                                            value="1"
                                            readOnly
                                            className="w-16 rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white text-center"
                                        />
                                        <select
                                            name="shipTo"
                                            value={formState.shipTo}
                                            onChange={handleInputChange}
                                            className="flex-1 rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                        >
                                            <option>L'OREAL FLORENCE</option>
                                            <option>DC - CHICAGO NORTH</option>
                                            <option>RETAIL - NYC 5TH AVE</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Originating Site</label>
                                    <input
                                        name="originatingSite"
                                        value={formState.originatingSite}
                                        onChange={handleInputChange}
                                        className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="rounded border border-neutral-800 bg-neutral-950 p-4">
                                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5" /> Address Preview
                                </h3>
                                <div className="text-sm font-mono text-neutral-300 space-y-1 p-3 bg-black rounded border border-neutral-900">
                                    <p>L'OREAL USA PRODUCTS, INC</p>
                                    <p>FLORENCE PLANT</p>
                                    <p>PO BOX 1529</p>
                                    <p>MAIL STOP 826</p>
                                    <p>BOUNTIFUL, UT 84011-1529</p>
                                    <p>United States</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <label className="flex items-center gap-2 p-3 rounded border border-neutral-800 hover:bg-neutral-800/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="shipRelease"
                                        checked={formState.shipRelease}
                                        onChange={handleInputChange}
                                        className="rounded border-neutral-700 bg-black text-blue-500 focus:ring-offset-black"
                                    />
                                    <span className="text-sm font-medium text-white">Ship Release</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 rounded border border-neutral-800 hover:bg-neutral-800/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="externalOrder"
                                        checked={formState.externalOrder}
                                        onChange={handleInputChange}
                                        className="rounded border-neutral-700 bg-black text-blue-500 focus:ring-offset-black"
                                    />
                                    <span className="text-sm font-medium text-white">External Order (EDI)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Financials Tab */}
                    {activeTab === "financials" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Terms</label>
                                    <select
                                        name="terms"
                                        value={formState.terms}
                                        onChange={handleInputChange}
                                        className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                    >
                                        <option value="Net 30">Net 30</option>
                                        <option value="Net 45">Net 45</option>
                                        <option value="Net 60">Net 60</option>
                                        <option value="COD">COD</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Currency</label>
                                    <input value="USD" readOnly className="w-full rounded bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Tax Schedule</label>
                                    <select className="w-full rounded bg-black border border-neutral-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                                        <option>AVATAX-STD</option>
                                        <option>EXEMPT</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-emerald-900/30 text-emerald-400">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-emerald-400/70 uppercase">Est. Total Price</div>
                                        <div className="text-xl font-mono font-bold text-emerald-400">13,251.60</div>
                                    </div>
                                </div>
                                <div className="text-xs text-emerald-600 font-mono">
                                    Includes Tax & Estimated Freight
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Actions */}
                <div className="border-t border-neutral-800 p-4 bg-neutral-900 flex justify-between items-center">
                    <div className="text-xs text-neutral-500">
                        {activeTab === 'general' ? 'Step 1 of 3' : activeTab === 'shipping' ? 'Step 2 of 3' : 'Step 3 of 3'}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                const form = document.querySelector('form');
                                if (form) form.requestSubmit();
                            }}
                            disabled={loading}
                            className="flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50 shadow-lg shadow-white/10 transition-all"
                        >
                            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                            Create Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
