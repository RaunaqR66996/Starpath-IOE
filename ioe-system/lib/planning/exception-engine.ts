import { db } from "@/lib/db";
import { ItemPlan } from "./mrp-service";
import { CapacityLoad } from "./capacity-service";

/**
 * The Nervous System of the Planning Engine.
 * Analyzes the raw math (MRP Results + Capacity LOad) and decides what constitutes a "Problem".
 */
export async function generatePlanningExceptions(
    runId: string,
    mrpResults: ItemPlan[],
    capacityLoads: CapacityLoad[]
) {
    const exceptionsToCreate: any[] = [];

    // 1. Analyze Material Shortages
    // Detects: STOCK_OUT
    for (const item of mrpResults) {
        if (item.shortage > 0) {
            // Heuristic: Is it a "Critical" shortage?
            // If shortage > 20% of demand OR absolute value is high
            const severity = (item.shortage / (item.grossDemand || 1) > 0.2) ? 'CRITICAL' : 'WARNING';

            exceptionsToCreate.push({
                planId: runId,
                type: 'MATERIAL_SHORTAGE',
                severity: severity,
                itemId: item.item.id,
                message: `Shortage of ${item.shortage} ${item.item.uom || 'units'}. Demand: ${item.grossDemand || 0}.`,
                shortageQty: item.shortage,
                recommendation: item.item.type === 'MAKE' ? 'Create Production Order' : 'Expedite Purchase Order',
                status: 'OPEN'
            });
        }

        // Detects: SAFETY_STOCK_BREACH
        // If we have stock, but it's below safety stock
        const projectedEnd = item.projectedStock - item.netRequirement; // Rough calc
        if (projectedEnd < (item.item.safetyStock || 0) && item.shortage === 0) {
            exceptionsToCreate.push({
                planId: runId,
                type: 'SAFETY_STOCK_RISK',
                severity: 'INFO',
                itemId: item.item.id,
                message: `Projected inventory drops below safety stock (${item.item.safetyStock}).`,
                recommendation: 'Monitor or replenish early.',
                status: 'OPEN'
            });
        }
    }

    // 2. Analyze Capacity Overloads
    // Detects: CAPACITY_OVERLOAD
    for (const wc of capacityLoads) {
        if (wc.utilization > 100) {
            exceptionsToCreate.push({
                planId: runId,
                type: 'CAPACITY_OVERLOAD',
                severity: 'CRITICAL',
                entityId: wc.workCenterId,
                message: `Work Center ${wc.code} at ${wc.utilization}% Load.`,
                recommendation: 'Approve Overtime or Shift Orders.',
                status: 'OPEN'
            });
        } else if (wc.utilization > 85) {
            exceptionsToCreate.push({
                planId: runId,
                type: 'CAPACITY_WARNING',
                severity: 'WARNING',
                entityId: wc.workCenterId,
                message: `Work Center ${wc.code} nearing capacity (${wc.utilization}%).`,
                recommendation: 'Review schedule.',
                status: 'OPEN'
            });
        }
    }

    // 3. Persist Exceptions (Transactional Wipe & Recreate for this run)
    if (exceptionsToCreate.length > 0) {
        // cast to any for temporary schema compliance until client refresh
        await (db as any).planningException.deleteMany({ where: { planId: runId } });
        await (db as any).planningException.createMany({ data: exceptionsToCreate });
    }

    return exceptionsToCreate;
}
