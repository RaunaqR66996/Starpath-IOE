import { NextRequest, NextResponse } from 'next/server';
import { telemetryState } from '@/lib/hardware/telemetry-state';
import { SensorFusionFrame } from '@/lib/simulation/types';

/**
 * HARDWARE INGESTION ENDPOINT
 * Device (Jetson Orin) POSTs telemetry here.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic Validation
        if (!body.deviceId || !body.timestamp) {
            return NextResponse.json(
                { error: 'Invalid Payload: Missing deviceId or timestamp' },
                { status: 400 }
            );
        }

        // Cast to type (Validation would typically use Zod here)
        const frame = body as SensorFusionFrame;

        // Update Global State
        telemetryState.updateFrame(frame);

        return NextResponse.json({ status: 'ack', sequenceId: frame.timestamp });

    } catch (error) {
        console.error('Ingest Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
