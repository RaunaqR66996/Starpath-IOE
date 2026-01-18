import { SensorFusionFrame } from '@/lib/simulation/types';

// Global state to hold the latest frame (acting as a simple in-memory Redis)
// In production, this would be a Redis Cache Key: "device:FL-01:latest_frame"
class TelemetryStateManager {
    private static instance: TelemetryStateManager;
    private latestFrame: SensorFusionFrame | null = null;
    private lastUpdateTimestamp: number = 0;

    private constructor() { }

    public static getInstance(): TelemetryStateManager {
        if (!TelemetryStateManager.instance) {
            TelemetryStateManager.instance = new TelemetryStateManager();
        }
        return TelemetryStateManager.instance;
    }

    public updateFrame(frame: SensorFusionFrame): void {
        this.latestFrame = frame;
        this.lastUpdateTimestamp = Date.now();
    }

    public getLatestFrame(): SensorFusionFrame | null {
        // Optional: Implement "Time-to-Live" logic. 
        // If no data for 5 seconds, consider device offline? 
        // For now, return what we have, let frontend decide "Stale" status.
        return this.latestFrame;
    }

    public getLastUpdate(): number {
        return this.lastUpdateTimestamp;
    }
}

// Export singleton
export const telemetryState = TelemetryStateManager.getInstance();
