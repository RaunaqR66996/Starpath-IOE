// @ts-nocheck
"use server";

import { db } from "@/lib/db";

interface Requirement {
    itemId: string;
    sku: string;
    name: string;
    qtyRequired: number;
    qtyOnHand: number;
    qtyOnOrder: number;
    netShortage: number;
}

export async function getMRPRecommendations() {
    try {
        // 1. Fetch all Demands (Sales Orders)
        const openOrders = await db.order.findMany({
            where: {
                status: {
                    in: ["OPEN", "PARTIAL", "RELEASED", "PICKING"]
                }
            },
            include: {
                lines: {
                    include: {
                        item: true
                    }
                }
            }
        });

        const requirementsMap: Record<string, { qty: number; item: any }> = {};

        // 2. Explode BOMs for all demands
        for (const order of openOrders) {
            for (const line of order.lines) {
                await explodeRequirements(line.itemId, line.qtyOrdered, requirementsMap);
            }
        }

        // 3. Fetch current Supply (Inventory + Open POs)
        const allItemIds = Object.keys(requirementsMap);

        const inventory = await db.inventory.findMany({
            where: { itemId: { in: allItemIds } }
        });

        const openPoLines = await db.purchaseOrderLine.findMany({
            where: {
                itemId: { in: allItemIds },
                purchaseOrder: {
                    status: { in: ["ISSUED", "PARTIAL"] }
                }
            }
        });

        // 4. Calculate Net Shortages
        const recommendations: Requirement[] = [];

        for (const itemId of allItemIds) {
            const req = requirementsMap[itemId];
            const qtyOnHand = inventory
                .filter(i => i.itemId === itemId)
                .reduce((sum, i) => sum + i.quantity, 0);

            const qtyOnOrder = openPoLines
                .filter(l => l.itemId === itemId)
                .reduce((sum, l) => sum + (l.qtyOrdered - l.qtyReceived), 0);

            const netShortage = req.qty - (qtyOnHand + qtyOnOrder);

            if (netShortage > 0) {
                recommendations.push({
                    itemId,
                    sku: req.item.sku,
                    name: req.item.name,
                    qtyRequired: req.qty,
                    qtyOnHand,
                    qtyOnOrder,
                    netShortage
                });
            }
        }

        return recommendations;

    } catch (error) {
        console.error("MRP Calculation Error:", error);
        return [];
    }
}

async function explodeRequirements(itemId: string, qty: number, map: Record<string, { qty: number; item: any }>) {
    const item = await db.item.findUnique({
        where: { id: itemId },
        include: { bomsAsParent: { include: { childItem: true } } }
    });

    if (!item) return;

    // Add to requirements map
    if (!map[itemId]) {
        map[itemId] = { qty: 0, item };
    }
    map[itemId].qty += qty;

    // If it's a MAKE item, explode its children
    if (item.type === 'MAKE' && item.bomsAsParent.length > 0) {
        for (const bom of item.bomsAsParent) {
            const childQty = bom.quantity * qty;
            await explodeRequirements(bom.childId, childQty, map);
        }
    }
}
