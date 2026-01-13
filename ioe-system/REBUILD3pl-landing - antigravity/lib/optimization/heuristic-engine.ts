import { TrailerSpec } from '../types/trailer';

// Redefine local types to avoid circular dependencies or missing imports
interface CargoItem {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  canStack: boolean;
  maxStackWeight?: number;
  quantity: number; // Add quantity to match typical inputs
  rotationAllowed?: boolean;
}

interface Position {
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

interface PlacedItem extends CargoItem, Position {
  instanceId: string;
}

interface OptimizationResult {
  placedItems: PlacedItem[];
  unplacedItems: CargoItem[];
  utilization: number;
  totalWeight: number;
  centerOfGravity: { x: number; y: number; z: number };
  loadMeters: number;
}

export class HeuristicOptimizer {
  private placed: PlacedItem[] = [];
  private trailer: TrailerSpec;

  constructor(trailer: TrailerSpec) {
    this.trailer = trailer;
  }

  /**
   * Main optimization method using Deep-Bottom-Left heuristic
   */
  optimize(items: CargoItem[]): OptimizationResult {
    this.placed = [];
    const unplaced: CargoItem[] = [];
    
    // 1. Expand items by quantity
    const allItems: CargoItem[] = [];
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        allItems.push({ ...item, quantity: 1 }); // Flatten quantity
      }
    });

    // 2. Sort by Volume Descending (Big rocks first)
    // Secondary sort by weight for stability
    const sortedItems = allItems.sort((a, b) => {
      const volA = a.width * a.height * a.length;
      const volB = b.width * b.height * b.length;
      if (volB !== volA) return volB - volA;
      return b.weight - a.weight;
    });

    // 3. Pack items
    for (const item of sortedItems) {
      const position = this.findBestPosition(item);
      
      if (position) {
        this.placed.push({
          ...item,
          ...position,
          instanceId: `${item.id}-${this.placed.length}`
        });
      } else {
        unplaced.push(item);
      }
    }

    return this.calculateMetrics(unplaced);
  }

  /**
   * Find best position using Bottom-Left-Back strategy
   * Iterates through potential placement points relative to already placed items
   */
  private findBestPosition(item: CargoItem): Position | null {
    // Potential placement points: 
    // 1. Origin (0,0,0)
    // 2. Top-right-front corners of existing items
    const candidates: Position[] = [{ x: 0, y: 0, z: 0, rotationY: 0 }];

    this.placed.forEach(p => {
      // Right of item
      candidates.push({ x: p.x + p.length, y: p.y, z: p.z, rotationY: 0 });
      // Behind item
      candidates.push({ x: p.x, y: p.y, z: p.z + p.width, rotationY: 0 });
      // On top of item (if stackable)
      if (item.canStack && p.canStack) {
        candidates.push({ x: p.x, y: p.y + p.height, z: p.z, rotationY: 0 });
      }
    });

    // Also consider rotation
    if (item.rotationAllowed) {
      const rotatedCandidates = candidates.map(c => ({ ...c, rotationY: 90 }));
      candidates.push(...rotatedCandidates);
    }

    // Sort candidates by Y (bottom), then X (front), then Z (left)
    candidates.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.z - b.z;
    });

    // Find first valid position
    for (const pos of candidates) {
      if (this.isValidPlacement(pos, item)) {
        return pos;
      }
    }

    return null;
  }

  private isValidPlacement(pos: Position, item: CargoItem): boolean {
    // Determine actual dimensions based on rotation
    const length = pos.rotationY === 90 ? item.width : item.length;
    const width = pos.rotationY === 90 ? item.length : item.width;
    const height = item.height;

    // 1. Check Trailer Bounds
    if (pos.x + length > this.trailer.innerLength) return false;
    if (pos.y + height > this.trailer.innerHeight) return false;
    if (pos.z + width > this.trailer.innerWidth) return false;

    // 2. Check Collisions
    const itemBox = { 
      x: pos.x, y: pos.y, z: pos.z, 
      l: length, w: width, h: height 
    };

    for (const p of this.placed) {
      const pLength = p.rotationY === 90 ? p.width : p.length;
      const pWidth = p.rotationY === 90 ? p.length : p.width;
      
      const placedBox = {
        x: p.x, y: p.y, z: p.z,
        l: pLength, w: pWidth, h: p.height
      };

      if (this.boxesIntersect(itemBox, placedBox)) return false;
    }

    // 3. Check Support (Gravity)
    if (pos.y > 0) {
      const supported = this.checkSupport(itemBox);
      if (!supported) return false;
    }

    return true;
  }

  private boxesIntersect(a: any, b: any): boolean {
    return (
      a.x < b.x + b.l &&
      a.x + a.l > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y &&
      a.z < b.z + b.w &&
      a.z + a.w > b.z
    );
  }

  private checkSupport(box: any): boolean {
    // Calculate required support area (e.g., 80%)
    const requiredArea = box.l * box.w * 0.80;
    let supportedArea = 0;

    for (const p of this.placed) {
      // Only check items directly below
      if (Math.abs((p.y + p.height) - box.y) < 0.01) {
        const pLength = p.rotationY === 90 ? p.width : p.length;
        const pWidth = p.rotationY === 90 ? p.length : p.width;

        // Calculate intersection area on X-Z plane
        const xOverlap = Math.max(0, Math.min(box.x + box.l, p.x + pLength) - Math.max(box.x, p.x));
        const zOverlap = Math.max(0, Math.min(box.z + box.w, p.z + pWidth) - Math.max(box.z, p.z));
        
        supportedArea += xOverlap * zOverlap;
      }
    }

    return supportedArea >= requiredArea;
  }

  private calculateMetrics(unplaced: CargoItem[]): OptimizationResult {
    const totalWeight = this.placed.reduce((sum, p) => sum + p.weight, 0);
    
    // Calculate Center of Gravity
    let cogX = 0, cogY = 0, cogZ = 0;
    if (totalWeight > 0) {
      this.placed.forEach(p => {
        const pLength = p.rotationY === 90 ? p.width : p.length;
        const pWidth = p.rotationY === 90 ? p.length : p.width;
        
        const centerX = p.x + pLength / 2;
        const centerY = p.y + p.height / 2;
        const centerZ = p.z + pWidth / 2;

        cogX += centerX * p.weight;
        cogY += centerY * p.weight;
        cogZ += centerZ * p.weight;
      });
      cogX /= totalWeight;
      cogY /= totalWeight;
      cogZ /= totalWeight;
    }

    // Calculate Utilization
    const trailerVol = this.trailer.innerLength * this.trailer.innerWidth * this.trailer.innerHeight;
    const usedVol = this.placed.reduce((sum, p) => sum + (p.width * p.height * p.length), 0);
    
    // Calculate Load Meters (furthest X point)
    const maxX = this.placed.reduce((max, p) => {
        const pLength = p.rotationY === 90 ? p.width : p.length;
        return Math.max(max, p.x + pLength);
    }, 0);

    return {
      placedItems: this.placed,
      unplacedItems: unplaced,
      utilization: (usedVol / trailerVol) * 100,
      totalWeight,
      centerOfGravity: { x: cogX, y: cogY, z: cogZ },
      loadMeters: maxX
    };
  }
}

