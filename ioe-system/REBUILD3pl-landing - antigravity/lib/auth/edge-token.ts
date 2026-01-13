const JWT_SECRET = process.env.JWT_SECRET || 'change_me'
const encoder = new TextEncoder()
const subtleCrypto = globalThis.crypto?.subtle

if (!subtleCrypto) {
  throw new Error('Web Crypto APIs are not available in this runtime')
}

let cachedKey: CryptoKey | null = null

const getKey = async () => {
  if (cachedKey) return cachedKey
  cachedKey = await subtleCrypto.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return cachedKey
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  if (typeof btoa === 'function') {
    return btoa(binary)
  }
  // @ts-ignore Buffer is available in Node runtimes
  return Buffer.from(binary, 'binary').toString('base64')
}

const base64ToBytes = (value: string) => {
  if (typeof atob === 'function') {
    const binary = atob(value)
    return Uint8Array.from(binary, char => char.charCodeAt(0))
  }
  // @ts-ignore Buffer is available in Node runtimes
  return Uint8Array.from(Buffer.from(value, 'base64'))
}

const toBase64Url = (value: string) =>
  value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const fromBase64Url = (value: string) => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=')
  return padded.replace(/-/g, '+').replace(/_/g, '/')
}

const signSegment = async (segment: string) => {
  const key = await getKey()
  const signature = await subtleCrypto.sign('HMAC', key, encoder.encode(segment))
  return toBase64Url(bytesToBase64(new Uint8Array(signature)))
}

const constantTimeCompare = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export interface EdgeTokenPayload {
  id: string
  email: string
  role: string
  organizationId?: string
  exp?: number
}

export const ACCESS_TOKEN_COOKIE = 'rebuild3pl.access'
export const REFRESH_TOKEN_COOKIE = 'rebuild3pl.refresh'
export const SESSION_COOKIE = 'rebuild3pl.session'

export const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL ?? 60 * 15) // 15 minutes

export async function verifyEdgeToken(token: string): Promise<EdgeTokenPayload | null> {
  try {
    const segments = token.split('.')
    if (segments.length !== 3) {
      return null
    }

    const [encodedHeader, encodedPayload, encodedSignature] = segments
    const headerJson = new TextDecoder().decode(base64ToBytes(fromBase64Url(encodedHeader)))
    const header = JSON.parse(headerJson)

    if (header.alg !== 'HS256') {
      return null
    }

    const expectedSignature = await signSegment(`${encodedHeader}.${encodedPayload}`)
    if (!constantTimeCompare(expectedSignature, encodedSignature)) {
      return null
    }

    const payloadJson = new TextDecoder().decode(base64ToBytes(fromBase64Url(encodedPayload)))
    const payload = JSON.parse(payloadJson) as EdgeTokenPayload

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null
    }

    return payload
  } catch (error) {
    console.warn('Failed to verify token at edge:', error)
    return null
  }
}


export async function signEdgeToken(payload: EdgeTokenPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = toBase64Url(bytesToBase64(encoder.encode(JSON.stringify(header))))

  const now = Math.floor(Date.now() / 1000)
  const exp = payload.exp ?? (now + ACCESS_TOKEN_TTL_SECONDS)
  const payloadWithExp = { ...payload, exp }

  const encodedPayload = toBase64Url(bytesToBase64(encoder.encode(JSON.stringify(payloadWithExp))))

  const signature = await signSegment(`${encodedHeader}.${encodedPayload}`)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}
