const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGlobalInventory() {
    console.log("📊 GLOBAL INVENTORY AUDIT");

    const inventory = await prisma.inventory.findMany({
        include: { item: true }
    });

    const totalQty = inventory.reduce((s, i) => s + i.quantity, 0);
    const totalValue = inventory.reduce((s, i) => s + (i.quantity * (i.item.cost || 0)), 0);
    const distinctItems = new Set(inventory.map(i => i.item.sku)).size;
    const activeItems = await prisma.item.count({ where: { lifecycleStatus: 'ACTIVE' } });

    console.log(`   > Total SKU Count (Active): ${activeItems}`);
    console.log(`   > SKUs with Stock: ${distinctItems}`);
    console.log(`   > Total Units On Hand: ${totalQty}`);
    console.log(`   > Total Inventory Value: $${totalValue.toFixed(2)}`);

    // Top 3 Items
    const topHoldings = inventory
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

    console.log("\n   📦 TOP HOLDINGS:");
    topHoldings.forEach(i => {
        console.log(`      - ${i.item.sku}: ${i.quantity} units ($${(i.quantity * i.item.cost).toFixed(0)})`);
    });
}

checkGlobalInventory()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
