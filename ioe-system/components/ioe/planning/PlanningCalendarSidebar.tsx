"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PlanningCalendarSidebar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            try {
                const res = await fetch(`/api/planning/events?date=${selectedDate.toISOString()}`);
                const data = await res.json();
                if (data.events) {
                    setEvents(data.events);
                } else {
                    setEvents([]);
                }
            } catch (e) {
                console.error("Failed to fetch events", e);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [selectedDate]);

    return (
        <div className="flex h-full flex-col bg-neutral-950/50 border-r border-neutral-800 w-64">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-blue-500" />
                    <span className="text-sm font-bold text-slate-200">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                        <ChevronLeft size={14} />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-[10px] font-bold text-slate-500">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isToday =
                            day === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear();

                        const isSelected =
                            day === selectedDate.getDate() &&
                            currentDate.getMonth() === selectedDate.getMonth() &&
                            currentDate.getFullYear() === selectedDate.getFullYear();

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                className={cn(
                                    "h-8 w-8 text-xs rounded-full flex items-center justify-center transition-all",
                                    isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" :
                                        isToday ? "border border-blue-500 text-blue-400" : "text-slate-300 hover:bg-slate-800"
                                )}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 px-4 py-2 border-t border-slate-800/50">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider flex justify-between items-center">
                    <span>Events for {selectedDate.toLocaleDateString()}</span>
                    <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px]">{events.length}</span>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-400px)]">
                    {loading ? (
                        <div className="text-center py-4 text-slate-500 text-xs animate-pulse">Loading schedule...</div>
                    ) : (
                        <>
                            {events.map((event, i) => (
                                <button
                                    key={i}
                                    onClick={() => alert(`Opening ${event.title}...`)}
                                    className="w-full bg-slate-900/50 border border-slate-800 p-2 rounded text-xs flex gap-2 items-start hover:bg-slate-800 hover:border-slate-700 transition-all text-left group"
                                >
                                    <div className={cn("w-1 h-8 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform", event.color)} />
                                    <div>
                                        <div className="text-slate-200 font-medium group-hover:text-blue-400 transition-colors">{event.title}</div>
                                        <div className="text-[10px] text-slate-500">{event.time} • {event.location}</div>
                                    </div>
                                </button>
                            ))}
                            {events.length === 0 && (
                                <div className="text-center text-slate-600 text-xs py-4">No events scheduled</div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

