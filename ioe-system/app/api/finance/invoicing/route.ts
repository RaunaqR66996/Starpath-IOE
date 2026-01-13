import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SALES INVOICING Logic
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { lines: true, invoice: true }
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        if (order.invoice) return NextResponse.json({ error: 'Invoice already exists' }, { status: 400 });

        // Calculate Total
        const totalAmount = order.lines.reduce((acc, line) => acc + (line.qtyShipped * line.unitPrice), 0);

        // Create Invoice
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `INV-${Date.now()}`,
                orderId: order.id,
                amount: totalAmount,
                status: 'UNPAID',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Net 30
            }
        });

        return NextResponse.json({ success: true, invoice });

    } catch (error) {
        console.error('Invoicing Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
