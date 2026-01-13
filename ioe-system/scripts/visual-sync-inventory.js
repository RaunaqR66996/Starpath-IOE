const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateVisualBins() {
    console.log("🎨 POPULATING 3D VISUALIZATION BINS...");

    const SITE_IDs = [
        "Kuehne Nagel East",
        "Los Angeles",
        "Texas"
    ];

    // 1. Get All Inventory
    const allInventory = await prisma.inventory.findMany({
        include: { item: true }
    });

    console.log(`   📦 Processing ${allInventory.length} records...`);

    let binIndex = 0;

    for (const inv of allInventory) {

        // We will assign each record to a Specific BIN ID that the UI recognizes (BIN-0 to BIN-99)
        // We cycle through BIN-0 to BIN-30 to fill the first few racks clearly.

        const targetBinId = `BIN-${binIndex % 30}`; // Keep them clustered in the first 3 aisles

        // We also assign it to the correct Warehouse based on the rotation, or keep existing if matched.
        // Let's force them into the sites we have.
        const siteId = SITE_IDs[binIndex % 3];

        await prisma.inventory.update({
            where: { id: inv.id },
            data: {
                locationId: targetBinId,
                warehouseId: siteId,
                // Ensure quantity is high enough to show a "Full Pallet" in the UI logic
                quantity: inv.quantity < 50 ? 50 : inv.quantity
            }
        });

        console.log(`      > Moves ${inv.item.sku} to ${siteId} / ${targetBinId} (Visual Ready)`);
        binIndex++;
    }

    console.log("✅ VISUALIZATION SYNC COMPLETE. Racks should now show 3D pallets.");
}

populateVisualBins()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
