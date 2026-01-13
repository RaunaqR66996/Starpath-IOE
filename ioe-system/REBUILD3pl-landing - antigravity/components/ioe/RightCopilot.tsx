"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, CheckCircle2, Info } from "lucide-react";

export function RightCopilot() {
    return (
        <div className="flex h-full w-80 flex-col border-l border-slate-700 bg-slate-900/50">
            <div className="flex h-9 items-center border-b border-slate-700 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Sparkles className="mr-2 h-3 w-3 text-slate-500" />
                AI Ops Copilot
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-6 p-4">
                    {/* Suggested Actions */}
                    <section>
                        <h3 className="mb-2 text-[10px] font-bold uppercase text-slate-500">Suggested Actions</h3>
                        <div className="space-y-1.5">
                            <ActionItem label="Optimize WH-01 Cluster" />
                            <ActionItem label="Rebalance Inventory (North)" />
                            <ActionItem label="Batch 45 Ready Orders" />
                        </div>
                    </section>

                    {/* Reasoning */}
                    <section>
                        <h3 className="mb-2 text-[10px] font-bold uppercase text-slate-500">Reasoning</h3>
                        <div className="rounded-none border border-slate-700 bg-slate-950 p-2 text-xs leading-relaxed text-slate-400">
                            Current throughput models indicate a 12% bottleneck in zone A-12.
                            Applying Wave Pick strategy #4 will increase consolidation efficiency.
                        </div>
                    </section>
                </div>
            </ScrollArea>

            {/* Action Footer */}
            <div className="grid grid-cols-1 gap-1 border-t border-slate-700 p-3 bg-slate-950">
                <Button size="sm" variant="default" className="w-full rounded-none bg-slate-100 text-slate-900 hover:bg-white text-[10px] font-bold uppercase">
                    Allocate
                </Button>
                <div className="grid grid-cols-2 gap-1">
                    <Button size="sm" variant="outline" className="rounded-none border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px] font-bold uppercase">
                        Wave Pick
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-none border-slate-700 text-slate-300 hover:bg-slate-800 text-[10px] font-bold uppercase">
                        Tender
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ActionItem({ label }: { label: string }) {
    return (
        <div className="flex cursor-pointer items-center justify-between rounded-none border border-slate-800 bg-slate-900/30 p-2 hover:border-slate-600 transition-colors group">
            <div className="flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-3 w-3 text-slate-600 group-hover:text-slate-400" />
                {label}
            </div>
            <Info className="h-3 w-3 text-slate-700" />
        </div>
    );
}
