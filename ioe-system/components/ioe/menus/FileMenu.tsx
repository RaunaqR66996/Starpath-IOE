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
import { useThemeStore } from "@/lib/stores/theme-store";

export function FileMenu() {
    return (
        <Menubar className="border-none bg-transparent p-0">
            <MenubarMenu>
                <MenubarTrigger value="file" className="px-2 h-full hover:bg-slate-800 hover:text-slate-100 data-[state=open]:bg-slate-800 data-[state=open]:text-slate-100">File</MenubarTrigger>
                <MenubarContent value="file" className="min-w-[14rem]">
                    {/* New */}
                    <MenubarSub>
                        <MenubarSubTrigger>New</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>New Order</MenubarItem>
                            <MenubarItem>New Sales Order</MenubarItem>
                            <MenubarItem>New Purchase Order</MenubarItem>
                            <MenubarItem>New Shipment</MenubarItem>
                            <MenubarItem>New Load</MenubarItem>
                            <MenubarItem>New Plan</MenubarItem>
                            <MenubarItem>New Scenario</MenubarItem>
                            <MenubarItem>New Warehouse Layout</MenubarItem>
                            <MenubarItem>New Digital Twin Version</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Open */}
                    <MenubarSub>
                        <MenubarSubTrigger>Open</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Open Order...</MenubarItem>
                            <MenubarItem>Open Sales Order...</MenubarItem>
                            <MenubarItem>Open Purchase Order...</MenubarItem>
                            <MenubarItem>Open Shipment...</MenubarItem>
                            <MenubarItem>Open Load...</MenubarItem>
                            <MenubarItem>Open Plan Version...</MenubarItem>
                            <MenubarItem>Open Scenario...</MenubarItem>
                            <MenubarItem>Open Warehouse Layout...</MenubarItem>
                            <MenubarItem>Open Digital Twin...</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Open Recent */}
                    <MenubarSub>
                        <MenubarSubTrigger>Open Recent</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Orders</MenubarItem>
                            <MenubarItem>Plans</MenubarItem>
                            <MenubarItem>Scenarios</MenubarItem>
                            <MenubarItem>Excel Sheets</MenubarItem>
                            <MenubarItem>Warehouse Layouts</MenubarItem>
                            <MenubarItem>Digital Twin Versions</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Import */}
                    <MenubarSub>
                        <MenubarSubTrigger>Import</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Import Excel (.xlsx)</MenubarItem>
                            <MenubarItem>Import CSV (.csv)</MenubarItem>
                            <MenubarItem>Import PDF (PO, BOL, Invoice)</MenubarItem>
                            <MenubarItem>Import Carrier Rate Sheet</MenubarItem>
                            <MenubarItem>Import Demand Signal</MenubarItem>
                            <MenubarItem>Import CAD (DWG, DXF)</MenubarItem>
                            <MenubarItem>Import BIM / 3D (IFC, STEP, IGES)</MenubarItem>
                            <MenubarItem>Import Point Cloud (LAS, LAZ, PLY)</MenubarItem>
                            <MenubarItem>Import LiDAR Scan</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Export */}
                    <MenubarSub>
                        <MenubarSubTrigger>Export</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Export Excel (.xlsx)</MenubarItem>
                            <MenubarItem>Export CSV (.csv)</MenubarItem>
                            <MenubarItem>Export PDF</MenubarItem>
                            <MenubarItem>Export BOL</MenubarItem>
                            <MenubarItem>Export Labels</MenubarItem>
                            <MenubarItem>Export Invoice</MenubarItem>
                            <MenubarItem>Export CAD (DWG, DXF)</MenubarItem>
                            <MenubarItem>Export 3D Model (STEP, IFC)</MenubarItem>
                            <MenubarItem>Export Digital Twin Snapshot (GLTF / OBJ)</MenubarItem>
                            <MenubarItem>Export Load Plan</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Templates */}
                    <MenubarSub>
                        <MenubarSubTrigger>Templates</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Download Forecast Template</MenubarItem>
                            <MenubarItem>Download Supply Plan Template</MenubarItem>
                            <MenubarItem>Download Inventory Plan Template</MenubarItem>
                            <MenubarItem>Download Capacity Plan Template</MenubarItem>
                            <MenubarItem>Download Load Plan Template</MenubarItem>
                            <MenubarItem>Download Carrier Rate Template</MenubarItem>
                            <MenubarItem>Download Warehouse CAD Template</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Save & Versioning */}
                    <MenubarSub>
                        <MenubarSubTrigger>Save & Versioning</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Save</MenubarItem>
                            <MenubarItem>Save As...</MenubarItem>
                            <MenubarItem>Save Version</MenubarItem>
                            <MenubarItem>Tag Version (Draft / Approved / As-Planned / As-Built)</MenubarItem>
                            <MenubarItem>Compare Versions</MenubarItem>
                            <MenubarItem>Revert to Previous Version</MenubarItem>
                            <MenubarItem>Lock Version (Read-Only)</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Validation & Build */}
                    <MenubarSub>
                        <MenubarSubTrigger>Validation & Build</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Validate Data</MenubarItem>
                            <MenubarItem>Validate Constraints</MenubarItem>
                            <MenubarItem>Run Simulation</MenubarItem>
                            <MenubarItem>Rebuild Plan</MenubarItem>
                            <MenubarItem>Rebuild Load Plan</MenubarItem>
                            <MenubarItem>Rebuild Warehouse Model</MenubarItem>
                            <MenubarItem>Rebuild Digital Twin</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Sync & Release */}
                    <MenubarSub>
                        <MenubarSubTrigger>Sync & Release</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Sync Digital Twin</MenubarItem>
                            <MenubarItem>Sync to ERP</MenubarItem>
                            <MenubarItem>Sync to WMS</MenubarItem>
                            <MenubarItem>Sync to TMS</MenubarItem>
                            <MenubarItem>Release to Operations</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Workspace */}
                    <MenubarSub>
                        <MenubarSubTrigger>Workspace</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Close Tab</MenubarItem>
                            <MenubarItem>Close All Tabs</MenubarItem>
                            <MenubarItem>Close Other Tabs</MenubarItem>
                            <MenubarItem>Reopen Closed Tab</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Preferences */}
                    <MenubarSub>
                        <MenubarSubTrigger>Preferences</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarSub>
                                <MenubarSubTrigger>Color Theme</MenubarSubTrigger>
                                <MenubarSubContent>
                                    <MenubarItem onClick={() => useThemeStore.getState().setTheme('cosmic')}>Cosmic Dark</MenubarItem>
                                    <MenubarItem onClick={() => useThemeStore.getState().setTheme('light')}>Polar Ice</MenubarItem>
                                    <MenubarItem onClick={() => useThemeStore.getState().setTheme('dracula')}>Dracula</MenubarItem>
                                    <MenubarItem onClick={() => useThemeStore.getState().setTheme('monokai')}>Monokai</MenubarItem>
                                </MenubarSubContent>
                            </MenubarSub>
                            <MenubarSeparator />
                            <MenubarItem>Settings</MenubarItem>
                            <MenubarItem>Keyboard Shortcuts</MenubarItem>
                            <MenubarItem>User Snippets</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Exit */}
                    <MenubarItem>Exit</MenubarItem>

                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}
