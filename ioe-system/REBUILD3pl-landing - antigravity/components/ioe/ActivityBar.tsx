"use client";

import React from "react";
import {
    Files,
    Search,
    Settings2,
    Package,
    Truck,
    Calendar,
    AlertCircle,
    BarChart3,
    Network,
    ShieldCheck,
    Cpu,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ACTIVITIES = [
    { id: "explorer", icon: Files, label: "Explorer" },
    { id: "search", icon: Search, label: "Search" },
    { id: "ops", icon: Settings2, label: "Ops" },
    { id: "inventory", icon: Package, label: "Inventory" },
    { id: "logistics", icon: Truck, label: "Logistics" },
    { id: "planning", icon: Calendar, label: "Planning" },
    { id: "exceptions", icon: AlertCircle, label: "Exceptions" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "integrations", icon: Network, label: "Integrations" },
    { id: "admin", icon: ShieldCheck, label: "Admin" },
    { id: "ai-ops", icon: Cpu, label: "AI Ops" },
];

interface ActivityBarProps {
    selectedActivity: string;
    onSelect: (id: string) => void;
}

export function ActivityBar({ selectedActivity, onSelect }: ActivityBarProps) {
    return (
        <div className="flex w-12 flex-col items-center border-r border-slate-700 bg-slate-900 py-2">
            <TooltipProvider delayDuration={0}>
                {ACTIVITIES.map((activity) => (
                    <Tooltip key={activity.id}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onSelect(activity.id)}
                                className={cn(
                                    "group relative mb-2 flex h-10 w-10 items-center justify-center rounded-none transition-colors focus:outline-none",
                                    selectedActivity === activity.id
                                        ? "text-slate-100"
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {selectedActivity === activity.id && (
                                    <div className="absolute left-0 h-8 w-[2px] bg-slate-100" />
                                )}
                                <activity.icon className="h-5 w-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="rounded-none border-slate-700 bg-slate-800 text-[10px] text-slate-100">
                            {activity.label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
}
