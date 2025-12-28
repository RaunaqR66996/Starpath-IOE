/**
 * WMS Picking Service
 * Handles wave planning, pick list generation, and pick confirmation
 */

import { prisma } from '@/lib/prisma'

export interface WavePlan {
  waveId: string
  orders: string[]
  estimatedPickTime: number
  pickPath: PickStop[]
  assignee?: string
}

export interface PickStop {
  locationCode: string
  itemSku: string
  quantity: number
  sequence: number
  estimatedTime: number
}

export interface PickConfirmation {
  pickId: string
  locationCode: string
  itemSku: string
  quantityPicked: number
  quantityExpected: number
  lotNumber?: string
  timestamp: Date
}

export class PickingService {
  /**
   * Plan picking wave
   * Groups orders by carrier/zone, optimizes pick path
   */
  static async planWave(
    siteId: string,
    orderIds: string[],
    options?: {
      carrierCode?: string
      zoneCode?: string
      maxItemsPerWave?: number
    }
  ): Promise<WavePlan> {
    try {
      // Fetch orders
      const orders = await prisma.order.findMany({
        where: {
          id: { in: orderIds },
          organizationId: siteId,
        },
        include: {
          orderItems: {
            include: {
              item: true,
            },
          },
        },
      })

      if (orders.length === 0) {
        throw new Error('No orders found for wave planning')
      }

      // Collect all items to pick
      const pickItems: Array<{
        sku: string
        quantity: number
        orderId: string
      }> = []

      for (const order of orders) {
        for (const line of order.orderItems) {
          pickItems.push({
            sku: line.item.sku,
            quantity: line.quantity,
            orderId: order.id,
          })
        }
      }

      // Find locations for each item
      const warehouse = await prisma.warehouse.findFirst({
        where: { warehouseCode: siteId },
      })

      if (!warehouse) {
        throw new Error(`Warehouse ${siteId} not found`)
      }

      // Build pick path (optimized by location sequence)
      const pickPath: PickStop[] = []
      let sequence = 1

      for (const pickItem of pickItems) {
        // Find inventory location for this item
        const inventory = await prisma.inventoryItem.findFirst({
          where: {
            item: { sku: pickItem.sku },
            warehouseCode: warehouse.warehouseCode,
            quantityAvailable: { gte: pickItem.quantity },
          },
          include: {
            location: true,
          },
          orderBy: {
            location: {
              locationId: 'asc',
            },
          },
        })

        if (inventory) {
          pickPath.push({
            locationCode: inventory.location?.locationId || 'UNKNOWN',
            itemSku: pickItem.sku,
            quantity: pickItem.quantity,
            sequence: sequence++,
            estimatedTime: 30, // 30 seconds per pick
          })
        }
      }

      // Optimize pick path (simple nearest-neighbor)
      const optimizedPath = this.optimizePickPath(pickPath)

      // Calculate total estimated time
      const estimatedPickTime = optimizedPath.reduce(
        (sum, stop) => sum + stop.estimatedTime,
        0
      )

      const waveId = `WAVE-${Date.now()}`

      return {
        waveId,
        orders: orderIds,
        estimatedPickTime,
        pickPath: optimizedPath,
      }
    } catch (error: any) {
      throw new Error(`Wave planning failed: ${error.message}`)
    }
  }

  /**
   * Optimize pick path using nearest-neighbor heuristic
   */
  private static optimizePickPath(path: PickStop[]): PickStop[] {
    if (path.length <= 1) return path

    // Group by location to minimize travel
    const locationMap = new Map<string, PickStop[]>()

    for (const stop of path) {
      const existing = locationMap.get(stop.locationCode) || []
      existing.push(stop)
      locationMap.set(stop.locationCode, existing)
    }

    // Sort locations by sequence (aisle/bay/level)
    const sortedLocations = Array.from(locationMap.keys()).sort()

    // Rebuild path
    const optimized: PickStop[] = []
    let sequence = 1

    for (const locationCode of sortedLocations) {
      const stops = locationMap.get(locationCode) || []
      for (const stop of stops) {
        optimized.push({
          ...stop,
          sequence: sequence++,
        })
      }
    }

    return optimized
  }

  /**
   * Confirm pick
   * Barcode scanning integration, quantity verification, real-time inventory updates
   */
  static async confirmPick(
    siteId: string,
    confirmation: PickConfirmation
  ): Promise<{ success: boolean; variance?: number; message: string }> {
    try {
      const item = await prisma.item.findUnique({
        where: {
          organizationId_sku: {
            organizationId: siteId,
            sku: confirmation.itemSku
          }
        },
      })

      if (!item) {
        throw new Error(`Item ${confirmation.itemSku} not found`)
      }

      // Find location
      const warehouse = await prisma.warehouse.findFirst({
        where: { warehouseCode: siteId },
      })

      if (!warehouse) {
        throw new Error(`Warehouse ${siteId} not found`)
      }

      const location = await prisma.location.findFirst({
        where: {
          warehouseCode: warehouse.warehouseCode,
          locationId: confirmation.locationCode,
        },
      })

      if (!location) {
        throw new Error(`Location ${confirmation.locationCode} not found`)
      }

      // Find inventory
      const inventory = await prisma.inventoryItem.findFirst({
        where: {
          itemId: item.id,
          locationId: location.locationId,
        },
      })

      if (!inventory) {
        throw new Error(
          `Inventory not found for ${confirmation.itemSku} at ${confirmation.locationCode}`
        )
      }

      // Check quantity variance
      const variance = confirmation.quantityPicked - confirmation.quantityExpected

      if (variance !== 0) {
        // Log variance but allow pick to proceed
        console.warn(
          `Pick variance: Expected ${confirmation.quantityExpected}, Picked ${confirmation.quantityPicked}`
        )
      }

      // Update inventory (reduce available quantity)
      if (inventory.quantityAvailable < confirmation.quantityPicked) {
        throw new Error(
          `Insufficient available inventory. Available: ${inventory.quantityAvailable}, Requested: ${confirmation.quantityPicked}`
        )
      }

      await prisma.inventoryItem.update({
        where: { id: inventory.id },
        data: {
          quantityAvailable: inventory.quantityAvailable - confirmation.quantityPicked,
          quantityReserved:
            (inventory.quantityReserved || 0) + confirmation.quantityPicked,
        },
      })

      // Update order line (mark as picked)
      // This would typically be done through order management
      // For now, we'll just return success

      return {
        success: true,
        variance: variance !== 0 ? variance : undefined,
        message: variance === 0
          ? 'Pick confirmed successfully'
          : `Pick confirmed with variance: ${variance > 0 ? '+' : ''}${variance}`,
      }
    } catch (error: any) {
      throw new Error(`Pick confirmation failed: ${error.message}`)
    }
  }

  /**
   * Get pick list for wave
   */
  static async getPickList(waveId: string): Promise<PickStop[]> {
    // This would retrieve the pick list from storage
    // For now, return empty array
    return []
  }
}
