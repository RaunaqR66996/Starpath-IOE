"use client";

import React from "react";
import {
    Cpu, Battery, Navigation2, AlertTriangle,
    Play, Square, Radio, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AMRUnit } from "@/app/actions/wcs-actions";

interface FleetManagerProps {
    fleet: AMRUnit[];
    onDispatch?: (id: string) => void;
    onStop?: () => void;
}

export function FleetManager({ fleet, onDispatch, onStop }: FleetManagerProps) {
    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-white tracking-widest uppercase">AMR FLEET COMMAND</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onStop}
                        className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white text-[9px] font-black rounded border border-red-500/30 transition-all flex items-center gap-1"
                    >
                        <Square className="h-2 w-2" /> E-STOP
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {fleet.map(robot => (
                    <div
                        key={robot.id}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-lg hover:border-blue-500/30 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-1.5 rounded bg-white/5",
                                    robot.status === 'MOVING' ? "text-blue-400" :
                                        robot.status === 'ERROR' ? "text-red-400" : "text-neutral-500"
                                )}>
                                    <Cpu className="h-3 w-3" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-white">{robot.id}</div>
                                    <div className="text-[8px] text-neutral-500 uppercase">{robot.model}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className={cn(
                                    "text-[8px] font-black px-1.5 py-0.5 rounded",
                                    robot.status === 'MOVING' ? "bg-blue-500/20 text-blue-400" :
                                        robot.status === 'CHARGING' ? "bg-amber-500/20 text-amber-400" :
                                            robot.status === 'ERROR' ? "bg-red-500/20 text-red-400" : "bg-neutral-800 text-neutral-400"
                                )}>
                                    {robot.status}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Battery className={cn(
                                        "h-2 w-2",
                                        robot.battery < 20 ? "text-red-500 animate-bounce" : "text-emerald-500"
                                    )} />
                                    <span className="text-[9px] font-mono text-neutral-400">{robot.battery}%</span>
                                </div>
                            </div>
                        </div>

                        {robot.taskId && (
                            <div className="mb-3 px-2 py-1 bg-blue-600/10 border border-blue-500/20 rounded text-[9px] flex items-center justify-between">
                                <span className="text-blue-400 font-bold flex items-center gap-1">
                                    <Navigation2 className="h-2 w-2" /> {robot.taskId}
                                </span>
                                <span className="text-blue-500 opacity-50 font-mono italic">ETA: 2m</span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onDispatch?.(robot.id)}
                                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                            >
                                <MapPin className="h-2 w-2" /> Dispatch
                            </button>
                            <button className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded transition-all">
                                <AlertTriangle className="h-2 w-2 text-neutral-600 group-hover:text-amber-500" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/10">
                <div className="flex items-center justify-between text-[8px] text-neutral-500 font-mono uppercase">
                    <span>Active Telemetry</span>
                    <span className="text-emerald-500 animate-pulse">● System Live</span>
                </div>
            </div>
        </div>
    );
}
