import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { authenticateRequest, AuthenticatedRequest } from '@/lib/auth/middleware'
import { successResponse, errorResponse } from '@/lib/api/response'
import { sanitizePayload } from '@/lib/security/input-sanitizer'
import { recordAuditLog } from '@/lib/security/audit-logger'
import { RouteRole } from '@/lib/security/route-policies'
import { logger } from '@/lib/monitoring/logger'
import { recordApiDuration } from '@/lib/monitoring/metrics'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

export interface HandlerContext<TBody = unknown> {
  request: NextRequest | AuthenticatedRequest
  params?: Record<string, string>
  user?: AuthenticatedRequest['user']
  body?: TBody
}

interface HandlerOptions {
  requireAuth?: boolean
  roles?: RouteRole[]
  audit?: {
    action: string
    resource?: string
    captureResponse?: boolean
    resourceId?: (result: unknown) => string | undefined
  }
  parseJson?: boolean
  sanitizeBody?: boolean
}

export function withApiHandler<TBody = unknown, TResult = unknown>(
  handler: (context: HandlerContext<TBody>) => Promise<TResult>,
  options: HandlerOptions = {}
) {
  return async (request: NextRequest, context: any = {}) => {
    const method = request.method.toUpperCase()
    const route = request.nextUrl.pathname
    const handlerName = options.audit?.action || handler.name || 'api_handler'
    const start = process.hrtime.bigint()

    // Await params if they exist (Next.js 15)
    const params = context.params ? await context.params : undefined;

    const finalize = (response: NextResponse, userId?: string) => {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9
      recordApiDuration(method, route, response.status, durationSeconds)
      logger.info('api_request', {
        handler: handlerName,
        route,
        method,
        status: response.status,
        durationSeconds,
        userId
      })
      return response
    }

    try {
      let authRequest: NextRequest | AuthenticatedRequest = request
      let user: AuthenticatedRequest['user']

      if (options.requireAuth) {
        const authenticated = await authenticateRequest(request)
        if (!authenticated?.user) {
          return errorResponse('Unauthorized', 401)
        }
        authRequest = authenticated
        user = authenticated.user

        if (options.roles && !options.roles.includes(user.role as RouteRole)) {
          return errorResponse('Forbidden', 403)
        }
      }

      let body: TBody | undefined
      if (options.parseJson && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const rawBody = await request.json()
        body = (options.sanitizeBody ?? true) ? sanitizePayload(rawBody) : rawBody
      }

      const result = await handler({
        request: authRequest,
        params,
        user,
        body
      })

      if (options.audit && user) {
        await recordAuditLog({
          userId: user.id,
          organizationId: user.organizationId,
          action: options.audit.action,
          resource: options.audit.resource ?? request.nextUrl.pathname,
          resourceId: options.audit.resourceId?.(result) ?? undefined,
          details: options.audit.captureResponse ? (typeof result === 'object' ? (result as Record<string, unknown>) : { value: result }) : undefined,
          ipAddress: request.ip ?? request.headers.get('x-forwarded-for') ?? null,
          userAgent: request.headers.get('user-agent') ?? null
        })
      }

      if (result instanceof NextResponse) {
        return finalize(result, user?.id)
      }

      return finalize(successResponse(result), user?.id)
    } catch (error) {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9

      if (error instanceof ApiError) {
        recordApiDuration(method, route, error.status, durationSeconds)
        logger.warn('api_error', { handler: handlerName, route, method, status: error.status, durationSeconds })
        return errorResponse(error.message, error.status)
      }

      if (error instanceof ZodError) {
        recordApiDuration(method, route, 400, durationSeconds)
        logger.warn('api_validation_error', { handler: handlerName, route, method, durationSeconds, issues: error.issues })
        return errorResponse(
          {
            error: 'Invalid input',
            details: error.issues
          },
          400
        )
      }

      logger.error('api_handler_error', error as Error, { handler: handlerName, route, method })
      recordApiDuration(method, route, 500, durationSeconds)
      return errorResponse('Internal server error', 500)
    }
  }
}

