"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl"
    text?: string
    className?: string
}

const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
}

export function LoadingSpinner({
    size = "md",
    text,
    className
}: LoadingSpinnerProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <Loader2 className={cn("animate-spin text-blue-600", sizeMap[size])} />
            {text && (
                <p className="text-sm text-gray-600 animate-pulse">{text}</p>
            )}
        </div>
    )
}

// Full page loading spinner
export function LoadingPage({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="xl" text={text} />
        </div>
    )
}

// Inline loading spinner for buttons
export function LoadingButton({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{text}</span>
        </div>
    )
}
