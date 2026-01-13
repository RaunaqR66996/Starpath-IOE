const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning Legacy G-Shock Data (Robust Mode)...');

    // 1. Identify Legacy Items
    const legacyItems = await prisma.item.findMany({
        where: {
            OR: [
                { sku: { contains: 'DW-5600' } },
                { sku: { contains: 'BEZEL' } },
                { sku: { contains: 'STRAP' } },
                { sku: { contains: 'SCREW' } },
                { sku: { contains: 'GASKET' } },
                { sku: { contains: 'MODULE' } },
                { sku: { contains: 'GLASS' } }
            ]
        }
    });

    if (legacyItems.length === 0) {
        console.log("No legacy items found.");
        return;
    }

    const legacyIds = legacyItems.map(i => i.id);
    console.log(`Targeting ${legacyIds.length} items for deletion.`);

    // 2. Clear Dependent Tables (Order matters!)

    await safeDelete('MaterialShortage', 'materialShortage', legacyIds);
    await safeDelete('ProductionForecast', 'productionForecast', legacyIds);
    await safeDelete('ProductionTask', 'productionTask', legacyIds, 'productionOrder.itemId'); // Indirect via PO? No, direct ID usually not there. Tasks linked to PO.

    // Find POs first to delete their tasks
    const pos = await prisma.productionOrder.findMany({ where: { itemId: { in: legacyIds } }, select: { id: true } });
    if (pos.length > 0) {
        const poIds = pos.map(p => p.id);
        await prisma.productionTask.deleteMany({ where: { productionOrderId: { in: poIds } } });
        console.log(`- Deleted Tasks for ${poIds.length} POs`);
        await prisma.productionOrder.deleteMany({ where: { id: { in: poIds } } });
        console.log(`- Deleted ${poIds.length} Production Orders`);
    }

    await safeDelete('BillOfMaterial (Parent)', 'billOfMaterial', legacyIds, 'parentItemId');
    await safeDelete('BillOfMaterial (Child)', 'billOfMaterial', legacyIds, 'childItemId');

    await safeDelete('Inventory', 'inventory', legacyIds);
    await safeDelete('OrderLine', 'orderLine', legacyIds);
    await safeDelete('PurchaseLine', 'purchaseLine', legacyIds);
    await safeDelete('Routing', 'routing', legacyIds);

    // 3. Delete Items
    const delItems = await prisma.item.deleteMany({ where: { id: { in: legacyIds } } });
    console.log(`✅ Successfully deleted ${delItems.count} Legacy Items.`);
}

async function safeDelete(label, model, ids, field = 'itemId') {
    try {
        // @ts-ignore
        const res = await prisma[model].deleteMany({ where: { [field]: { in: ids } } });
        console.log(`- Deleted ${res.count} ${label}`);
    } catch (e) {
        console.log(`- Skipping ${label} (Table might not exist or error)`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
