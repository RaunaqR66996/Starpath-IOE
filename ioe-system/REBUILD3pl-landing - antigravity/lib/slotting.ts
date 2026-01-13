import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SlottingResult {
  locationId: string
  locationCode: string
  zone: string
  reason: string
}

export interface SlottingOptions {
  warehouseId: string
  itemSku: string
  qty: number
  preferredZone?: string
}

/**
 * Slotting v1: Simple rule-based slotting
 * 1. If location.allowedSkuPrefixes matches SKU prefix and capacity available → choose that
 * 2. Else choose BULK zone with highest free capacity
 * 3. Keep fast-movers (top 20% by velocity) in zones PICK-A/B
 */
export async function findOptimalLocation(options: SlottingOptions): Promise<SlottingResult | null> {
  const { warehouseId, itemSku, qty, preferredZone } = options

  // Get item details
  const item = await prisma.item.findUnique({
    where: { sku: itemSku }
  })

  if (!item) {
    throw new Error(`Item not found: ${itemSku}`)
  }

  // Get all locations in warehouse
  const locations = await prisma.location.findMany({
    where: { warehouseId },
    include: {
      inventory: {
        where: { status: 'AVAILABLE' },
        select: { qty: true }
      }
    }
  })

  // Calculate available capacity for each location
  const locationsWithCapacity = locations.map(loc => {
    const currentQty = loc.inventory.reduce((sum, inv) => sum + inv.qty, 0)
    const availableCapacity = loc.capacityQty - currentQty
    
    return {
      ...loc,
      availableCapacity,
      utilizationPercent: (currentQty / loc.capacityQty) * 100
    }
  })

  // Rule 1: Check for locations with matching SKU prefix
  const skuPrefix = itemSku.substring(0, 3) // First 3 characters
  const prefixMatches = locationsWithCapacity.filter(loc => 
    loc.allowedSkuPrefixes && 
    loc.allowedSkuPrefixes.includes(skuPrefix) &&
    loc.availableCapacity >= qty
  )

  if (prefixMatches.length > 0) {
    // Choose the one with lowest utilization
    const bestMatch = prefixMatches.reduce((best, current) => 
      current.utilizationPercent < best.utilizationPercent ? current : best
    )

    return {
      locationId: bestMatch.id,
      locationCode: bestMatch.code,
      zone: bestMatch.zone,
      reason: `SKU prefix match (${skuPrefix}) with ${bestMatch.utilizationPercent.toFixed(1)}% utilization`
    }
  }

  // Rule 2: Check preferred zone first
  if (preferredZone) {
    const preferredLocations = locationsWithCapacity.filter(loc => 
      loc.zone === preferredZone && 
      loc.availableCapacity >= qty
    )

    if (preferredLocations.length > 0) {
      const bestPreferred = preferredLocations.reduce((best, current) => 
        current.utilizationPercent < best.utilizationPercent ? current : best
      )

      return {
        locationId: bestPreferred.id,
        locationCode: bestPreferred.code,
        zone: bestPreferred.zone,
        reason: `Preferred zone (${preferredZone}) with ${bestPreferred.utilizationPercent.toFixed(1)}% utilization`
      }
    }
  }

  // Rule 3: Choose BULK zone with highest free capacity
  const bulkLocations = locationsWithCapacity.filter(loc => 
    loc.zone.startsWith('BULK') && 
    loc.availableCapacity >= qty
  )

  if (bulkLocations.length > 0) {
    const bestBulk = bulkLocations.reduce((best, current) => 
      current.availableCapacity > best.availableCapacity ? current : best
    )

    return {
      locationId: bestBulk.id,
      locationCode: bestBulk.code,
      zone: bestBulk.zone,
      reason: `BULK zone with ${bestBulk.availableCapacity} available capacity`
    }
  }

  // Rule 4: Fallback to any location with capacity
  const anyAvailable = locationsWithCapacity.filter(loc => 
    loc.availableCapacity >= qty
  )

  if (anyAvailable.length > 0) {
    const bestAvailable = anyAvailable.reduce((best, current) => 
      current.utilizationPercent < best.utilizationPercent ? current : best
    )

    return {
      locationId: bestAvailable.id,
      locationCode: bestAvailable.code,
      zone: bestAvailable.zone,
      reason: `Fallback location with ${bestAvailable.utilizationPercent.toFixed(1)}% utilization`
    }
  }

  return null // No suitable location found
}

/**
 * Get fast-moving items (top 20% by velocity)
 * This is a simplified version - in production, you'd calculate based on actual movement data
 */
export async function getFastMovingItems(warehouseId: string, limit: number = 50): Promise<string[]> {
  // This would typically be calculated from historical data
  // For now, return a mock list of common fast-moving SKUs
  const fastMovingSkus = [
    'SKU001', 'SKU002', 'SKU003', 'SKU004', 'SKU005',
    'SKU006', 'SKU007', 'SKU008', 'SKU009', 'SKU010'
  ]

  return fastMovingSkus.slice(0, limit)
}

/**
 * Check if item should go to PICK zone (fast-mover)
 */
export async function isFastMover(itemSku: string, warehouseId: string): Promise<boolean> {
  const fastMovers = await getFastMovingItems(warehouseId)
  return fastMovers.includes(itemSku)
}
































































