"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPurchaseOrderCore(input: { supplierName: string, sku: string, qty: number }) {
    const { supplierName, sku, qty } = input;

    try {
        if (!supplierName || !sku) {
            return { success: false, error: "Missing required fields" };
        }

        // 1. Find or Create Supplier
        // @ts-ignore
        let supplier = await db.supplier.findFirst({ where: { name: supplierName } });
        if (!supplier) {
            // @ts-ignore
            supplier = await db.supplier.create({
                data: {
                    name: supplierName,
                    email: `contact@${supplierName.replace(' ', '').toLowerCase()}.com`
                }
            });
        }

        // 2. Find or Create Item
        // @ts-ignore
        let item = await db.item.findUnique({ where: { sku: sku } });
        if (!item) {
            // @ts-ignore
            item = await db.item.create({
                data: {
                    sku: sku,
                    name: `Auto-Item ${sku}`,
                    type: "BUY", // Default to BUY for procurement
                    cost: 50,
                    leadTimeDays: 5
                }
            });
        }

        // 3. Create PO
        // @ts-ignore
        const newPO = await db.purchaseOrder.create({
            data: {
                poNumber: `PO-${Date.now().toString().slice(-6)}`,
                supplierId: supplier.id,
                status: "ISSUED",
                lines: {
                    create: [
                        {
                            itemId: item.id,
                            qtyOrdered: qty,
                            qtyReceived: 0,
                            unitCost: item.cost
                        }
                    ]
                }
            }
        });

        try {
            revalidatePath('/procurement');
        } catch (e) {
            // Ignore revalidate error in script context
        }
        return { success: true, poNumber: newPO.poNumber, poId: newPO.id };

    } catch (error: any) {
        console.error("Create PO Core Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createPurchaseOrder(formData: FormData) {
    const supplierName = formData.get("supplierName") as string;
    const skuInput = formData.get("sku") as string;
    const qty = parseInt(formData.get("qty") as string, 10);

    return createPurchaseOrderCore({ supplierName, sku: skuInput, qty });
}

export async function getPurchaseOrders() {
    try {
        const orders = await db.purchaseOrder.findMany({
            include: { supplier: true, lines: true },
            orderBy: { createdAt: 'desc' }
        });

        // @ts-ignore
        return orders.map((po: any) => ({
            id: po.id,
            poNumber: po.poNumber,
            supplierName: po.supplier.name,
            status: po.status,
            totalQty: po.lines.reduce((acc: number, l: any) => acc + l.qtyOrdered, 0),
            totalCost: po.lines.reduce((acc: number, l: any) => acc + (l.qtyOrdered * l.unitCost), 0),
            createdAt: po.createdAt.toISOString()
        }));
    } catch (error) {
        console.error("Fetch POs Error:", error);
        return [];
    }
}

export async function getPurchaseOrder(id: string) {
    try {
        const po = await db.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                lines: { include: { item: true } }
            }
        });
        return po;
    } catch (error) {
        return null;
    }
}
