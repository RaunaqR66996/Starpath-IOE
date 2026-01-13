'use server';

import { DigitalTwinService } from '@/lib/services/DigitalTwinService';
import { ScanResult, SyncReport } from '@/lib/types/DigitalTwin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AssetMetadata {
    confidence: number;
    lastScanned: Date;
    locationId: string;
    itemId?: string;
    detectedLabel?: string;
}

interface DetectedAsset {
    id: string;
    type: 'rack' | 'bin';
    coordinates: { x: number; y: number; z: number; rotation: number };
    dimensions: { width: number; height: number; depth: number };
    capacity: { volume: number; weightLimit: number };
    status: 'empty' | 'occupied';
    metadata: AssetMetadata;
}

export async function performLidarScan(warehouseCode: string): Promise<ScanResult> {
    console.log(`Starting LiDAR scan for ${warehouseCode}...`);

    // 1. Simulate scanning process (delay)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Generate simulated scan data based on existing locations
    const locations = await prisma.location.findMany({
        where: { warehouseCode }
    });

    const detectedAssets: DetectedAsset[] = [];

    for (const loc of locations) {
        // Simulate detection probability
        if (Math.random() > 0.05) { // 95% chance to detect the rack/bin itself
            const asset: DetectedAsset = {
                id: loc.locationId,
                type: (loc.rack ? 'rack' : 'bin') as 'rack' | 'bin',
                coordinates: { x: 0, y: 0, z: 0, rotation: 0 }, // Mock coords
                dimensions: { width: 100, height: 100, depth: 100 }, // Mock dims
                capacity: { volume: 1000, weightLimit: loc.maxWeightKG || 1000 },
                status: 'empty', // Default to empty
                metadata: {
                    confidence: 0.99,
                    lastScanned: new Date(),
                    locationId: loc.locationId
                }
            };

            // Check if there's inventory (System of Record)
            const inventory = await prisma.inventoryItem.findFirst({
                where: { locationId: loc.locationId }
            });

            if (inventory) {
                // If system has inventory, we likely see it.
                // Let's say 98% match.
                if (Math.random() < 0.98) {
                    asset.status = 'occupied';
                    asset.metadata.itemId = inventory.itemId;
                    asset.metadata.detectedLabel = inventory.sku;
                } else {
                    // 2% chance we miss it (Physical = Empty, System = Occupied) -> Missing Item
                    asset.status = 'empty';
                }
            } else {
                // If system has NO inventory.
                // Let's say 1% chance we see something (Physical = Occupied, System = Empty) -> Unexpected Item
                if (Math.random() < 0.01) {
                    asset.status = 'occupied';
                    asset.metadata.detectedLabel = 'UNKNOWN-BOX';
                }
            }

            detectedAssets.push(asset);
        }
    }

    const scanResult: ScanResult = {
        jobId: `SCAN-${Date.now()}`,
        timestamp: new Date(),
        warehouseId: warehouseCode,
        detectedAssets: detectedAssets as any
    };

    // 3. Process the scan result to update Digital Twin state
    await DigitalTwinService.processScanResult(scanResult);

    return scanResult;
}

export async function getDigitalTwinSyncReport(warehouseCode: string): Promise<SyncReport> {
    return await DigitalTwinService.generateSyncReport(warehouseCode);
}
