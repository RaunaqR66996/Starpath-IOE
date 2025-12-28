interface RateBucket {
  count: number
  resetAt: number
}

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15_000)
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120)

const buckets = new Map<string, RateBucket>()

export function enforceRateLimit(key: string) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (bucket.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000)
    }
  }

  bucket.count += 1
  return { allowed: true }
}

