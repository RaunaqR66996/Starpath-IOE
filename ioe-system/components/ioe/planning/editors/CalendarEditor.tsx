import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEditorProps {
    tabId: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarEditor({ tabId }: CalendarEditorProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedCalendar, setSelectedCalendar] = useState("warehouse-ops");

    const calendars = [
        { id: "warehouse-ops", name: "Warehouse Operations", type: "Working Days" },
        { id: "carrier-schedule", name: "Carrier Schedule", type: "Delivery Windows" },
        { id: "production", name: "Production Calendar", type: "Shifts" }
    ];

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-16 border border-slate-800" />);
        }

        // Calendar days
        for (let day = 1; day <= daysInMonth; day++) {
            const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;
            const isHoliday = day === 25 && currentMonth === 11; // Example: Dec 25
            const isNonWorking = isWeekend || isHoliday;

            days.push(
                <div
                    key={day}
                    className={cn(
                        "h-16 border border-slate-800 p-1 hover:bg-slate-800/30 cursor-pointer",
                        isNonWorking ? "bg-slate-900/70" : "bg-slate-900/30"
                    )}
                >
                    <div className={cn(
                        "text-xs font-mono",
                        isNonWorking ? "text-slate-600" : "text-slate-300"
                    )}>
                        {day}
                    </div>
                    {isHoliday && (
                        <div className="text-[9px] text-amber-500 mt-0.5">Holiday</div>
                    )}
                </div>
            );
        }

        return days;
    };

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    return (
        <div className="h-full bg-slate-900 flex">
            {/* Left Panel - Calendar List */}
            <div className="w-64 border-r border-slate-700 flex flex-col">
                <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Calendars</span>
                    <button className="p-1 hover:bg-slate-700 rounded">
                        <Plus className="h-3 w-3 text-slate-400" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                    {calendars.map(cal => (
                        <div
                            key={cal.id}
                            onClick={() => setSelectedCalendar(cal.id)}
                            className={cn(
                                "px-3 py-2 cursor-pointer hover:bg-slate-800/50 border-l-2 transition-colors",
                                selectedCalendar === cal.id
                                    ? "border-l-emerald-500 bg-slate-800 text-slate-200"
                                    : "border-l-transparent text-slate-400"
                            )}
                        >
                            <div className="text-xs font-medium">{cal.name}</div>
                            <div className="text-[10px] text-slate-600 mt-0.5">{cal.type}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel - Calendar View */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-slate-200">
                            {calendars.find(c => c.id === selectedCalendar)?.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                            {calendars.find(c => c.id === selectedCalendar)?.type}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300">
                            <Edit2 className="h-3 w-3" />
                        </button>
                        <button className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                </div>

                {/* Calendar Navigation */}
                <div className="px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded">
                        <ChevronLeft className="h-4 w-4 text-slate-400" />
                    </button>
                    <div className="text-sm font-mono text-slate-300">
                        {MONTHS[currentMonth]} {currentYear}
                    </div>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded">
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="grid grid-cols-7 gap-px bg-slate-800">
                        {/* Day headers */}
                        {DAYS.map((day, i) => (
                            <div key={i} className="h-8 bg-slate-900 flex items-center justify-center">
                                <span className="text-xs font-bold text-slate-500">{day}</span>
                            </div>
                        ))}
                        {/* Calendar days */}
                        {renderCalendarGrid()}
                    </div>
                </div>

                {/* Legend */}
                <div className="px-4 py-2 border-t border-slate-700 flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-slate-900/30 border border-slate-800" />
                        <span className="text-slate-500">Working Day</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-slate-900/70 border border-slate-800" />
                        <span className="text-slate-500">Non-Working</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500/10 border border-amber-700" />
                        <span className="text-slate-500">Holiday</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
