import { NextResponse } from 'next/server';
import { getShipments } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET() {
    const shipments = await getShipments();
    return NextResponse.json(shipments);
}
