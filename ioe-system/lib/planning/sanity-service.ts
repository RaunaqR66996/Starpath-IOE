import { db } from "@/lib/db";

export type SanitySeverity = 'PASS' | 'WARN' | 'FAIL';
export type EntityType = 'ITEM' | 'BOM' | 'ORDER' | 'INVENTORY' | 'WORK_CENTER' | 'ROUTING';

export interface SanityIssue {
    id: string; // Unique ID for keying
    entityType: EntityType;
    entityId: string;
    entityName?: string;
    message: string;
    severity: 'WARN' | 'FAIL';
    fix?: string;
}

export interface SanityReport {
    status: SanitySeverity;
    passCount: number;
    warnCount: number;
    failCount: number;
    issues: SanityIssue[];
}

export async function runSanityChecks(): Promise<SanityReport> {
    const issues: SanityIssue[] = [];

    // --- 1. Master Data Sanity (Items / BOM / Routings) ---

    // Check Items (Lead Time, Costs)
    const items = await db.item.findMany();
    for (const item of items) {
        if (item.leadTimeDays < 0) {
            issues.push({
                id: `item-lt-${item.id}`,
                entityType: 'ITEM',
                entityId: item.id,
                entityName: item.name,
                message: `Lead time is negative (${item.leadTimeDays} days)`,
                severity: 'FAIL',
                fix: "Set lead time to >= 0"
            });
        }
        if (item.cost < 0) {
            issues.push({
                id: `item-cost-${item.id}`,
                entityType: 'ITEM',
                entityId: item.id,
                entityName: item.name,
                message: `Cost is negative ($${item.cost})`,
                severity: 'WARN',
                fix: "Verify item cost"
            });
        }
    }

    // Check BOMs (Quantities, Cycles - simple self-ref check for MVP)
    const boms = await db.bom.findMany({ include: { parentItem: true, childItem: true } });
    for (const bom of boms) {
        if (bom.quantity <= 0) {
            issues.push({
                id: `bom-qty-${bom.id}`,
                entityType: 'BOM',
                entityId: bom.id,
                entityName: `${bom.parentItem.sku} -> ${bom.childItem.sku}`,
                message: `BOM quantity is zero or negative (${bom.quantity})`,
                severity: 'FAIL',
                fix: "Set valid component quantity"
            });
        }
        if (bom.parentId === bom.childId) {
            issues.push({
                id: `bom-cycle-${bom.id}`,
                entityType: 'BOM',
                entityId: bom.id,
                entityName: `${bom.parentItem.sku}`,
                message: `Direct Recursive BOM detected (Item consumes itself)`,
                severity: 'FAIL',
                fix: "Remove self-reference"
            });
        }
    }

    // --- 2. Demand Sanity (Orders) ---
    const orders = await db.order.findMany({
        where: { status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] } },
        include: { lines: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const order of orders) {
        // Double check this logic. Often "backlog" is allowed, but should be flagged.
        if (new Date(order.requestedDeliveryDate) < today) {
            issues.push({
                id: `ord-date-${order.id}`,
                entityType: 'ORDER',
                entityId: order.id,
                entityName: order.erpReference,
                message: `Active Order is past due (${order.requestedDeliveryDate.toLocaleDateString()})`,
                severity: 'WARN',
                fix: "Reschedule or Expedite" // Not a FAIL usually, just critical ops issue
            });
        }

        for (const line of order.lines) {
            if (line.qtyOrdered <= 0) {
                issues.push({
                    id: `ord-qty-${line.id}`,
                    entityType: 'ORDER',
                    entityId: order.id,
                    entityName: order.erpReference,
                    message: `Order Line has invalid quantity (${line.qtyOrdered})`,
                    severity: 'FAIL',
                    fix: "Correct order quantity"
                });
            }
        }
    }

    // --- 3. Inventory Sanity ---
    const inventory = await db.inventory.findMany({ include: { item: true } });
    for (const inv of inventory) {
        if (inv.quantity < 0) {
            issues.push({
                id: `inv-neg-${inv.id}`,
                entityType: 'INVENTORY',
                entityId: inv.id,
                entityName: inv.item.sku,
                message: `Negative Inventory detected (${inv.quantity})`,
                severity: 'FAIL',
                fix: "Perform Cycle Count"
            });
        }
    }

    // --- 5. Manufacturing Sanity (Routings) ---
    // Check if MAKE items have Routings (simplified check)
    const makeItems = items.filter(i => i.type === 'MAKE');
    for (const item of makeItems) {
        const routing = await db.routing.findFirst({ where: { itemId: item.id, isActive: true } });
        if (!routing) {
            issues.push({
                id: `rtg-miss-${item.id}`,
                entityType: 'ROUTING',
                entityId: item.id,
                entityName: item.sku,
                message: `Item type is MAKE but no active Routing found`,
                severity: 'WARN', // Could be FAIL depending on strictness
                fix: "Define Routing or change to BUY"
            });
        }
    }


    const failCount = issues.filter(i => i.severity === 'FAIL').length;
    const warnCount = issues.filter(i => i.severity === 'WARN').length;

    let status: SanitySeverity = 'PASS';
    if (failCount > 0) status = 'FAIL';
    else if (warnCount > 0) status = 'WARN';

    return {
        status,
        passCount: items.length + boms.length + orders.length, // Rough proxy for "checks passed"
        warnCount,
        failCount,
        issues
    };
}
