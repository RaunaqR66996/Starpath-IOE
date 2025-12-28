import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

export interface BOMExplodedComponent {
  itemId: string
  sku: string
  name: string | null
  requiredQuantity: number
  unit: string
  level: number
  bomId?: string
}

/**
 * Explode a BOM (Bill of Materials) to calculate all required components
 * for a given production quantity, including nested BOMs
 * 
 * @param bomId - The BOM ID to explode
 * @param quantity - Quantity of the finished product to produce
 * @param level - Current depth level (for nested BOMs)
 * @returns Array of exploded components with calculated quantities
 */
export async function explodeBOM(
  bomId: string, 
  quantity: number, 
  level: number = 0
): Promise<BOMExplodedComponent[]> {
  try {
    const bom = await prisma.bOM.findUnique({
      where: { id: bomId },
      include: {
        product: true,
        components: {
          include: {
            item: true
          },
          orderBy: {
            position: 'asc'
          }
        }
      }
    })
    
    if (!bom) {
      throw new Error(`BOM not found: ${bomId}`)
    }
    
    logger.debug('Exploding BOM', { bomId, quantity, level })
    
    const explodedComponents: BOMExplodedComponent[] = []
    
    // Process each component in the BOM
    for (const component of bom.components) {
      const { itemId, quantity: bomQuantity, waste } = component
      const item = component.item
      
      // Calculate required quantity including waste
      const wasteMultiplier = 1 + (waste / 100)
      const requiredQuantity = bomQuantity * quantity * wasteMultiplier
      
      explodedComponents.push({
        itemId,
        sku: item.sku,
        name: item.name,
        requiredQuantity,
        unit: 'EA', // Default unit - should come from item UOM
        level,
        bomId: component.bomId
      })
      
      // Check if this component has a BOM (nested BOM)
      const componentBOM = await prisma.bOM.findFirst({
        where: {
          productId: itemId,
          isActive: true
        }
      })
      
      if (componentBOM) {
        // Recursively explode nested BOM
        const nestedComponents = await explodeBOM(
          componentBOM.id, 
          requiredQuantity, 
          level + 1
        )
        explodedComponents.push(...nestedComponents)
      }
    }
    
    // Consolidate components by item (if same item appears multiple times)
    const consolidatedComponents = consolidateComponents(explodedComponents)
    
    logger.info('BOM explosion complete', { 
      bomId, 
      quantity, 
      components: consolidatedComponents.length,
      totalLevels: level + 1
    })
    
    return consolidatedComponents
    
  } catch (error) {
    logger.error('Error exploding BOM', error as Error)
    throw error
  }
}

/**
 * Consolidate components by summing quantities for the same item
 */
function consolidateComponents(components: BOMExplodedComponent[]): BOMExplodedComponent[] {
  const consolidatedMap = new Map<string, BOMExplodedComponent>()
  
  for (const component of components) {
    const key = component.itemId
    
    if (consolidatedMap.has(key)) {
      // Sum quantities for existing item
      const existing = consolidatedMap.get(key)!
      existing.requiredQuantity += component.requiredQuantity
      // Keep the lowest level (closest to root)
      if (component.level < existing.level) {
        existing.level = component.level
      }
    } else {
      consolidatedMap.set(key, { ...component })
    }
  }
  
  return Array.from(consolidatedMap.values())
}

/**
 * Validate BOM completeness - check if all components have sufficient inventory
 * 
 * @param bomId - The BOM ID to validate
 * @param quantity - Quantity of finished product to check
 * @param locationId - Location to check inventory at (optional)
 * @returns Validation result with missing items
 */
export async function validateBOMInventory(
  bomId: string, 
  quantity: number,
  locationId?: string
): Promise<{ valid: boolean; missingItems: Array<{ itemId: string; sku: string; required: number; available: number }> }> {
  try {
    const exploded = await explodeBOM(bomId, quantity)
    const missingItems: Array<{ itemId: string; sku: string; required: number; available: number }> = []
    
    for (const component of exploded) {
      // Get inventory levels
      const inventoryQuery: any = {
        itemId: component.itemId,
        status: 'AVAILABLE'
      }
      
      if (locationId) {
        inventoryQuery.locationId = locationId
      }
      
      const inventoryRecords = await prisma.inventory.findMany({
        where: inventoryQuery
      })
      
      const totalAvailable = inventoryRecords.reduce((sum, inv) => sum + inv.quantityAvailable, 0)
      
      if (totalAvailable < component.requiredQuantity) {
        missingItems.push({
          itemId: component.itemId,
          sku: component.sku,
          required: component.requiredQuantity,
          available: totalAvailable
        })
      }
    }
    
    logger.info('BOM inventory validation', { 
      bomId, 
      quantity, 
      valid: missingItems.length === 0, 
      missingCount: missingItems.length 
    })
    
    return {
      valid: missingItems.length === 0,
      missingItems
    }
    
  } catch (error) {
    logger.error('Error validating BOM inventory', error as Error)
    throw error
  }
}




