import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { withRetry } from '@/lib/utils/retry'
import { CircuitBreaker } from '@/lib/utils/circuit-breaker'

const getBaseUrl = () => process.env.ERP_BASE_URL ?? ''
const getApiKey = () => process.env.ERP_API_KEY ?? ''
const getDefaultOrgId = () => process.env.DEFAULT_ORGANIZATION_ID ?? 'default-org'

export interface ErpOrderPayload {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  customerCode: string
  lines: Array<{
    sku: string
    quantity: number
    unitPrice: number
  }>
}

export interface ErpInventoryPayload {
  sku: string
  warehouseCode: string
  quantity: number
  availableQuantity: number
  reservedQuantity: number
}

export interface ErpShipmentPayload {
  shipmentId: string
  carrierCode: string
  trackingNumber?: string
  status: string
  stops: Array<{
    stopType: 'pickup' | 'delivery'
    scheduledAt: string
    locationCode: string
  }>
}

export interface ErpWebhookPayload {
  id: string
  organizationId: string
  eventType: string
  entityType: string
  entityId: string
  payload: Record<string, unknown>
  occurredAt: string
}

export interface ErpSyncJob {
  id: string
  type: 'orders' | 'inventory' | 'shipments' | 'custom'
  systemId: string
  payload: Record<string, unknown>
  status: 'queued' | 'processing' | 'completed' | 'failed'
  attempts: number
  lastError?: string
  createdAt: string
  updatedAt: string
}

class InMemoryErpQueue {
  private jobs: Map<string, ErpSyncJob> = new Map()

  async enqueue(job: Omit<ErpSyncJob, 'createdAt' | 'updatedAt' | 'attempts' | 'status'>) {
    const record: ErpSyncJob = {
      ...job,
      status: 'queued',
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.jobs.set(record.id, record)
    return record
  }

  async update(id: string, patch: Partial<ErpSyncJob>) {
    const existing = this.jobs.get(id)
    if (!existing) return null
    const updated: ErpSyncJob = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString()
    }
    this.jobs.set(id, updated)
    return updated
  }

  async list(limit = 20) {
    return Array.from(this.jobs.values()).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)).slice(0, limit)
  }
}

class ErpAdapter {
  private breaker = new CircuitBreaker()
  private queue = new InMemoryErpQueue()

  private async post(path: string, body: unknown) {
    const baseUrl = getBaseUrl()
    const apiKey = getApiKey()

    if (!baseUrl || !apiKey) {
      throw new Error('ERP configuration missing (ERP_BASE_URL / ERP_API_KEY)')
    }

    return this.breaker.execute(async () =>
      withRetry(
        async attempt => {
          const response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'x-request-attempt': `${attempt}`
            },
            body: JSON.stringify(body)
          })

          if (!response.ok) {
            const errorBody = await response.text().catch(() => '')
            const message = `ERP request failed (${response.status}): ${errorBody}`
            throw new Error(message)
          }

          return response.json().catch(() => ({}))
        },
        {
          retries: 3,
          onRetry: (error, attempt, delay) => {
            logger.warn('erp_request_retry', { error, attempt, delay, path })
          }
        }
      )
    )
  }

  async pushOrders(systemId: string, orders: ErpOrderPayload[]) {
    const payload = { systemId, orders }
    await this.post('/orders/sync', payload)
    await this.recordEvent(systemId, 'erp.orders.sync', orders.length)
  }

  async pushInventory(systemId: string, inventory: ErpInventoryPayload[]) {
    const payload = { systemId, inventory }
    await this.post('/inventory/sync', payload)
    await this.recordEvent(systemId, 'erp.inventory.sync', inventory.length)
  }

  async pushShipments(systemId: string, shipments: ErpShipmentPayload[]) {
    const payload = { systemId, shipments }
    await this.post('/shipments/sync', payload)
    await this.recordEvent(systemId, 'erp.shipments.sync', shipments.length)
  }

  async handleWebhook(payload: ErpWebhookPayload) {
    await prisma.analyticsEvent.create({
      data: {
        organizationId: payload.organizationId ?? getDefaultOrgId(),
        eventType: payload.eventType,
        entityType: payload.entityType,
        entityId: payload.entityId,
        eventData: payload.payload,
        metrics: {
          source: 'erp-webhook',
          receivedAt: payload.occurredAt
        }
      }
    })

    logger.info('erp_webhook_processed', {
      eventType: payload.eventType,
      entityType: payload.entityType,
      entityId: payload.entityId
    })
  }

  async enqueueSync(job: Omit<ErpSyncJob, 'createdAt' | 'updatedAt' | 'attempts' | 'status'>) {
    return this.queue.enqueue(job)
  }

  async listRecentJobs(limit = 20) {
    return this.queue.list(limit)
  }

  async getStatus(systemId?: string) {
    const recentEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventType: { startsWith: 'erp.' },
        ...(systemId ? { entityId: systemId } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 25
    })

    const jobs = await this.listRecentJobs()

    return {
      systems: [
        {
          id: systemId ?? 'default-system',
          status: this.breaker ? 'connected' : 'unknown',
          lastSync: recentEvents[0]?.createdAt ?? null,
          pendingJobs: jobs.length
        }
      ],
      recentSyncs: recentEvents.map(event => ({
        id: event.id,
        type: event.eventType,
        entityId: event.entityId,
        status: 'success',
        recordedAt: event.createdAt,
        metrics: event.metrics
      })),
      queue: jobs
    }
  }

  private async recordEvent(systemId: string, eventType: string, count: number) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          organizationId: getDefaultOrgId(),
          eventType,
          entityType: 'integration',
          entityId: systemId,
          eventData: {
            count
          },
          metrics: {
            systemId,
            count
          }
        }
      })
    } catch (error) {
      logger.warn('erp_event_record_failed', { error, eventType, systemId })
    }
  }
}

export const erpAdapter = new ErpAdapter()

