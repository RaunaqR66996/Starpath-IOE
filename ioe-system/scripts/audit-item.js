const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
    const sku = 'RE-TEST-1';
    console.log(`AUDITING SKU: ${sku}`);

    // Find ID first by SKU, as relations map to ID not SKU usually, 
    // but here Item.sku is unique.
    const item = await prisma.item.findUnique({
        where: { sku: sku },
        include: {
            inventory: true,
            purchaseLines: true,
            orderLines: true
        }
    });

    if (!item) {
        console.log("Item NOT FOUND.");
        return;
    }

    console.log(`LIFECYCLE: ${item.lifecycleStatus}`);
    console.log(`CONFIDENCE: ${item.skuConfidence}`);
    console.log(`APPROVAL: ${item.approvalStatus}`);

    // Sum Inventory
    const stock = item.inventory.reduce((acc, inv) => acc + inv.quantity, 0);
    console.log(`STOCK_ON_HAND: ${stock}`);

    // Sum Inbound POs
    const poQty = item.purchaseLines.reduce((acc, line) => acc + line.qtyOrdered, 0);
    console.log(`INBOUND_PO_QTY: ${poQty}`);

    // Sum Outbound SOs
    // Check schema for property name: qtyOrdered vs qty
    // Schema says: qtyOrdered Int
    const soQty = item.orderLines.reduce((acc, line) => acc + line.qtyOrdered, 0);
    console.log(`OUTBOUND_SO_QTY: ${soQty}`);
}

audit()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
