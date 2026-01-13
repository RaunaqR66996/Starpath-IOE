export interface DigitalTwinAsset {
    id: string;
    type: "rack" | "bin" | "pallet" | "forklift" | "zone";
    coordinates: { x: number; y: number; z: number; rotation: number };
    dimensions: { width: number; height: number; depth: number };
    capacity: { volume: number; weightLimit: number };
    status: "occupied" | "empty" | "blocked";
    metadata?: {
        confidence: number;
        lastScanned: Date;
        detectedLabel: string;
        itemId?: string;
        locationId?: string;
    };
}

export interface ScanResult {
    jobId: string;
    timestamp: Date;
    warehouseId: string;
    detectedAssets: DigitalTwinAsset[];
    rawPointCloudUrl?: string;
}

export interface SyncReport {
    id: string;
    timestamp: Date;
    warehouseId: string;
    matchedItems: number;
    missingItems: number;
    unexpectedItems: number;
    discrepancies: Array<{
        type: "missing" | "unexpected" | "location_mismatch";
        assetId: string;
        expectedLocation?: string;
        actualLocation?: string;
        description: string;
    }>;
}

export interface StagingZoneStatus {
    zoneId: string;
    totalCapacity: number;
    currentUtilization: number;
    readyToLoadItems: Array<{
        id: string;
        sku: string;
        weight: number;
        dimensions: { l: number; w: number; h: number };
        position: { x: number; y: number; z: number };
    }>;
    trafficCongestionLevel: "low" | "medium" | "high";
}
