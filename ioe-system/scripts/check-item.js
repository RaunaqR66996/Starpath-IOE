const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const item = await prisma.item.findFirst({
        where: { sku: 'TEST-UI-SKU-1' }
    });
    console.log('CHECK_RESULT:', JSON.stringify(item));
}

main().catch(console.error).finally(() => prisma.$disconnect());
