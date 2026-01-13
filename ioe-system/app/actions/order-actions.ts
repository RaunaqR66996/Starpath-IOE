"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createOrder(formData: FormData) {
    return createOrderCore({
        customerName: formData.get("customerName") as string,
        sku: formData.get("itemId") as string,
        qty: parseInt(formData.get("qty") as string, 10),
        priority: formData.get("priority") as string
    });
}

export async function createOrderCore(input: { customerName: string, sku: string, qty: number, priority?: string }) {
    const { customerName, sku, qty, priority } = input;
    const requestedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
        if (!sku) return { success: false, error: "Missing required SKU" };

        const finalCustomerName = customerName || "TBD - Unknown Customer";

        // 1. Get/Create Customer
        let customer = await db.customer.findFirst({ where: { name: finalCustomerName } });
        if (!customer) {
            customer = await db.customer.create({
                data: {
                    name: finalCustomerName,
                    tier: "Standard",
                    defaultAddress: "123 New St, New York, NY 10001, USA"
                }
            });
        }

        // 2. Get/Create Item
        // @ts-ignore
        let item = await db.item.findUnique({ where: { sku } });
        if (!item) {
            // @ts-ignore
            item = await db.item.create({
                data: {
                    sku: sku,
                    name: `Auto-Item ${sku}`,
                    type: "MAKE",
                    cost: 100,
                    leadTimeDays: 1,
                    skuConfidence: "PLACEHOLDER",
                    approvalStatus: "PENDING"
                }
            });
        }

        // 3. INVENTORY CHECK (On-Hand vs In-Transit vs None)
        // @ts-ignore
        const inventory = await db.inventory.findFirst({ where: { itemId: item.id } });
        const onHand = inventory ? inventory.quantity : 0;

        let stockStatus = "NO_STOCK"; // Default
        let allocationType = "NONE";

        if (onHand >= qty) {
            stockStatus = "IN_STOCK";
            allocationType = "IMMEDIATE";
        } else {
            // Check In-Transit (Open Purchase Orders)
            // @ts-ignore
            const inbound = await db.purchaseOrderLine.findMany({
                where: { itemId: item.id, qtyReceived: { lt: db.purchaseOrderLine.fields.qtyOrdered } }
            });
            const inboundQty = inbound.reduce((acc: any, line: any) => acc + (line.qtyOrdered - line.qtyReceived), 0);

            if (inboundQty >= qty) {
                stockStatus = "IN_TRANSIT";
                allocationType = "FUTURE";
            }
        }

        // if (stockStatus === "NO_STOCK") {
        //     return { success: false, error: `Insufficient Stock! On-hand: ${onHand}. Needs: ${qty}. No inbound POs found.` };
        // }

        // 4. Create Order
        const newOrder = await db.order.create({
            data: {
                erpReference: `PO-${Date.now().toString().slice(-6)}`,
                customerId: customer.id,
                customerName: customer.name,
                originId: "Kuehne Nagel East",
                destination: customer.defaultAddress || "Unknown",
                status: "DRAFT", // Starts as Draft until Credit Check
                priority: priority || "NORMAL",
                requestedDeliveryDate: requestedDate,
                totalWeight: qty * 5,
                totalValue: qty * 100,
                lines: {
                    create: [{
                        lineNumber: 1,
                        itemId: item.id,
                        qtyOrdered: qty,
                        qtyAllocated: allocationType === "IMMEDIATE" ? qty : 0,
                        qtyPicked: 0,
                        qtyShipped: 0,
                        unitPrice: 100
                    }]
                },
                tags: stockStatus // Tag order with stock source (fixed type error from string[] to string)
            }
        });

        revalidatePath('/');
        return { success: true, orderId: newOrder.id, status: stockStatus, erpReference: newOrder.erpReference };

    } catch (error: any) {
        console.error("Create Order Error:", error);
        return { success: false, error: error.message };
    }
}

// --- Lifecycle Actions ---

export async function checkCredit(orderId: string) {
    // Simulate Credit Check logic
    await new Promise(r => setTimeout(r, 800));
    // 90% chance of success for demo
    const success = Math.random() > 0.1;

    if (success) {
        await db.order.update({ where: { id: orderId }, data: { status: "CONFIRMED" } });
        revalidatePath('/');
        return { success: true, message: "Credit Approved. Order Confirmed." };
    } else {
        await db.order.update({ where: { id: orderId }, data: { status: "ON_HOLD" } });
        revalidatePath('/');
        return { success: false, message: "Credit Check Failed. Order Placed On Hold." };
    }
}

export async function executePick(orderId: string) {
    await new Promise(r => setTimeout(r, 1000));
    await db.order.update({ where: { id: orderId }, data: { status: "PICKED" } });
    revalidatePath('/');
    return { success: true, message: "Order Picked Successfully." };
}

export async function executePack(orderId: string) {
    await new Promise(r => setTimeout(r, 1000));
    await db.order.update({ where: { id: orderId }, data: { status: "PACKED" } });
    revalidatePath('/');
    return { success: true, message: "Order Packed & Labelled." };
}

import { updateInventory } from "./inventory-actions";

export async function executeShip(orderId: string) {
    await new Promise(r => setTimeout(r, 1200));

    // 1. Fetch Order with Lines
    const order = await db.order.findUnique({
        where: { id: orderId },
        include: { lines: true }
    });

    if (order) {
        // 2. Create Shipment Record
        const shipment = await db.shipment.create({
            data: {
                carrierId: "UPS",
                serviceLevel: "GROUND",
                origin: "Laredo, TX",
                destination: typeof order.destination === 'string' ? order.destination : "Unknown",
                status: "IN_TRANSIT",
                totalWeight: order.totalWeight,
                cost: 150
            }
        });

        // 3. Decrement Inventory for each Line Item
        for (const line of order.lines) {
            await updateInventory(
                line.itemId,
                -line.qtyOrdered, // Negative to remove
                order.originId || "Kuehne Nagel East", // Source Warehouse
                "DEFAULT"
            );
        }

        // 4. Update Order Status
        await db.order.update({
            where: { id: orderId },
            data: { status: "SHIPPED", shipmentId: shipment.id }
        });
    }

    revalidatePath('/');
    return { success: true, message: "Order Shipped! Inventory Decremented & Tracking # Generated." };
}
