/**
 * WMS Putaway Service
 * Handles intelligent slotting, putaway optimization, and location assignment
 */

import { prisma } from '@/lib/prisma'

export interface PutawayOptimization {
  itemSku: string
  quantity: number
  recommendedLocation: string
  priority: 'HIGH' | 'NORMAL' | 'LOW'
  reason: string
  estimatedPickTime?: number
}

export interface SlottingRule {
  velocityCategory: 'A' | 'B' | 'C' // ABC analysis
  zonePreference: string[]
  minLevel: number
  maxLevel: number
}

export class PutawayService {
  /**
   * Optimize putaway location assignment
   * Uses ABC analysis, velocity-based slotting, pick path minimization
   */
  static async optimizePutaway(
    siteId: string,
    itemSku: string,
    quantity: number
  ): Promise<PutawayOptimization> {
    try {
      // Find item
      const item = await prisma.item.findUnique({
        where: { sku: itemSku },
      })

      if (!item) {
        throw new Error(`Item ${itemSku} not found`)
      }

      // Find warehouse
      const warehouse = await prisma.warehouse.findFirst({
        where: { code: siteId },
        include: {
          locations: {
            include: {
              inventory: {
                include: {
                  item: true,
                },
              },
            },
          },
        },
      })

      if (!warehouse) {
        throw new Error(`Warehouse ${siteId} not found`)
      }

      // Calculate item velocity (simplified - would use historical data)
      const velocity = await this.calculateItemVelocity(itemSku)

      // ABC Analysis
      const abcCategory = this.getABCCategory(velocity)

      // Find optimal location based on rules
      const optimalLocation = await this.findOptimalLocation(
        warehouse.id,
        item,
        quantity,
        abcCategory
      )

      if (!optimalLocation) {
        throw new Error(`No suitable location found for ${itemSku}`)
      }

      // Calculate priority based on urgency
      const priority = this.calculatePriority(velocity, quantity)

      return {
        itemSku,
        quantity,
        recommendedLocation: optimalLocation.code,
        priority,
        reason: `Velocity: ${velocity} (${abcCategory}-item), Zone: ${optimalLocation.type}`,
        estimatedPickTime: this.estimatePickTime(optimalLocation),
      }
    } catch (error: any) {
      throw new Error(`Putaway optimization failed: ${error.message}`)
    }
  }

  /**
   * Calculate item velocity (picks per time period)
   * Simplified - would use historical pick data
   */
  private static async calculateItemVelocity(sku: string): Promise<number> {
    // Get recent order history for this SKU
    const recentOrders = await prisma.orderItem.findMany({
      where: {
        item: {
          sku: sku,
        },
        order: {
          orderDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      },
    })

    const totalPicks = recentOrders.reduce((sum, order) => sum + order.quantity, 0)
    
    // Normalize to picks per day
    return totalPicks / 30
  }

  /**
   * Determine ABC category based on velocity
   */
  private static getABCCategory(velocity: number): 'A' | 'B' | 'C' {
    if (velocity > 10) return 'A' // Fast movers
    if (velocity > 2) return 'B' // Medium movers
    return 'C' // Slow movers
  }

  /**
   * Find optimal location based on slotting rules
   */
  private static async findOptimalLocation(
    warehouseId: string,
    item: any,
    quantity: number,
    abcCategory: 'A' | 'B' | 'C'
  ) {
    // Get all available locations
    const locations = await prisma.location.findMany({
      where: {
        warehouseId: warehouseId,
        type: {
          in: ['STORAGE', 'PICK'],
        },
      },
      include: {
        inventory: true,
      },
      orderBy: {
        code: 'asc',
      },
    })

    // Filter by ABC rules
    let candidateLocations = locations

    // A-items go to fast pick zones (near shipping)
    if (abcCategory === 'A') {
      candidateLocations = locations.filter(
        (loc) => loc.type === 'PICK' || loc.code.includes('FAST')
      )
    }

    // B-items go to medium zones
    if (abcCategory === 'B') {
      candidateLocations = locations.filter(
        (loc) => loc.type === 'PICK' || loc.type === 'STORAGE'
      )
    }

    // C-items go to bulk storage
    if (abcCategory === 'C') {
      candidateLocations = locations.filter(
        (loc) => loc.type === 'STORAGE' || loc.code.includes('BULK')
      )
    }

    // Find location with available capacity
    for (const location of candidateLocations) {
      const totalCapacity = 1000 // Would come from location metadata
      const usedCapacity = location.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      )

      if (usedCapacity + quantity <= totalCapacity) {
        return location
      }
    }

    // Fallback: return first available location
    return candidateLocations[0]
  }

  /**
   * Calculate putaway priority
   */
  private static calculatePriority(
    velocity: number,
    quantity: number
  ): 'HIGH' | 'NORMAL' | 'LOW' {
    if (velocity > 10 && quantity > 100) return 'HIGH'
    if (velocity > 5 || quantity > 50) return 'NORMAL'
    return 'LOW'
  }

  /**
   * Estimate pick time for location (seconds)
   */
  private static estimatePickTime(location: any): number {
    // Simplified calculation
    // Would use distance from shipping, aisle depth, etc.
    const baseTime = 30 // Base 30 seconds
    const distancePenalty = location.code.includes('DEEP') ? 20 : 0
    return baseTime + distancePenalty
  }

  /**
   * Execute putaway (move inventory from receiving to storage)
   */
  static async executePutaway(
    siteId: string,
    fromLocationId: string,
    toLocationId: string,
    itemSku: string,
    quantity: number
  ) {
    try {
      const item = await prisma.item.findUnique({
        where: { sku: itemSku },
      })

      if (!item) {
        throw new Error(`Item ${itemSku} not found`)
      }

      // Remove from source location
      const sourceInventory = await prisma.inventory.findFirst({
        where: {
          itemId: item.id,
          locationId: fromLocationId,
        },
      })

      if (!sourceInventory || sourceInventory.quantity < quantity) {
        throw new Error(`Insufficient inventory at source location`)
      }

      await prisma.inventory.update({
        where: { id: sourceInventory.id },
        data: {
          quantity: sourceInventory.quantity - quantity,
          quantityAvailable: sourceInventory.quantityAvailable - quantity,
        },
      })

      // Add to destination location
      const destInventory = await prisma.inventory.findFirst({
        where: {
          itemId: item.id,
          locationId: toLocationId,
        },
      })

      if (destInventory) {
        await prisma.inventory.update({
          where: { id: destInventory.id },
          data: {
            quantity: destInventory.quantity + quantity,
            quantityAvailable: destInventory.quantityAvailable + quantity,
          },
        })
      } else {
        await prisma.inventory.create({
          data: {
            itemId: item.id,
            locationId: toLocationId,
            quantity: quantity,
            quantityAvailable: quantity,
            quantityReserved: 0,
            quantityAllocated: 0,
            status: 'AVAILABLE',
          },
        })
      }

      return {
        success: true,
        message: `Moved ${quantity} of ${itemSku} from ${fromLocationId} to ${toLocationId}`,
      }
    } catch (error: any) {
      throw new Error(`Putaway execution failed: ${error.message}`)
    }
  }
}



