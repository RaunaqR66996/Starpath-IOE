const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestPO() {
    console.log("📝 CREATING TEST PO [PO-TEST-101]...");

    // Ensure supplier
    const supplier = await prisma.supplier.upsert({
        where: { id: 'SUP-001' },
        update: {},
        create: { id: 'SUP-001', name: 'Global Materials Inc.', email: 'orders@globalmat.com' }
    });

    // Ensure Item
    const item = await prisma.item.findFirst();
    if (!item) { console.error("No items!"); return; }

    const po = await prisma.purchaseOrder.upsert({
        where: { poNumber: 'PO-TEST-101' },
        update: { status: 'ISSUED' }, // Reset to ISSUED if exists
        create: {
            poNumber: 'PO-TEST-101',
            supplierId: supplier.id,
            status: 'ISSUED',
            lines: {
                create: [
                    { itemId: item.id, qtyOrdered: 500, unitCost: 12.50 }
                ]
            }
        }
    });

    console.log(`✅ PO Created: ${po.poNumber} with 500x ${item.sku}`);
}

createTestPO()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
