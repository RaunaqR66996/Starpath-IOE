"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Clock,
    CheckCircle2,
    TrendingUp,
    DollarSign,
    Search,
    Filter,
    ArrowUpRight,
    PieChart,
    BarChart3,
    MoreHorizontal,
    Mail,
    CreditCard,
    AlertCircle
} from "lucide-react";
import { getInvoices, markAsPaid } from "@/app/actions/invoice-actions";
import { cn } from "@/lib/utils";
import { DocumentGenerator } from "../DocumentGenerator";
import { Invoice } from "@/lib/types";

// --- Mock Data Removed ---
const mockCashFlow: any[] = [];
const mockBills: any[] = [];

// --- Sub-Components ---

function CashFlowWidget() {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl h-full flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 z-10">
                <div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Net Cash Flow (30d)</div>
                    <div className="text-2xl font-black tracking-tighter text-white mt-1">+$23,000</div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <BarChart3 className="h-4 w-4" />
                </div>
            </div>

            {/* Simple CSS Bar Chart */}
            <div className="flex-1 flex items-end justify-between gap-2 z-10">
                {mockCashFlow.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                        <div className="w-full flex gap-1 h-32 items-end justify-center">
                            {/* Inflow Bar */}
                            <div
                                style={{ height: `${(data.inflow / 70000) * 100}%` }}
                                className="w-3 bg-emerald-500/80 rounded-t-sm transition-all group-hover/bar:bg-emerald-400"
                            />
                            {/* Outflow Bar */}
                            <div
                                style={{ height: `${(data.outflow / 70000) * 100}%` }}
                                className="w-3 bg-red-500/80 rounded-t-sm transition-all group-hover/bar:bg-red-400"
                            />
                        </div>
                        <span className="text-[9px] text-neutral-500 font-mono uppercase">{data.month}</span>
                    </div>
                ))}
            </div>

            {/* Background Decor */}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="h-32 w-32 text-white" />
            </div>
        </div>
    );
}

