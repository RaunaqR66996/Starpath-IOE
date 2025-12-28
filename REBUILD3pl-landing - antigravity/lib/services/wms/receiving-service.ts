/**
 * WMS Receiving Service
 * Handles ASN processing, receiving workflows, and putaway task generation
 */

import { prisma } from '@/lib/prisma'
import type { Order, OrderItem, Item, Inventory, Location } from '@prisma/client'

export interface ASNData {
  asnNumber: string
  poNumber: string
  supplierCode?: string
  expectedItems: ASNLine[]
  expectedDate?: Date
}

export interface ASNLine {
  sku: string
  quantity: number
  uom?: string
  lotNumber?: string
  expirationDate?: Date
}

export interface ReceivingResult {
  success: boolean
  receiptId?: string
  matchedItems: number
  unmatchedItems: number
  putawayTasks: string[]
  exceptions: string[]
}

export class ReceivingService {
  /**
   * Process ASN (Advanced Shipping Notice)
   * Upload/import ASN files, match expected vs received
   */
  static async processASN(siteId: string, asnData: ASNData): Promise<ReceivingResult> {
    try {
      // Find PO by order number
      const po = await prisma.order.findFirst({
        where: {
          orderNumber: asnData.poNumber,
          organizationId: siteId, // Assuming siteId maps to organizationId
        },
        include: {
          orderItems: {
            include: {
              item: true,
            },
          },
        },
      })

      if (!po) {
        throw new Error(`Purchase Order ${asnData.poNumber} not found`)
      }

      const matchedItems: string[] = []
      const unmatchedItems: string[] = []
      const putawayTasks: string[] = []
      const exceptions: string[] = []

      // Match ASN lines with PO lines
      for (const asnLine of asnData.expectedItems) {
        const poLine = po.orderItems.find(
          (line) => line.item.sku === asnLine.sku
        )

        if (!poLine) {
          unmatchedItems.push(asnLine.sku)
          exceptions.push(`SKU ${asnLine.sku} not found in PO ${asnData.poNumber}`)
          continue
        }

        // Check quantity match
        if (asnLine.quantity !== poLine.quantity) {
          exceptions.push(
            `Quantity mismatch for SKU ${asnLine.sku}: Expected ${poLine.quantity}, ASN shows ${asnLine.quantity}`
          )
        }

        matchedItems.push(asnLine.sku)

        // Create putaway task
        const putawayTask = await this.createPutawayTask(
          siteId,
          asnLine.sku,
          asnLine.quantity,
          asnLine.lotNumber
        )
        putawayTasks.push(putawayTask.id)
      }

      // Create receipt record
      const receipt = await prisma.order.update({
        where: { id: po.id },
        data: {
          status: 'PROCESSING',
          updatedAt: new Date(),
        },
      })

      return {
        success: true,
        receiptId: receipt.id,
        matchedItems: matchedItems.length,
        unmatchedItems: unmatchedItems.length,
        putawayTasks,
        exceptions,
      }
    } catch (error: any) {
      throw new Error(`ASN processing failed: ${error.message}`)
    }
  }

