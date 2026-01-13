const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('☢️  INITIATING COMPLETE FACTORY RESET ☢️');
    console.log('This will wipe all Manufacturing Data and re-seed the Scooter Line.');

    // 1. Nuke Tables (Order is critical for constraints)

    // Transactional
    await prisma.materialShortage.deleteMany({});
    await prisma.productionForecast.deleteMany({});
    await prisma.productionTask.deleteMany({});
    await prisma.productionOrder.deleteMany({});

    // Master Data (Dependencies)
    await prisma.billOfMaterial.deleteMany({});
    await prisma.routing.deleteMany({});

    // Order/Purchase Lines linked to Items
    await prisma.orderLine.deleteMany({});
    await prisma.purchaseLine.deleteMany({});

    // Inventory
    await prisma.inventory.deleteMany({});

    // Items
    const delItems = await prisma.item.deleteMany({});
    console.log(`✅ Wiped valid tables. Deleted ${delItems.count} Items.`);

    // Work Centers
    await prisma.workCenter.deleteMany({});
    console.log(`✅ Wiped Work Centers.`);


    console.log('\n🌱 Re-Seeding Fresh Data (Scooter Line)...');

    // 2. Re-Seed Work Centers
    const wcAsm = await prisma.workCenter.create({
        data: { name: 'General Assembly', code: 'WC-ASM-01', type: 'ASSEMBLY', capacityHours: 16, efficiency: 0.95 }
    });
    const wcFab = await prisma.workCenter.create({
        data: { name: 'Metal Fabrication', code: 'WC-FAB-01', type: 'MACHINING', capacityHours: 24, efficiency: 0.85 }
    });

    // 3. Re-Seed Items
    const fg = await prisma.item.create({
        data: { sku: 'FG-SCOOTER-PRO', name: 'Electric Scooter Pro', type: 'MAKE', cost: 450, price: 899, leadTimeDays: 5, safetyStock: 10, minOrderQty: 1 }
    });
    const saBatt = await prisma.item.create({
        data: { sku: 'SA-BATTERY-48V', name: '48V Lithium Battery Pack', type: 'MAKE', cost: 150, leadTimeDays: 3, safetyStock: 20, minOrderQty: 5 }
    });
    const rmCell = await prisma.item.create({
        data: { sku: 'RM-CELL-18650', name: 'Li-Ion Cell 18650', type: 'BUY', cost: 2.50, leadTimeDays: 14, safetyStock: 1000, minOrderQty: 500 }
    });
    const rmFrame = await prisma.item.create({
        data: { sku: 'RM-ALU-FRAME', name: 'Extruded Aluminum Frame', type: 'BUY', cost: 45.00, leadTimeDays: 20, safetyStock: 50, minOrderQty: 20 }
    });

    // 4. Re-Seed BOMs
    // Scooter -> Battery (1) + Frame (1)
    await prisma.billOfMaterial.create({ data: { parentItemId: fg.id, childItemId: saBatt.id, quantity: 1 } });
    await prisma.billOfMaterial.create({ data: { parentItemId: fg.id, childItemId: rmFrame.id, quantity: 1 } });
    // Battery -> Cells (40)
    await prisma.billOfMaterial.create({ data: { parentItemId: saBatt.id, childItemId: rmCell.id, quantity: 40 } });

    // 5. Re-Seed Routings
    // Scooter Assembly
    await prisma.routing.create({
        data: {
            itemId: fg.id,
            isActive: true,
            steps: JSON.stringify([
                { sequence: 10, workCenterId: wcAsm.id, name: 'Final Assembly', setupTime: 15, runTime: 30 },
                { sequence: 20, workCenterId: wcAsm.id, name: 'QC Test', setupTime: 5, runTime: 10 }
            ])
        }
    });
    // Battery Assembly
    await prisma.routing.create({
        data: {
            itemId: saBatt.id,
            isActive: true,
            steps: JSON.stringify([
                { sequence: 10, workCenterId: wcAsm.id, name: 'Cell Welding', setupTime: 30, runTime: 20 },
                { sequence: 20, workCenterId: wcAsm.id, name: 'BMS Wiring', setupTime: 10, runTime: 15 }
            ])
        }
    });

    // 6. Create Initial Demand (Sales Order)
    const order = await prisma.order.create({
        data: {
            customerName: 'Bird Rides Inc.',
            orderNumber: 'SO-2024-1001',
            status: 'CONFIRMED',
            totalAmount: 17980
        }
    });
    await prisma.orderLine.create({
        data: { orderId: order.id, itemId: fg.id, qtyOrdered: 20, qtyAllocated: 0, price: 899 }
    });

    console.log('✅ DATABASE RESET COMPLETE. Ready for Clean Demo.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
