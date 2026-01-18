"use server";

import { db } from "@/lib/db";

export async function getLiveInventory() {
    try {
        // @ts-ignore
        const inventory = await db.inventory.findMany({
            include: {
                item: true
            }
        });
        return inventory;
    } catch (error) {
        console.error("Failed to fetch live inventory:", error);
        return [];
    }
}


/**
 * Updates inventory quantity for an item in a specific warehouse/location.
 * Supports both increment (positive qty) and decrement (negative qty).
 */
export async function updateInventory(
    itemId: string,
    quantity: number, // Positive to add, Negative to remove
    warehouseId: string,
    locationId: string = 'DEFAULT'
) {
    try {
        console.log(`Inventory Update: ${itemId} in ${warehouseId} | Delta: ${quantity}`);

        return await db.$transaction(async (tx) => {
            // 1. Find existing record
            // @ts-ignore
            const existing = await tx.inventory.findFirst({
                where: {
                    itemId,
                    warehouseId,
                    locationId // Simplified location logic for now
                }
            });

            // 2. Decrement Logic: Check sufficiency
            if (quantity < 0 && existing) {
                if (existing.quantity + quantity < 0) {
                    throw new Error(`Insufficient stock for Item ${itemId}. Has ${existing.quantity}, trying to remove ${Math.abs(quantity)}.`);
                }
            }

            // 3. Upsert Logic
            if (existing) {
                // @ts-ignore
                const updated = await tx.inventory.update({
                    where: { id: existing.id },
                    data: { quantity: { increment: quantity } }
                });
                return { success: true, newQuantity: updated.quantity };
            } else {
                if (quantity < 0) {
                    throw new Error(`Cannot decrement inventory. Item ${itemId} not found in ${warehouseId}.`);
                }
                // @ts-ignore
                const created = await tx.inventory.create({
                    data: {
                        itemId,
                        warehouseId,
                        locationId,
                        quantity,
                        status: 'AVAILABLE'
                    }
                });
                return { success: true, newQuantity: created.quantity };
            }
        });

    } catch (error: any) {
        console.error("Inventory Update Failed:", error.message);
        return { success: false, error: error.message };
    }
}

// --- New Dock-to-Stock Logic ---

export async function suggestPutawayLocation(warehouseId: string, itemId: string | null) {
    // 1. Try to find existing bin with same item (Consolidation)
    if (itemId) {
        // @ts-ignore
        const existing = await db.inventory.findFirst({
            where: { warehouseId, itemId, locationId: { startsWith: 'BIN-' } }
        });
        if (existing) return { locationId: existing.locationId, reason: "High Efficiency: Consolidate with existing stock" };
    }

    // 2. Find empty bin (Simple simulation: BIN-XX that implies not taken)
    // @ts-ignore
    const usedLocations = await db.inventory.findMany({
        where: { warehouseId },
        select: { locationId: true }
    });
    // @ts-ignore
    const usedSet = new Set(usedLocations.map(i => i.locationId));

    // Find first free BIN-0 to BIN-99
    for (let i = 0; i < 100; i++) {
        const bin = `BIN-${i}`;
        if (!usedSet.has(bin)) return { locationId: bin, reason: "Optimization: Nearest empty bin found" };
    }

    return { locationId: 'OVERFLOW', reason: "Warning: Warehouse near capacity (Overflow)" };
}

export async function executeReceipt(poNumber: string, warehouseId: string, locationId: string) {
    try {
        // 1. Verify PO
        const po = await db.purchaseOrder.findUnique({
            where: { poNumber },
            include: { lines: true }
        });

        if (!po) return { success: false, error: "PO Not Found" };
        if (po.status === 'CLOSED') return { success: false, error: "PO already closed" };

        // 2. Process Lines
        let summary = [];
        for (const line of po.lines) {
            // Add Inventory
            await updateInventory(line.itemId, line.qtyOrdered, warehouseId, locationId);
            summary.push(`${line.qtyOrdered}x Item-${line.itemId.slice(0, 4)}`);
        }

        // 3. Close PO
        await db.purchaseOrder.update({
            where: { id: po.id },
            data: { status: 'CLOSED' }
        });

        return {
            success: true,
            message: `Received ${summary.join(', ')} into ${warehouseId} at ${locationId}`,
            locationId
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getInventoryStats() {
    try {
        const totalItems = await db.item.count();
        // @ts-ignore
        const lowStockItems = await db.inventory.count({
            where: {
                quantity: { lt: 10 }
            }
        });

        return {
            totalItems,
            lowStockItems
        };
    } catch (error) {
        console.error("Failed to get inventory stats:", error);
        return { totalItems: 0, lowStockItems: 0 };
    }
}
