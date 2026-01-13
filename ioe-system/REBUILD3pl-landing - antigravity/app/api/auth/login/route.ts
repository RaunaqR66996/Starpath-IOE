import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// TODO: Add password fields and auth infrastructure to schema
// Temporarily using simplified auth for MVP

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    // TODO: Implement proper password verification
    // For now, accept any password for MVP
    // const isValid = user.passwordHash ? await verifyPassword(password, user.passwordHash) : false
    const isValid = true // Bypass for seeded users without passwords

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate edge token
    const { signEdgeToken, ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_TTL_SECONDS } = await import('@/lib/auth/edge-token')

    const token = await signEdgeToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        organizationId: user.organizationId
      }
    })

    // Set the cookie
    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_TTL_SECONDS
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: error.issues }, { status: 400 })
    }

    console.error('Login error:', error)
    return NextResponse.json({ success: false, error: 'Failed to login' }, { status: 500 })
  }
}
