"use client"

import { AlertCircle, RefreshCw, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface ErrorAlertProps {
    title?: string
    message: string
    onRetry?: () => void
    onContactSupport?: () => void
    className?: string
    variant?: "default" | "destructive"
}

export function ErrorAlert({
    title = "Something went wrong",
    message,
    onRetry,
    onContactSupport,
    className,
    variant = "destructive",
}: ErrorAlertProps) {
    return (
        <Alert variant={variant} className={cn("", className)}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription className="mt-2">
                <p className="mb-4">{message}</p>
                <div className="flex gap-2">
                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Try Again
                        </Button>
                    )}
                    {onContactSupport && (
                        <Button
                            onClick={onContactSupport}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <HelpCircle className="h-3 w-3" />
                            Contact Support
                        </Button>
                    )}
                </div>
            </AlertDescription>
        </Alert>
    )
}

// Inline error for forms
export function ErrorInline({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
        </div>
    )
}

// Full page error
export function ErrorPage({
    title = "Oops! Something went wrong",
    message = "We're having trouble loading this page. Please try again.",
    onRetry,
}: Omit<ErrorAlertProps, 'className' | 'variant' | 'onContactSupport'>) {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="max-w-md w-full text-center">
                <div className="rounded-full bg-red-100 p-6 inline-flex mb-4">
                    <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                {onRetry && (
                    <Button onClick={onRetry} size="lg" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                )}
            </div>
        </div>
    )
}
