"use client";

import React from "react";
import {
    Files,
    Search,
    Settings2,
    Truck,
    CalendarDays,
    BarChart3,
    ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";


const ACTIVITIES = [
    { id: "explorer", icon: Files, label: "Explorer" },
    { id: "search", icon: Search, label: "Search" },
    { id: "ops", icon: Settings2, label: "Actions" }, // Renamed Ops to Actions
    { id: "logistics", icon: Truck, label: "Logistics" },
    { id: "planning", icon: CalendarDays, label: "Planning" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "admin", icon: ShieldCheck, label: "Admin" },
];

interface ActivityBarProps {
    selectedActivity: string;
    onSelect: (id: string) => void;
}

export function ActivityBar({ selectedActivity, onSelect }: ActivityBarProps) {


    return (
        <div className="flex w-12 flex-col items-center border-r bg-[var(--bg-activity-bar)] py-2 border-[var(--border-color)] relative z-50">
            {ACTIVITIES.map((activity) => (
                <button
                    key={activity.id}
                    title={activity.label}
                    onClick={() => onSelect(activity.id)}
                    className={cn(
                        "group relative mb-2 flex h-10 w-10 items-center justify-center rounded-none transition-all focus:outline-none",
                        selectedActivity === activity.id
                            ? "text-[var(--accent-color)]"
                            : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    )}
                >
                    {selectedActivity === activity.id && (
                        <div className="absolute left-0 h-8 w-[2px] bg-[var(--accent-color)]" />
                    )}

                    {activity.id === 'ops' ? (
                        <div className="relative h-6 w-6 overflow-hidden rounded-full border border-white/20 p-0.5">
                            <img
                                src="/actions-logo.png"
                                alt="Actions"
                                className={cn("h-full w-full object-contain", selectedActivity !== 'ops' && "opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100")}
                            />
                        </div>
                    ) : (
                        <activity.icon className="h-5 w-5" />
                    )}
                </button>
            ))}

        </div>
    );
}
