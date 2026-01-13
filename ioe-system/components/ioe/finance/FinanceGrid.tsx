"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Clock,
    CheckCircle2,
    TrendingUp,
    DollarSign,
    Search,
    Filter,
    ArrowUpRight
} from "lucide-react";
import { getInvoices, markAsPaid } from "@/app/actions/invoice-actions";
import { cn } from "@/lib/utils";
import { DocumentGenerator } from "../DocumentGenerator";
import { Invoice } from "@/lib/types";

export function FinanceGrid() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchInvoices = async () => {
        setLoading(true);
        const data = await getInvoices();
        setInvoices(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleMarkPaid = async (id: string) => {
        const res = await markAsPaid(id);
        if (res.success) {
            fetchInvoices();
        }
    };

    const stats = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const outstanding = invoices
            .filter(inv => inv.status !== 'PAID')
            .reduce((sum, inv) => sum + inv.amount, 0);
        const paidCount = invoices.filter(inv => inv.status === 'PAID').length;

        const formatCurrency = (val: number) => {
            if (val >= 1000) {
                return `$${(val / 1000).toFixed(1)}K`;
            }
            return `$${val.toLocaleString()}`;
        };

        return [
            {
                label: "Total Revenue",
                value: formatCurrency(totalRevenue),
                change: "+12.5%", // Todo: Calculate vs last month
                icon: DollarSign,
                color: "text-blue-500"
            },
            {
                label: "Outstanding",
                value: formatCurrency(outstanding),
                change: "-2.3%",
                icon: Clock,
                color: "text-amber-500"
            },
            {
                label: "Paid Invoices",
                value: paidCount.toString(),
                change: "+48",
                icon: CheckCircle2,
                color: "text-emerald-500"
            },
            {
                label: "Avg. Collection",
                value: "14 Days",
                change: "-2d",
                icon: TrendingUp,
                color: "text-purple-500"
            },
        ];
    }, [invoices]);

    return (
        <div className="flex flex-col h-full bg-black text-white p-6 overflow-hidden">
            {/* Stats Header */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className={cn("p-2 rounded-lg bg-black", stat.color)}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                {stat.change}
                            </span>
                        </div>
                        <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                        <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* List Control */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search invoices, customers..."
                        className="bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs w-80 focus:outline-none focus:border-blue-500 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:bg-neutral-800 transition-all">
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-all">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="flex-1 overflow-auto border border-neutral-800 rounded-xl bg-neutral-900/20">
                <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-neutral-950 text-neutral-500 font-bold uppercase tracking-widest text-[10px] border-b border-neutral-800">
                        <tr>
                            <th className="px-6 py-4">Invoice</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Due Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={6} className="px-6 py-8 bg-neutral-900/10"></td>
                                </tr>
                            ))
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-neutral-500 italic">
                                    No invoices found. Generate an invoice from an order to see it here.
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-neutral-800/30 transition-colors group">
                                    <td className="px-6 py-4 font-mono font-bold text-blue-400">
                                        {inv.invoiceNumber}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{inv.order.customerName}</div>
                                        <div className="text-[10px] text-neutral-500">{inv.order.erpReference}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold">
                                        ${inv.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-neutral-400">
                                        {new Date(inv.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                                            inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                                                inv.status === "UNPAID" ? "bg-amber-500/10 text-amber-500" :
                                                    "bg-red-500/10 text-red-500"
                                        )}>
                                            {inv.status === "PAID" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {inv.status !== "PAID" && (
                                                <button
                                                    onClick={() => handleMarkPaid(inv.id)}
                                                    className="px-2 py-1 bg-emerald-600 rounded text-[10px] font-bold hover:bg-emerald-500"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                            <DocumentGenerator
                                                type="INVOICE"
                                                data={inv}
                                                label="View"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
