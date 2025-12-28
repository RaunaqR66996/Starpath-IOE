import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, extractTokenFromRequest, UserPayload } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest | null> {
  try {
    // Extract token from request
    const token = extractTokenFromRequest(request);
    if (!token) {
      return null;
    }

    // Verify JWT token
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Get user from database to verify they exist and get organization
    // Note: If using Supabase Auth, you may want to use Supabase's user verification instead
    // For now, we'll use the payload directly and optionally verify in database
    try {
      // Check if user exists in database (optional - depends on your auth strategy)
      // If using external auth (Supabase), you might skip this and trust the JWT
      const user = await prisma.user?.findUnique({
        where: { id: payload.id },
        include: { organization: true }
      }).catch(() => null); // Gracefully handle if User model doesn't exist yet

      // If user model exists, use database user; otherwise use JWT payload
      if (user) {
        return {
          ...request,
          user: {
            id: user.id,
            email: payload.email,
            organizationId: user.organizationId || 'default-org',
            role: payload.role || 'viewer'
          }
        } as AuthenticatedRequest;
      }

      // Fallback: Use JWT payload directly (for external auth systems like Supabase)
      return {
        ...request,
        user: {
          id: payload.id,
          email: payload.email,
          organizationId: payload.organizationId || 'default-org',
          role: payload.role || 'viewer'
        }
      } as AuthenticatedRequest;

    } catch (dbError) {
      // Database query failed - still allow auth via JWT if token is valid
      // This supports external auth providers (e.g., Supabase)
      console.warn('Database user lookup failed, using JWT payload:', dbError);
      return {
        ...request,
        user: {
          id: payload.id,
          email: payload.email,
          organizationId: payload.organizationId || 'default-org',
          role: payload.role || 'viewer'
        }
      } as AuthenticatedRequest;
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authenticatedRequest = await authenticateRequest(request);
    
    if (!authenticatedRequest?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(authenticatedRequest);
  };
}

export function optionalAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authenticatedRequest = await authenticateRequest(request);
    
    // If no auth, create a request without user (handler must handle null user)
    const req = authenticatedRequest || {
      ...request,
      user: undefined
    } as AuthenticatedRequest;

    return handler(req);
  };
} 