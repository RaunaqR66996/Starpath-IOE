const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function approveItem() {
    const sku = 'RE-TEST-1';
    console.log(`✨ INITIATING APPROVAL PROTOCOL FOR: ${sku}`);

    const item = await prisma.item.update({
        where: { sku: sku },
        data: {
            approvalStatus: 'APPROVED',
            skuConfidence: 'HIGH',   // Changed from 'APPROVED' string to specific rating if needed, or kept consistent
            lifecycleStatus: 'ACTIVE',
            description: 'StarPath Certified Component - Verified Supply Chain Twin',
            leadTimeDays: 5,
            safetyStock: 10
        }
    });

    console.log(`✅ ITEM ACTIVATED:`);
    console.log(`   Status: ${item.lifecycleStatus}`);
    console.log(`   Confidence: ${item.skuConfidence}`);
    console.log(`   Approval: ${item.approvalStatus}`);
    console.log(`   Description: ${item.description}`);
}

approveItem()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
