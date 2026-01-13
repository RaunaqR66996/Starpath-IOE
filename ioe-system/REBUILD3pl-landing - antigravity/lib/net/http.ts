interface RetryOptions {
  timeout?: number
  retries?: number
  backoff?: 'linear' | 'exponential'
  baseDelay?: number
  maxDelay?: number
}

interface FetchOptions extends RequestInit {
  retry?: RetryOptions
}

class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public response?: Response
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Enhanced fetch with retry logic, timeout, and exponential backoff
 */
export async function fetchWithRetry(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const {
    retry = {},
    ...fetchOptions
  } = options

  const {
    timeout = 10000, // 10 seconds default
    retries = 3,
    backoff = 'exponential',
    baseDelay = 1000, // 1 second
    maxDelay = 10000 // 10 seconds max
  } = retry

  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Check if response is ok
      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          response
        )
      }

      return response

    } catch (error) {
      lastError = error as Error

      // Don't retry on certain errors
      if (error instanceof TimeoutError || 
          (error instanceof NetworkError && error.status && error.status >= 400 && error.status < 500)) {
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw error
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, baseDelay, maxDelay, backoff)
      
      console.warn(`Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message)
      
      await sleep(delay)
    }
  }

  throw lastError!
}

/**
 * Calculate delay for retry attempts
 */
function calculateDelay(
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  backoff: 'linear' | 'exponential'
): number {
  let delay: number

  if (backoff === 'exponential') {
    delay = baseDelay * Math.pow(2, attempt)
  } else {
    delay = baseDelay * (attempt + 1)
  }

  return Math.min(delay, maxDelay)
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Convenience method for GET requests
 */
export async function get(url: string, options: FetchOptions = {}): Promise<Response> {
  return fetchWithRetry(url, { ...options, method: 'GET' })
}

/**
 * Convenience method for POST requests
 */
export async function post(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
  return fetchWithRetry(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * Convenience method for PUT requests
 */
export async function put(url: string, data?: any, options: FetchOptions = {}): Promise<Response> {
  return fetchWithRetry(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * Convenience method for DELETE requests
 */
export async function del(url: string, options: FetchOptions = {}): Promise<Response> {
  return fetchWithRetry(url, { ...options, method: 'DELETE' })
}

/**
 * Parse JSON response with error handling
 */
export async function parseJson<T = any>(response: Response): Promise<T> {
  try {
    return await response.json()
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}`)
  }
}

/**
 * Handle common HTTP errors
 */
export function handleHttpError(error: Error): string {
  if (error instanceof NetworkError) {
    if (error.status === 404) {
      return 'Resource not found'
    } else if (error.status === 401) {
      return 'Unauthorized - please log in again'
    } else if (error.status === 403) {
      return 'Forbidden - insufficient permissions'
    } else if (error.status === 429) {
      return 'Too many requests - please try again later'
    } else if (error.status >= 500) {
      return 'Server error - please try again later'
    } else {
      return `Request failed: ${error.message}`
    }
  } else if (error instanceof TimeoutError) {
    return 'Request timed out - please try again'
  } else {
    return `Network error: ${error.message}`
  }
}

export { NetworkError, TimeoutError }
export type { FetchOptions, RetryOptions }
