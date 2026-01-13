
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function summarize() {
    console.log("Analyzing Imported Data...");

    // 1. Items
    const totalItems = await prisma.item.count();
    const items = await prisma.item.findMany();
    const categories = new Set(items.map(i => i.category));

    // 2. Orders
    const totalOrders = await prisma.order.count();
    const orderStats = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { totalValue: true }
    });

    // 3. Customers
    const totalCustomers = await prisma.customer.count();
    const customers = await prisma.customer.findMany({ select: { defaultAddress: true } });

    // Parse Cities roughly
    const cities = new Map<string, number>();
    customers.forEach(c => {
        try {
            const addr = JSON.parse(c.defaultAddress);
            const city = addr.city || "Unknown";
            cities.set(city, (cities.get(city) || 0) + 1);
        } catch (e) { }
    });
    const topCities = [...cities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    console.log(`\n📊 **DATA SUMMARY**`);
    console.log(`- **Items**: ${totalItems} SKUs`);
    console.log(`- **Categories**: ${Array.from(categories).slice(0, 5).join(', ')}...`);

    console.log(`\n📦 **ORDERS**`);
    console.log(`- **Total Volume**: ${totalOrders} Orders`);
    orderStats.forEach(stat => {
        console.log(`  - ${stat.status}: ${stat._count.id} orders ($${stat._sum.totalValue?.toLocaleString()})`);
    });

    console.log(`\n👥 **CUSTOMERS**`);
    console.log(`- **Total**: ${totalCustomers} Profiles`);
    console.log(`- **Top Hubs**: ${topCities.map(c => `${c[0]} (${c[1]})`).join(', ')}`);
}

summarize()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
