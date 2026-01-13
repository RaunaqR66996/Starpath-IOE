"use client";

import React, { useState } from "react";
import { Customer } from "@/lib/types";
import { Search, Filter, MapPin, Award } from "lucide-react";

interface CustomerGridProps {
    customers: Customer[];
}

export function CustomerGrid({ customers }: CustomerGridProps) {
    const [filterText, setFilterText] = useState("");

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(filterText.toLowerCase()) ||
        c.id.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <div className="flex h-full flex-col bg-black text-xs text-neutral-300">
            {/* Toolbar */}
            <div className="flex h-10 items-center justify-between border-b border-neutral-800 px-3 bg-neutral-950/50">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 h-3 w-3 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="h-7 w-64 rounded-sm border border-neutral-800 bg-black pl-7 pr-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
                        />
                    </div>
                </div>
                <div className="text-neutral-500">
                    {filteredCustomers.length} records
                </div>
            </div>

            {/* Header */}
            <div className="flex h-8 w-full items-center border-b border-neutral-800 bg-neutral-900/50 font-medium text-neutral-400">
                <div className="w-32 px-3">Customer ID</div>
                <div className="flex-1 px-3 border-l border-neutral-800/50">Name</div>
                <div className="w-32 px-3 border-l border-neutral-800/50">Tier</div>
                <div className="flex-1 px-3 border-l border-neutral-800/50">Location</div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {filteredCustomers.map(cust => (
                    <div key={cust.id} className="flex h-10 w-full items-center border-b border-neutral-800 hover:bg-neutral-900">
                        <div className="w-32 px-3 font-mono text-neutral-500">{cust.id}</div>
                        <div className="flex-1 px-3 text-white font-medium">{cust.name}</div>
                        <div className="w-32 px-3 flex items-center gap-2">
                            {cust.tier === "Strategic" && <Award className="h-3 w-3 text-amber-500" />}
                            {cust.tier === "Premuim" && <Award className="h-3 w-3 text-blue-400" />}
                            <span>{cust.tier}</span>
                        </div>
                        <div className="flex-1 px-3 flex items-center gap-2 text-neutral-400">
                            <MapPin className="h-3 w-3" />
                            {cust.defaultAddress.city}, {cust.defaultAddress.state}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
