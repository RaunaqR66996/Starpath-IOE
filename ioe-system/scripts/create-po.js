const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPO() {
    const sku = 'RE-TEST-1';

    // 1. Get Item ID
    const item = await prisma.item.findUnique({ where: { sku: sku } });
    if (!item) {
        console.log("ITEM NOT FOUND");
        return;
    }

    // 2. Get Supplier
    let supplier = await prisma.supplier.findFirst();
    if (!supplier) {
        supplier = await prisma.supplier.create({
            data: { name: "Global Tech Supplies Inc." }
        });
    }

    // 3. Create PO
    const po = await prisma.purchaseOrder.create({
        data: {
            poNumber: `PO-AUTO-${Date.now().toString().slice(-6)}`,
            supplierId: supplier.id,
            status: 'ISSUED', // Skip DRAFT, go straight to ISSUED for demo speed
            lines: {
                create: [{
                    itemId: item.id,
                    qtyOrdered: 100, // Enough to cover 25 demand
                    unitCost: 15.00
                }]
            }
        }
    });

    console.log(`PO CREATED: ${po.poNumber}`);
    console.log(`QTY: 100`);
    console.log(`STATUS: ${po.status}`);
}

createPO()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