  /**
   * Receive items (physical receipt confirmation)
   */
  static async receiveItems(
    siteId: string,
    receiptId: string,
    receivedItems: Array<{
      sku: string
      quantity: number
      locationCode: string
      lotNumber?: string
      serialNumber?: string
    }>
  ): Promise<ReceivingResult> {
    try {
      const exceptions: string[] = []
      const putawayTasks: string[] = []

      // Find the order/receipt
      const order = await prisma.order.findUnique({
        where: { id: receiptId },
        include: {
          orderItems: {
            include: {
              item: true,
            },
          },
        },
      })

      if (!order) {
        throw new Error(`Receipt ${receiptId} not found`)
      }

      // Find warehouse location
      const warehouse = await prisma.warehouse.findFirst({
        where: { code: siteId },
      })

      if (!warehouse) {
        throw new Error(`Warehouse ${siteId} not found`)
      }

      // Process each received item
      for (const receivedItem of receivedItems) {
        const orderLine = order.orderItems.find(
          (line) => line.item.sku === receivedItem.sku
        )

        if (!orderLine) {
          exceptions.push(`SKU ${receivedItem.sku} not found in order`)
          continue
        }

        // Find or create receiving location
        let receivingLocation = await prisma.location.findFirst({
          where: {
            warehouseId: warehouse.id,
            code: receivedItem.locationCode,
          },
        })

        if (!receivingLocation) {
          receivingLocation = await prisma.location.create({
            data: {
              warehouseId: warehouse.id,
              code: receivedItem.locationCode,
              name: `Receiving Dock ${receivedItem.locationCode}`,
              type: 'RECEIVING',
            },
          })
        }

        // Find item
        const item = await prisma.item.findUnique({
          where: { sku: receivedItem.sku },
        })

        if (!item) {
          exceptions.push(`Item ${receivedItem.sku} not found`)
          continue
        }

        // Create or update inventory at receiving location
        const existingInventory = await prisma.inventory.findFirst({
          where: {
            itemId: item.id,
            locationId: receivingLocation.id,
          },
        })

        if (existingInventory) {
          await prisma.inventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: existingInventory.quantity + receivedItem.quantity,
              quantityAvailable: existingInventory.quantityAvailable + receivedItem.quantity,
            },
          })
        } else {
          await prisma.inventory.create({
            data: {
              itemId: item.id,
              locationId: receivingLocation.id,
              quantity: receivedItem.quantity,
              quantityAvailable: receivedItem.quantity,
              quantityReserved: 0,
              quantityAllocated: 0,
              status: 'AVAILABLE',
            },
          })
        }

        // Create putaway task
        const putawayTask = await this.createPutawayTask(
          siteId,
          receivedItem.sku,
          receivedItem.quantity,
          receivedItem.lotNumber,
          receivingLocation.id
        )
        putawayTasks.push(putawayTask.id)
      }

      // Update order status
      await prisma.order.update({
        where: { id: receiptId },
        data: {
          status: 'SHIPPED', // Or appropriate status
          updatedAt: new Date(),
        },
      })

      return {
        success: true,
        receiptId,
        matchedItems: receivedItems.length - exceptions.length,
        unmatchedItems: exceptions.length,
        putawayTasks,
        exceptions,
      }
    } catch (error: any) {
      throw new Error(`Receiving failed: ${error.message}`)
    }
  }

  /**
   * Create putaway task
   */
  private static async createPutawayTask(
    siteId: string,
    sku: string,
    quantity: number,
    lotNumber?: string,
    fromLocationId?: string
  ) {
    // Find optimal storage location (simplified - will be enhanced in putaway-service)
    const warehouse = await prisma.warehouse.findFirst({
      where: { code: siteId },
      include: {
        locations: {
          where: {
            type: 'STORAGE',
          },
          take: 1,
        },
      },
    })

    if (!warehouse) {
      throw new Error(`Warehouse ${siteId} not found`)
    }

    const toLocation = warehouse.locations[0]

    if (!toLocation) {
      throw new Error(`No storage locations found in warehouse ${siteId}`)
    }

    // Create putaway task (assuming we have a task system)
    // For now, we'll create it as a generic task record
    // In a full implementation, this would use a Task model

    return {
      id: `putaway-${Date.now()}`,
      type: 'PUTAWAY',
      status: 'PENDING',
    }
  }

  /**
   * Get pending ASNs
   */
  static async getPendingASNs(siteId: string) {
    const orders = await prisma.order.findMany({
      where: {
        organizationId: siteId,
        status: 'CREATED',
      },
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
      },
    })

    return orders.map((order) => ({
      poNumber: order.orderNumber,
      expectedItems: order.orderItems.length,
      expectedQuantity: order.orderItems.reduce(
        (sum, line) => sum + line.quantity,
        0
      ),
      status: order.status,
      orderDate: order.orderDate,
    }))
  }

  /**
   * Get receiving exceptions
   */
  static async getReceivingExceptions(siteId: string) {
    // This would query exceptions/discrepancies
    // For now, return empty array
    return []
  }
}



