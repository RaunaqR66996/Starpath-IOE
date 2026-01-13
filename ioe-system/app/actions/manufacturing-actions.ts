"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { updateInventory } from "./inventory-actions";

/**
 * START PRODUCTION: 
 * Moves system from Planning Intent to Execution Reality.
 * 1. Consumes Components (Inventory Decrement)
 * 2. Logs WIP Transaction (Traceability)
 * 3. Updates MO Status
 */
export async function startProductionOrder(moId: string) {
    try {
        return await db.$transaction(async (tx) => {
            // 1. Fetch Order with BOM
            const mo = await tx.productionOrder.findUnique({
                where: { id: moId },
                include: { item: { include: { bomsAsParent: true } } }
            });

            if (!mo) throw new Error("Production Order not found");
            if (mo.status !== 'PLANNED') throw new Error("Order must be in PLANNED status to start");

            // 2. Consume Components (Physical Exit from Inventory)
            for (const bom of mo.item.bomsAsParent) {
                const consumeQty = bom.quantity * mo.quantity;

                // Decrement Inventory
                await updateInventory(bom.childId, -consumeQty, "Kuehne Nagel East", "MANUFACTURING_BIN");

                // Log WIP Entry (The "WIP State" requested by audit)
                await (tx as any).wipTransaction.create({
                    data: {
                        productionOrderId: mo.id,
                        itemId: bom.childId,
                        quantity: consumeQty,
                        transactionType: "CONSUME",
                        timestamp: new Date()
                    }
                });
            }

            // 3. Update status to IN_PROGRESS
            await tx.productionOrder.update({
                where: { id: mo.id },
                data: { status: 'IN_PROGRESS' }
            });

            return { success: true, message: "Production Started. Components moved to WIP." };
        });
    } catch (e: any) {
        console.error("Start Production Error:", e);
        return { success: false, error: e.message };
    } finally {
        revalidatePath('/manufacturing');
    }
}

/**
 * COMPLETE PRODUCTION:
 * 1. Logs Finished Good Production
 * 2. Increments Finished Good Inventory
 * 3. Closes WIP Loop
 */
export async function completeProductionOrder(moId: string) {
    try {
        return await db.$transaction(async (tx) => {
            const mo = await tx.productionOrder.findUnique({
                where: { id: moId }
            });

            if (!mo) throw new Error("Production Order not found");
            if (mo.status !== 'IN_PROGRESS') throw new Error("Order must be IN_PROGRESS to complete");

            // 1. Log Finish Good WIP Transaction
            await (tx as any).wipTransaction.create({
                data: {
                    productionOrderId: mo.id,
                    itemId: mo.itemId,
                    quantity: mo.quantity,
                    transactionType: "PRODUCE",
                    timestamp: new Date()
                }
            });

            // 2. Increment Finished Good Inventory
            await updateInventory(mo.itemId, mo.quantity, "Kuehne Nagel East", "FINISHED_GOODS_BIN");

            // 3. Update Status
            await tx.productionOrder.update({
                where: { id: mo.id },
                data: { status: 'COMPLETED' }
            });

            return { success: true, message: "Production Completed. Finished Goods received into inventory." };
        });
    } catch (e: any) {
        console.error("Complete Production Error:", e);
        return { success: false, error: e.message };
    } finally {
        revalidatePath('/manufacturing');
    }
}
