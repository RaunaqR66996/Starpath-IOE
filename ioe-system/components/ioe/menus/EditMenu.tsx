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

export function EditMenu() {
    return (
        <Menubar className="border-none bg-transparent p-0">
            <MenubarMenu>
                <MenubarTrigger value="edit" className="px-2 h-full hover:bg-slate-800 hover:text-slate-100 data-[state=open]:bg-slate-800 data-[state=open]:text-slate-100">Edit</MenubarTrigger>
                <MenubarContent value="edit" className="min-w-[14rem]">
                    {/* Undo / Redo */}
                    <MenubarSub>
                        <MenubarSubTrigger>Undo / Redo</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Undo</MenubarItem>
                            <MenubarItem>Redo</MenubarItem>
                            <MenubarItem>Undo Last Action</MenubarItem>
                            <MenubarItem>Redo Last Action</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Selection */}
                    <MenubarSub>
                        <MenubarSubTrigger>Selection</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Select All</MenubarItem>
                            <MenubarItem>Deselect All</MenubarItem>
                            <MenubarItem>Invert Selection</MenubarItem>
                            <MenubarItem>Select Rows</MenubarItem>
                            <MenubarItem>Select Columns</MenubarItem>
                            <MenubarItem>Select Invalid Rows</MenubarItem>
                            <MenubarItem>Select Conflicts</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Clipboard */}
                    <MenubarSub>
                        <MenubarSubTrigger>Clipboard</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Cut</MenubarItem>
                            <MenubarItem>Copy</MenubarItem>
                            <MenubarItem>Paste</MenubarItem>
                            <MenubarItem>Paste as Values</MenubarItem>
                            <MenubarItem>Paste & Match Schema</MenubarItem>
                            <MenubarItem>Duplicate</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Find & Replace */}
                    <MenubarSub>
                        <MenubarSubTrigger>Find & Replace</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Find...</MenubarItem>
                            <MenubarItem>Find Next</MenubarItem>
                            <MenubarItem>Find Previous</MenubarItem>
                            <MenubarItem>Replace...</MenubarItem>
                            <MenubarItem>Replace All</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Edit Data */}
                    <MenubarSub>
                        <MenubarSubTrigger>Edit Data</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Edit Cell</MenubarItem>
                            <MenubarItem>Clear Cell</MenubarItem>
                            <MenubarItem>Clear Row</MenubarItem>
                            <MenubarItem>Clear Selection</MenubarItem>
                            <MenubarItem>Reset to Default</MenubarItem>
                            <MenubarItem>Revert Field Value</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Bulk Actions */}
                    <MenubarSub>
                        <MenubarSubTrigger>Bulk Actions</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Bulk Edit...</MenubarItem>
                            <MenubarItem>Bulk Assign...</MenubarItem>
                            <MenubarItem>Bulk Update Status</MenubarItem>
                            <MenubarItem>Bulk Delete (Soft Delete)</MenubarItem>
                            <MenubarItem>Bulk Validate</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Transform */}
                    <MenubarSub>
                        <MenubarSubTrigger>Transform</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Normalize Data</MenubarItem>
                            <MenubarItem>Split Rows</MenubarItem>
                            <MenubarItem>Merge Rows</MenubarItem>
                            <MenubarItem>Recalculate</MenubarItem>
                            <MenubarItem>Reapply Rules</MenubarItem>
                            <MenubarItem>Re-run Mapping</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Validation */}
                    <MenubarSub>
                        <MenubarSubTrigger>Validation</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Validate Selection</MenubarItem>
                            <MenubarItem>Validate Entire Tab</MenubarItem>
                            <MenubarItem>Show Validation Errors</MenubarItem>
                            <MenubarItem>Clear Validation Errors</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    {/* Constraints & Rules */}
                    <MenubarSub>
                        <MenubarSubTrigger>Constraints & Rules</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Apply Constraints</MenubarItem>
                            <MenubarItem>Remove Constraints</MenubarItem>
                            <MenubarItem>Override Constraint (Requires Permission)</MenubarItem>
                            <MenubarItem>Reset Overrides</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Version Control (IDE-style) */}
                    <MenubarSub>
                        <MenubarSubTrigger>Version Control</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Commit Changes</MenubarItem>
                            <MenubarItem>Discard Changes</MenubarItem>
                            <MenubarItem>Compare with Previous Version</MenubarItem>
                            <MenubarItem>View Change History</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                    <MenubarSeparator />

                    {/* Preferences (Contextual) */}
                    <MenubarSub>
                        <MenubarSubTrigger>Preferences</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>Table Preferences</MenubarItem>
                            <MenubarItem>Column Visibility</MenubarItem>
                            <MenubarItem>Density (Compact / Standard)</MenubarItem>
                            <MenubarItem>Reset View Layout</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>

                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}
