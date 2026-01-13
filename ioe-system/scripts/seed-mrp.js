
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedShortages() {
    console.log('Seeding shortages...');

    // 1. Create Items
    await prisma.item.upsert({
        where: { sku: 'STEEL-SHEET-2MM' },
        update: { reorderPoint: 100, safetyStock: 20, minOrderQty: 50, type: 'BUY' },
        create: {
            sku: 'STEEL-SHEET-2MM',
            name: 'Steel Sheet 2mm',
            description: 'Raw steel for stamping',
            type: 'BUY',
            cost: 15.00,
            price: 25.00,
            reorderPoint: 100,
            safetyStock: 20,
            minOrderQty: 50
        }
    });

    await prisma.item.upsert({
        where: { sku: 'GASKET-RUBBER' },
        update: { reorderPoint: 500, safetyStock: 50, minOrderQty: 200, type: 'BUY' },
        create: {
            sku: 'GASKET-RUBBER',
            name: 'Rubber Gasket',
            description: 'Sealing gasket',
            type: 'BUY',
            cost: 0.50,
            price: 2.00,
            reorderPoint: 500,
            safetyStock: 50,
            minOrderQty: 200
        }
    });

    const item1 = await prisma.item.findUnique({ where: { sku: 'STEEL-SHEET-2MM' } });
    const item2 = await prisma.item.findUnique({ where: { sku: 'GASKET-RUBBER' } });

    // 2. Ensuring Zone Exists
    // Based on schema: model Zone { id, name, type, x, y ... }
    await prisma.zone.upsert({
        where: { id: 'ZONE-A' },
        update: {},
        create: {
            id: 'ZONE-A',
            name: 'Picking Zone A',
            type: 'STORAGE',
            x: 0.0,
            y: 0.0
        }
    });

    // 3. Set Inventory - MUST include warehouseId
    // Delete existing to reset quantity
    await prisma.inventory.deleteMany({ where: { itemId: item1.id } });

    await prisma.inventory.create({
        data: {
            itemId: item1.id,
            warehouseId: 'WH-MAIN',
            zoneId: 'ZONE-A',
            quantity: 10,
            status: 'AVAILABLE'
        }
    });

    await prisma.inventory.deleteMany({ where: { itemId: item2.id } });

    await prisma.inventory.create({
        data: {
            itemId: item2.id,
            warehouseId: 'WH-MAIN',
            zoneId: 'ZONE-A',
            quantity: 50,
            status: 'AVAILABLE'
        }
    });

    console.log('Shortages seeded successfully.');
}

seedShortages()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
