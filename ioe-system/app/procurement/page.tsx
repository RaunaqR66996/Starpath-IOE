"use client"

import React, { useState } from "react";
import { PurchaseOrderGrid } from "@/components/ioe/procurement/PurchaseOrderGrid";
import { MRPDashboard } from "@/components/ioe/procurement/MRPDashboard";
import { cn } from "@/lib/utils";

export default function ProcurementPage() {
    const [activeTab, setActiveTab] = useState<'orders' | 'planning'>('orders');

    return (
        <div className="h-full w-full bg-black flex flex-col">
            {/* Sub-navigation */}
            <div className="flex border-b border-neutral-800 px-6 gap-6 bg-neutral-900/20">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={cn(
                        "py-3 text-xs font-bold tracking-wider transition-all border-b-2",
                        activeTab === 'orders' ? "text-blue-500 border-blue-500" : "text-neutral-500 border-transparent hover:text-neutral-300"
                    )}
                >
                    PURCHASE ORDERS
                </button>
                <button
                    onClick={() => setActiveTab('planning')}
                    className={cn(
                        "py-3 text-xs font-bold tracking-wider transition-all border-b-2",
                        activeTab === 'planning' ? "text-blue-500 border-blue-500" : "text-neutral-500 border-transparent hover:text-neutral-300"
                    )}
                >
                    PLANNING (MRP)
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                {activeTab === 'orders' ? <PurchaseOrderGrid /> : <div className="p-6"><MRPDashboard /></div>}
            </div>
        </div>
    );
}
