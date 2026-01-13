const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Planning Models...');

    try {
        const count = await prisma.productionForecast.count();
        console.log(`✅ ProductionForecast Accessible. Count: ${count}`);
    } catch (e) {
        console.error('❌ Failed to access ProductionForecast:', e.message);
        process.exit(1);
    }

    try {
        const count = await prisma.materialShortage.count();
        console.log(`✅ MaterialShortage Accessible. Count: ${count}`);
    } catch (e) {
        console.error('❌ Failed to access MaterialShortage:', e.message);
        process.exit(1);
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
