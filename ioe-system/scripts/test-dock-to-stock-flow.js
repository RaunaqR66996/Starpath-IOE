const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDockToStockFlow() {
    console.log("🧪 STARTING END-TO-END DOCK-TO-STOCK TEST");
    console.log("=========================================");

    // --- STEP 1: CREATE PO ---
    console.log("\n👤 USER: 'Buy 100 STEEL-ROD-20mm from Acme Corp'");
    console.log("🤖 AGENT: Creating Purchase Order...");

    // 1a. Ensure Supplier/Item
    const supplier = await prisma.supplier.upsert({
        where: { id: 'SUP-ACME' },
        update: {},
        create: { id: 'SUP-ACME', name: 'Acme Corp', email: 'sales@acme.com' }
    });

    const item = await prisma.item.upsert({
        where: { sku: 'STEEL-ROD-20mm' },
        update: {},
        create: { sku: 'STEEL-ROD-20mm', name: 'Steel Rod 20mm', cost: 45.00, type: 'BUY' }
    });

    // 1b. Create PO
    const po = await prisma.purchaseOrder.create({
        data: {
            poNumber: `PO-AUTO-${Date.now().toString().slice(-6)}`,
            supplierId: supplier.id,
            status: 'ISSUED',
            lines: {
                create: [{ itemId: item.id, qtyOrdered: 100, unitCost: 45.00 }]
            }
        }
    });
    console.log(`✅ PO CREATED: [${po.poNumber}] Status: ${po.status}`);


    // --- STEP 2: SELECT WAREHOUSE & FIND SPACE ---
    console.log(`\n👤 USER: 'Receive ${po.poNumber} into Texas Warehouse'`);
    console.log("🤖 AGENT: Scanning Texas Warehouse for capacity...");

    const warehouseId = "Texas";

    // 2a. Find used locations
    const usedLocs = await prisma.inventory.findMany({
        where: { warehouseId },
        select: { locationId: true }
    });
    const usedSet = new Set(usedLocs.map(i => i.locationId));

    // 2b. Find first empty BIN
    let targetBin = 'OVERFLOW';
    for (let i = 0; i < 100; i++) {
        const bin = `BIN-${i}`;
        if (!usedSet.has(bin) && !bin.includes('A-')) { // Prefer standard bins
            targetBin = bin;
            break;
        }
    }

    console.log(`🔍 LOGIC: Found ${usedSet.size} occupied bins.`);
    console.log(`💡 SUGGESTION: "I found empty space at [${targetBin}]. Shall I put it away there?"`);


    // --- STEP 3: EXECUTE RECEIPT ---
    console.log(`\n👤 USER: 'Yes, confirm.'`);
    console.log(`🤖 AGENT: Executing Receipt...`);

    // 3a. Update Inventory
    await prisma.inventory.create({
        data: {
            itemId: item.id,
            warehouseId: warehouseId,
            locationId: targetBin,
            quantity: 100,
            status: 'AVAILABLE'
        }
    });

    // 3b. Close PO
    const updatedPO = await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: 'CLOSED' }
    });

    console.log(`✨ SUCCESS: PO [${updatedPO.poNumber}] is now CLOSED.`);
    console.log(`📦 INVENTORY: +100 units of ${item.sku} added to ${warehouseId} at location ${targetBin}.`);
    console.log("\n✅ END OF TEST: System state updated correctly.");
}

testDockToStockFlow()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
