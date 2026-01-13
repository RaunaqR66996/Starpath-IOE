import { prisma } from '@/lib/prisma'

interface AuditEvent {
  userId?: string | null
  organizationId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  details?: Record<string, unknown> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export async function recordAuditLog(event: AuditEvent) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: event.userId ?? null,
        organizationId: event.organizationId ?? null,
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId ?? event.resource,
        details: event.details ?? {},
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null
      }
    })
  } catch (error) {
    console.warn('Failed to record audit log', error)
  }
}

