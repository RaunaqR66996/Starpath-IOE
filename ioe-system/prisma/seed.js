
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADDRESSES = [
    { street: "123 Logistics Way", city: "Atlanta", state: "GA", zip: "30303", country: "USA" },
    { street: "456 Commerce Blvd", city: "Dallas", state: "TX", zip: "75201", country: "USA" },
    { street: "789 Supply Chain Dr", city: "Chicago", state: "IL", zip: "60601", country: "USA" },
    { street: "101 Warehouse Rd", city: "Los Angeles", state: "CA", zip: "90012", country: "USA" },
    { street: "202 Dockside Ave", city: "Elizabeth", state: "NJ", zip: "07201", country: "USA" },
];

async function main() {
    console.log('Start seeding demo data (JS Mode) ...')

    // 1. Create Customers (if not exist)
    const customers = ["Acme Corp", "Globex Inc", "Initech"];
    const suppliers = ["Global Parts Co", "Raw Materials Ltd", "Steel Works Inc"];

    const dbCustomers = [];
    const dbSuppliers = [];

    // Create Standard Customers
    for (const name of customers) {
        let c = await prisma.customer.findFirst({ where: { name } });
        if (!c) {
            c = await prisma.customer.create({
                data: {
                    name,
                    tier: "Standard",
                    defaultAddress: ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)],
                }
            });
        }
        dbCustomers.push(c);
        console.log(`Customer ready: ${c.name}`);
    }

    // Create Suppliers (modeled as Customers with Strategic tier)
    for (const name of suppliers) {
        let c = await prisma.customer.findFirst({ where: { name } });
        if (!c) {
            c = await prisma.customer.create({
                data: {
                    name,
                    tier: "Strategic",
                    defaultAddress: ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)],
                }
            });
        }
        dbSuppliers.push(c);
        console.log(`Supplier ready: ${c.name}`);
    }

    // 2. Create 5 Sales Orders (Outbound)
    console.log('Creating 5 Sales Orders...');
    for (let i = 1; i <= 5; i++) {
        const customer = dbCustomers[i % dbCustomers.length];
        const uniqueSuffix = Date.now().toString().slice(-4) + i;
        const so = await prisma.order.upsert({
            where: { erpReference: `SO-2025-00${i}` },
            update: {},
            create: {
                erpReference: `SO-2025-00${i}`,
                customerId: customer.id,
                customerName: customer.name,
                originId: "Kuehne Nagel East",
                destination: ADDRESSES[i % ADDRESSES.length],
                status: "CONFIRMED",
                priority: i % 3 === 0 ? "HIGH" : "NORMAL",
                requestedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                totalWeight: 150 + i * 10,
                totalValue: 5000 + i * 100,
                lines: {
                    create: [
                        {
                            lineNumber: 1,
                            skuId: "SKU-1001",
                            qtyOrdered: 10 + i,
                            qtyAllocated: 0,
                            qtyPicked: 0,
                            qtyShipped: 0,
                            unitPrice: 150
                        },
                        {
                            lineNumber: 2,
                            skuId: "SKU-2002",
                            qtyOrdered: 5,
                            qtyAllocated: 0,
                            qtyPicked: 0,
                            qtyShipped: 0,
                            unitPrice: 85
                        }
                    ]
                },
                tags: ["Outbound", "Sales Order"],
            }
        });
        console.log(`Ensured SO: ${so.erpReference}`);
    }

    // 3. Create 5 Purchase Orders (Inbound)
    console.log('Creating 5 Purchase Orders...');
    for (let i = 1; i <= 5; i++) {
        const supplier = dbSuppliers[i % dbSuppliers.length];
        const po = await prisma.order.upsert({
            where: { erpReference: `PO-SUP-00${i}` },
            update: {},
            create: {
                erpReference: `PO-SUP-00${i}`,
                customerId: supplier.id,
                customerName: supplier.name,
                originId: "Supplier Dock",
                destination: { street: "Our Warehouse", city: "Atlanta", state: "GA", zip: "30303", country: "USA" },
                status: "PLANNED",
                priority: "NORMAL",
                requestedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                totalWeight: 1000 + i * 50,
                totalValue: 2000 + i * 50,
                lines: {
                    create: [
                        {
                            lineNumber: 1,
                            skuId: "RAW-MAT-01",
                            qtyOrdered: 100 + i * 10,
                            qtyAllocated: 0,
                            qtyPicked: 0,
                            qtyShipped: 0,
                            unitPrice: 10
                        }
                    ]
                },
                tags: ["Inbound", "Purchase Order"],
            }
        });
        console.log(`Ensured PO: ${po.erpReference}`);
    }

    console.log('Demo seeding finished.')
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
