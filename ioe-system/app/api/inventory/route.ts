import { NextResponse } from 'next/server';
import { getInventory } from '@/lib/data-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const inventory = await getInventory(warehouseId);
    return NextResponse.json(inventory);
}
