
const prismaLib = require('@prisma/client');
console.log('Keys in @prisma/client:', Object.keys(prismaLib));

try {
    const dotPrisma = require('.prisma/client');
    console.log('Keys in .prisma/client:', Object.keys(dotPrisma));

    const { PrismaClient } = prismaLib;
    console.log('PrismaClient type:', typeof PrismaClient);
    try {
        const p = new PrismaClient({
            datasources: { db: { url: process.env.DATABASE_URL } }
        });
        console.log('PrismaClient instantiated successfully');
    } catch (err) {
        console.error('Instantiation failed message:', err.message);
        console.error('Instantiation failed stack:', err.stack);
    }

} catch (e) {
    console.log('Could not require .prisma/client:', e.message);
}
