const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Scanning Item Master...');
    const items = await prisma.item.findMany({
        select: { id: true, sku: true, name: true, type: true }
    });

    console.log(`Found ${items.length} items:`);
    items.forEach(i => console.log(`- [${i.type}] ${i.sku}: ${i.name}`));

    const legacy = items.filter(i => !i.sku.includes('SCOOTER') && !i.sku.includes('CELL') && !i.sku.includes('ALU') && !i.sku.includes('BATTERY'));
    console.log(`\n⚠️ Potential Legacy Items: ${legacy.length}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
