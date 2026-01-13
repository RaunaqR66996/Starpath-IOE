import { NextResponse } from 'next/server';
import { getShipment } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    // Awaiting params is required in Next.js 15, but let's check exact version context. 
    // Assuming standard behavior for now.
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const shipment = await getShipment(id);

    if (!shipment) {
        return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json(shipment);
}
