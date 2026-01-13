import { NextResponse } from 'next/server';
import { calculateNetRequirements } from '@/lib/planning/mrp-service';

import { db } from '@/lib/db';

export async function GET() {
    try {
        // Run Calculation
        const { results, runId } = await calculateNetRequirements();

        // Fetch the persistent run state with exceptions (if runId exists)
        let runState = null;
        if (runId && runId !== 'SIMULATION') {
            runState = await (db as any).planningRun.findUnique({
                where: { id: runId },
                include: {
                    exceptions: {
                        include: { item: true }
                    }
                }
            });
        }

        return NextResponse.json({
            results,
            runId,
            runState
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
