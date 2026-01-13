"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createShipmentFromOrders(orderIds: string[]) {
    if (!orderIds || orderIds.length === 0) {
        return { success: false, error: "No orders selected" };
    }

    try {
        // 1. Fetch orders to calculate totals
        const orders = await db.order.findMany({
            where: { id: { in: orderIds } }
        });

        if (orders.length === 0) {
            return { success: false, error: "Orders not found" };
        }

        const totalWeight = orders.reduce((sum: number, o: any) => sum + o.totalWeight, 0);
        // Mock cost logic: base $500 + $0.50 per kg
        const cost = 500 + (totalWeight * 0.5);

        // 2. Create Shipment
        const shipment = await db.shipment.create({
            data: {
                carrierId: "Pending Assignment", // To be updated later
                serviceLevel: "LTL",
                origin: orders[0].destination, // Ideally from warehouse, but simplified
                destination: orders[0].destination, // Simplification: assuming same dest or multi-stop
                status: "PLANNING",
                totalWeight,
                cost,
                // We don't link orders here directly in 'create' via 'connect' easily for many-to-one if strict, 
                // but we can update orders next.
            }
        });

        // 3. Update Orders to link to Shipment and update status
        await db.order.updateMany({
            where: { id: { in: orderIds } },
            data: {
                shipmentId: shipment.id,
                status: "PLANNED"
            }
        });

        revalidatePath('/');
        return { success: true, shipmentId: shipment.id };

    } catch (error) {
        console.error("Create Shipment Error:", error);
        return { success: false, error: "Failed to create shipment" };
    }
}
