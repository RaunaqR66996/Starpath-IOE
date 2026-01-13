"use client";

import React, { useState } from "react";
import { TopMenu } from "@/components/ioe/TopMenu";
import { ActivityBar } from "@/components/ioe/ActivityBar";
import { Sidebar } from "@/components/ioe/Sidebar";
import { EditorTabs } from "@/components/ioe/EditorTabs";
import { RightCopilot } from "@/components/ioe/RightCopilot";
import { BottomPanel } from "@/components/ioe/BottomPanel";
import { cn } from "@/lib/utils";

export default function IOEPage() {
    // Panel States
    const [selectedActivity, setSelectedActivity] = useState("explorer");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [bottomPanelOpen, setBottomPanelOpen] = useState(true);

    // Tab States
    const [tabs, setTabs] = useState(["Orders", "Inventory", "Shipments"]);
    const [activeTab, setActiveTab] = useState("Orders");

    const closeTab = (tabName: string) => {
        if (tabName === "Orders") return; // Keep Orders persistent
        const newTabs = tabs.filter((t) => t !== tabName);
        setTabs(newTabs);
        if (activeTab === tabName) {
            setActiveTab(newTabs[0]);
        }
    };

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 selection:bg-slate-700">
            {/* 1. Top Menubar */}
            <TopMenu />

            <div className="flex flex-1 overflow-hidden">
                {/* 2. Left Activity Bar */}
                <ActivityBar
                    selectedActivity={selectedActivity}
                    onSelect={(id) => {
                        if (selectedActivity === id) {
                            setSidebarOpen(!sidebarOpen);
                        } else {
                            setSelectedActivity(id);
                            setSidebarOpen(true);
                        }
                    }}
                />

                {/* 3. Left Sidebar Panel */}
                {sidebarOpen && <Sidebar selectedActivity={selectedActivity} />}

                {/* Main Workspace Area (Center + Bottom) */}
                <div className="flex flex-1 flex-col overflow-hidden bg-slate-900">
                    <div className="flex flex-1 overflow-hidden">
                        {/* 4. Center Editor Area */}
                        <div className="flex-1 overflow-hidden">
                            <EditorTabs
                                tabs={tabs}
                                activeTab={activeTab}
                                onSelectTab={setActiveTab}
                                onCloseTab={closeTab}
                            />
                        </div>

                        {/* 5. Right AI Ops Copilot */}
                        {rightPanelOpen && <RightCopilot />}
                    </div>

                    {/* 6. Bottom Panel */}
                    {bottomPanelOpen && (
                        <div className="h-[180px]">
                            <BottomPanel />
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar Placeholder */}
            <footer className="flex h-6 w-full items-center border-t border-slate-700 bg-slate-100/5 px-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Central (ORD-01)
                    </span>
                    <span>Main</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <span>UTF-8</span>
                    <span>React (Next.js)</span>
                </div>
            </footer>
        </div>
    );
}
