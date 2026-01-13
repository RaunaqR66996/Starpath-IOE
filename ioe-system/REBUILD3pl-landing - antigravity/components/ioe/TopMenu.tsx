"use client";

import React from "react";

const MENU_ITEMS = [
    "File",
    "Edit",
    "Selection",
    "View",
    "Go",
    "Run",
    "Terminal",
    "Help",
];

export function TopMenu() {
    return (
        <nav className="flex h-9 w-full items-center border-b border-slate-700 bg-slate-900 px-3 text-xs text-slate-300">
            <div className="mr-6 font-bold text-slate-100">IOE</div>
            <div className="flex gap-4">
                {MENU_ITEMS.map((item) => (
                    <button
                        key={item}
                        className="hover:text-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                        {item}
                    </button>
                ))}
            </div>
            <div className="ml-auto flex items-center gap-4">
                <span className="text-[10px] text-slate-500">v1.2.4-stable</span>
            </div>
        </nav>
    );
}
