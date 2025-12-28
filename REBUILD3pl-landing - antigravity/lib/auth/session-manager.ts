import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL ?? 60 * 60 * 24 * 7) // default 7 days

interface SessionMetadata {
  ipAddress?: string | null
  userAgent?: string | null
  reason?: string | null
}

export interface SessionTokens {
  refreshToken: string
  sessionToken: string
  expiresAt: Date
}

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex')
const userSessions = () => (prisma as any).userSession

export async function createSession(userId: string, metadata: SessionMetadata = {}): Promise<SessionTokens> {
  const refreshToken = crypto.randomBytes(48).toString('hex')
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)

  await userSessions().create({
    data: {
      userId,
      refreshTokenHash: hash(refreshToken),
      sessionTokenHash: hash(sessionToken),
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
      reason: metadata.reason ?? null,
      expiresAt
    }
  })

  return { refreshToken, sessionToken, expiresAt }
}

export async function validateSession(sessionToken: string | undefined | null) {
  if (!sessionToken) return null
  const session = await userSessions().findUnique({
    where: { sessionTokenHash: hash(sessionToken) },
    include: { user: true }
  })

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null
  }

  return session
}

export async function rotateSession(refreshToken: string | undefined | null): Promise<{ session: SessionTokens; userId: string }> {
  if (!refreshToken) {
    throw new Error('Missing refresh token')
  }

  const existing = await userSessions().findUnique({
    where: { refreshTokenHash: hash(refreshToken) }
  })

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new Error('Invalid session')
  }

  const newRefresh = crypto.randomBytes(48).toString('hex')
  const newSession = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)

  await userSessions().update({
    where: { id: existing.id },
    data: {
      refreshTokenHash: hash(newRefresh),
      sessionTokenHash: hash(newSession),
      expiresAt,
      revokedAt: null,
      revokedBy: null,
      reason: null
    }
  })

  return {
    session: {
      refreshToken: newRefresh,
      sessionToken: newSession,
      expiresAt
    },
    userId: existing.userId
  }
}

export async function revokeSession(sessionToken?: string | null, reason?: string) {
  if (!sessionToken) return
  await userSessions().updateMany({
    where: { sessionTokenHash: hash(sessionToken), revokedAt: null },
    data: {
      revokedAt: new Date(),
      reason: reason ?? 'user_logout'
    }
  })
}

export async function revokeAllUserSessions(userId: string, revokedBy?: string, reason?: string) {
  await userSessions().updateMany({
    where: { userId, revokedAt: null },
    data: {
      revokedAt: new Date(),
      revokedBy: revokedBy ?? userId,
      reason: reason ?? 'bulk_termination'
    }
  })
}

