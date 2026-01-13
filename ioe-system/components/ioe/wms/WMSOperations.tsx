"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw, Package, Truck, ClipboardList, Plus, Search, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types based on our Prisma Schema & API
interface Receipt {
    id: string;
    receiptNumber: string;
    status: string;
    receivedAt: string;
    purchaseOrder: { poNumber: string };
    lines: { id: string; qtyReceived: number; item: { sku: string } }[];
}

interface PickWave {
    id: string;
    waveNumber: string;
    status: string;
    type: string;
    pickLists: { items: { id: string; status: string }[] }[];
}

interface DockAppointment {
    id: string;
    dockId: string;
    carrier: { name: string };
    startTime: string;
    endTime: string;
    type: string;
    status: string;
}

interface Dock {
    id: string;
    name: string;
    status: string;
    appointments: DockAppointment[];
}

export function WMSOperations() {
    const [activeTab, setActiveTab] = useState<'receiving' | 'picking' | 'yard'>('receiving');
    const [isLoading, setIsLoading] = useState(false);

    // Data State
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [waves, setWaves] = useState<PickWave[]>([]);
    const [docks, setDocks] = useState<Dock[]>([]);

    // Fetchers
    const loadReceiving = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/wms/receiving');
            if (res.ok) setReceipts(await res.json());
        } finally { setIsLoading(false); }
    };

    const loadPicking = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/wms/picking');
            if (res.ok) setWaves(await res.json());
        } finally { setIsLoading(false); }
    };

    const loadYard = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/wms/yard');
            if (res.ok) setDocks(await res.json());
        } finally { setIsLoading(false); }
    };

    // Auto-load on tab switch
    useEffect(() => {
        if (activeTab === 'receiving') loadReceiving();
        if (activeTab === 'picking') loadPicking();
        if (activeTab === 'yard') loadYard();
    }, [activeTab]);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-editor)] text-[var(--foreground)]">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-panel-header)]">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold tracking-tight">Warehouse Operations</h2>
                    <div className="flex items-center bg-[var(--bg-surface)] rounded-md border border-[var(--border-color)] p-1">
                        <button
                            onClick={() => setActiveTab('receiving')}
                            className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", activeTab === 'receiving' ? "bg-[var(--accent-color)] text-white shadow-sm" : "hover:text-[var(--text-primary)] text-[var(--text-secondary)]")}
                        >
                            <div className="flex items-center gap-2"><Package size={14} /> Inbound</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('picking')}
                            className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", activeTab === 'picking' ? "bg-[var(--accent-color)] text-white shadow-sm" : "hover:text-[var(--text-primary)] text-[var(--text-secondary)]")}
                        >
                            <div className="flex items-center gap-2"><ClipboardList size={14} /> Outbound</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('yard')}
                            className={cn("px-3 py-1 text-xs font-medium rounded-sm transition-all", activeTab === 'yard' ? "bg-[var(--accent-color)] text-white shadow-sm" : "hover:text-[var(--text-primary)] text-[var(--text-secondary)]")}
                        >
                            <div className="flex items-center gap-2"><Truck size={14} /> Yard</div>
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { activeTab === 'receiving' ? loadReceiving() : activeTab === 'picking' ? loadPicking() : loadYard() }} className="p-1.5 text-[var(--text-secondary)] hover:text-white transition-colors">
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    {activeTab === 'picking' ? (
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                try {
                                    // Hardcoded warehouse/rule for demo
                                    await fetch('/api/wms/wave-planning/route', {
                                        method: 'POST',
                                        body: JSON.stringify({ warehouseId: 'WH-01', ruleId: 'DEMO-RULE' })
                                    });
                                    await loadPicking();
                                } catch (e) { console.error(e); }
                                setIsLoading(false);
                            }}
                            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-3 py-1.5 rounded-sm text-xs font-medium transition-colors shadow-sm"
                        >
                            <ClipboardList size={14} />
                            Auto-Plan Wave
                        </button>
                    ) : (
                        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-sm text-xs font-medium transition-colors">
                            <Plus size={14} />
                            {activeTab === 'receiving' ? 'New Receipt' : 'Book Appointment'}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-auto p-4">
                {activeTab === 'receiving' && (
                    <div className="grid grid-cols-1 gap-4">
                        {receipts.length === 0 ? <EmptyState label="No active receipts found" /> : receipts.map(r => (
                            <div key={r.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md p-4 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono font-medium text-blue-400">{r.receiptNumber}</span>
                                        <Badge status={r.status} />
                                    </div>
                                    <div className="text-xs text-[var(--text-secondary)]">PO: {r.purchaseOrder?.poNumber || 'N/A'} • {new Date(r.receivedAt).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold">{r.lines.reduce((acc, l) => acc + l.qtyReceived, 0)}</div>
                                    <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider">Units Received</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'picking' && (
                    <div className="grid grid-cols-1 gap-4">
                        {waves.length === 0 ? <EmptyState label="No pick waves released" /> : waves.map(w => (
                            <div key={w.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium text-orange-400">{w.waveNumber}</span>
                                        <Badge status={w.status} />
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">{w.type}</span>
                                    </div>
                                    <button className="text-xs text-blue-400 hover:text-blue-300 underline">View Pick List</button>
                                </div>
                                {/* Progress Bar simulation based on generic status or mock */}
                                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full" style={{ width: w.status === 'COMPLETED' ? '100%' : w.status === 'IN_PROGRESS' ? '45%' : '5%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'yard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docks.map(dock => (
                            <div key={dock.id} className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md p-3">
                                <div className="flex justify-between items-center mb-4 border-b border-[var(--border-color)] pb-2">
                                    <h3 className="font-semibold">{dock.name}</h3>
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono", dock.status === 'AVAILABLE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400')}>
                                        {dock.status}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {dock.appointments && dock.appointments.length > 0 ? dock.appointments.map(apt => (
                                        <div key={apt.id} className="text-xs bg-neutral-900/50 p-2 rounded border-l-2 border-l-blue-500">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-blue-200">{apt.carrier?.name || 'Unknown Carrier'}</span>
                                                <span className="text-[var(--text-muted)]">{new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-[var(--text-secondary)]">
                                                <span className={cn("w-1.5 h-1.5 rounded-full", apt.type === 'DELIVERY' ? 'bg-emerald-500' : 'bg-amber-500')}></span>
                                                {apt.type} • {apt.status}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-xs text-[var(--text-muted)] italic py-2 text-center">No upcoming appointments</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {docks.length === 0 && <EmptyState label="No docks configured" />}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-[var(--text-muted)] border-2 border-dashed border-[var(--border-color)] rounded-lg">
            <Search className="mb-2 opacity-50" />
            <span>{label}</span>
        </div>
    );
}

function Badge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'RECEIVED': 'bg-green-500/10 text-green-400 border-green-500/20',
        'COMPLETED': 'bg-green-500/10 text-green-400 border-green-500/20',
        'PLANNED': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'RELEASED': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'PENDING': 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
        'IN_PROGRESS': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };
    return (
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide font-medium", colors[status] || colors['PENDING'])}>
            {status}
        </span>
    );
}
