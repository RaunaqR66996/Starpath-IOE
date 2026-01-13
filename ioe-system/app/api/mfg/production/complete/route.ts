import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// COMPLETE WORK ORDER (Backflush)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, warehouseId } = body; // warehouseId needed for stock movements

        const order = await prisma.productionOrder.findUnique({
            where: { id },
            include: { item: { include: { bomsAsParent: true } } }
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (order.status === 'COMPLETED') return NextResponse.json({ error: 'Already completed' }, { status: 400 });

        // TRANSACTION: Consume Parts + Make Item
        const result = await prisma.$transaction(async (tx) => {
            // 1. Consume Components (Backflush)
            for (const bomLine of order.item.bomsAsParent) {
                const qtyNeeded = bomLine.quantity * order.quantity;

                // Find stock (Naive: First available)
                const componentStock = await tx.inventory.findFirst({
                    where: { itemId: bomLine.childId, warehouseId: warehouseId || 'WH-01' }
                });

                if (componentStock) {
                    await tx.inventory.update({
                        where: { id: componentStock.id },
                        data: { quantity: { decrement: qtyNeeded } }
                    });
                } else {
                    // Logic for negative inventory or error?
                    // allowing negative for now to prevent blocking
                }
            }

            // 2. Increment Finished Good
            const fgStock = await tx.inventory.findFirst({
                where: { itemId: order.itemId, warehouseId: warehouseId || 'WH-01' }
            });

            if (fgStock) {
                await tx.inventory.update({
                    where: { id: fgStock.id },
                    data: { quantity: { increment: order.quantity } }
                });
            } else {
                await tx.inventory.create({
                    data: {
                        itemId: order.itemId,
                        warehouseId: warehouseId || 'WH-01',
                        quantity: order.quantity,
                        locationId: 'FG-STAGING'
                    }
                });
            }

            // 3. Close Order
            return await tx.productionOrder.update({
                where: { id: order.id },
                data: { status: 'COMPLETED', endDate: new Date() }
            });
        });

        return NextResponse.json({ success: true, order: result });

    } catch (error) {
        console.error('Completion Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
