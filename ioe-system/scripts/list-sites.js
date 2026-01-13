const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listSites() {
    console.log("🌍 NETWORK TOPOLOGY AUDIT");

    const warehouses = await prisma.warehouse.findMany();

    if (warehouses.length === 0) {
        console.log("⚠️ No warehouses found in database.");
    } else {
        console.log(`✅ Found ${warehouses.length} Active Sites:`);
        warehouses.forEach(w => {
            console.log(`   🏭 [${w.id}] ${w.name} (${w.location || 'No Location'})`);
        });
    }

    // Also check for distinct warehouse IDs in inventory to see where stock actually is
    const inventory = await prisma.inventory.findMany({ select: { warehouseId: true } });
    const stockSites = new Set(inventory.map(i => i.warehouseId));
    console.log(`\n📦 Stock is currently held in: ${Array.from(stockSites).join(', ')}`);
}

listSites()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
