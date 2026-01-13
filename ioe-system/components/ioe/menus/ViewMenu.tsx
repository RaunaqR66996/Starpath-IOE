"use client";

import React from "react";
import {
    Menubar,
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
} from "@/components/ui/menubar";
import { useUIStore } from "@/lib/store/ui-store";

export function ViewMenu() {
    const { toggleRightPanel, toggleSidebar, rightPanelOpen, sidebarOpen } = useUIStore();
    return (
        <Menubar className="border-none bg-transparent p-0">
            <MenubarMenu>
                <MenubarTrigger value="view" className="px-2 h-full hover:bg-slate-800 hover:text-slate-100 data-[state=open]:bg-slate-800 data-[state=open]:text-slate-100">View</MenubarTrigger>
                <MenubarContent value="view" className="min-w-[14rem]">

                    {/* Layout */}
                    <MenubarSub>
                        <MenubarSubTrigger>Layout</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Reset Layout</MenubarItem>
                            <MenubarItem>Save Layout</MenubarItem>
                            <MenubarItem>Manage Layouts...</MenubarItem>
                            <MenubarItem>Toggle Full Screen</MenubarItem>
                            <MenubarItem>Toggle Zen Mode</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Panels */}
                    <MenubarSub>
                        <MenubarSubTrigger>Panels</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem onSelect={() => toggleSidebar()}>
                                {sidebarOpen ? "Hide" : "Show"} Sidebar
                            </MenubarItem>
                            <MenubarItem>Show Right Intelligence Panel</MenubarItem>
                            <MenubarItem>Show Status Bar</MenubarItem>
                            <MenubarItem>Toggle Terminal Panel</MenubarItem>
                            <MenubarItem onSelect={() => toggleRightPanel()}>
                                {rightPanelOpen ? "Hide" : "Show"} AI Panel
                            </MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Editors & Tabs */}
                    <MenubarSub>
                        <MenubarSubTrigger>Editors & Tabs</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Split Editor</MenubarItem>
                            <MenubarItem>Split Editor Right</MenubarItem>
                            <MenubarItem>Split Editor Down</MenubarItem>
                            <MenubarItem>Move Tab to New Pane</MenubarItem>
                            <MenubarItem>Close Editor Group</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Navigation */}
                    <MenubarSub>
                        <MenubarSubTrigger>Navigation</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Toggle Explorer</MenubarItem>
                            <MenubarItem>Toggle Planning Navigator</MenubarItem>
                            <MenubarItem>Toggle Logistics Navigator</MenubarItem>
                            <MenubarItem>Toggle Inventory Navigator</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Tables & Density */}
                    <MenubarSub>
                        <MenubarSubTrigger>Tables & Density</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Toggle Compact Mode</MenubarItem>
                            <MenubarItem>Toggle Standard Mode</MenubarItem>
                            <MenubarItem>Show Grid Lines</MenubarItem>
                            <MenubarItem>Show Row Numbers</MenubarItem>
                            <MenubarItem>Show Column Headers</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Columns & Fields */}
                    <MenubarSub>
                        <MenubarSubTrigger>Columns & Fields</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Show/Hide Columns...</MenubarItem>
                            <MenubarItem>Auto-Size Columns</MenubarItem>
                            <MenubarItem>Reset Column Widths</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Filtering & Sorting */}
                    <MenubarSub>
                        <MenubarSubTrigger>Filtering & Sorting</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Toggle Filters</MenubarItem>
                            <MenubarItem>Clear Filters</MenubarItem>
                            <MenubarItem>Toggle Sort Indicators</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Visual Overlays */}
                    <MenubarSub>
                        <MenubarSubTrigger>Visual Overlays</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Show Validation Errors</MenubarItem>
                            <MenubarItem>Show Constraint Violations</MenubarItem>
                            <MenubarItem>Show SLA Risks</MenubarItem>
                            <MenubarItem>Show Change Highlights</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* 3D & Spatial Views */}
                    <MenubarSub>
                        <MenubarSubTrigger>3D & Spatial Views</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Toggle 3D View</MenubarItem>
                            <MenubarItem>Toggle 2D View</MenubarItem>
                            <MenubarItem>Show Warehouse Grid</MenubarItem>
                            <MenubarItem>Show Rack Boundaries</MenubarItem>
                            <MenubarItem>Show Dock Doors</MenubarItem>
                            <MenubarItem>Show Traffic Paths</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Zoom & Scale */}
                    <MenubarSub>
                        <MenubarSubTrigger>Zoom & Scale</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Zoom In</MenubarItem>
                            <MenubarItem>Zoom Out</MenubarItem>
                            <MenubarItem>Reset Zoom</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Appearance */}
                    <MenubarSub>
                        <MenubarSubTrigger>Appearance</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Toggle Dark Mode</MenubarItem>
                            <MenubarItem>Toggle Light Mode</MenubarItem>
                            <MenubarItem>Adjust Font Size</MenubarItem>
                            <MenubarItem>Adjust Row Height</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Focus & Visibility */}
                    <MenubarSub>
                        <MenubarSubTrigger>Focus & Visibility</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Focus Active Pane</MenubarItem>
                            <MenubarItem>Hide Inactive Panes</MenubarItem>
                            <MenubarItem>Toggle Distraction-Free Mode</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}
