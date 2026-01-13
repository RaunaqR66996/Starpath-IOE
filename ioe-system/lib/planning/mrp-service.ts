import { db } from "@/lib/db";

export type MrpResult = {
    itemId: string;
    sku: string;
    name: string;
    stock: number;
    incoming: number;
    demand: number;
    shortage: number;
    cost: number;
    suggestion: string;
    level?: number;
    dependentDemand?: number;
    lifecycleStatus: string;
    demandSources?: string[];
};

export interface ItemPlan {
    item: any;
    grossDemand: number;
    salesDemand: number;
    dependentDemand: number;
    projectedStock: number;
    netRequirement: number;
    plannedOrder: number;
    shortage: number;
    demandSources: Set<string>;
}

// Type definition for Item with all includes
type ItemWithRelations = {
    id: string;
    sku: string;
    name: string;
    type: string;
    cost: number;
    uom: string;
    minOrderQty: number;
    safetyStock: number;
    inventory: any[];
    bomsAsParent: any[];
    bomsAsChild: any[];
    purchaseLines: any[];
    productionOrders: any[];
    orderLines: any[];
    forecasts: any[];
    lifecycleStatus: string;
};

export async function calculateNetRequirements(existingRunId?: string): Promise<{ results: MrpResult[], runId: string }> {

    // STEP 0: Initialize Planning Run
    let updatedRunId = existingRunId;
    if (!updatedRunId) {
        // cast to any to bypass temporary linter state if client isn't fully refreshed in IDE
        const newRun = await (db as any).planningRun.create({
            data: {
                status: 'RUNNING',
                horizonStart: new Date(),
                horizonEnd: new Date(new Date().setDate(new Date().getDate() + 90)) // 90 Days
            }
        });
        updatedRunId = newRun.id;
    }

    // STEP 1: Consolidate Demand (Master Data Fetch)
    const itemsRaw = await db.item.findMany({
        where: {
            lifecycleStatus: { not: 'OBSOLETE' },
            skuConfidence: 'APPROVED',
            approvalStatus: 'APPROVED'
        } as any,
        include: {
            inventory: true,
            bomsAsParent: { include: { childItem: true } },
            bomsAsChild: true,
            purchaseLines: {
                where: { purchaseOrder: { status: { in: ["DRAFT", "ISSUED", "PARTIAL"] } } }
            },
            productionOrders: {
                where: { status: { in: ["PLANNED", "RELEASED", "IN_PROGRESS"] } }
            },
            orderLines: {
                where: { order: { status: { notIn: ["SHIPPED", "DELIVERED", "CANCELLED"] } } },
                include: { order: true }
            },
            forecasts: true // Step 1: Include Forecasts
        } as any,
    });

    // Cast to our defined type to satisfy TS
    const items = itemsRaw as unknown as ItemWithRelations[];

    const itemMap = new Map<string, any>();
    const planMap = new Map<string, ItemPlan>();

    items.forEach(i => {
        itemMap.set(i.id, i);
        planMap.set(i.id, {
            item: i,
            grossDemand: 0,
            salesDemand: 0,
            dependentDemand: 0,
            projectedStock: i.inventory.reduce((sum, inv: any) => sum + inv.quantity, 0),
            netRequirement: 0,
            plannedOrder: 0,
            shortage: 0,
            demandSources: new Set<string>()
        });
    });

    // STEP 2: Demand Netting (Orders vs Forecast)
    // "Greater of Forecast or Orders" logic per bucket would go here.
    // For MVP, we sum them but keep track separately.
    items.forEach(item => {
        // Sales Orders
        const salesQty = item.orderLines.reduce((sum, line: any) => {
            const plan = planMap.get(item.id)!;
            if (line.order?.customerName) plan.demandSources.add(line.order.customerName);
            return sum + (line.qtyOrdered - line.qtyAllocated);
        }, 0);

        // Forecasts (Simple Sum for now)
        const forecastQty = item.forecasts.reduce((sum, fc: any) => sum + fc.quantity, 0);

        const plan = planMap.get(item.id)!;
        plan.salesDemand += salesQty + forecastQty;
        plan.grossDemand += salesQty + forecastQty;
    });

    // STEP 3: Recursive BOM Explosion & Netting
    let changed = true;
    let passes = 0;
    while (changed && passes < 10) {
        changed = false;
        passes++;

        // Reset dependent demands to recalculate fresh for this pass
        for (const item of items) {
            planMap.get(item.id)!.dependentDemand = 0;
        }

        // Propagate Requirements Down (Top-Down Flow would be better, but iterative works)
        // 1. Calculate Demand from Parents (Dependent)
        for (const item of items) {
            const plan = planMap.get(item.id)!;

            // If OTHER items have planned orders, and they use THIS item, add to dependent demand
            // This requires looking at WHO uses ME (bomsAsChild).
            if (item.bomsAsChild.length > 0) {
                for (const bom of item.bomsAsChild) {
                    const parentPlan = planMap.get(bom.parentId);
                    if (parentPlan && parentPlan.plannedOrder > 0) {
                        plan.dependentDemand += (parentPlan.plannedOrder * bom.quantity);
                    }
                }
            }
        }

        // 2. Calculate Net Requirements & Planned Orders
        for (const item of items) {
            const plan = planMap.get(item.id)!;
            const totalDemand = plan.salesDemand + plan.dependentDemand + (plan.item.safetyStock || 0);

            const incomingPO = plan.item.purchaseLines.reduce((s: number, l: any) => s + (l.qtyOrdered - l.qtyReceived), 0);
            const incomingWO = plan.item.productionOrders.reduce((s: number, o: any) => s + o.quantity, 0);
            const totalSupply = plan.projectedStock + incomingPO + incomingWO;

            const net = totalDemand - totalSupply;

            if (net > 0) {
                // We have a shortage
                const newPlannedOrder = Math.max(net, plan.item.minOrderQty || 1);

                if (newPlannedOrder !== plan.plannedOrder) {
                    plan.plannedOrder = newPlannedOrder;
                    plan.shortage = net;
                    changed = true; // Signal another pass needed to update children
                }
            } else {
                if (plan.plannedOrder > 0) {
                    plan.plannedOrder = 0;
                    plan.shortage = 0;
                    changed = true;
                }
            }
        }
    }

    // STEP 5: Persist Results (The "Stateful" part)
    // We wipe old shortages for this plan if re-running, or just create new ones
    if (updatedRunId) {
        // Clear previous results for this run (idempotency)
        await (db as any).materialShortage.deleteMany({ where: { planId: updatedRunId } });
        await (db as any).masterSchedule.deleteMany({ where: { planId: updatedRunId } });

        const shortagesToCreate: any[] = [];
        const masterScheduleToCreate: any[] = [];

        items.forEach(item => {
            const plan = planMap.get(item.id)!;

            // Save Master Schedule (What we plan to make/buy)
            if (plan.plannedOrder > 0) {
                masterScheduleToCreate.push({
                    planId: updatedRunId,
                    itemId: item.id,
                    date: new Date(), // Bucket: Today (MVP)
                    quantity: plan.plannedOrder,
                    status: 'DRAFT'
                });
            }

            // Save Shortages
            if (plan.shortage > 0) {
                shortagesToCreate.push({
                    planId: updatedRunId,
                    itemId: item.id,
                    requiredDate: new Date(), // Critical: Needs real date logic later
                    requiredQty: Math.ceil(plan.grossDemand + plan.dependentDemand),
                    availableQty: Math.ceil(plan.projectedStock),
                    shortageQty: plan.shortage,
                    status: 'OPEN',
                    actionProposed: item.type === 'MAKE' ? 'Production Order' : 'Purchase Order'
                });
            }
        });

        if (shortagesToCreate.length > 0) {
            await (db as any).materialShortage.createMany({ data: shortagesToCreate });
        }
        if (masterScheduleToCreate.length > 0) {
            await (db as any).masterSchedule.createMany({ data: masterScheduleToCreate });
        }

        // STEP 6: Run Capacity Check (Integrated)
        // We run this *after* the material plan to see the impact of these planned orders
        // For MVP, we calculate based on *current* state + planned
        const { calculateCapacityLoad } = await import("./capacity-service");
        const capacityLoads = await calculateCapacityLoad();

        // STEP 7-9: Exception Management (The Nervous System)
        const { generatePlanningExceptions } = await import("./exception-engine");
        if (updatedRunId) {
            // Pass the FULL detailed plan (ItemPlan[]) to the engine, not the simplified UI result
            await generatePlanningExceptions(updatedRunId, Array.from(planMap.values()), capacityLoads);

            // Mark Run as COMPLETED
            await (db as any).planningRun.update({
                where: { id: updatedRunId },
                data: { status: 'COMPLETED' }
            });
        }

        // Transform to UI-Friendly MrpResult
        const results: MrpResult[] = Array.from(planMap.values()).map(p => ({
            itemId: p.item.id,
            sku: p.item.sku,
            name: p.item.name,
            stock: p.projectedStock,
            incoming: p.item.purchaseLines.reduce((s: number, l: any) => s + (l.qtyOrdered - l.qtyReceived), 0) +
                p.item.productionOrders.reduce((s: number, o: any) => s + o.quantity, 0),
            demand: p.salesDemand + p.dependentDemand,
            shortage: p.shortage,
            cost: p.item.cost || 0,
            dependentDemand: p.dependentDemand,
            lifecycleStatus: p.item.lifecycleStatus,
            suggestion: p.plannedOrder > 0
                ? (p.item.type === 'MAKE' ? `Production Order: ${p.plannedOrder}` : `Purchase Order: ${p.plannedOrder}`)
                : "Balanced",
            demandSources: Array.from(p.demandSources).slice(0, 3) // Top 3 customers
        }));

        results.sort((a, b) => b.shortage - a.shortage);

        return { results, runId: updatedRunId || 'SIMULATION' };
    }

    // Default Fallback (should not be reached if updatedRunId exists)
    return { results: [], runId: 'ERROR' };
}
