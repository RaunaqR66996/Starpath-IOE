import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List recent receipts
export async function GET(request: Request) {
    try {
        const receipts = await prisma.receipt.findMany({
            take: 50,
            orderBy: { receivedAt: 'desc' },
            include: {
                purchaseOrder: true,
                lines: {
                    include: { item: true, qualityInspection: true }
                }
            }
        });
        return NextResponse.json(receipts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 });
    }
}

// POST: Process a new Receipt (Inbound)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { poId, warehouseId, items } = body;
        // items: { itemId, qtyReceived, locationId, lotNumber?, expirationDate? }[]

        if (!poId || !warehouseId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields: poId, warehouseId, items' }, { status: 400 });
        }

        // Transaction to ensure Receipt + Inventory updates happen atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Receipt
            const receipt = await tx.receipt.create({
                data: {
                    receiptNumber: `RCT-${Date.now()}`,
                    poId,
                    warehouseId,
                    status: 'RECEIVED',
                    receivedAt: new Date(),
                    lines: {
                        create: items.map((item: any) => ({
                            itemId: item.itemId,
                            qtyReceived: item.qtyReceived,
                            locationId: item.locationId,
                            // If QC is needed, we could init a record here, but we'll leave it for a separate QC step or null
                        }))
                    }
                },
                include: { lines: true }
            });

            // 2. Update Inventory for each line
            for (const item of items) {
                // Check if inventory exists for this Item + Warehouse + Location (and optionally Lot)
                // For simplicity, we'll match on Item + Location + Warehouse. 
                // Creating a simplified composite key logic here since Prisma upsert on complex non-unique fields can be tricky without a unique constraint.
                // We will attempt to find first, then update or create.

                const existingInventory = await tx.inventory.findFirst({
                    where: {
                        itemId: item.itemId,
                        warehouseId: warehouseId,
                        locationId: item.locationId,
                        // Not filtering by Lot yet to keep it simple, or we could strict match.
                    }
                });

                if (existingInventory) {
                    await tx.inventory.update({
                        where: { id: existingInventory.id },
                        data: {
                            quantity: { increment: item.qtyReceived },
                            updatedAt: new Date()
                        }
                    });
                } else {
                    await tx.inventory.create({
                        data: {
                            itemId: item.itemId,
                            warehouseId: warehouseId,
                            locationId: item.locationId,
                            quantity: item.qtyReceived,
                            status: 'AVAILABLE',
                            lotNumber: item.lotNumber,
                            expirationDate: item.expirationDate ? new Date(item.expirationDate) : null
                        }
                    });
                }

                // 3. Update PO Line `qtyReceived`
                // Find the PO line for this item
                const poLine = await tx.purchaseOrderLine.findFirst({
                    where: { poId: poId, itemId: item.itemId }
                });

                if (poLine) {
                    await tx.purchaseOrderLine.update({
                        where: { id: poLine.id },
                        data: { qtyReceived: { increment: item.qtyReceived } }
                    });
                }
            }

            // 4. Check if PO is fully received (Optional enhancement)

            return receipt;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Inbound Receipt Error:', error);
        return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
    }
}
