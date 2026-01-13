"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Unified Orchestrator
 * "The Golden Thread" logic that moves Orders across ERP -> TMS -> WMS domains.
 */

// --- 1. ERP -> WMS: Release Order for Picking ---
export async function releaseOrderToWarehouse(orderId: string) {
    console.log(`[Orchestrator] Releasing Order ${orderId} to WMS...`);

    try {
        if (!db) {
            // Mock behavior
            console.log("DB not connected, simulating release");
            return { success: true, message: "Order Released (Mock)" };
        }

        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { lines: true }
        });

        if (!order) return { success: false, message: "Order not found" };

        // 1. Create Picking Tasks for each line
        const tasks = order.lines.map(line => ({
            type: "PICK",
            status: "PENDING",
            priority: order.priority,
            orderId: order.id,
            itemId: line.itemId,
            qty: line.qtyOrdered,
            locationId: "ZONE-A", // Ideally would be looked up from Inventory
            toLocationId: "PACKING-01",
            assignedUser: "AUTO-ASSIGN"
        }));

        // @ts-ignore
        await db.warehouseTask.createMany({ data: tasks });

        // 2. Update Order Status
        await db.order.update({
            where: { id: orderId },
            data: { status: "RELEASED" }
        });

        revalidatePath('/orders');
        return { success: true, message: `Generated ${tasks.length} Picking Tasks` };

    } catch (error) {
        console.error("Release Failed:", error);
        return { success: false, message: "Failed to release order" };
    }
}


// --- 2. ERP -> TMS: Plan Shipment ---
export async function planShipment(orderIds: string[]) {
    console.log(`[Orchestrator] Planning Shipment for ${orderIds.length} orders...`);

    try {
        if (!db) return { success: true, message: "Shipment Planned (Mock)" };

        // 1. Create Shipment
        const shipment = await db.shipment.create({
            data: {
                carrierId: "UPS", // Default for now
                serviceLevel: "LTL",
                origin: { city: "Los Angeles", state: "CA" }, // Default Origin
                destination: { city: "Multi-Stop", state: "Mixed" }, // Placeholder
                status: "PLANNING",
                totalWeight: 0, // Should calc from orders
                cost: 0
            }
        });

        // 2. Link Orders to Shipment & Update Status
        await db.order.updateMany({
            where: { id: { in: orderIds } },
            data: {
                shipmentId: shipment.id,
                status: "PLANNED"
            }
        });

        revalidatePath('/shipments');
        revalidatePath('/orders');
        return { success: true, message: `Shipment ${shipment.id} Created` };

    } catch (error) {
        console.error("Planning Failed:", error);
        return { success: false, message: "Failed to plan shipment" };
    }
}


// --- 3. TMS -> ERP: Dispatch & Invoice ---
export async function dispatchShipment(shipmentId: string) {
    console.log(`[Orchestrator] Dispatching Shipment ${shipmentId}...`);

    try {
        if (!db) return { success: true, message: "Shipment Dispatched (Mock)" };

        // 1. Update Shipment Status
        await db.shipment.update({
            where: { id: shipmentId },
            data: { status: "IN_TRANSIT" } // or DISPATCHED
        });

        // 2. Find Linked Orders
        const orders = await db.order.findMany({
            where: { shipmentId }
        });

        // 3. Invoice Orders (ERP Action)
        for (const order of orders) {
            const amount = order.totalValue; // Simplify

            // Create Invoice
            await db.invoice.create({
                data: {
                    invoiceNumber: `INV-${Date.now()}-${order.id.slice(0, 4)}`,
                    orderId: order.id,
                    amount: amount,
                    status: "UNPAID",
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Net 30
                }
            });

            // Update Order Status
            await db.order.update({
                where: { id: order.id },
                data: { status: "IN_TRANSIT" }
            });
        }

        revalidatePath('/shipments');
        revalidatePath('/finance');
        return { success: true, message: "Shipment Dispatched & Invoices Generated" };

    } catch (error) {
        console.error("Dispatch Failed:", error);
        return { success: false, message: "Failed to dispatch" };
    }
}
