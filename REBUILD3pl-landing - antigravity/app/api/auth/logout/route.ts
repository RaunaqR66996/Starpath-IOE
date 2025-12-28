import { NextRequest, NextResponse } from 'next/server'
import { revokeSession } from '@/lib/auth/session-manager'
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE } from '@/lib/auth/edge-token'
import { recordAuditLog } from '@/lib/security/audit-logger'
import { authenticateRequest } from '@/lib/auth/middleware'

const clearCookie = (name: string, request: NextRequest) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: (request.nextUrl.protocol === 'https:') || process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 0
})

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
    const authenticated = await authenticateRequest(request)
    const user = authenticated?.user

    await revokeSession(sessionToken, 'user_logout')

    const response = NextResponse.json({ success: true })
    response.cookies.set(ACCESS_TOKEN_COOKIE, '', clearCookie(ACCESS_TOKEN_COOKIE, request))
    response.cookies.set(REFRESH_TOKEN_COOKIE, '', clearCookie(REFRESH_TOKEN_COOKIE, request))
    response.cookies.set(SESSION_COOKIE, '', clearCookie(SESSION_COOKIE, request))

    if (user) {
      await recordAuditLog({
        action: 'auth.logout',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        organizationId: user.organizationId,
        ipAddress:  request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent')
      })
    }

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: false, error: 'Failed to logout' }, { status: 500 })
  }
}

