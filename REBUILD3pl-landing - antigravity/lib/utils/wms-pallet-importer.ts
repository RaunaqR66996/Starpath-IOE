import { Layout } from '@/lib/layout';
import { CargoItem } from '@/lib/stores/loadOptimizerStore';
import { loadLayout } from '@/lib/layout';

/**
 * Calculate the number of pallets in a warehouse layout using the same logic as Warehouse3D
 */
export function calculatePalletsFromLayout(layout: Layout): number {
  let totalPallets = 0;
  
  // Pallet dimensions (48x40 inches = 1.22m x 1.02m)
  const PALLET_WIDTH = 1.22;  // 48 inches = 1.22m
  const PALLET_LENGTH = 1.02; // 40 inches = 1.02m
  
  layout.racks.forEach((rack) => {
    const {
      bayCount,
      bayWidth,
      depth,
      levelCount,
      levelHeight,
    } = rack;
    
    // Validate rack properties
    if (!levelHeight || levelHeight <= 0 || !bayWidth || bayWidth <= 0) {
      return;
    }
    
    // Place pallets on each level (skip bottom level for performance)
    for (let level = 2; level <= levelCount; level++) {
      // Place pallets in each bay (skip every other bay for performance)
      for (let bay = 0; bay < bayCount; bay += 2) {
        // Limit to maximum 2 pallets per bay for performance
        const palletsPerBay = Math.min(2, Math.max(1, Math.floor(bayWidth / (PALLET_WIDTH + 0.1))));
        
        // Only count front side pallets (back side removed for performance)
        if (depth >= PALLET_LENGTH + 0.15) {
          totalPallets += palletsPerBay;
        }
      }
    }
  });
  
  return totalPallets;
}

/**
 * Convert tight layout to cargo items for TMS optimizer
 */
export function convertLayoutToCargoItems(
  layout: Layout,
  palletWeight: number = 1000, // Default weight per pallet in lbs
  boxesPerPallet: number = 2 // Number of boxes on each pallet
): CargoItem[] {
  const cargoItems: CargoItem[] = [];
  
  // Standard pallet dimensions (48x40 inches, height includes boxes ~48 inches)
  const PALLET_LENGTH_INCHES = 48;  // Length (inches)
  const PALLET_WIDTH_INCHES = 40;   // Width (inches) 
  const PALLET_HEIGHT_INCHES = 48;  // Height including boxes (inches)
  
  // Calculate total pallets
  const totalPallets = calculatePalletsFromLayout(layout);
  
  if (totalPallets === 0) {
    return cargoItems;
  }
  
  // Create cargo item representing pallets with boxes
  // Group pallets by warehouse/location for better organization
  const cargoItem: CargoItem = {
    id: `wms-pallet-${Date.now()}`,
    sku: 'PALLET-48X40',
    name: '48x40 Wooden Pallet with Yellow Boxes',
    length: PALLET_LENGTH_INCHES,
    width: PALLET_WIDTH_INCHES,
    height: PALLET_HEIGHT_INCHES,
    weight: palletWeight,
    quantity: totalPallets,
    stackable: true,
    maxStack: 3,
    rotatable: true,
    family: 'ambient',
    fragility: 0,
    temperature: null,
    crushStrength: 500,
    priority: 5,
    stopSequence: 1,
    color: '#d2b48c', // Wooden pallet color
  };
  
  cargoItems.push(cargoItem);
  
  return cargoItems;
}

/**
 * Load warehouse layout and convert to cargo items
 */
export async function importPalletsFromWMS(
  warehouseId?: string,
  palletWeight?: number,
  boxesPerPallet?: number
): Promise<CargoItem[]> {
  try {
    const layout = await loadLayout(warehouseId);
    return convertLayoutToCargoItems(layout, palletWeight, boxesPerPallet);
  } catch (error) {
    console.error('Failed to import pallets from WMS:', error);
    throw new Error('Failed to load warehouse layout');
  }
}


