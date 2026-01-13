import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DIRECTED PUTAWAY
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { itemId, warehouseId, quantity } = body;

        // 1. Get Item Velocity (Simulated)
        // In real life, calculate sales freq over last 30 days.
        // Here, randomly assign A/B/C based on SKU length or hash
        const velocity = itemId.length % 2 === 0 ? 'A' : 'B'; // A = Fast, B = Slow

        // 2. Find Best Zone
        // A -> "PICK" Zone (Front)
        // B -> "RESERVE" Zone (Back)
        const targetZoneType = velocity === 'A' ? 'PICK' : 'RESERVE';

        // 3. Find Empty Bin in Zone
        const bin = await prisma.location.findFirst({
            where: {
                warehouseId: warehouseId,
                type: targetZoneType,
                // Check capacity if we had rigorous tracking
                // currentLoad: { lt: db.location.capacity } 
            },
            orderBy: {
                name: 'asc' // Fill first available
            }
        });

        if (bin) {
            return NextResponse.json({
                success: true,
                locationId: bin.id,
                locationName: bin.name,
                reason: `Item is Velocity ${velocity} -> Assigned to ${targetZoneType}`
            });
        } else {
            // Fallback
            return NextResponse.json({
                success: true,
                locationId: 'DOCK-FLOOR',
                locationName: 'Overflow Floor',
                reason: 'No suitable bins found'
            });
        }

    } catch (error) {
        console.error('Putaway Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
