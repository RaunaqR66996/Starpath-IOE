"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    secondaryAction?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
            <div className="rounded-full bg-gray-100 p-6 mb-4">
                <Icon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 max-w-md mb-6">{description}</p>
            {(action || secondaryAction) && (
                <div className="flex gap-3">
                    {action && (
                        <Button onClick={action.onClick} size="lg">
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

// Compact version for smaller spaces
export function EmptyStateCompact({
    icon: Icon,
    title,
    description,
    action,
}: Omit<EmptyStateProps, 'secondaryAction' | 'className'>) {
    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Icon className="h-8 w-8 text-gray-400 mb-3" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
            <p className="text-xs text-gray-600 mb-4">{description}</p>
            {action && (
                <Button onClick={action.onClick} size="sm">
                    {action.label}
                </Button>
            )}
        </div>
    )
}
