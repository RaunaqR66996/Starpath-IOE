"use client";

import { cn } from "@/lib/utils";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronRight, Check, Circle } from "lucide-react";

// --- Contexts ---

interface MenubarContextValue {
    activeMenu: string | null;
    setActiveMenu: (id: string | null) => void;
}

const MenubarContext = createContext<MenubarContextValue | null>(null);

// --- Components ---

export const Menubar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menubarRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menubarRef.current && !menubarRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <MenubarContext.Provider value={{ activeMenu, setActiveMenu }}>
            <div
                ref={ref || menubarRef}
                className={cn(
                    "flex h-9 items-center space-x-1 border-b border-border bg-background p-1",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        </MenubarContext.Provider>
    );
});
Menubar.displayName = "Menubar";

export const MenubarMenu = ({ children, value }: { children: React.ReactNode; value?: string }) => {
    // We can use a unique ID generator if value is not provided, 
    // but for simplicity we'll assume the trigger will handle the ID logic or correct mapping
    // Actually, to make it simple like Radix: the Trigger sets the active state.
    // We'll wrap children to pass down the 'value' if needed, but Context handles the state.
    return <div className="relative">{children}</div>;
};

export const MenubarTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string } // Enforce value for ID
>(({ className, value, ...props }, ref) => {
    const context = useContext(MenubarContext);
    if (!context) throw new Error("MenubarTrigger must be used within Menubar");

    const isOpen = context.activeMenu === value;

    return (
        <button
            ref={ref}
            className={cn(
                "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-xs font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-neutral-800 data-[state=open]:text-white hover:bg-neutral-800 hover:text-white",
                isOpen && "bg-neutral-800 text-white",
                className
            )}
            onClick={(e) => {
                e.stopPropagation(); // Prevent immediate close
                context.setActiveMenu(isOpen ? null : value);
            }}
            onMouseEnter={() => {
                // If another menu is open, switch to this one on hover
                if (context.activeMenu && context.activeMenu !== value) {
                    context.setActiveMenu(value);
                }
            }}
            {...props}
        />
    );
});
MenubarTrigger.displayName = "MenubarTrigger";

export const MenubarContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
    const context = useContext(MenubarContext);
    if (!context) throw new Error("MenubarContent must be used within Menubar");

    if (context.activeMenu !== value) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute left-0 top-full z-50 min-w-[12rem] rounded-md border border-neutral-800 bg-neutral-950 text-neutral-300 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        >
            <div className="p-1 text-xs">{children}</div>
        </div>
    );
});
MenubarContent.displayName = "MenubarContent";

export const MenubarItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none focus:bg-neutral-800 focus:text-white hover:bg-neutral-800 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                inset && "pl-8",
                className
            )}
            {...props}
        />
    );
});
MenubarItem.displayName = "MenubarItem";

export const MenubarSeparator = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-neutral-800", className)}
        {...props}
    />
));
MenubarSeparator.displayName = "MenubarSeparator";

// --- Submenus (Simplified) ---

export const MenubarSub = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { isOpen });
                }
                return child;
            })}
        </div>
    );
};

export const MenubarSubTrigger = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; isOpen?: boolean }
>(({ className, inset, children, isOpen, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none focus:bg-neutral-800 focus:text-white hover:bg-neutral-800 hover:text-white data-[state=open]:bg-neutral-800 data-[state=open]:text-white",
            inset && "pl-8",
            isOpen && "bg-neutral-800 text-white",
            className
        )}
        {...props}
    >
        {children}
        <ChevronRight className="ml-auto h-3 w-3" />
    </div>
));
MenubarSubTrigger.displayName = "MenubarSubTrigger";

export const MenubarSubContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { isOpen?: boolean }
>(({ className, isOpen, children, ...props }, ref) => {
    if (!isOpen) return null;
    return (
        <div
            ref={ref}
            className={cn(
                "absolute left-full top-0 z-50 min-w-[8rem] -ml-1 rounded-md border border-neutral-800 bg-neutral-950 text-neutral-300 shadow-md animate-in fade-in-0 zoom-in-95",
                className
            )}
            {...props}
        >
            <div className="p-1">{children}</div>
        </div>
    );
});
MenubarSubContent.displayName = "MenubarSubContent";
