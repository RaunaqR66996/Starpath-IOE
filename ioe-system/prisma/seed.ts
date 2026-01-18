
import { PrismaClient } from '@prisma/client'

// @ts-ignore
const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding G-Shock Manufacturing Data (v2 Spatial) - ENTERPRISE MODE...')

    // --- 0. ENTERPRISE BOOTSTRAP ---
    const org = await prisma.organization.upsert({
        where: { domain: 'starpath.com' },
        update: {},
        create: {
            id: 'org-global-01',
            name: 'StarPath Manufacturing Global',
            domain: 'starpath.com',
            plan: 'ENTERPRISE'
        }
    });
    console.log(`Organization Verified: ${org.name} (${org.id})`);
    const ORG_ID = org.id;


    // --- AHA #3: SPATIAL INTELLIGENCE ---
    // 0. Zones (The Map)
    const upsertZone = async (name: string, type: string, x: number, y: number) => {
        const existing = await prisma.zone.findFirst({ where: { name } });
        if (existing) return existing;
        return await prisma.zone.create({
            data: { name, type, x, y, organizationId: ORG_ID }
        });
    };

    const zDock = await upsertZone("Warehouse Dock", "DOCK", 0, 0);
    const zMold = await upsertZone("Molding Area", "PRODUCTION", 10, 0);
    const zAsy = await upsertZone("Assembly Line", "PRODUCTION", 20, 0);
    const zTest = await upsertZone("Testing Lab", "PRODUCTION", 25, 0);
    const zPack = await upsertZone("Packing Station", "PACKING", 30, 0);

    console.log('Zones created.');

    // 0.1 Transit Times (The Distance)
    await prisma.transitTime.deleteMany({});

    // Transits link Zones, which are now strictly Org-owned.
    await prisma.transitTime.createMany({
        data: [
            { fromZoneId: zDock.id, toZoneId: zMold.id, minutes: 15 },
            { fromZoneId: zMold.id, toZoneId: zAsy.id, minutes: 5 },
            { fromZoneId: zDock.id, toZoneId: zAsy.id, minutes: 10 },
            { fromZoneId: zAsy.id, toZoneId: zTest.id, minutes: 5 },
            { fromZoneId: zTest.id, toZoneId: zPack.id, minutes: 5 },
            { fromZoneId: zPack.id, toZoneId: zDock.id, minutes: 10 },
        ]
    });
    console.log('Transit Grid calculated.');

    // 1. Work Centers (The Factory)
    const upsertWC = async (code: string, name: string, type: string, hours: number, zoneId: string) => {
        const existing = await prisma.workCenter.findUnique({ where: { code } });
        if (existing) {
            return await prisma.workCenter.update({
                where: { code },
                data: { name, type, capacityHours: hours, zoneId, organizationId: ORG_ID }
            });
        }
        return await prisma.workCenter.create({
            data: { code, name, type, capacityHours: hours, zoneId, organizationId: ORG_ID }
        });
    };

    const wcMolding = await upsertWC('WC-MOLD-01', 'Resin Molding (Bezel/Strap)', 'MOLDING', 16, zMold.id);
    const wcAssembly = await upsertWC('WC-ASY-01', 'Watch Module Assembly', 'ASSEMBLY', 16, zAsy.id);
    const wcTest = await upsertWC('WC-TEST-01', 'Water/Shock Resistance Test', 'TESTING', 8, zTest.id);
    const wcPack = await upsertWC('WC-PACK-01', 'Final Packaging', 'PACKING', 8, zPack.id);

    console.log('Work Centers ready (with Location).');

    // 2. Items
    const upsertItem = async (sku: string, name: string, type: string, cost: number, lead: number) => {
        const existing = await prisma.item.findUnique({ where: { sku } });
        if (existing) {
            return await prisma.item.update({
                where: { sku },
                data: { name, type, cost, leadTimeDays: lead, organizationId: ORG_ID }
            });
        }
        return await prisma.item.create({
            data: { sku, name, type, cost, leadTimeDays: lead, organizationId: ORG_ID }
        });
    };

    // Raw Materials
    const resin = await upsertItem('RAW-RESIN-BLK', 'Polyurethane Resin (Black)', 'BUY', 1.50, 7);
    const module5600 = await upsertItem('MOD-3229', 'Digital Module (DW-5600)', 'BUY', 12.00, 14);
    const glass = await upsertItem('CMP-GLASS-MIN', 'Mineral Glass Crystal', 'BUY', 2.50, 5);

    // Sub-Assemblies
    const bezel = await upsertItem('SUB-BEZEL-5600', 'Bezel Case (DW-5600)', 'MAKE', 3.00, 1);

    // Finished Goods
    const dw5600 = await upsertItem('DW-5600E-1V', 'G-Shock Classic Digital', 'MAKE', 25.00, 2);

    console.log('Items ready.');

    // 3. BOMs
    const parentIds = [bezel.id, dw5600.id];
    await prisma.bom.deleteMany({
        where: { parentId: { in: parentIds } }
    });

    await prisma.bom.createMany({
        data: [
            { parentId: bezel.id, childId: resin.id, quantity: 0.2 },
            { parentId: dw5600.id, childId: bezel.id, quantity: 1 },
            { parentId: dw5600.id, childId: module5600.id, quantity: 1 },
            { parentId: dw5600.id, childId: glass.id, quantity: 1 },
        ]
    });
    console.log('BOMs created.');

    // 4. Routings
    const itemIdsForRouting = [bezel.id, dw5600.id];
    await prisma.routing.deleteMany({
        where: { itemId: { in: itemIdsForRouting } }
    });

    await prisma.routing.create({
        data: {
            itemId: bezel.id,
            version: 1,
            steps: JSON.stringify([
                { sequence: 10, workCenterId: wcMolding.id, setupTime: 30, runTime: 5 }
            ])
        }
    });

    await prisma.routing.create({
        data: {
            itemId: dw5600.id,
            version: 1,
            steps: JSON.stringify([
                { sequence: 10, workCenterId: wcAssembly.id, setupTime: 15, runTime: 10 },
                { sequence: 20, workCenterId: wcTest.id, setupTime: 5, runTime: 15 },
                { sequence: 30, workCenterId: wcPack.id, setupTime: 10, runTime: 5 }
            ])
        }
    });
    console.log('Routings created.');

    // 5. Orders
    let customer = await prisma.customer.findFirst({ where: { name: 'Macy\'s Retail' } });
    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                name: 'Macy\'s Retail',
                tier: 'Premium',
                organizationId: ORG_ID,
                defaultAddress: JSON.stringify({ city: 'New York', state: 'NY' })
            }
        });
    }

    const orderRef = 'PO-MACY-9001';
    const existingOrder = await prisma.order.findUnique({ where: { erpReference: orderRef } });
    if (!existingOrder) {
        await prisma.order.create({
            data: {
                erpReference: orderRef,
                customerId: customer.id,
                customerName: customer.name,
                organizationId: ORG_ID,
                originId: 'Factory',
                destination: JSON.stringify({ city: 'New York' }),
                status: 'CONFIRMED',
                priority: 'HIGH',
                requestedDeliveryDate: new Date(Date.now() + 7 * 86400000), // +7 days
                totalWeight: 50,
                totalValue: 5000,
                lines: {
                    create: [
                        { lineNumber: 1, itemId: dw5600.id, qtyOrdered: 200, qtyAllocated: 0, qtyPicked: 0, qtyShipped: 0, unitPrice: 45.00 }
                    ]
                },
                tags: "G-SHOCK, URGENT"
            }
        });
        console.log('G-Shock Order created.');
    } else {
        console.log('G-Shock Order already exists.');
    }

    // 6. Inventory
    await prisma.inventory.deleteMany({ where: { itemId: { in: [resin.id, module5600.id, glass.id] } } });

    await prisma.inventory.create({
        data: {
            itemId: resin.id,
            organizationId: ORG_ID,
            warehouseId: 'WH-01',
            zoneId: zDock.id,
            quantity: 300,
            locationId: 'Bin-A1',
            status: 'AVAILABLE',
            locked: false
        }
    });

    await prisma.inventory.create({
        data: {
            itemId: resin.id,
            organizationId: ORG_ID,
            warehouseId: 'WH-01',
            zoneId: zDock.id,
            quantity: 200,
            locationId: 'QC-Cage',
            status: 'QC_HOLD',
            locked: true,
            customAttributes: JSON.stringify({ reason: "Moisture content too high", inspector: "J.Doe" })
        }
    });

    await prisma.inventory.create({
        data: {
            itemId: module5600.id,
            organizationId: ORG_ID,
            warehouseId: 'WH-01',
            zoneId: zDock.id,
            quantity: 500,
            locationId: 'Bin-M1',
            status: 'AVAILABLE'
        }
    });

    await prisma.inventory.create({
        data: {
            itemId: glass.id,
            organizationId: ORG_ID,
            warehouseId: 'WH-01',
            zoneId: zDock.id,
            quantity: 500,
            locationId: 'Bin-G1',
            status: 'AVAILABLE'
        }
    });

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
