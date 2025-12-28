// WMS Projections - Read Model Updates
// Handles projection updates from events for fast read queries

import { prisma } from '@/lib/prisma'
import { WmsEventStore, WmsEvent, WMS_EVENT_TYPES } from '@/lib/events/wms-event-store'

export class WmsProjections {
  private eventStore: WmsEventStore

  constructor() {
    this.eventStore = WmsEventStore.getInstance()
  }

  /**
   * Update inventory projection from events
   */
  async updateInventoryProjection(event: WmsEvent): Promise<void> {
    switch (event.eventType) {
      case WMS_EVENT_TYPES.INVENTORY_RECEIVED:
        await this.handleInventoryReceived(event)
        break
      case WMS_EVENT_TYPES.INVENTORY_ADJUSTED:
        await this.handleInventoryAdjusted(event)
        break
      case WMS_EVENT_TYPES.INVENTORY_TRANSFERRED:
        await this.handleInventoryTransferred(event)
        break
      case WMS_EVENT_TYPES.INVENTORY_ALLOCATED:
        await this.handleInventoryAllocated(event)
        break
      case WMS_EVENT_TYPES.INVENTORY_PICKED:
        await this.handleInventoryPicked(event)
        break
      case WMS_EVENT_TYPES.INVENTORY_SHIPPED:
        await this.handleInventoryShipped(event)
        break
    }
  }

  /**
   * Update task projection from events
   */
  async updateTaskProjection(event: WmsEvent): Promise<void> {
    switch (event.eventType) {
      case WMS_EVENT_TYPES.TASK_CREATED:
        await this.handleTaskCreated(event)
        break
      case WMS_EVENT_TYPES.TASK_ASSIGNED:
        await this.handleTaskAssigned(event)
        break
      case WMS_EVENT_TYPES.TASK_STARTED:
        await this.handleTaskStarted(event)
        break
      case WMS_EVENT_TYPES.TASK_COMPLETED:
        await this.handleTaskCompleted(event)
        break
      case WMS_EVENT_TYPES.TASK_CANCELLED:
        await this.handleTaskCancelled(event)
        break
    }
  }

  /**
   * Process all pending events for projections
   */
  async processPendingEvents(
    fromTimestamp: Date,
    tenantId?: string
  ): Promise<void> {
    const events = await this.eventStore.getEventsForProjection(
      fromTimestamp,
      [
        WMS_EVENT_TYPES.INVENTORY_RECEIVED,
        WMS_EVENT_TYPES.INVENTORY_ADJUSTED,
        WMS_EVENT_TYPES.INVENTORY_TRANSFERRED,
        WMS_EVENT_TYPES.INVENTORY_ALLOCATED,
        WMS_EVENT_TYPES.INVENTORY_PICKED,
        WMS_EVENT_TYPES.INVENTORY_SHIPPED,
        WMS_EVENT_TYPES.TASK_CREATED,
        WMS_EVENT_TYPES.TASK_ASSIGNED,
        WMS_EVENT_TYPES.TASK_STARTED,
        WMS_EVENT_TYPES.TASK_COMPLETED,
        WMS_EVENT_TYPES.TASK_CANCELLED
      ],
      tenantId
    )

    for (const event of events) {
      await this.updateInventoryProjection(event)
      await this.updateTaskProjection(event)
    }
  }

  // Inventory Event Handlers
  private async handleInventoryReceived(event: WmsEvent): Promise<void> {
    const { siteId, binId, itemId, quantity, lotNumber, serialNumber } = event.eventData

    await prisma.inventoryProjection.upsert({
      where: {
        siteId_binId_itemId: {
          siteId,
          binId,
          itemId
        }
      },
      update: {
        quantity: {
          increment: quantity
        },
        lastUpdated: new Date()
      },
      create: {
        siteId,
        binId,
        itemId,
        quantity,
        status: 'AVAILABLE',
        lastUpdated: new Date()
      }
    })
  }

  private async handleInventoryAdjusted(event: WmsEvent): Promise<void> {
    const { siteId, binId, itemId, quantity, status } = event.eventData

    await prisma.inventoryProjection.upsert({
      where: {
        siteId_binId_itemId: {
          siteId,
          binId,
          itemId
        }
      },
      update: {
        quantity,
        status,
        lastUpdated: new Date()
      },
      create: {
        siteId,
        binId,
        itemId,
        quantity,
        status,
        lastUpdated: new Date()
      }
    })
  }

  private async handleInventoryTransferred(event: WmsEvent): Promise<void> {
    const { fromSiteId, fromBinId, toSiteId, toBinId, itemId, quantity } = event.eventData

    // Decrease from source
    await prisma.inventoryProjection.upsert({
      where: {
        siteId_binId_itemId: {
          siteId: fromSiteId,
          binId: fromBinId,
          itemId
        }
      },
      update: {
        quantity: {
          decrement: quantity
        },
        lastUpdated: new Date()
      },
      create: {
        siteId: fromSiteId,
        binId: fromBinId,
        itemId,
        quantity: -quantity,
        status: 'AVAILABLE',
        lastUpdated: new Date()
      }
    })

    // Increase at destination
    await prisma.inventoryProjection.upsert({
      where: {
        siteId_binId_itemId: {
          siteId: toSiteId,
          binId: toBinId,
          itemId
        }
      },
      update: {
        quantity: {
          increment: quantity
        },
        lastUpdated: new Date()
      },
      create: {
        siteId: toSiteId,
        binId: toBinId,
        itemId,
        quantity,
        status: 'AVAILABLE',
        lastUpdated: new Date()
      }
    })
  }

