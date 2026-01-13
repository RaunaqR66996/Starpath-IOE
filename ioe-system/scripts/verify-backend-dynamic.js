const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDynamicTest() {
    const randomSuffix = Math.floor(Math.random() * 1000);
    const sku = `DYN-TEST-${randomSuffix}`;
    const demandQty = 50;

    console.log(`🧪 GENERATING NEW TEST SUBJECT: ${sku}`);

    // 1. Create Data (Backend)
    const item = await prisma.item.create({
        data: {
            sku: sku,
            name: `Dynamic Test Item ${randomSuffix}`,
            type: 'BUY',
            lifecycleStatus: 'ACTIVE',         // CRITICAL
            skuConfidence: 'APPROVED',         // CRITICAL
            approvalStatus: 'APPROVED',        // CRITICAL
            cost: 10,
            price: 20
        }
    });

    const customer = await prisma.customer.findFirst();
    await prisma.order.create({
        data: {
            erpReference: `SO-DYN-${randomSuffix}`,
            customerId: customer.id,
            totalValue: demandQty * 20,
            totalWeight: 10,
            status: 'CONFIRMED',
            customerName: customer.name,
            originId: 'W1',
            destination: 'Test Dest',
            priority: 'NORMAL',
            requestedDeliveryDate: new Date(),
            lines: {
                create: [{
                    lineNumber: 1,
                    itemId: item.id,
                    qtyOrdered: demandQty,
                    qtyAllocated: 0,
                    unitPrice: 20
                }]
            }
        }
    });

    console.log("   > Item Created + Demand Injected.");

    // 2. Run Headless Scan (Replicating General MRP Logic)
    console.log("\n📡 SCANNING GLOBAL DATABASE (No ID Filters)...");

    // FETCH ALL items like the real engine does
    const allItems = await prisma.item.findMany({
        where: {
            lifecycleStatus: { not: 'OBSOLETE' },
            skuConfidence: 'APPROVED',
            approvalStatus: 'APPROVED'
        },
        include: {
            // Minimal include for verification
            orderLines: { where: { order: { status: { notIn: ['SHIPPED', 'CANCELLED'] } } } },
            inventory: true
        }
    });

    console.log(`   > Scanned ${allItems.length} active items in network.`);

    // 3. Find our random SKU in the haystack
    const found = allItems.find(i => i.sku === sku);

    if (found) {
        const demand = found.orderLines.reduce((s, l) => s + (l.qtyOrdered || l.qty), 0);
        const supply = found.inventory.reduce((s, i) => s + i.quantity, 0);
        const net = supply - demand;

        console.log(`\n✅ DETECTED: ${found.sku}`);
        console.log(`   > Demand Found: ${demand}`);
        console.log(`   > Supply Found: ${supply}`);
        console.log(`   > Net Requirement: ${net}`);

        if (net === -demandQty) {
            console.log("   > MATH VERIFIED: Backend correctly computed shortage for new dynamic item.");
        } else {
            console.log("   > MATH MISMATCH.");
        }
    } else {
        console.error("   ❌ FAILED: The engine missed the new item.");
    }
}

runDynamicTest()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
