import React from "react";
import { ArrowRight, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesOrderEditorProps {
    poData: any | null;
    onConvert: () => void;
}

export function SalesOrderEditor({ poData, onConvert }: SalesOrderEditorProps) {
    if (!poData) {
        return (
            <div className="w-80 border-l border-slate-700 bg-slate-900 p-4" />
        );
    }

    return (
        <div className="flex w-80 flex-col border-l border-slate-700 bg-slate-900">
            <div className="flex h-10 items-center justify-between border-b border-slate-700 px-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sales Order Editor</span>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Auto-Filled
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Customer Info */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Ship To</label>
                    <div className="rounded border border-slate-700 bg-slate-800 p-3 text-xs text-slate-300">
                        <div className="font-medium text-slate-200">{poData.ship_to?.name || "Unknown"}</div>
                        <div className="mt-1 text-slate-400">
                            {poData.ship_to?.address}<br />
                            {poData.ship_to?.city_state_zip}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-slate-500">
                        Detected Items ({Array.isArray(poData.items) ? poData.items.length : 0})
                    </label>
                    <div className="space-y-2">
                        {Array.isArray(poData.items) && poData.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between rounded bg-slate-800/50 px-3 py-2 text-xs border border-transparent hover:border-slate-700">
                                <div>
                                    <div className="text-slate-300">{item.sku || "NO-SKU"}</div>
                                    <div className="text-[10px] text-slate-500">{item.description}</div>
                                </div>
                                <div className="font-mono text-emerald-400">{item.quantity} {item.unit}</div>
                            </div>
                        ))}
                        {(!Array.isArray(poData.items) || poData.items.length === 0) && (
                            <div className="text-xs text-slate-500 italic p-2 text-center">No items detected</div>
                        )}
                    </div>
                </div>

                {/* Automation Rules */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Applied Rules</label>
                    <div className="space-y-1">
                        {Array.isArray(poData.automation_rules) && poData.automation_rules.map((rule: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-400">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span>{rule}</span>
                            </div>
                        ))}
                        {(!Array.isArray(poData.automation_rules) || poData.automation_rules.length === 0) && (
                            <span className="text-[10px] text-slate-600 italic">No rules applied</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-700 bg-slate-900 p-4">
                <button
                    onClick={onConvert}
                    className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
                >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Convert to Sales Order
                </button>
            </div>
        </div>
    );
}
