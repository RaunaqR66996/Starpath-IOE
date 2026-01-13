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

export function HelpMenu() {
    return (
        <Menubar className="border-none bg-transparent p-0">
            <MenubarMenu>
                <MenubarTrigger value="help" className="px-2 h-full hover:bg-slate-800 hover:text-slate-100 data-[state=open]:bg-slate-800 data-[state=open]:text-slate-100">Help</MenubarTrigger>
                <MenubarContent value="help" className="min-w-[14rem]">

                    {/* Getting Started */}
                    <MenubarSub>
                        <MenubarSubTrigger>Getting Started</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Welcome</MenubarItem>
                            <MenubarItem>Quick Start Guide</MenubarItem>
                            <MenubarItem>Keyboard Shortcuts</MenubarItem>
                            <MenubarItem>UI Overview</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Documentation */}
                    <MenubarSub>
                        <MenubarSubTrigger>Documentation</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>User Guide</MenubarItem>
                            <MenubarItem>Planning Guide</MenubarItem>
                            <MenubarItem>Logistics Guide</MenubarItem>
                            <MenubarItem>Warehouse Guide</MenubarItem>
                            <MenubarItem>Load Optimizer Guide</MenubarItem>
                            <MenubarItem>Excel & CAD Import Guide</MenubarItem>
                            <MenubarItem>API & Integration Docs</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Reference */}
                    <MenubarSub>
                        <MenubarSubTrigger>Reference</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Data Model Reference</MenubarItem>
                            <MenubarItem>Constraint Reference</MenubarItem>
                            <MenubarItem>Status & Lifecycle Reference</MenubarItem>
                            <MenubarItem>Error & Warning Codes</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Examples & Templates */}
                    <MenubarSub>
                        <MenubarSubTrigger>Examples & Templates</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Sample Plans</MenubarItem>
                            <MenubarItem>Sample Loads</MenubarItem>
                            <MenubarItem>Sample Warehouse Layouts</MenubarItem>
                            <MenubarItem>Sample Excel Files</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Support */}
                    <MenubarSub>
                        <MenubarSubTrigger>Support</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Search Help</MenubarItem>
                            <MenubarItem>Report an Issue</MenubarItem>
                            <MenubarItem>Contact Support</MenubarItem>
                            <MenubarItem>System Status</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Diagnostics */}
                    <MenubarSub>
                        <MenubarSubTrigger>Diagnostics</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>View Logs</MenubarItem>
                            <MenubarItem>Run Health Check</MenubarItem>
                            <MenubarItem>Validate Configuration</MenubarItem>
                            <MenubarItem>Check Integrations</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Updates */}
                    <MenubarSub>
                        <MenubarSubTrigger>Updates</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Check for Updates</MenubarItem>
                            <MenubarItem>Release Notes</MenubarItem>
                            <MenubarItem>What's New</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Legal & About */}
                    <MenubarSub>
                        <MenubarSubTrigger>Legal & About</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>License Information</MenubarItem>
                            <MenubarItem>Privacy Policy</MenubarItem>
                            <MenubarItem>Terms of Service</MenubarItem>
                            <MenubarItem>About IOE</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}
