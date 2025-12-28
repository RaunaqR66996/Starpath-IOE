import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rotateSession, REFRESH_TOKEN_TTL_SECONDS } from '@/lib/auth/session-manager'
import { generateToken, Role } from '@/lib/auth'
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_COOKIE, SESSION_COOKIE } from '@/lib/auth/edge-token'

const cookieOptions = (maxAge: number, request: NextRequest) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: (request.nextUrl.protocol === 'https:') || process.env.NODE_ENV === 'production',
  path: '/',
  maxAge
})

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
    const { session, userId } = await rotateSession(refreshToken)

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const accessToken = generateToken({
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role as Role,
      organizationId: user.organizationId ?? undefined
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions(ACCESS_TOKEN_TTL_SECONDS, request))
    response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, cookieOptions(REFRESH_TOKEN_TTL_SECONDS, request))
    response.cookies.set(SESSION_COOKIE, session.sessionToken, cookieOptions(REFRESH_TOKEN_TTL_SECONDS, request))

    return response
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 })
  }
}

