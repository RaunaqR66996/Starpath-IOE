import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// FREIGHT AUDIT Logic
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { freightBillId } = body;

        const bill = await prisma.freightBill.findUnique({
            where: { id: freightBillId },
            include: { shipment: true }
        });

        if (!bill || !bill.shipment) {
            return NextResponse.json({ error: 'Bill or Shipment not found' }, { status: 404 });
        }

        const expectedCost = bill.shipment.cost;
        const billedAmount = bill.amount;

        let status = 'APPROVED';
        let discrepancy = 0;
        let notes = 'Auto-Audit Passed';

        if (billedAmount > expectedCost * 1.05) { // 5% Tolerance
            status = 'OPEN'; // Creates an Audit Issue
            discrepancy = billedAmount - expectedCost;
            notes = `Billed amount ($${billedAmount}) exceeds rate ($${expectedCost}) > 5%`;

            // Update Bill Status
            await prisma.freightBill.update({
                where: { id: bill.id },
                data: { status: 'DISPUTED' }
            });
        } else {
            await prisma.freightBill.update({
                where: { id: bill.id },
                data: { status: 'AUDITED' }
            });
        }

        // Create Audit Record
        const audit = await prisma.freightAudit.create({
            data: {
                freightBillId: bill.id,
                discrepancy: discrepancy,
                status: status,
                notes: notes
            }
        });

        return NextResponse.json({ success: true, audit });

    } catch (error) {
        console.error('Audit Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
