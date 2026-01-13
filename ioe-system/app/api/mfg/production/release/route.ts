import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// RELEASE WORK ORDER
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id } = body;

        // 1. Check Capacity / Materials (Mocked)

        // 2. Update Status
        const curOrder = await prisma.productionOrder.update({
            where: { id },
            data: {
                status: 'RELEASED',
                // startDate: new Date() // Actual start?
            }
        });

        return NextResponse.json({ success: true, order: curOrder });

    } catch (error) {
        console.error('Release Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
