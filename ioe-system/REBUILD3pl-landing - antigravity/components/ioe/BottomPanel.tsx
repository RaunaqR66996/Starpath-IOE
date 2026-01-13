"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal as TerminalIcon, AlertCircle, MessageSquare, Bug } from "lucide-react";

export function BottomPanel() {
    return (
        <div className="h-full border-t border-slate-700 bg-slate-900">
            <Tabs defaultValue="terminal" className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 px-4">
                    <TabsList className="h-8 rounded-none border-none bg-transparent p-0">
                        <PanelTab value="problems" label="Problems" icon={AlertCircle} count={0} />
                        <PanelTab value="output" label="Output" icon={MessageSquare} />
                        <PanelTab value="debug" label="Debug Console" icon={Bug} />
                        <PanelTab value="terminal" label="Terminal" icon={TerminalIcon} />
                    </TabsList>
                </div>

                <div className="flex-1 bg-slate-950 font-mono text-[11px] leading-relaxed overflow-hidden">
                    <TabsContent value="terminal" className="h-full m-0">
                        <Terminal />
                    </TabsContent>
                    <TabsContent value="problems" className="h-full m-0 p-4 text-slate-500">
                        No problems have been detected in the workspace.
                    </TabsContent>
                    <TabsContent value="output" className="h-full m-0 p-4 text-slate-500">
                        [system] initializing IOE core...
                        [system] activity bar active
                    </TabsContent>
                    <TabsContent value="debug" className="h-full m-0 p-4 text-slate-500">
                        Debug session not started.
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function PanelTab({ value, label, icon: Icon, count }: { value: string; label: string; icon: any; count?: number }) {
    return (
        <TabsTrigger
            value={value}
            className="relative h-8 rounded-none border-b-2 border-transparent bg-transparent px-3 text-[10px] font-bold uppercase text-slate-500 shadow-none transition-none data-[state=active]:border-slate-100 data-[state=active]:bg-transparent data-[state=active]:text-slate-100"
        >
            <div className="flex items-center gap-1.5">
                <span>{label}</span>
                {count !== undefined && (
                    <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-slate-800 px-1 text-[8px]">
                        {count}
                    </span>
                )}
            </div>
        </TabsTrigger>
    );
}

function Terminal() {
    const logs = [
        { time: "16:08:32", type: "info", msg: "IOE environment initialized successfully." },
        { time: "16:08:34", type: "system", msg: "connection established with central node WH-ORD-01" },
        { time: "16:08:35", type: "auth", msg: "admin@starpath.ioe authenticated with session S-9023" },
        { time: "16:10:01", type: "sync", msg: "fetching latest order stream... done (45 new records)" },
        { time: "16:10:05", type: "ai", msg: "copilot generating suggested actions for inventory throughput" },
    ];

    return (
        <ScrollArea className="h-full p-3">
            <div className="space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3">
                        <span className="text-slate-600">[{log.time}]</span>
                        <span className="text-slate-400">[{log.type}]</span>
                        <span className="text-slate-200">{log.msg}</span>
                    </div>
                ))}
                <div className="flex gap-2 text-slate-300">
                    <span className="text-emerald-500">❯</span>
                    <span className="animate-pulse">_</span>
                </div>
            </div>
        </ScrollArea>
    );
}
