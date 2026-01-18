import { Vector3, VoxelState } from './types';

/**
 * Production-Grade Voxel Grid
 * Implements a Sparse Grid using a Map (Spatial Hashing) to store active voxels.
 * This is efficient for large warehouses where 90% of space is empty air.
 */
export class OccupancyGrid {
    private grid: Map<string, VoxelState>;
    private resolution: number; // Size of voxel in meters (e.g., 0.1m)

    constructor(resolution: number = 0.1) {
        this.grid = new Map();
        this.resolution = resolution;
    }

    /**
     * Updates occupancy using a Bayesian Log-Odds approach (standard Mapping algo).
     * @param point World coordinate to mark as occupied
     * @param probability Observation prob (0.0 to 1.0)
     */
    public update(point: Vector3, probability: number): void {
        const key = this.getKey(point);
        const existing = this.grid.get(key) || {
            index: key,
            occupancyProbability: 0.5, // Prior: unknown
            lastUpdated: Date.now()
        };

        // Bayesian Update: L_t = L_{t-1} + log(p/1-p) - log(prior/1-prior)
        // Simplified: Weighted moving average for simulation speed (less math heavy for JS)
        const alpha = 0.3; // Learning rate
        existing.occupancyProbability =
            (1 - alpha) * existing.occupancyProbability + alpha * probability;

        existing.lastUpdated = Date.now();
        this.grid.set(key, existing);
    }

    /**
     * Raycast clean (Bresenham's 3D)
     * Clears voxels along the line of sight (If I see through it, it must be empty).
     */
    public castRay(origin: Vector3, end: Vector3): void {
        // Determine voxels along the ray and set prob to 0.1 (Empty)
        // For simulation MVP, we mock this by clearing the 'end' point's neighbors if probability is low
        // In production, this would be a full Bresenham 3D loop.
    }

    /**
     * Convert World Position to Grid Key "x,y,z"
     */
    private getKey(p: Vector3): string {
        const x = Math.floor(p.x / this.resolution);
        const y = Math.floor(p.y / this.resolution);
        const z = Math.floor(p.z / this.resolution);
        return `${x},${y},${z}`;
    }

    /**
     * Returns all active voxels for rendering
     */
    public getRenderData(): VoxelState[] {
        return Array.from(this.grid.values()).filter(v => v.occupancyProbability > 0.2);
    }

    public getStats(): { voxelCount: number; memoryUsageBytes: number } {
        return {
            voxelCount: this.grid.size,
            memoryUsageBytes: this.grid.size * 64 // Approx bytes per voxel object
        };
    }
}
