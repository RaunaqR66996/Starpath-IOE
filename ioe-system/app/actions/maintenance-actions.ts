"use server";

export interface AssetHealth {
    id: string;
    type: 'CONVEYOR' | 'SORTER' | 'ROBOT' | 'FORKLIFT';
    health: number; // 0-100
    status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    lastService: string;
    mtbf: number; // Hours
    utilization: number; // %
}

export async function getAssetHealthMonitor() {
    return [
        { id: 'CNV-A1', type: 'CONVEYOR', health: 94, status: 'OPTIMAL', lastService: '2024-12-01', mtbf: 4500, utilization: 82 },
        { id: 'SRT-Main', type: 'SORTER', health: 78, status: 'DEGRADED', lastService: '2024-11-15', mtbf: 2100, utilization: 95 },
        { id: 'AMR-Fleet-X', type: 'ROBOT', health: 91, status: 'OPTIMAL', lastService: '2024-12-10', mtbf: 8000, utilization: 64 },
        { id: 'FK-002', type: 'FORKLIFT', health: 42, status: 'CRITICAL', lastService: '2024-05-20', mtbf: 500, utilization: 12 },
    ] as AssetHealth[];
}

export async function scheduleMaintenance(assetId: string) {
    console.log(`[Maintenance] Scheduled service for ${assetId}`);
    return { success: true, date: new Date(Date.now() + 86400000).toISOString() };
}
