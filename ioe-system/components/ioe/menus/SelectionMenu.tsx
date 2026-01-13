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

export function SelectionMenu() {
    return (
        <Menubar className="border-none bg-transparent p-0">
            <MenubarMenu>
                <MenubarTrigger value="selection" className="px-2 h-full hover:bg-slate-800 hover:text-slate-100 data-[state=open]:bg-slate-800 data-[state=open]:text-slate-100">Selection</MenubarTrigger>
                <MenubarContent value="selection" className="min-w-[14rem]">

                    {/* Basic Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Basic Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select All</MenubarItem>
                            <MenubarItem>Deselect All</MenubarItem>
                            <MenubarItem>Invert Selection</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Row & Column Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Row & Column Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Row</MenubarItem>
                            <MenubarItem>Select Column</MenubarItem>
                            <MenubarItem>Select Rows Above</MenubarItem>
                            <MenubarItem>Select Rows Below</MenubarItem>
                            <MenubarItem>Select Columns Left</MenubarItem>
                            <MenubarItem>Select Columns Right</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Range Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Range Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Range...</MenubarItem>
                            <MenubarItem>Expand Selection</MenubarItem>
                            <MenubarItem>Shrink Selection</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Data-Based Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Data-Based Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Invalid Rows</MenubarItem>
                            <MenubarItem>Select Conflicting Rows</MenubarItem>
                            <MenubarItem>Select Empty Cells</MenubarItem>
                            <MenubarItem>Select Modified Cells</MenubarItem>
                            <MenubarItem>Select Locked Cells</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Status-Based Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Status-Based Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarSub>
                                <MenubarSubTrigger>Select by Status...</MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarItem>Draft</MenubarItem>
                                    <MenubarItem>Planned</MenubarItem>
                                    <MenubarItem>Approved</MenubarItem>
                                    <MenubarItem>Released</MenubarItem>
                                    <MenubarItem>Exception</MenubarItem>
                                    <MenubarItem>Failed</MenubarItem>
                                </MenubarSubContent>
                            </MenubarSub>
                            <MenubarItem>Select On Hold</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Constraint-Based Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Constraint-Based Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Constraint Violations</MenubarItem>
                            <MenubarItem>Select Capacity Overloads</MenubarItem>
                            <MenubarItem>Select Stockout Risks</MenubarItem>
                            <MenubarItem>Select SLA Risks</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Entity Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Entity Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Orders...</MenubarItem>
                            <MenubarItem>Select Shipments...</MenubarItem>
                            <MenubarItem>Select Loads...</MenubarItem>
                            <MenubarItem>Select Inventory Items...</MenubarItem>
                            <MenubarItem>Select Locations...</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Warehouse Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Warehouse Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Warehouse...</MenubarItem>
                            <MenubarItem>Select Multiple Warehouses...</MenubarItem>
                            <MenubarItem>Select Current Warehouse</MenubarItem>
                            <MenubarItem>Select All Warehouses</MenubarItem>
                            <MenubarItem>Select Warehouses by Region</MenubarItem>
                            <MenubarItem>Select Warehouses by Type</MenubarItem>
                            <MenubarItem>Clear Warehouse Selection</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Carrier Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Carrier Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Carrier...</MenubarItem>
                            <MenubarItem>Select Multiple Carriers...</MenubarItem>
                            <MenubarItem>Select Preferred Carriers</MenubarItem>
                            <MenubarItem>Select Active Carriers</MenubarItem>
                            <MenubarItem>Select Carriers by Mode</MenubarItem>
                            <MenubarItem>Select Carriers with SLA Risk</MenubarItem>
                            <MenubarItem>Clear Carrier Selection</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* User Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>User Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select User...</MenubarItem>
                            <MenubarItem>Select Multiple Users...</MenubarItem>
                            <MenubarItem>Select Current User</MenubarItem>
                            <MenubarItem>Select Users by Role</MenubarItem>
                            <MenubarItem>Select Users by Team</MenubarItem>
                            <MenubarItem>Select Users On Shift</MenubarItem>
                            <MenubarItem>Clear User Selection</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Window & Tab Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Window & Tab Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select Active Tab</MenubarItem>
                            <MenubarItem>Select All Tabs</MenubarItem>
                            <MenubarItem>Select Tabs to Left</MenubarItem>
                            <MenubarItem>Select Tabs to Right</MenubarItem>
                            <MenubarItem>Select Editor Group</MenubarItem>
                            <MenubarItem>Select Split Pane</MenubarItem>
                            <MenubarItem>Focus Next Pane</MenubarItem>
                            <MenubarItem>Focus Previous Pane</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Context Control */}
                    <MenubarSub>
                        <MenubarSubTrigger>Context Control</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Lock Selection</MenubarItem>
                            <MenubarItem>Unlock Selection</MenubarItem>
                            <MenubarItem>Clear Selection</MenubarItem>
                            <MenubarItem>Clear All Selections</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}
