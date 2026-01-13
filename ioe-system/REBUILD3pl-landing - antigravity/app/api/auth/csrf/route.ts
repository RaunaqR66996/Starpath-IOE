import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/edge-token'
import { generateCsrfToken } from '@/lib/security/csrf'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Missing session' }, { status: 401 })
    }

    const csrfToken = await generateCsrfToken(sessionToken)
    if (!csrfToken) {
      return NextResponse.json({ success: false, error: 'Unable to create token' }, { status: 500 })
    }

    return NextResponse.json({ success: true, csrfToken })
  } catch (error) {
    console.error('CSRF token error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create CSRF token' }, { status: 500 })
  }
}