function ARAgingWidget({ breakdown }: { breakdown: any }) {
    return (
        <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">A/R Aging Buckets</div>
                    <div className="text-2xl font-black tracking-tighter text-white mt-1">
                        ${(breakdown['0-30'] + breakdown['31-60'] + breakdown['61-90'] + breakdown['90+']).toLocaleString()}
                    </div>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    <Clock className="h-4 w-4" />
                </div>
            </div>

            <div className="flex-1 flex gap-2">
                {Object.entries(breakdown).map(([bucket, amount]: [string, any]) => (
                    <div key={bucket} className="flex-1 bg-neutral-900 rounded border border-neutral-800 p-2 flex flex-col justify-between hover:border-neutral-700 transition-colors cursor-pointer">
                        <span className={cn(
                            "text-[10px] font-bold uppercase",
                            bucket === '90+' ? 'text-red-500' :
                                bucket === '0-30' ? 'text-emerald-500' : 'text-amber-500'
                        )}>{bucket}</span>
                        <div className="text-sm font-mono font-bold">${(amount / 1000).toFixed(1)}k</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function APBillTable() {
    return (
        <div className="flex-1 overflow-auto border border-neutral-800 rounded-xl bg-neutral-900/20">
            <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-neutral-950 text-neutral-500 font-bold uppercase tracking-widest text-[10px] border-b border-neutral-800">
                    <tr>
                        <th className="px-6 py-4">Bill #</th>
                        <th className="px-6 py-4">Vendor</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                    {mockBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-neutral-400">{bill.id}</td>
                            <td className="px-6 py-4 font-bold">{bill.vendor}</td>
                            <td className="px-6 py-4 text-right font-mono text-red-400">-${bill.amount.toLocaleString()}</td>
                            <td className="px-6 py-4 text-neutral-400">{bill.due}</td>
                            <td className="px-6 py-4">
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                                    bill.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500" :
                                        bill.status === 'OVERDUE' ? "bg-red-500/10 text-red-500" : "bg-neutral-500/10 text-neutral-400"
                                )}>
                                    {bill.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-neutral-500 hover:text-white transition-colors">Pay Now</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- Main Component ---

export function FinanceGrid() {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'AR' | 'AP'>('OVERVIEW');
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

    // Derived State for Analytics
    const stats = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
        const outstanding = invoices
            .filter(inv => inv.status !== 'PAID')
            .reduce((sum, inv) => sum + inv.amount, 0);
        const paidCount = invoices.filter(inv => inv.status === 'PAID').length;

        // Mock Aging Calculation
        const agingBuckets = {
            '0-30': outstanding * 0.6,
            '31-60': outstanding * 0.25,
            '61-90': outstanding * 0.1,
            '90+': outstanding * 0.05
        };

        const formatCurrency = (val: number) => {
            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
            return `$${val.toLocaleString()}`;
        };

        return {
            revenue: { value: formatCurrency(totalRevenue), raw: totalRevenue },
            outstanding: { value: formatCurrency(outstanding), raw: outstanding },
            paid: paidCount,
            aging: agingBuckets
        };
    }, [invoices]);

    return (
        <div className="flex flex-col h-full bg-black text-white p-6 overflow-hidden">
            {/* Header & Tabs */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                    {['OVERVIEW', 'AR', 'AP'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                activeTab === tab
                                    ? "bg-neutral-800 text-white shadow-sm"
                                    : "text-neutral-500 hover:text-neutral-300"
                            )}
                        >
                            {tab === 'AR' ? 'Accounts Receivable' : tab === 'AP' ? 'Accounts Payable' : 'Overview'}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs hover:bg-neutral-800 transition-all">
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <DollarSign className="h-3.5 w-3.5" />
                        New Transaction
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 min-h-0">

                {/* Dashboard Row (Dynamic based on Tab) */}
                <div className="grid grid-cols-4 gap-4 flex-shrink-0 h-40">
                    {activeTab === 'AP' ? (
                        <>
                            {/* AP Specific KPIs (Mocked) */}
                            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col justify-center">
                                <div className="text-neutral-500 text-[10px] uppercase font-bold">Total Payables</div>
                                <div className="text-3xl text-white font-black tracking-tighter">$42,300</div>
                                <div className="text-red-500 text-xs mt-1 font-bold">+5.2% vs last month</div>
                            </div>
                            <div className="col-span-2">
                                <CashFlowWidget />
                            </div>
                            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col justify-center relative overflow-hidden">
                                <div className="z-10 relative">
                                    <div className="text-neutral-500 text-[10px] uppercase font-bold">DPO (Days Payable)</div>
                                    <div className="text-3xl text-white font-black tracking-tighter">28 Days</div>
                                    <div className="text-emerald-500 text-xs mt-1 font-bold">-2 days (Faster)</div>
                                </div>
                                <CreditCard className="absolute -right-2 -bottom-2 h-24 w-24 text-neutral-800 opacity-50 z-0" />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Standard/AR KPIs */}
                            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col justify-between">
                                <div className="flex justify-between">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><DollarSign className="h-4 w-4" /></div>
                                    <span className="text-emerald-500 text-[10px] font-bold">+12.5%</span>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white tracking-tighter">{stats.revenue.value}</div>
                                    <div className="text-[10px] text-neutral-500 uppercase font-bold">Total Revenue</div>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <ARAgingWidget breakdown={stats.aging} />
                            </div>

                            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col justify-between">
                                <div className="flex justify-between">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><CheckCircle2 className="h-4 w-4" /></div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black text-white tracking-tighter">{stats.paid}</div>
                                    <div className="text-[10px] text-neutral-500 uppercase font-bold">Paid Invoices</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Table Section */}
                {activeTab === 'AP' ? (
                    <APBillTable />
                ) : (
                    <div className="flex-1 overflow-auto border border-neutral-800 rounded-xl bg-neutral-900/20">
                        {/* Existing Invoice Table Logic with added Actions */}
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-neutral-950 text-neutral-500 font-bold uppercase tracking-widest text-[10px] border-b border-neutral-800 z-10">
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
                                        <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-8 bg-neutral-900/10"></td></tr>
                                    ))
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-20 text-center text-neutral-500 italic">No invoices found.</td></tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-neutral-800/30 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-bold text-blue-400">{inv.invoiceNumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold">{inv.order.customerName}</div>
                                                <div className="text-[10px] text-neutral-500">{inv.order.erpReference}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold">${inv.amount.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-neutral-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                                                    inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-500" :
                                                        inv.status === "UNPAID" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                                )}>
                                                    {inv.status === "PAID" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {inv.status !== "PAID" && (
                                                        <>
                                                            <button title="Send Reminder" className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"><Mail className="h-3.5 w-3.5" /></button>
                                                            <button
                                                                onClick={() => handleMarkPaid(inv.id)}
                                                                className="px-2 py-1 bg-emerald-600 rounded text-[10px] font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                                                            >
                                                                Record Payment
                                                            </button>
                                                        </>
                                                    )}
                                                    <DocumentGenerator type="INVOICE" data={inv} label="View" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
