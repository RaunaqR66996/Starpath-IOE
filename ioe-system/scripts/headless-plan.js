const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mocking the Planner Logic inline since we can't easily import TS lib modules into raw Node JS scripts 
// without ts-node or build steps. We will replicate the EXACT logic for verification.

async function headlessPlan() {
    console.log("🧠 STARPATH CORE: INITIALIZING HEADLESS PLANNING RUN...");

    // 1. Demand Signal Trace
    const rawDemand = await prisma.order.findMany({
        where: { status: { notIn: ['SHIPPED', 'CANCELLED'] } },
        include: { lines: { include: { item: true } } }
    });

    const targetItemDemand = rawDemand
        .flatMap(o => o.lines)
        .filter(l => l.item.sku === 'RE-TEST-1')
        .reduce((sum, l) => sum + l.qtyOrdered, 0);

    console.log(`\n🔍 [PHASE 1] DEMAND SENSING`);
    console.log(`   > Scanned ${rawDemand.length} active orders.`);
    console.log(`   > TARGET SKU 'RE-TEST-1': Identified Demand = ${targetItemDemand}`);

    if (targetItemDemand === 0) {
        console.error("   ❌ ERROR: No demand signal found for verified Item.");
        return;
    }

    // 2. Supply Signal Trace (MRP)
    const item = await prisma.item.findUnique({
        where: { sku: 'RE-TEST-1' },
        include: {
            inventory: true,
            purchaseLines: { include: { purchaseOrder: true } }
        }
    });

    const onHand = item.inventory.reduce((s, i) => s + i.quantity, 0);
    const inbound = item.purchaseLines
        .filter(l => l.purchaseOrder.status !== 'CANCELLED' && l.purchaseOrder.status !== 'CLOSED')
        .reduce((s, l) => s + (l.qtyOrdered - l.qtyReceived), 0);

    console.log(`\n📦 [PHASE 2] SUPPLY NETTING`);
    console.log(`   > On-Hand Inventory: ${onHand}`);
    console.log(`   > Inbound Supply (PO): ${inbound}`);
    console.log(`   > Total Supply Position: ${onHand + inbound}`);

    // 3. The Logic (Balance)
    const netPosition = (onHand + inbound) - targetItemDemand;

    console.log(`\n⚖️ [PHASE 3] LOGIC CORE`);
    console.log(`   > Calculation: (${onHand} + ${inbound}) - ${targetItemDemand} = ${netPosition}`);

    if (netPosition >= 0) {
        console.log(`   ✅ RESULT: FULLY COVERED (+${netPosition} surplus)`);
        console.log(`   > ACTION: Release Order for Fulfillment.`);
    } else {
        console.log(`   ⚠️ RESULT: SHORTAGE (${netPosition})`);
        console.log(`   > ACTION: TRIGGER PROCUREMENT.`);
    }

    // 4. Life-Cycle Verification
    console.log(`\n🛡️ [PHASE 4] INTEGRITY CHECK`);
    if (item.lifecycleStatus === 'ACTIVE' && item.skuConfidence === 'HIGH' && item.approvalStatus === 'APPROVED') {
        console.log("   > Item Health: 100% (High Confidence + Active)");
    } else {
        console.log("   > Item Health: COMPROMISED (Check Master Data)");
        console.log(`     Status: ${item.lifecycleStatus}, Conf: ${item.skuConfidence}`);
    }
}

headlessPlan()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
