import { NextRequest, NextResponse } from 'next/server';
import { telemetryState } from '@/lib/hardware/telemetry-state';

/**
 * FRONTEND POLLING ENDPOINT
 * Web Client polls this to get the latest state for visualization.
 */
export async function GET(req: NextRequest) {
    const frame = telemetryState.getLatestFrame();
    const lastUpdate = telemetryState.getLastUpdate();

    // Calculate "Stale" status
    const now = Date.now();
    const isStale = (now - lastUpdate) > 2000; // If no data for >2s, device is "Disconnected"

    if (!frame || isStale) {
        // Return empty/offline status
        return NextResponse.json({
            online: false,
            lastSeen: lastUpdate
        });
    }

    return NextResponse.json({
        online: true,
        frame
    });
}
