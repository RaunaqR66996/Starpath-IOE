"use client";

import React from "react";
import { ChevronRight, ChevronDown, Folder, FileJson, Database } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
    selectedActivity: string;
}

export function Sidebar({ selectedActivity }: SidebarProps) {
    return (
        <div className="flex h-full w-64 flex-col border-r border-slate-700 bg-slate-900/50">
            <div className="flex h-9 items-center px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {selectedActivity}
            </div>
            <ScrollArea className="flex-1">
                <div className="py-2">
                    {selectedActivity === "explorer" && <ExplorerTree />}
                    {selectedActivity !== "explorer" && (
                        <div className="px-4 py-8 text-center text-xs text-slate-600">
                            Panel content for {selectedActivity}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function ExplorerTree() {
    return (
        <div className="space-y-1 px-2 text-xs text-slate-300">
            <TreeItem label="SITES" isOpen>
                <TreeItem label="North America Central" isOpenIcon>
                    <TreeItem label="WH-ORD-01" icon={Database}>
                        <TreeItem label="Configuration" icon={Folder}>
                            <TreeItem label="layout.json" icon={FileJson} />
                            <TreeItem label="rules.json" icon={FileJson} />
                        </TreeItem>
                        <TreeItem label="Modules" icon={Folder} />
                    </TreeItem>
                </TreeItem>
            </TreeItem>
        </div>
    );
}

function TreeItem({
    label,
    children,
    isOpen = false,
    isOpenIcon = false,
    icon: Icon,
}: {
    label: string;
    children?: React.ReactNode;
    isOpen?: boolean;
    isOpenIcon?: boolean;
    icon?: any;
}) {
    return (
        <div className="select-none">
            <div className="flex h-6 cursor-pointer items-center gap-1 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none px-1">
                {children ? (
                    isOpenIcon ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                ) : (
                    <div className="w-3" />
                )}
                {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
                <span>{label}</span>
            </div>
            {(isOpen || isOpenIcon) && children && <div className="ml-3 border-l border-slate-800 pl-1">{children}</div>}
        </div>
    );
}
