export interface RetryOptions {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitter?: boolean
  onRetry?: (error: unknown, attempt: number, delay: number) => void
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  {
    retries = 3,
    baseDelayMs = 200,
    maxDelayMs = 5_000,
    jitter = true,
    onRetry
  }: RetryOptions = {}
): Promise<T> {
  let attempt = 0
  let lastError: unknown

  while (attempt <= retries) {
    try {
      return await operation(attempt + 1)
    } catch (error) {
      lastError = error
      attempt += 1

      if (attempt > retries) {
        break
      }

      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
      const delay = jitter ? backoff * (0.5 + Math.random() / 2) : backoff
      onRetry?.(error, attempt, delay)
      await sleep(delay)
    }
  }

  throw lastError ?? new Error('Retry operation failed')
}

