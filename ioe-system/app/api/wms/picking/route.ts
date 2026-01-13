import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List recent Pick Waves
export async function GET(request: Request) {
    try {
        const waves = await prisma.pickWave.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                pickLists: {
                    include: { items: true }
                }
            }
        });
        return NextResponse.json(waves);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch pick waves' }, { status: 500 });
    }
}

// POST: Release a Pick Wave (Outbound)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderIds, warehouseId, type } = body;
        // type: "BATCH" | "ZONE"

        if (!orderIds || !warehouseId || orderIds.length === 0) {
            return NextResponse.json({ error: 'Missing required fields: orderIds, warehouseId' }, { status: 400 });
        }

        // Transaction: Create Wave -> Allocate Inventory -> Create Pick Lists
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Wave
            const wave = await tx.pickWave.create({
                data: {
                    waveNumber: `WAVE-${Date.now()}`,
                    warehouseId,
                    type: type || 'BATCH',
                    status: 'RELEASED'
                }
            });

            // 2. Create a generic Pick List for this wave (Simplification: 1 List per Wave for now)
            const pickList = await tx.pickList.create({
                data: {
                    waveId: wave.id,
                    status: 'PENDING'
                }
            });

            const allocatedItems = [];

            // 3. Process each Order
            for (const orderId of orderIds) {
                // Fetch order lines
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    include: { lines: true }
                });

                if (!order) continue;

                for (const line of order.lines) {
                    const qtyNeeded = line.qtyOrdered - (line.qtyAllocated || 0);
                    if (qtyNeeded <= 0) continue;

                    // Find Inventory to allocate
                    // Strategy: FEFO or just simple Match
                    const inventory = await tx.inventory.findMany({
                        where: {
                            itemId: line.itemId,
                            warehouseId: warehouseId,
                            quantity: { gt: 0 },
                            status: 'AVAILABLE'
                        },
                        orderBy: { quantity: 'desc' } // Pick from largest pile for now
                    });

                    let remainingToAlloc = qtyNeeded;

                    for (const stock of inventory) {
                        if (remainingToAlloc <= 0) break;

                        const take = Math.min(stock.quantity, remainingToAlloc);

                        // Create Pick List Item
                        await tx.pickListItem.create({
                            data: {
                                pickListId: pickList.id,
                                itemId: line.itemId,
                                locationId: stock.locationId || 'UNKNOWN',
                                quantity: take,
                                orderId: orderId,
                                orderLineId: line.id,
                                status: 'PENDING'
                            }
                        });

                        // Deduct from Inventory (Soft Allocation logic - strictly typically we'd move to "ALLOCATED" status, 
                        // but here we will just decrement quantity or mark as locked. 
                        // Let's decrement for simplicity of "Available" stock, 
                        // in a real system we'd move to a 'Staged' location or 'Allocated' bucket.)
                        // DECISION: Decrement 'quantity' now to prevent double selling.
                        await tx.inventory.update({
                            where: { id: stock.id },
                            data: { quantity: { decrement: take } }
                        });

                        // Update Order Line Allocation
                        await tx.orderLine.update({
                            where: { id: line.id },
                            data: { qtyAllocated: { increment: take } }
                        });

                        remainingToAlloc -= take;
                    }
                }

                // Update Order Status
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'PICKING' }
                });
            }

            return { wave, pickList };
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Pick Wave Error:', error);
        return NextResponse.json({ error: 'Failed to create pick wave' }, { status: 500 });
    }
}