  private async handleInventoryAllocated(event: WmsEvent): Promise<void> {
    const { siteId, binId, itemId, quantity } = event.eventData

    await prisma.inventoryProjection.updateMany({
      where: {
        siteId,
        binId,
        itemId
      },
      data: {
        status: 'ALLOCATED',
        lastUpdated: new Date()
      }
    })
  }

  private async handleInventoryPicked(event: WmsEvent): Promise<void> {
    const { siteId, binId, itemId, quantity } = event.eventData

    await prisma.inventoryProjection.updateMany({
      where: {
        siteId,
        binId,
        itemId
      },
      data: {
        quantity: {
          decrement: quantity
        },
        status: 'PICKED',
        lastUpdated: new Date()
      }
    })
  }

  private async handleInventoryShipped(event: WmsEvent): Promise<void> {
    const { siteId, binId, itemId, quantity } = event.eventData

    await prisma.inventoryProjection.updateMany({
      where: {
        siteId,
        binId,
        itemId
      },
      data: {
        quantity: {
          decrement: quantity
        },
        status: 'SHIPPED',
        lastUpdated: new Date()
      }
    })
  }

  // Task Event Handlers
  private async handleTaskCreated(event: WmsEvent): Promise<void> {
    const { siteId, type, priority } = event.eventData

    await prisma.taskProjection.upsert({
      where: {
        siteId_type_status: {
          siteId,
          type,
          status: 'PENDING'
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUpdated: new Date()
      },
      create: {
        siteId,
        type,
        status: 'PENDING',
        priority,
        count: 1,
        lastUpdated: new Date()
      }
    })
  }

  private async handleTaskAssigned(event: WmsEvent): Promise<void> {
    const { siteId, type, status } = event.eventData

    // Decrease pending count
    await prisma.taskProjection.updateMany({
      where: {
        siteId,
        type,
        status: 'PENDING'
      },
      data: {
        count: {
          decrement: 1
        },
        lastUpdated: new Date()
      }
    })

    // Increase assigned count
    await prisma.taskProjection.upsert({
      where: {
        siteId_type_status: {
          siteId,
          type,
          status: 'ASSIGNED'
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUpdated: new Date()
      },
      create: {
        siteId,
        type,
        status: 'ASSIGNED',
        priority: 'NORMAL',
        count: 1,
        lastUpdated: new Date()
      }
    })
  }

  private async handleTaskStarted(event: WmsEvent): Promise<void> {
    const { siteId, type } = event.eventData

    // Decrease assigned count
    await prisma.taskProjection.updateMany({
      where: {
        siteId,
        type,
        status: 'ASSIGNED'
      },
      data: {
        count: {
          decrement: 1
        },
        lastUpdated: new Date()
      }
    })

    // Increase in-progress count
    await prisma.taskProjection.upsert({
      where: {
        siteId_type_status: {
          siteId,
          type,
          status: 'IN_PROGRESS'
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUpdated: new Date()
      },
      create: {
        siteId,
        type,
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        count: 1,
        lastUpdated: new Date()
      }
    })
  }

  private async handleTaskCompleted(event: WmsEvent): Promise<void> {
    const { siteId, type } = event.eventData

    // Decrease in-progress count
    await prisma.taskProjection.updateMany({
      where: {
        siteId,
        type,
        status: 'IN_PROGRESS'
      },
      data: {
        count: {
          decrement: 1
        },
        lastUpdated: new Date()
      }
    })

    // Increase completed count
    await prisma.taskProjection.upsert({
      where: {
        siteId_type_status: {
          siteId,
          type,
          status: 'COMPLETED'
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUpdated: new Date()
      },
      create: {
        siteId,
        type,
        status: 'COMPLETED',
        priority: 'NORMAL',
        count: 1,
        lastUpdated: new Date()
      }
    })
  }

  private async handleTaskCancelled(event: WmsEvent): Promise<void> {
    const { siteId, type, fromStatus } = event.eventData

    // Decrease from current status
    await prisma.taskProjection.updateMany({
      where: {
        siteId,
        type,
        status: fromStatus
      },
      data: {
        count: {
          decrement: 1
        },
        lastUpdated: new Date()
      }
    })

    // Increase cancelled count
    await prisma.taskProjection.upsert({
      where: {
        siteId_type_status: {
          siteId,
          type,
          status: 'CANCELLED'
        }
      },
      update: {
        count: {
          increment: 1
        },
        lastUpdated: new Date()
      },
      create: {
        siteId,
        type,
        status: 'CANCELLED',
        priority: 'NORMAL',
        count: 1,
        lastUpdated: new Date()
      }
    })
  }
}

// Projection Queries
export class WmsProjectionQueries {
  /**
   * Get inventory summary for a site
   */
  async getInventorySummary(siteId: string) {
    return await prisma.inventoryProjection.groupBy({
      by: ['status'],
      where: { siteId },
      _sum: { quantity: true },
      _count: { id: true }
    })
  }

  /**
   * Get task summary for a site
   */
  async getTaskSummary(siteId: string) {
    return await prisma.taskProjection.findMany({
      where: { siteId },
      orderBy: [
        { type: 'asc' },
        { status: 'asc' }
      ]
    })
  }

  /**
   * Get inventory by bin
   */
  async getInventoryByBin(siteId: string, binId: string) {
    return await prisma.inventoryProjection.findMany({
      where: { siteId, binId },
      include: {
        item: true,
        bin: true
      }
    })
  }

  /**
   * Get inventory by item
   */
  async getInventoryByItem(siteId: string, itemId: string) {
    return await prisma.inventoryProjection.findMany({
      where: { siteId, itemId },
      include: {
        item: true,
        bin: true
      }
    })
  }
}


