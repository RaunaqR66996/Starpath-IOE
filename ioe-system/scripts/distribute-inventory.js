const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function distributeInventory() {
    console.log("🚚 INITIATING MULTI-SITE DISTRIBUTION (CORRECTED IDs)...");

    const CORRECT_SITES = [
        "Kuehne Nagel East",
        "Los Angeles",
        "Texas"
    ];

    console.log(`   📍 Target Sites: ${CORRECT_SITES.join(', ')}`);

    // 1. Get All Inventory
    const allInventory = await prisma.inventory.findMany({
        include: { item: true }
    });

    console.log(`   📦 Found ${allInventory.length} Inventory Records to Distribute.`);

    // 2. Distribute
    let count = 0;

    // Cleanup first: If we have old 'WH-EAST' etc., we will consolidate them into the new logic
    // OR just update everything in place.

    for (const inv of allInventory) {
        const qty = inv.quantity;

        if (qty <= 5) continue; // Skip small items

        const split = Math.floor(qty / 3);
        const remainder = qty - (split * 2);

        // Update Record 1 -> Site 1 (Kuehne Nagel East)
        await prisma.inventory.update({
            where: { id: inv.id },
            data: {
                quantity: remainder,
                warehouseId: CORRECT_SITES[0],
                locationId: 'A-01-01'
            }
        });

        // Create Record 2 -> Site 2 (Los Angeles)
        await prisma.inventory.create({
            data: {
                itemId: inv.itemId,
                warehouseId: CORRECT_SITES[1],
                locationId: 'LA-01-01',
                quantity: split,
                status: 'AVAILABLE'
            }
        });

        // Create Record 3 -> Site 3 (Texas)
        await prisma.inventory.create({
            data: {
                itemId: inv.itemId,
                warehouseId: CORRECT_SITES[2],
                locationId: 'TX-01-01',
                quantity: split,
                status: 'AVAILABLE'
            }
        });

        console.log(`      > ${inv.item.sku}: Split ${qty} -> ${remainder} (${CORRECT_SITES[0]}) / ${split} (${CORRECT_SITES[1]}) / ${split} (${CORRECT_SITES[2]})`);
        count++;
    }

    console.log(`✅ DISTRIBUTION COMPLETE. ${count} SKUs distributed across explicit Site IDs.`);
}

distributeInventory()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
