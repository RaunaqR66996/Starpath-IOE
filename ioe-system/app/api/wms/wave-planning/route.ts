import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// WAVE PLANNING
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { ruleId, warehouseId } = body;

        // Fetch Rule
        const rule = await prisma.waveRule.findUnique({ where: { id: ruleId } });
        if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

        const criteria = JSON.parse(rule.criteria);
        // criteria example: { carrier: "UPS", service: "Ground", maxLines: 500 }

        // Fetch Eligible Orders
        // In a real system, we'd translate JSON criteria to a Prisma 'where' clause dynamically
        // precise mapping is complex, so we'll do a basic filter here for demo
        let eligibleOrders = await prisma.order.findMany({
            where: {
                originId: warehouseId,
                status: 'PLANNED', // Only plan unreleased orders
            },
            include: { lines: true }
        });

        // Filter in memory (Demo Logic)
        if (criteria.carrier) {
            // Assuming we had carrier info on order, or we look up via ShipVia
            // eligibleOrders = eligibleOrders.filter(o => o.shipVia === criteria.carrier);
        }

        if (eligibleOrders.length === 0) {
            return NextResponse.json({ message: 'No orders match criteria' });
        }

        // Create Wave
        const wave = await prisma.pickWave.create({
            data: {
                waveNumber: `WAVE-${Date.now()}`,
                status: 'PLANNED',
                type: 'BATCH',
                warehouseId: warehouseId
            }
        });

        // Create PickLists
        // Demo: 1 PickList per 5 Orders
        const chunkSize = 5;
        for (let i = 0; i < eligibleOrders.length; i += chunkSize) {
            const chunk = eligibleOrders.slice(i, i + chunkSize);

            const pickList = await prisma.pickList.create({
                data: {
                    waveId: wave.id,
                    status: 'PENDING'
                }
            });

            for (const order of chunk) {
                for (const line of order.lines) {
                    await prisma.pickListItem.create({
                        data: {
                            pickListId: pickList.id,
                            itemId: line.itemId,
                            locationId: "A-01-01", // Placeholder until directed picking
                            quantity: line.qtyOrdered, // Quantity ordered
                            orderId: order.id,
                            orderLineId: line.id
                        }
                    });
                }
                // Update Order Status
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'WAVED' } // Custom status
                });
            }
        }

        return NextResponse.json({ success: true, wave });

    } catch (error) {
        console.error('Wave Plan Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
