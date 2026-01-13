"use client";

import React from "react";

import Image from "next/image";
import { FileMenu } from "./menus/FileMenu";
import { EditMenu } from "./menus/EditMenu";
import { SelectionMenu } from "./menus/SelectionMenu";
import { ViewMenu } from "./menus/ViewMenu";
import { HelpMenu } from "./menus/HelpMenu";
import { Menubar, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { useUIStore } from "@/lib/store/ui-store";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_MENUS: string[] = [];

import { useThemeStore } from "@/lib/stores/theme-store";

export function TopMenu() {
    const { isOverseerMode, toggleOverseerMode } = useUIStore();
    const { theme } = useThemeStore();

    return (
        <nav className="flex h-9 w-full items-center border-b border-[var(--border-color)] bg-[var(--bg-panel-header)] px-3 text-xs text-[var(--text-secondary)]">
            <div className="mr-6 flex items-center gap-2">
                <Image
                    src="/starpath-logo.png"
                    alt="StarPath Logo"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                />
                <span className={cn("font-bold", theme === 'light' ? "text-black" : "text-white")}>StarPath</span>
            </div>

            {/* Menubar Container - Note: FileMenu and EditMenu have their own Menubars internally currently. 
                Ideally we should lift the Menubar root up, but for now we can display them side-by-side 
                or refactor to share a context if they need to coordinate closing. 
                Given the current implementation of Menubar in menubar.tsx, it acts as a root.
                Let's use a wrapper div for layout. 
            */}
            <div className="flex">
                <FileMenu />
                <EditMenu />
                <SelectionMenu />
                <ViewMenu />
                <HelpMenu />

                {/* Placeholders using the same styling structure but non-functional for now */}
                {PLACEHOLDER_MENUS.map((item) => (
                    <button
                        key={item}
                        className="flex cursor-default select-none items-center rounded-sm px-3 py-1 text-xs font-medium outline-none hover:bg-neutral-800 hover:text-white"
                    >
                        {item}
                    </button>
                ))}
            </div>

            <div className="ml-auto flex items-center gap-4">
                {/* 
                <button
                    onClick={toggleOverseerMode}
                    className={cn(
                        "flex items-center gap-2 rounded px-2 py-1 transition-colors",
                        isOverseerMode
                            ? "bg-red-900/50 text-red-200 border border-red-800"
                            : "bg-neutral-900/50 text-neutral-500 border border-neutral-800 hover:text-neutral-300"
                    )}
                >
                    {isOverseerMode ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    <span className="font-mono font-bold tracking-tight">
                        {isOverseerMode ? "OVERSEER ACTIVE" : "OVERSEER"}
                    </span>
                </button>
                <div className="h-4 w-[1px] bg-neutral-800" />
                <span className="text-[10px] text-neutral-600">v1.2.4-stable</span>
                */}
            </div>
        </nav>
    );
}
