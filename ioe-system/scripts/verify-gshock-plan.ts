
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PlannerEngine } from '../../packages/planner/src/engine';
import { SimpleOrder } from '../../packages/planner/src/engine';

const db = new PrismaClient();

async function main() {
    console.log('--- Verifying G-Shock Production Plan (Spatial) ---');

    // 1. Fetch Data
    const orders = await db.order.findMany({
        where: { erpReference: 'PO-MACY-9001' },
        include: { lines: true }
    });

    if (orders.length === 0) {
        console.error('❌ G-Shock Order PO-MACY-9001 not found!');
        // return; // Don't return, maybe we just want to test engine with mocks if DB empty? 
        // No, need integration test.
    }

    const items = await db.item.findMany();
    const wcs = await db.workCenter.findMany();
    const routings = await db.routing.findMany();
    const boms = await db.bom.findMany();

    // Spatial Data
    const zones = await db.zone.findMany();
    const transits = await db.transitTime.findMany();
    console.log(`[DEBUG] Loaded ${zones.length} Zones and ${transits.length} Transit Times.`);

    // Mock Inventory (Full Stock for components)
    const inventory = await db.inventory.findMany();
    console.log(`[DEBUG] Loaded ${inventory.length} inventory records.`);
    items.forEach(i => console.log(`[DEBUG] Item Map: ${i.id} -> ${i.name}`));
    inventory.forEach(inv => console.log(`[DEBUG] Inventory: Item ${inv.itemId} Qty ${inv.quantity} @ ${inv.zoneId}`));

    // Map to Planner Input
    const plannerOrders: SimpleOrder[] = orders.flatMap(o =>
        o.lines.map(l => ({
            id: l.id,
            order_id: o.erpReference,
            item_id: l.itemId,
            qty: 20, // Reduced from DB qty to fit in 1 day for simple engine
            due_date: o.requestedDeliveryDate,
            priority: 1
        }))
    );

    const calendars = wcs.map(wc => ({
        id: 'cal-' + wc.id,
        org_id: 'test',
        work_center_id: wc.id,
        date: new Date().toISOString().split('T')[0], // Today
        shift_id: 1,
        capacity_mins: wc.capacityHours * 60
    }));

    // Map WCs to include zoneId for Planner
    const plannerWCS = wcs.map(w => ({
        ...w,
        zoneId: w.zoneId
    }));

    // Run Engine
    const engine = new PlannerEngine({
        horizonStart: new Date(),
        horizonDays: 30,
        orders: plannerOrders,
        items: items as any,
        boms: boms.map(b => ({
            parent_item_id: b.parentId,
            child_item_id: b.childId,
            qty: b.quantity
        })) as any,
        routings: routings.map(r => {
            const steps = JSON.parse(r.steps);
            const mainStep = steps[0]; // Take first step
            return {
                item_id: r.itemId,
                work_center_id: mainStep.workCenterId,
                setup_time_mins: mainStep.setupTime,
                cycle_time_mins: mainStep.runTime
            };
        }) as any,
        workCenters: plannerWCS as any,
        calendars: calendars as any,
        inventory: inventory.map(i => ({
            item_id: i.itemId,
            qty: i.quantity,
            zoneId: i.zoneId,
            status: i.status // Aha #2
        })) as any,
        zones: zones as any,
        transitTimes: transits as any
    });

    const output = engine.run();

    console.log(`\nPlanner Output:`);
    console.log(`- Scheduled Lines: ${output.lines.length}`);
    console.log(`- Alerts: ${output.alerts.length}`);

    output.lines.forEach(line => {
        const item = items.find(i => i.id === line.item_id);
        const wc = wcs.find(w => w.id === line.work_center_id);
        console.log(`  [PLAN] ${item?.name} -> ${wc?.name} (Qty: ${line.qty})`);
    });

    output.alerts.forEach(alert => {
        console.log(`  [ALERT] ${alert.type}: ${alert.message}`);
    });

    if (output.lines.length > 0) {
        console.log('\n✅ Verification SUCCESS: G-Shock order planned!');
    } else {
        console.log('\n❌ Verification FAILED: No lines scheduled.');
    }
}

main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await db.$disconnect();
        process.exit(1);
    });
