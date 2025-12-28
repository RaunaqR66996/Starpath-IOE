type Primitive = string | number | boolean | null | undefined

const sanitizeString = (value: string) =>
  value
    .replace(/[\u0000-\u001F\u007F]+/g, '')
    .replace(/<\/?script.*?>/gi, '')
    .trim()

export function sanitizePayload<T>(payload: T): T {
  if (payload === null || payload === undefined) {
    return payload
  }

  if (typeof payload === 'string') {
    return sanitizeString(payload) as T
  }

  if (typeof payload === 'number' || typeof payload === 'boolean') {
    return payload
  }

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item)) as T
  }

  if (payload instanceof Date) {
    return payload
  }

  if (typeof payload === 'object') {
    const sanitized: Record<string, Primitive | object> = {}
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      sanitized[key] = sanitizePayload(value as Primitive)
    }
    return sanitized as T
  }

  return payload
}

