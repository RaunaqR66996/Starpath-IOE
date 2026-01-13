const CSRF_SECRET = process.env.CSRF_SECRET || 'change_me_csrf'
const encoder = new TextEncoder()
const subtleCrypto = globalThis.crypto?.subtle

if (!subtleCrypto) {
  throw new Error('Web Crypto APIs are not available in this runtime')
}

let cachedKey: CryptoKey | null = null

async function getKey() {
  if (cachedKey) return cachedKey
  cachedKey = await subtleCrypto.importKey(
    'raw',
    encoder.encode(CSRF_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return cachedKey
}

async function sign(value: string) {
  const key = await getKey()
  const signature = await subtleCrypto.sign('HMAC', key, encoder.encode(value))
  const bytes = new Uint8Array(signature)
  let result = ''
  bytes.forEach(byte => {
    result += byte.toString(16).padStart(2, '0')
  })
  return result
}

const timingSafeCompare = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

const CSRF_TTL_MS = Number(process.env.CSRF_TOKEN_TTL ?? 60 * 60 * 1000) // default 1 hour

export async function generateCsrfToken(sessionToken?: string | null) {
  if (!sessionToken) return null
  const issuedAt = Date.now().toString()
  const signature = await sign(`${sessionToken}:${issuedAt}`)
  return `${issuedAt}.${signature}`
}

export async function validateCsrfToken(token?: string | null, sessionToken?: string | null) {
  if (!token || !sessionToken) return false
  const [issuedAt, signature] = token.split('.')
  if (!issuedAt || !signature) return false

  const issuedAtMs = Number(issuedAt)
  if (Number.isNaN(issuedAtMs) || Date.now() - issuedAtMs > CSRF_TTL_MS) {
    return false
  }

  const expected = await sign(`${sessionToken}:${issuedAt}`)
  return timingSafeCompare(expected, signature)
}

