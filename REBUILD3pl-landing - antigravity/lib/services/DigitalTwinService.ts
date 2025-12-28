import { PrismaClient } from '@prisma/client';
import { DigitalTwinAsset, ScanResult, SyncReport } from '@/lib/types/DigitalTwin';

const prisma = new PrismaClient();

export class DigitalTwinService {
    /**
     * Updates or creates a Digital Twin Asset in the database.
     * This is the "Physical Truth" coming from LiDAR/Vision.
     */
    static async updateAsset(asset: DigitalTwinAsset) {
        // We need to map the interface to the Prisma model fields
        // Note: Prisma Decimal types need to be handled if we were strict, 
        // but passing numbers usually works if the client handles it, 
        // or we might need to use new Prisma.Decimal(val).

        // For simplicity in this MVP, we assume the input matches closely.

        return await prisma.digitalTwinAsset.upsert({
            where: { id: asset.id },
            update: {
                type: asset.type,
                status: asset.status,
                x: asset.coordinates.x,
                y: asset.coordinates.y,
                z: asset.coordinates.z,
                rotation: asset.coordinates.rotation,
                width: asset.dimensions.width,
                height: asset.dimensions.height,
                depth: asset.dimensions.depth,
                volumeCapacity: asset.capacity.volume,
                weightCapacity: asset.capacity.weightLimit,
                confidence: asset.metadata?.confidence,
                lastScanned: asset.metadata?.lastScanned,
                detectedLabel: asset.metadata?.detectedLabel,
                metadata: asset.metadata ? JSON.parse(JSON.stringify(asset.metadata)) : {},
                itemId: asset.metadata?.itemId,
                locationId: asset.metadata?.locationId,
            },
            create: {
                id: asset.id,
                organizationId: 'ORG-001', // Default for MVP
                warehouseCode: 'WH-WEST-01', // Default or extracted from context
                type: asset.type,
                status: asset.status,
                x: asset.coordinates.x,
                y: asset.coordinates.y,
                z: asset.coordinates.z,
                rotation: asset.coordinates.rotation,
                width: asset.dimensions.width,
                height: asset.dimensions.height,
                depth: asset.dimensions.depth,
                volumeCapacity: asset.capacity.volume,
                weightCapacity: asset.capacity.weightLimit,
                confidence: asset.metadata?.confidence,
                lastScanned: asset.metadata?.lastScanned,
                detectedLabel: asset.metadata?.detectedLabel,
                metadata: asset.metadata ? JSON.parse(JSON.stringify(asset.metadata)) : {},
                itemId: asset.metadata?.itemId,
                locationId: asset.metadata?.locationId,
            }
        });
    }

    /**
     * Retrieves the current 3D state of a warehouse.
     */
    static async getWarehouseState(warehouseCode: string) {
        const assets = await prisma.digitalTwinAsset.findMany({
            where: { warehouseCode },
        });

        // Map back to DigitalTwinAsset interface
        return assets.map(asset => ({
            id: asset.id,
            type: asset.type as any,
            coordinates: {
                x: Number(asset.x),
                y: Number(asset.y),
                z: Number(asset.z),
                rotation: Number(asset.rotation)
            },
            dimensions: {
                width: Number(asset.width),
                height: Number(asset.height),
                depth: Number(asset.depth)
            },
            capacity: {
                volume: Number(asset.volumeCapacity || 0),
                weightLimit: Number(asset.weightCapacity || 0)
            },
            status: asset.status as any,
            metadata: {
                confidence: Number(asset.confidence || 1),
                lastScanned: asset.lastScanned || new Date(),
                detectedLabel: asset.detectedLabel || '',
                itemId: asset.itemId || undefined,
                locationId: asset.locationId || undefined
            }
        }));
    }

