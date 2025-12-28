import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ReplenishmentSuggestion {
  id: string
  itemSku: string
  itemDescription: string
  fromLocationCode: string
  toLocationCode: string
  suggestedQty: number
  reason: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ReplenishmentOptions {
  warehouseId: string
  minPickLevel?: number
  maxPickLevel?: number
  includeZones?: string[]
}

/**
 * Replenishment v1: Simple rule-based replenishment
 * If PICK location on-hand < min (config: 20 EACH) and BULK has > 0 → suggest move to PICK to reach max (config: 80)
 */
export async function getReplenishmentSuggestions(
  options: ReplenishmentOptions
): Promise<ReplenishmentSuggestion[]> {
  const {
    warehouseId,
    minPickLevel = 20,
    maxPickLevel = 80,
    includeZones = ['PICK-A', 'PICK-B']
  } = options

  const suggestions: ReplenishmentSuggestion[] = []

  // Get all PICK locations
  const pickLocations = await prisma.location.findMany({
    where: {
      warehouseId,
      zone: { in: includeZones }
    },
    include: {
      inventory: {
        where: { status: 'AVAILABLE' },
        include: { item: true }
      }
    }
  })

  // Get all BULK locations
  const bulkLocations = await prisma.location.findMany({
    where: {
      warehouseId,
      zone: { startsWith: 'BULK' }
    },
    include: {
      inventory: {
        where: { status: 'AVAILABLE' },
        include: { item: true }
      }
    }
  })

  // Group inventory by item SKU
  const pickInventoryBySku = new Map<string, { qty: number, location: any }>()
  const bulkInventoryBySku = new Map<string, { qty: number, location: any }>()

  pickLocations.forEach(location => {
    location.inventory.forEach(inv => {
      const key = inv.item.sku
      if (!pickInventoryBySku.has(key)) {
        pickInventoryBySku.set(key, { qty: 0, location })
      }
      const current = pickInventoryBySku.get(key)!
      current.qty += inv.qty
    })
  })

  bulkLocations.forEach(location => {
    location.inventory.forEach(inv => {
      const key = inv.item.sku
      if (!bulkInventoryBySku.has(key)) {
        bulkInventoryBySku.set(key, { qty: 0, location })
      }
      const current = bulkInventoryBySku.get(key)!
      current.qty += inv.qty
    })
  })

  // Check each item for replenishment needs
  for (const [sku, pickData] of pickInventoryBySku) {
    const pickQty = pickData.qty
    const bulkData = bulkInventoryBySku.get(sku)

    // Check if replenishment is needed
    if (pickQty < minPickLevel && bulkData && bulkData.qty > 0) {
      const neededQty = Math.min(
        maxPickLevel - pickQty, // How much we need to reach max
        bulkData.qty, // How much is available in bulk
        maxPickLevel // Don't exceed max level
      )

      if (neededQty > 0) {
        // Determine priority based on how low the pick level is
        let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
        if (pickQty === 0) priority = 'HIGH'
        else if (pickQty < minPickLevel / 2) priority = 'MEDIUM'

        suggestions.push({
          id: `replenish-${sku}-${Date.now()}`,
          itemSku: sku,
          itemDescription: pickData.location.inventory[0]?.item.description || '',
          fromLocationCode: bulkData.location.code,
          toLocationCode: pickData.location.code,
          suggestedQty: neededQty,
          reason: `PICK level ${pickQty} below minimum ${minPickLevel}, BULK has ${bulkData.qty}`,
          priority
        })
      }
    }
  }

  // Sort by priority and quantity needed
  suggestions.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.suggestedQty - a.suggestedQty
  })

  return suggestions
}

/**
 * Create replenishment tasks from suggestions
 */
export async function createReplenishmentTasks(
  suggestions: ReplenishmentSuggestion[],
  warehouseId: string,
  assigneeId?: string
): Promise<string[]> {
  const taskIds: string[] = []

  for (const suggestion of suggestions) {
    // Find the actual locations
    const fromLocation = await prisma.location.findFirst({
      where: {
        warehouseId,
        code: suggestion.fromLocationCode
      }
    })

    const toLocation = await prisma.location.findFirst({
      where: {
        warehouseId,
        code: suggestion.toLocationCode
      }
    })

    if (!fromLocation || !toLocation) {
      console.warn(`Location not found for replenishment: ${suggestion.fromLocationCode} -> ${suggestion.toLocationCode}`)
      continue
    }

    // Find the item
    const item = await prisma.item.findUnique({
      where: { sku: suggestion.itemSku }
    })

    if (!item) {
      console.warn(`Item not found for replenishment: ${suggestion.itemSku}`)
      continue
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        type: 'REPLENISH',
        status: 'NEW',
        priority: suggestion.priority === 'HIGH' ? 'HIGH' : suggestion.priority === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        warehouseId,
        assigneeId,
        payload: {
          fromLocationId: fromLocation.id,
          toLocationId: toLocation.id,
          itemSku: suggestion.itemSku,
          qty: suggestion.suggestedQty,
          reason: suggestion.reason
        }
      }
    })

    taskIds.push(task.id)
  }

  return taskIds
}

/**
 * Get replenishment plans for a warehouse
 */
export async function getReplenishmentPlans(warehouseId: string): Promise<any[]> {
  return prisma.replenishmentPlan.findMany({
    where: { warehouseId },
    include: {
      item: true,
      fromLocation: true,
      toLocation: true
    },
    orderBy: { createdAt: 'desc' }
  })
}
































































