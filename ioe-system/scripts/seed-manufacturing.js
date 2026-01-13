const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🏭 Seeding Manufacturing Data...');

    // 1. Create Work Centers
    const wcAssembly = await prisma.workCenter.upsert({
        where: { code: 'WC-ASM-01' },
        update: {},
        create: {
            name: 'General Assembly',
            code: 'WC-ASM-01',
            type: 'ASSEMBLY',
            capacityHours: 16.0, // 2 shifts
            efficiency: 0.95,
        },
    });

    const wcFab = await prisma.workCenter.upsert({
        where: { code: 'WC-FAB-01' },
        update: {},
        create: {
            name: 'Metal Fabrication',
            code: 'WC-FAB-01',
            type: 'MACHINING',
            capacityHours: 24.0, // 3 shifts
            efficiency: 0.85,
        },
    });
    console.log('✅ Work Centers created.');

    // 2. Create Items (Finished Goods, Sub-Assemblies, Raw Materials)
    // FG: Electric Scooter
    const fg = await prisma.item.upsert({
        where: { sku: 'FG-SCOOTER-PRO' },
        update: {},
        create: {
            sku: 'FG-SCOOTER-PRO',
            name: 'Electric Scooter Pro',
            type: 'MAKE',
            cost: 450.00,
            price: 1200.00,
            leadTimeDays: 2,
            category: 'Finite Goods'
        }
    });

    // Sub: Battery Pack
    const subBattery = await prisma.item.upsert({
        where: { sku: 'SA-BATTERY-48V' },
        update: {},
        create: {
            sku: 'SA-BATTERY-48V',
            name: '48V Lithium Battery Pack',
            type: 'MAKE', // We assemble the battery pack
            cost: 150.00,
            leadTimeDays: 1,
            category: 'Sub-Assembly'
        }
    });

    // Raw: 18650 Cell
    const rawCell = await prisma.item.upsert({
        where: { sku: 'RM-CELL-18650' },
        update: {},
        create: {
            sku: 'RM-CELL-18650',
            name: 'Li-Ion Cell 18650',
            type: 'BUY',
            cost: 3.50,
            leadTimeDays: 14,
            reorderPoint: 500,
            safetyStock: 100,
            category: 'Raw Material'
        }
    });

    // Raw: Aluminum Frame
    const rawFrame = await prisma.item.upsert({
        where: { sku: 'RM-ALU-FRAME' },
        update: {},
        create: {
            sku: 'RM-ALU-FRAME',
            name: 'Extruded Aluminum Frame',
            type: 'BUY',
            cost: 45.00,
            leadTimeDays: 21,
            reorderPoint: 50,
            safetyStock: 10,
            category: 'Raw Material'
        }
    });
    console.log('✅ Items created.');

    // 3. Create BOMs
    // Battery Pack BOM: 1x Pack = 20x Cells
    await prisma.bom.create({
        data: {
            parentId: subBattery.id,
            childId: rawCell.id,
            quantity: 20
        }
    });

    // Scooter BOM: 1x Scooter = 1x Battery + 1x Frame
    await prisma.bom.create({
        data: {
            parentId: fg.id,
            childId: subBattery.id,
            quantity: 1
        }
    });
    await prisma.bom.create({
        data: {
            parentId: fg.id,
            childId: rawFrame.id,
            quantity: 1
        }
    });
    console.log('✅ BOMs created (Multi-level).');

    // 4. Create Routings
    // Scooter Routing
    await prisma.routing.create({
        data: {
            itemId: fg.id,
            steps: JSON.stringify([
                { sequence: 10, workCenterId: wcAssembly.id, operation: "Final Assembly", setupTime: 15, runTime: 45 },
                { sequence: 20, workCenterId: wcAssembly.id, operation: "QC & Testing", setupTime: 5, runTime: 15 }
            ]),
            isActive: true
        }
    });

    // Battery Routing
    await prisma.routing.create({
        data: {
            itemId: subBattery.id,
            steps: JSON.stringify([
                { sequence: 10, workCenterId: wcFab.id, operation: "Cell Welding", setupTime: 30, runTime: 20 },
                { sequence: 20, workCenterId: wcAssembly.id, operation: "Casing Assembly", setupTime: 10, runTime: 10 }
            ]),
            isActive: true
        }
    });
    console.log('✅ Routings created.');

    // 5. Create Demand (Sales Order)
    const cust = await prisma.customer.findFirst();
    if (cust) {
        await prisma.order.create({
            data: {
                erpReference: `SO-PLAN-${Math.floor(Math.random() * 1000)}`,
                customerId: cust.id,
                customerName: cust.name,
                originId: 'WH-MAIN',
                destination: 'Customer Site',
                status: 'CONFIRMED',
                priority: 'HIGH',
                requestedDeliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Due in 7 days
                totalWeight: 100,
                totalValue: 12000,
                lines: {
                    create: [
                        {
                            lineNumber: 1,
                            itemId: fg.id,
                            qtyOrdered: 10, // Demand for 10 Scooters
                            qtyAllocated: 0,
                            qtyPicked: 0,
                            qtyShipped: 0,
                            unitPrice: 1200
                        }
                    ]
                }
            }
        });
        console.log('✅ Demand (Sales Order) created.');
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
