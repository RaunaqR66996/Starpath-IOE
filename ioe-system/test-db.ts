
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

console.log("Imported PrismaClient:", PrismaClient);

try {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        log: ['query', 'info', 'warn', 'error'],
    });
    console.log("Successfully initialized PrismaClient");

    prisma.$connect().then(() => {
        console.log("Successfully connected to DB");
        process.exit(0);
    }).catch((e) => {
        console.error("Failed to connect:", e);
        process.exit(1);
    });

} catch (e) {
    console.error("Failed to initialize:", e);
    process.exit(1);
}
