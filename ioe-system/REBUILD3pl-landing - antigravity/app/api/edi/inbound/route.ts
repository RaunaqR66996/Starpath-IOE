import { NextRequest, NextResponse } from 'next/server';
import { X12Parser } from '@/lib/edi/x12-parser';
import { EDI204Handler } from '@/lib/edi/transactions/204';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const parser = new X12Parser();

export async function POST(request: NextRequest) {
    try {
        const raw = await request.text();
        if (!raw) {
            return NextResponse.json({ error: 'Empty body' }, { status: 400 });
        }

        // 1. Parse X12
        const interchange = parser.parse(raw);
        console.log(`Received EDI from ${interchange.senderId}`);

        // 2. Log to DB
        // Hardcoded org for MVP
        const organizationId = 'org-1';

        await prisma.eDILog.create({
            data: {
                organizationId,
                direction: 'INBOUND',
                transactionSet: 'UNKNOWN', // Will update after parsing ST
                controlNumber: interchange.controlNumber,
                partnerId: interchange.senderId,
                rawContent: raw,
                status: 'PENDING'
            }
        });

        // 3. Route by Transaction Set (ST segment)
        const st = interchange.segments.find(s => s.tag === 'ST');
        if (!st) throw new Error('Missing ST segment');

        const transactionSet = st.elements[0];
        let result;

        if (transactionSet === '204') {
            result = await EDI204Handler.handle(interchange.segments, organizationId, interchange.senderId);
        } else {
            console.warn(`Unsupported transaction set: ${transactionSet}`);
        }

        // 4. Return 997 (Stub)
        // In a real system, we would generate a valid 997 X12 response
        return new NextResponse('ISA*00*...', { status: 200 });

    } catch (error: any) {
        console.error('EDI Processing Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
