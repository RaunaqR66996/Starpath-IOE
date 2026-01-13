import React from "react";
import { FileText, Truck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PurchaseOrder {
    id: string;
    vendor: string;
    date: string;
    status: string;
    items: number;
    total: string;
}

interface PurchaseOrderListProps {
    orders: PurchaseOrder[];
    selectedId: string | null;
    onSelect: (order: PurchaseOrder) => void;
}

export function PurchaseOrderList({ orders, selectedId, onSelect }: PurchaseOrderListProps) {
    return (
        <div className="flex h-full flex-col bg-slate-900 border-r border-slate-700 w-80">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inbound Queue</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{orders.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        onClick={() => onSelect(order)}
                        className={cn(
                            "flex cursor-pointer flex-col gap-1 border-b border-slate-800 p-3 transition-colors hover:bg-slate-800/50",
                            selectedId === order.id ? "bg-slate-800 border-l-2 border-l-emerald-500" : "border-l-2 border-l-transparent"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className={cn("font-mono text-xs font-medium", selectedId === order.id ? "text-emerald-400" : "text-slate-300")}>
                                {order.id}
                            </span>
                            <span className="text-[10px] text-slate-500">{order.date}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">{order.vendor}</div>
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-2 text-slate-500">
                                <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> {order.items} Items
                                </span>
                            </div>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-sm uppercase",
                                order.status === "Pending" ? "bg-amber-500/10 text-amber-500" : "bg-slate-700 text-slate-400"
                            )}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
