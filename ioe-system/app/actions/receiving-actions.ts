"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface ReceivedItem {
    itemId: string;
    qty: number;
    locationId: string;
}

export async function receivePurchaseOrder(poId: string, receivedItems: ReceivedItem[]) {
    try {
        console.log(`Receiving PO: ${poId}`, receivedItems);

        // 1. Verify PO exists
        const po = await db.purchaseOrder.findUnique({
            where: { id: poId },
            include: { lines: true }
        });

        if (!po) {
            return { success: false, error: "Purchase Order not found" };
        }

        // 2. Perform Transaction
        const result = await db.$transaction(async (tx) => {

            // A. Create Receipt Header
            const receipt = await tx.receipt.create({
                data: {
                    receiptNumber: `RCT-${Date.now().toString().slice(-6)}`,
                    poId: po.id,
                    warehouseId: "Kuehne Nagel East", // Hardcoded for MVP
                    status: "RECEIVED",
                }
            });

            // Process each received item
            for (const item of receivedItems) {

                // B. Create Receipt Line
                await tx.receiptLine.create({
                    data: {
                        receiptId: receipt.id,
                        itemId: item.itemId,
                        qtyReceived: item.qty,
                        locationId: item.locationId
                    }
                });

                // C. Update Inventory (Upsert)
                const existingInventory = await tx.inventory.findFirst({
                    where: {
                        itemId: item.itemId,
                        locationId: item.locationId,
                        warehouseId: "Kuehne Nagel East"
                    }
                });

                if (existingInventory) {
                    await tx.inventory.update({
                        where: { id: existingInventory.id },
                        data: { quantity: { increment: item.qty } }
                    });
                } else {
                    await tx.inventory.create({
                        data: {
                            itemId: item.itemId,
                            warehouseId: "Kuehne Nagel East",
                            locationId: item.locationId,
                            quantity: item.qty
                        }
                    });
                }

                // D. Update PO Line Progress
                // Find matching PO Line (assuming one line per item for MVP simplicity, or just first match)
                const poLine = await tx.purchaseOrderLine.findFirst({
                    where: { poId: po.id, itemId: item.itemId }
                });

                if (poLine) {
                    await tx.purchaseOrderLine.update({
                        where: { id: poLine.id },
                        data: { qtyReceived: { increment: item.qty } }
                    });
                }
            }

            // E. Update PO Status
            // Check total ordered vs total received (fetching fresh state)
            const updatedLines = await tx.purchaseOrderLine.findMany({
                where: { poId: po.id }
            });

            const totalOrdered = updatedLines.reduce((sum, line) => sum + line.qtyOrdered, 0);
            const totalReceived = updatedLines.reduce((sum, line) => sum + line.qtyReceived, 0);

            const newStatus = totalReceived >= totalOrdered ? "CLOSED" : "PARTIAL";

            await tx.purchaseOrder.update({
                where: { id: po.id },
                data: { status: newStatus }
            });

            return { receiptId: receipt.id, status: newStatus };
        });

        revalidatePath('/procurement');
        revalidatePath('/inventory'); // Inventory changed

        return { success: true, ...result };

    } catch (error: any) {
        console.error("Receive PO Error:", error);
        return { success: false, error: error.message };
    }
}
