// WMS Event Store - Event Sourcing Infrastructure
// Handles event storage, retrieval, and projection updates

import { EventStore, AuditEvent } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface WmsEvent {
  id: string
  aggregateId: string
  eventType: string
  eventData: any
  version: number
  timestamp: Date
  actorId: string
  tenantId: string
}

export interface EventMetadata {
  actorId: string
  tenantId: string
  correlationId?: string
  causationId?: string
  timestamp?: Date
}

export class WmsEventStore {
  private static instance: WmsEventStore

  public static getInstance(): WmsEventStore {
    if (!WmsEventStore.instance) {
      WmsEventStore.instance = new WmsEventStore()
    }
    return WmsEventStore.instance
  }

  /**
   * Append an event to the event store
   */
  async appendEvent(
    aggregateId: string,
    eventType: string,
    eventData: any,
    metadata: EventMetadata
  ): Promise<WmsEvent> {
    // Get current version for optimistic locking
    const lastEvent = await prisma.eventStore.findFirst({
      where: { aggregateId },
      orderBy: { version: 'desc' }
    })

    const version = (lastEvent?.version || 0) + 1

    // Create event
    const event = await prisma.eventStore.create({
      data: {
        aggregateId,
        eventType,
        eventData,
        version,
        actorId: metadata.actorId,
        tenantId: metadata.tenantId,
        timestamp: metadata.timestamp || new Date()
      }
    })

    // Log audit event
    await this.logAuditEvent({
      userId: metadata.actorId,
      action: eventType,
      resource: 'EventStore',
      resourceId: event.id,
      details: {
        aggregateId,
        eventType,
        version
      }
    })

    return {
      id: event.id,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      eventData: event.eventData as any,
      version: event.version,
      timestamp: event.timestamp,
      actorId: event.actorId,
      tenantId: event.tenantId
    }
  }

  /**
   * Get event stream for an aggregate
   */
  async getEventStream(
    aggregateId: string,
    fromVersion?: number
  ): Promise<WmsEvent[]> {
    const events = await prisma.eventStore.findMany({
      where: {
        aggregateId,
        ...(fromVersion && { version: { gte: fromVersion } })
      },
      orderBy: { version: 'asc' }
    })

    return events.map(event => ({
      id: event.id,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      eventData: event.eventData as any,
      version: event.version,
      timestamp: event.timestamp,
      actorId: event.actorId,
      tenantId: event.tenantId
    }))
  }

  /**
   * Get events by type and time range
   */
  async getEventsByType(
    eventType: string,
    fromDate?: Date,
    toDate?: Date,
    tenantId?: string
  ): Promise<WmsEvent[]> {
    const events = await prisma.eventStore.findMany({
      where: {
        eventType,
        ...(fromDate && toDate && {
          timestamp: {
            gte: fromDate,
            lte: toDate
          }
        }),
        ...(tenantId && { tenantId })
      },
      orderBy: { timestamp: 'asc' }
    })

    return events.map(event => ({
      id: event.id,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      eventData: event.eventData as any,
      version: event.version,
      timestamp: event.timestamp,
      actorId: event.actorId,
      tenantId: event.tenantId
    }))
  }

  /**
   * Replay events to rebuild aggregate state
   */
  async replayEvents<T>(
    aggregateId: string,
    initialState: T,
    eventHandlers: Record<string, (state: T, event: WmsEvent) => T>
  ): Promise<T> {
    const events = await this.getEventStream(aggregateId)
    
    return events.reduce((state, event) => {
      const handler = eventHandlers[event.eventType]
      if (handler) {
        return handler(state, event)
      }
      return state
    }, initialState)
  }

  /**
   * Get events for projection updates
   */
  async getEventsForProjection(
    fromTimestamp: Date,
    eventTypes?: string[],
    tenantId?: string
  ): Promise<WmsEvent[]> {
    const events = await prisma.eventStore.findMany({
      where: {
        timestamp: { gte: fromTimestamp },
        ...(eventTypes && { eventType: { in: eventTypes } }),
        ...(tenantId && { tenantId })
      },
      orderBy: { timestamp: 'asc' }
    })

    return events.map(event => ({
      id: event.id,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      eventData: event.eventData as any,
      version: event.version,
      timestamp: event.timestamp,
      actorId: event.actorId,
      tenantId: event.tenantId
    }))
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(auditData: {
    userId: string
    action: string
    resource: string
    resourceId: string
    details: any
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await prisma.auditEvent.create({
      data: {
        userId: auditData.userId,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        details: auditData.details,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent
      }
    })
  }

  /**
   * Get audit trail for a resource
   */
  async getAuditTrail(
    resource: string,
    resourceId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<AuditEvent[]> {
    return await prisma.auditEvent.findMany({
      where: {
        resource,
        resourceId,
        ...(fromDate && toDate && {
          timestamp: {
            gte: fromDate,
            lte: toDate
          }
        })
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
  }
}

// Event Types for WMS
export const WMS_EVENT_TYPES = {
  // Inventory Events
  INVENTORY_RECEIVED: 'InventoryReceived',
  INVENTORY_ADJUSTED: 'InventoryAdjusted',
  INVENTORY_TRANSFERRED: 'InventoryTransferred',
  INVENTORY_ALLOCATED: 'InventoryAllocated',
  INVENTORY_PICKED: 'InventoryPicked',
  INVENTORY_SHIPPED: 'InventoryShipped',

  // Order Events
  ORDER_CREATED: 'OrderCreated',
  ORDER_ALLOCATED: 'OrderAllocated',
  ORDER_PICKING_STARTED: 'OrderPickingStarted',
  ORDER_PICKING_COMPLETED: 'OrderPickingCompleted',
  ORDER_PACKED: 'OrderPacked',
  ORDER_SHIPPED: 'OrderShipped',

  // Task Events
  TASK_CREATED: 'TaskCreated',
  TASK_ASSIGNED: 'TaskAssigned',
  TASK_STARTED: 'TaskStarted',
  TASK_COMPLETED: 'TaskCompleted',
  TASK_CANCELLED: 'TaskCancelled',

  // Warehouse Events
  BIN_STATUS_CHANGED: 'BinStatusChanged',
  ZONE_STATUS_CHANGED: 'ZoneStatusChanged',
  DOCK_STATUS_CHANGED: 'DockStatusChanged',

  // System Events
  SYSTEM_STARTED: 'SystemStarted',
  SYSTEM_STOPPED: 'SystemStopped',
  MAINTENANCE_STARTED: 'MaintenanceStarted',
  MAINTENANCE_COMPLETED: 'MaintenanceCompleted'
} as const

export type WmsEventType = typeof WMS_EVENT_TYPES[keyof typeof WMS_EVENT_TYPES]


