import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List Docks and Appointments
export async function GET(request: Request) {
    try {
        const docks = await prisma.dock.findMany({
            include: {
                appointments: {
                    where: {
                        startTime: { gte: new Date() } // Future appointments only
                    },
                    orderBy: { startTime: 'asc' },
                    include: { carrier: true }
                }
            }
        });
        return NextResponse.json(docks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch yard data' }, { status: 500 });
    }
}

// POST: Schedule an Appointment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { dockId, carrierId, startTime, endTime, type, poId, loadId } = body;

        if (!dockId || !startTime || !endTime || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Overlap check
        const overlap = await prisma.dockAppointment.findFirst({
            where: {
                dockId,
                status: { not: 'RELEASED' },
                OR: [
                    {
                        startTime: { lte: new Date(endTime) },
                        endTime: { gte: new Date(startTime) }
                    }
                ]
            }
        });

        if (overlap) {
            return NextResponse.json({ error: 'Time slot conflict' }, { status: 409 });
        }

        const appointment = await prisma.dockAppointment.create({
            data: {
                dockId,
                carrierId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type, // PICKUP or DELIVERY
                poId,
                loadId,
                status: 'SCHEDULED'
            }
        });

        return NextResponse.json(appointment);

    } catch (error) {
        console.error('Yard Appt Error:', error);
        return NextResponse.json({ error: 'Failed to schedule appointment' }, { status: 500 });
    }
}
