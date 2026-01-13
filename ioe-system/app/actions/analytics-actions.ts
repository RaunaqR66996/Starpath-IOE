'use server'

import { db } from "@/lib/db";

export interface ZoneMetricData {
    zoneId: string;
    occupancy: number; // 0-1
    density: number;   // 0-1
}

/**
 * Retrieves heat map data for a specific warehouse.
 * For the MVP, if no data exists, it generates realistic mock data based on the rack configuration.
 */
export async function getHeatMapData(warehouseId: string = "W-001"): Promise<ZoneMetricData[]> {
    try {
        // 1. Try to fetch existing metrics
        const metrics = await db.zoneMetric.findMany({
            where: { warehouseId }
        });

        if (metrics.length > 0) {
            return metrics.map((m: any) => ({
                zoneId: m.zoneId,
                occupancy: m.occupancy,
                density: m.density
            }));
        }

        // 2. If no data, generate "Live" data on the fly (Simulation Mode)
        // In a real app, this would be a background job.
        return generateMockHeatMap(warehouseId);

    } catch (error) {
        console.error("Failed to fetch heat map data:", error);
        return [];
    }
}

/**
 * Generates realistic-looking heat map data for the 3D scene.
 * It maps to the grid coordinates used in Warehouse3DScene.
 */
async function generateMockHeatMap(warehouseId: string): Promise<ZoneMetricData[]> {
    const data: ZoneMetricData[] = [];

    // Grid dimensions from Warehouse3DScene (roughly)
    const ROWS = 40; // X axis
    const COLS = 40; // Z axis

    // Create "hot spots" (high density)
    const hotSpots = [
        { x: 10, z: 10, intensity: 0.9, radius: 8 }, // Receiving Area
        { x: 30, z: 5, intensity: 0.8, radius: 6 },  // Fast Movers
        { x: 20, z: 25, intensity: 0.4, radius: 10 }, // Bulk Storage
    ];

    for (let x = 0; x < ROWS; x++) {
        for (let z = 0; z < COLS; z++) {
            // Calculate base density from hot spots
            let density = 0.1; // Base low density

            for (const spot of hotSpots) {
                const dx = x - spot.x;
                const dz = z - spot.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < spot.radius) {
                    // Gaussian-ish falloff
                    const factor = (1 - dist / spot.radius);
                    density = Math.max(density, spot.intensity * factor);
                }
            }

            // Add some noise
            density += (Math.random() * 0.1 - 0.05);
            density = Math.max(0, Math.min(1, density));

            // Occupancy often correlates with density but not always
            const occupancy = Math.min(1, density * (1 + Math.random() * 0.2));

            data.push({
                zoneId: `${x}-${z}`, // Coordinate Key
                occupancy: parseFloat(occupancy.toFixed(2)),
                density: parseFloat(density.toFixed(2))
            });
        }
    }

    return data;
}
