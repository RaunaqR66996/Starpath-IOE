import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const Dialog = ({ open, onOpenChange, children }: any) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all" onClick={() => onOpenChange(false)} />
            <div className="animate-in fade-in-0 zoom-in-95 relative z-50 w-full">
                {children}
            </div>
        </div>
    )
}

const DialogContent = ({ className, children }: any) => {
    return (
        <div className={cn("relative mx-auto w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg sm:rounded-lg", className)}>
            {children}
        </div>
    )
}

const DialogHeader = ({ className, children }: any) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
        {children}
    </div>
)

const DialogTitle = ({ className, children }: any) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
        {children}
    </h3>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle }
