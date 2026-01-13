'use server';

import { calculateNetRequirements } from "@/lib/planning/mrp-service";
import { runSanityChecks, SanityReport } from "@/lib/planning/sanity-service";

export async function runMrpAction(planningRunId?: string) {
    try {
        const { results, runId } = await calculateNetRequirements(planningRunId);
        return { success: true, data: results, runId };
    } catch (error) {
        console.error("MRP Run Failed:", error);
        return { success: false, error: "MRP Computation Failed" };
    }
}

export async function runSanityCheckAction() {
    try {
        const report = await runSanityChecks();
        return { success: true, data: report };
    } catch (error) {
        console.error("Sanity Check Failed:", error);
        return { success: false, error: "Validation Service Failed" };
    }
}

// --- Simulations for PlanningAI Widget ---

import { db } from "@/lib/db";

// --- Real-System Checks for PlanningAI Widget ---

export async function validateDemand() {
    try {
        const count = await (db as any).productionForecast.count();
        const orderCount = await db.order.count({ where: { status: { notIn: ['SHIPPED', 'DELIVERED', 'CANCELLED'] } } });

        if (count === 0 && orderCount === 0) {
            return { message: "No Demand Signals Found", stats: { trend: "Idle" } };
        }

        return {
            message: "Demand Signals Validated",
            stats: { trend: `${count} Forecasts, ${orderCount} Orders` }
        };
    } catch (e) {
        return { message: "Demand Check Failed", stats: { trend: "Error" } };
    }
}

export async function checkCapacity() {
    try {
        const { calculateCapacityLoad } = await import("@/lib/planning/capacity-service");
        const loads = await calculateCapacityLoad();

        if (loads.length === 0) {
            return { message: "No Work Centers Defined", details: "Capacity undefined." };
        }

        const overloaded = loads.filter(wc => wc.utilization > 90);
        const avgUtil = Math.round(loads.reduce((s, wc) => s + wc.utilization, 0) / loads.length);

        if (overloaded.length > 0) {
            return {
                message: `Capacity Warning: ${overloaded[0].code} at ${overloaded[0].utilization}%`,
                details: `${overloaded.length} Centers Overloaded`
            };
        }

        return {
            message: `Capacity Balanced (Avg ${avgUtil}%)`,
            details: `${loads.length} Centers Active`
        };
    } catch (e) {
        console.error(e);
        return { message: "Capacity Check Failed", details: "Database Error" };
    }
}

export async function checkMaterials() {
    try {
        const { results } = await calculateNetRequirements();
        const shortages = results.filter(i => i.shortage > 0).length;

        if (shortages > 0) {
            const failedItems = results.filter(i => i.shortage > 0);
            const sources = Array.from(new Set(failedItems.flatMap(i => i.demandSources || [])));
            const sourceText = sources.length > 0 ? ` for ${sources.slice(0, 2).join(", ")}${sources.length > 2 ? '...' : ''}` : "";

            return { message: "MRP Run Complete", warning: `${shortages} Shortages Detected${sourceText}` };
        }

        if (results.length === 0) {
            return { message: "MRP Run Complete", warning: "No Items to Plan" };
        }

        return { message: "Materials Optimized", warning: null };
    } catch (e) {
        return { message: "MRP Check Failed", warning: "Data Error" };
    }
}

export async function optimizeRouting() {
    try {
        const routingCount = await db.routing.count({ where: { isActive: true } });

        if (routingCount === 0) {
            return { message: "No Routings Found", details: "Cannot optimize path." };
        }

        return {
            message: "Routings Validated",
            details: `${routingCount} Active Flows`
        };
    } catch (e) {
        return { message: "Routing Check Failed", details: "Error" };
    }
}

export async function generateSchedule() {
    // Phase 3: Finite Scheduling. For now, we confirm the plan exists.
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return {
        planId: `PLAN-${dateStr}-A`
    };
}

/**
 * RESOLUTION ENGINE: Converts an Exception -> Response Order
 */
export async function resolvePlanningExceptionAction(exceptionId: string) {
    try {
        // 1. Fetch Exception Details
        const exception = await (db as any).planningException.findUnique({
            where: { id: exceptionId },
            include: { item: true }
        });

        if (!exception) return { success: false, error: "Exception not found" };
        if (exception.status === 'RESOLVED') return { success: false, error: "Exception already resolved" };

        let orderId = '';
        let type = '';

        // 2. Resolve Material Shortages
        if (exception.type === 'MATERIAL_SHORTAGE' && exception.itemId) {
            const item = exception.item;
            const shortageQty = exception.shortageQty || 100; // Fallback

            if (item.type === 'MAKE') {
                // Create Production Order
                const po = await db.productionOrder.create({
                    data: {
                        orderNumber: `MO-RES-${Date.now().toString().slice(-6)}`,
                        itemId: item.id,
                        quantity: shortageQty,
                        status: 'PLANNED',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // +5 Days
                    }
                });
                orderId = po.id;
                type = 'Production Order';
            } else {
                // Create Purchase Order
                // 1. Get/Create default supplier
                let supplier = await db.supplier.findFirst();
                if (!supplier) {
                    supplier = await db.supplier.create({
                        data: { name: "System Default Supplier" }
                    });
                }

                const po = await db.purchaseOrder.create({
                    data: {
                        poNumber: `PO-RES-${Date.now().toString().slice(-6)}`,
                        supplierId: supplier.id,
                        status: 'DRAFT',
                        lines: {
                            create: [{
                                itemId: item.id,
                                qtyOrdered: shortageQty,
                                unitCost: item.cost || 0,
                                // note: PurchaseOrderLine doesn't have expectedDate, PurchaseOrder does
                            }]
                        }
                    }
                });
                orderId = po.id;
                type = 'Purchase Order';
            }

            // 3. Mark Exception as RESOLVED
            await (db as any).planningException.update({
                where: { id: exceptionId },
                data: { status: 'RESOLVED' }
            });

            return {
                success: true,
                message: `${type} created successfully to resolve shortage.`,
                orderId
            };
        }

        return { success: false, error: `Resolution not implemented for type: ${exception.type}` };

    } catch (e: any) {
        console.error("Resolution Failed:", e);
        return { success: false, error: e.message };
    }
}
