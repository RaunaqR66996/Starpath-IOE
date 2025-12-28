/**
 * User-friendly error messages
 * Maps technical errors to messages users can understand and act on
 */

export const ERROR_MESSAGES = {
    // Network errors
    NETWORK_ERROR: "Unable to connect. Please check your internet connection and try again.",
    TIMEOUT: "The request took too long. Please try again.",

    // Server errors
    SERVER_ERROR: "Something went wrong on our end. Our team has been notified. Please try again in a moment.",
    SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again in a few minutes.",

    // Authentication errors
    UNAUTHORIZED: "Please log in to continue.",
    FORBIDDEN: "You don't have permission to access this resource.",
    SESSION_EXPIRED: "Your session has expired. Please log in again.",
    INVALID_CREDENTIALS: "Invalid email or password. Please try again.",

    // Validation errors
    VALIDATION_ERROR: "Please check your input and try again.",
    REQUIRED_FIELD: "This field is required.",
    INVALID_FORMAT: "Please enter a valid format.",
    DUPLICATE_ENTRY: "This entry already exists.",

    // Resource errors
    NOT_FOUND: "We couldn't find what you're looking for.",
    ALREADY_EXISTS: "This item already exists.",
    CONFLICT: "This action conflicts with existing data.",

    // Business logic errors
    INSUFFICIENT_INVENTORY: "Not enough inventory available.",
    INVALID_STATUS: "This action cannot be performed in the current status.",
    ORDER_NOT_FOUND: "Order not found. Please check the order number.",
    SHIPMENT_NOT_FOUND: "Shipment not found. Please check the tracking number.",

    // Generic fallback
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again or contact support if the problem persists.",
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES

/**
 * Convert technical error to user-friendly message
 */
export function getUserFriendlyError(error: unknown): string {
    // Handle Axios/Fetch errors
    if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as any).response

        if (response?.status === 401) return ERROR_MESSAGES.UNAUTHORIZED
        if (response?.status === 403) return ERROR_MESSAGES.FORBIDDEN
        if (response?.status === 404) return ERROR_MESSAGES.NOT_FOUND
        if (response?.status === 409) return ERROR_MESSAGES.CONFLICT
        if (response?.status === 422) return ERROR_MESSAGES.VALIDATION_ERROR
        if (response?.status >= 500) return ERROR_MESSAGES.SERVER_ERROR

        // Check for custom error message from API
        if (response?.data?.message) {
            return response.data.message
        }
    }

    // Handle network errors
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message.toLowerCase()

        if (message.includes('network') || message.includes('fetch')) {
            return ERROR_MESSAGES.NETWORK_ERROR
        }
        if (message.includes('timeout')) {
            return ERROR_MESSAGES.TIMEOUT
        }
    }

    // Handle custom error codes
    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as any).code as string
        if (code in ERROR_MESSAGES) {
            return ERROR_MESSAGES[code as ErrorCode]
        }
    }

    // Fallback
    return ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Log error to console in development, send to monitoring in production
 */
export function logError(error: unknown, context?: string) {
    if (process.env.NODE_ENV === 'development') {
        console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)
    }

    // In production, send to Sentry or other monitoring service
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        // TODO: Send to Sentry
        // Sentry.captureException(error, { tags: { context } })
    }
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: unknown, context?: string): {
    message: string
    shouldRetry: boolean
} {
    logError(error, context)

    const message = getUserFriendlyError(error)

    // Determine if error is retryable
    const shouldRetry =
        message === ERROR_MESSAGES.NETWORK_ERROR ||
        message === ERROR_MESSAGES.TIMEOUT ||
        message === ERROR_MESSAGES.SERVER_ERROR ||
        message === ERROR_MESSAGES.SERVICE_UNAVAILABLE

    return { message, shouldRetry }
}
