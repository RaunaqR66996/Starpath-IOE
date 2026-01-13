// Simple greedy 3D bin packing algorithm for trailer loading
import { CargoItem, PlacedItem, TrailerSpec, AxleLoad, OptimizeResult } from '@/lib/types/trailer';

interface Placement {
  x: number;
  y: number;
  z: number;
  l: number;
  w: number;
  h: number;
}

// Check if two placements collide
function placementsCollide(a: Placement, b: Placement): boolean {
  return !(
    a.x + a.l <= b.x || b.x + b.l <= a.x ||
    a.y + a.w <= b.y || b.y + b.w <= a.y ||
    a.z + a.h <= b.z || b.z + b.h <= a.z
  );
}

// Check if placement fits within trailer bounds
function fitsInTrailer(placement: Placement, trailer: TrailerSpec): boolean {
  return (
    placement.x >= 0 &&
    placement.y >= 0 &&
    placement.z >= 0 &&
    placement.x + placement.l <= trailer.length_ft &&
    placement.y + placement.w <= trailer.width_ft &&
    placement.z + placement.h <= trailer.height_ft
  );
}

// Find lowest valid Z position for placement at (x,y)
function findLowestZ(x: number, y: number, item: CargoItem, placed: Placement[]): number {
  let maxZ = 0;
  
  for (const p of placed) {
    // Check if this placement overlaps in X-Y plane
    if (!(x + item.l <= p.x || p.x + p.l <= x || y + item.w <= p.y || p.y + p.w <= y)) {
      maxZ = Math.max(maxZ, p.z + p.h);
    }
  }
  
  return maxZ;
}

// Calculate axle loads based on placed items
function calculateAxleLoads(placed: PlacedItem[], trailer: TrailerSpec): AxleLoad[] {
  const axleLoads: AxleLoad[] = trailer.axles.map((axle, index) => ({
    axle_index: index,
    load_lbs: 0,
    limit_lbs: axle.type === 'dual' ? 34000 : 20000,
    percentage: 0
  }));
  
  // Distribute weight to axles based on longitudinal position
  for (const item of placed) {
    const itemCogX = item.x + item.l / 2;
    const itemWeight = getItemWeight(item.id, placed);
    
    // Simple distribution: closer axle gets more load
    for (let i = 0; i < trailer.axles.length; i++) {
      const axlePos = trailer.axles[i].pos_ft;
      const distance = Math.abs(itemCogX - axlePos);
      const maxDistance = trailer.length_ft;
      const influence = Math.max(0, 1 - distance / maxDistance);
      
      axleLoads[i].load_lbs += itemWeight * influence * 0.5; // Simplified distribution
    }
  }
  
  // Calculate percentages
  axleLoads.forEach(axle => {
    axle.percentage = (axle.load_lbs / axle.limit_lbs) * 100;
  });
  
  return axleLoads;
}

// Get item weight from original cargo data
function getItemWeight(id: string, placed: PlacedItem[]): number {
  // This would normally come from the original cargo item data
  // For now, estimate based on volume (simplified)
  const item = placed.find(p => p.id === id);
  if (!item) return 0;
  
  const volume = item.l * item.w * item.h;
  return volume * 50; // Rough estimate: 50 lbs per cubic foot
}

// Main packing algorithm
export function packTrailer(cargo: CargoItem[], trailer: TrailerSpec): OptimizeResult {
  const placed: PlacedItem[] = [];
  const unplaced: string[] = [];
  const placements: Placement[] = [];
  
  // Sort items by area * weight (largest first)
  const sortedCargo = [...cargo].sort((a, b) => {
    const aScore = a.l * a.w * a.weight_lbs;
    const bScore = b.l * b.w * b.weight_lbs;
    return bScore - aScore;
  });
  
  // Grid resolution for placement attempts (every 1 foot)
  const gridSize = 1;
  
  for (const item of sortedCargo) {
    let bestPlacement: Placement | null = null;
    
    // Try all allowed orientations
    for (const orientation of item.orientations) {
      const dims = [item.l, item.w, item.h];
      const [l, w, h] = [dims[orientation[0]], dims[orientation[1]], dims[orientation[2]]];
      
      // Try positions from back to front, left to right
      for (let x = 0; x <= trailer.length_ft - l; x += gridSize) {
        for (let y = 0; y <= trailer.width_ft - w; y += gridSize) {
          const z = findLowestZ(x, y, { ...item, l, w, h }, placements);
          
          const candidate: Placement = { x, y, z, l, w, h };
          
          // Check if fits in trailer and doesn't collide
          if (fitsInTrailer(candidate, trailer) && 
              !placements.some(p => placementsCollide(candidate, p))) {
            
            // Prefer positions closer to back (lower x) and lower z
            if (!bestPlacement || 
                z < bestPlacement.z || 
                (z === bestPlacement.z && x < bestPlacement.x)) {
              bestPlacement = candidate;
            }
          }
        }
      }
      
      // If we found a placement, use it
      if (bestPlacement) break;
    }
    
    if (bestPlacement) {
      const placedItem: PlacedItem = {
        id: item.id,
        x: bestPlacement.x,
        y: bestPlacement.y,
        z: bestPlacement.z,
        l: bestPlacement.l,
        w: bestPlacement.w,
        h: bestPlacement.h,
        rot: 0,
        color: getItemColor(item.id)
      };
      
      placed.push(placedItem);
      placements.push(bestPlacement);
    } else {
      unplaced.push(item.id);
    }
  }
  
  // Calculate metrics
  const totalVolume = cargo.reduce((sum, item) => sum + item.l * item.w * item.h, 0);
  const placedVolume = placed.reduce((sum, item) => sum + item.l * item.w * item.h, 0);
  const utilization = (placedVolume / (trailer.length_ft * trailer.width_ft * trailer.height_ft)) * 100;
  
  // Calculate center of gravity
  const totalWeight = placed.reduce((sum, item) => sum + getItemWeight(item.id, placed), 0);
  const cogX = placed.reduce((sum, item) => 
    sum + (item.x + item.l / 2) * getItemWeight(item.id, placed), 0
  ) / (totalWeight || 1);
  const cogY = placed.reduce((sum, item) => 
    sum + (item.y + item.w / 2) * getItemWeight(item.id, placed), 0
  ) / (totalWeight || 1);
  const cogZ = placed.reduce((sum, item) => 
    sum + (item.z + item.h / 2) * getItemWeight(item.id, placed), 0
  ) / (totalWeight || 1);
  
  const axleLoads = calculateAxleLoads(placed, trailer);
  
  return {
    placed,
    unplaced,
    axle_loads: axleLoads,
    cog: [cogX, cogY, cogZ],
    utilization_pct: utilization
  };
}

// Assign colors to different item types
function getItemColor(id: string): string {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
}








