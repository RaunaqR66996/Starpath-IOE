import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { hashPassword as hashPasswordImpl, verifyPassword as verifyPasswordImpl } from '@/lib/auth/password-service'

// JWT Secret must be set in production
const JWT_SECRET = process.env.JWT_SECRET || 'change_me'

// Warn if using default secret in production
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change_me') {
  console.error('⚠️  WARNING: JWT_SECRET is using default value! Set JWT_SECRET environment variable in production.')
}

export type Role = 'admin' | 'supervisor' | 'associate' | 'viewer'

export interface UserPayload {
  id: string
  email: string
  name: string
  role: Role
  organizationId?: string
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export async function hashPassword(password: string): Promise<string> {
  return hashPasswordImpl(password)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return verifyPasswordImpl(password, hash)
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

export function getCurrentUser(request: NextRequest): UserPayload | null {
  const token = extractTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

export function requireAuth(roles?: Role[]) {
  return function (request: NextRequest): UserPayload {
    const user = getCurrentUser(request)
    if (!user) {
      throw new Error('Authentication required')
    }
    
    if (roles && !roles.includes(user.role)) {
      throw new Error('Insufficient permissions')
    }
    
    return user
  }
}

// Permission helpers
export const PERMISSIONS: Record<Role, readonly string[]> = {
  admin: ['*'],
  supervisor: [
    'inventory:read', 'inventory:write',
    'orders:read', 'orders:write',
    'tasks:read', 'tasks:write',
    'reports:read',
    'settings:read'
  ],
  associate: [
    'inventory:read',
    'tasks:read', 'tasks:execute',
    'orders:read'
  ],
  viewer: [
    'inventory:read',
    'orders:read',
    'tasks:read',
    'reports:read'
  ]
}

export function hasPermission(userRole: Role, permission: string): boolean {
  const rolePermissions = PERMISSIONS[userRole]
  return rolePermissions.includes('*') || rolePermissions.includes(permission)
}
































