    /**
     * Processes a full LiDAR scan result.
     */
    static async processScanResult(scan: ScanResult) {
        console.log(`Processing scan ${scan.jobId} for ${scan.warehouseId} with ${scan.detectedAssets.length} assets.`);

        const results = [];
        for (const asset of scan.detectedAssets) {
            // In a real app, we would infer warehouseCode from the scan context
            // For now, we'll patch the updateAsset method to accept warehouseCode if needed
            // or rely on the default in updateAsset (which is hacky but okay for MVP start)

            // Better: Update updateAsset to take context
            const saved = await this.updateAssetWithContext(asset, scan.warehouseId);
            results.push(saved);
        }
        return results;
    }

    private static async updateAssetWithContext(asset: DigitalTwinAsset, warehouseCode: string) {
        return await prisma.digitalTwinAsset.upsert({
            where: { id: asset.id },
            update: {
                status: asset.status,
                lastScanned: new Date(),
                confidence: asset.metadata?.confidence,
                // Update coordinates if they changed? 
                // Usually master data geometry is static, but status changes.
                // For MVP, we assume geometry might be refined.
                x: asset.coordinates.x,
                y: asset.coordinates.y,
                z: asset.coordinates.z,
            },
            create: {
                id: asset.id,
                organizationId: 'ORG-001',
                warehouseCode: warehouseCode,
                type: asset.type,
                status: asset.status,
                x: asset.coordinates.x,
                y: asset.coordinates.y,
                z: asset.coordinates.z,
                rotation: asset.coordinates.rotation,
                width: asset.dimensions.width,
                height: asset.dimensions.height,
                depth: asset.dimensions.depth,
                volumeCapacity: asset.capacity.volume,
                weightCapacity: asset.capacity.weightLimit,
                confidence: asset.metadata?.confidence,
                lastScanned: new Date(),
                detectedLabel: asset.metadata?.detectedLabel,
                metadata: asset.metadata ? JSON.parse(JSON.stringify(asset.metadata)) : {},
            }
        });
    }

    /**
     * Generates a Sync Report comparing Physical (DigitalTwinAsset) vs System (InventoryItem).
     */
    static async generateSyncReport(warehouseCode: string): Promise<SyncReport> {
        // 1. Get Physical State
        const physicalAssets = await this.getWarehouseState(warehouseCode);

        // 2. Get System State
        const systemInventory = await prisma.inventoryItem.findMany({
            where: { warehouseCode },
            include: { item: true, location: true }
        });

        const report: SyncReport = {
            id: `SYNC-${Date.now()}`,
            timestamp: new Date(),
            warehouseId: warehouseCode,
            matchedItems: 0,
            missingItems: 0,
            unexpectedItems: 0,
            discrepancies: []
        };

        // 3. Compare
        // This is a simplified logic:
        // - Check if occupied locations in 3D have inventory in DB.
        // - Check if empty locations in 3D have no inventory in DB.

        // Map system inventory by location
        const systemMap = new Map<string, any>();
        systemInventory.forEach(inv => {
            if (inv.locationId) systemMap.set(inv.locationId, inv);
        });

        for (const asset of physicalAssets) {
            // Only check storage locations (racks/bins)
            if (asset.type === 'rack' || asset.type === 'bin') {
                const systemItem = asset.metadata?.locationId ? systemMap.get(asset.metadata.locationId) : null;

                if (asset.status === 'occupied') {
                    if (systemItem) {
                        report.matchedItems++;
                    } else {
                        report.unexpectedItems++;
                        report.discrepancies.push({
                            type: 'unexpected',
                            assetId: asset.id,
                            actualLocation: asset.id,
                            description: `Physical item detected at ${asset.id} but system shows empty.`
                        });
                    }
                } else if (asset.status === 'empty') {
                    if (systemItem) {
                        report.missingItems++;
                        report.discrepancies.push({
                            type: 'missing',
                            assetId: asset.id,
                            expectedLocation: asset.id,
                            description: `System expects item ${systemItem.sku} at ${asset.id} but location is empty.`
                        });
                    } else {
                        // Both empty, match
                        report.matchedItems++;
                    }
                }
            }
        }

        return report;
    }
}
