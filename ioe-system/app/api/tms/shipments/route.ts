import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all Shipments
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        const shipments = await prisma.shipment.findMany({
            where: status ? { status } : undefined,
            include: {
                carrier: true,
                orders: {
                    select: { id: true, erpReference: true, status: true, totalWeight: true }
                },
                load: true,
                _count: {
                    select: { orders: true, trackingEvents: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(shipments);
    } catch (error) {
        console.error('Failed to fetch shipments:', error);
        return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
    }
}

// POST: Create a new Shipment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            orderIds, // Array of Order IDs to include in this shipment
            carrierId,
            serviceLevel,
            origin,
            destination,
            status,
            totalWeight,
            cost
        } = body;

        // Validation
        if (!origin || !destination) {
            return NextResponse.json({ error: 'Origin and Destination are required' }, { status: 400 });
        }

        const newShipment = await prisma.shipment.create({
            data: {
                origin,
                destination,
                status: status || 'PLANNED',
                carrierId,
                serviceLevel,
                totalWeight: totalWeight || 0,
                cost: cost || 0,
                // Link existing orders if provided
                orders: orderIds && orderIds.length > 0 ? {
                    connect: orderIds.map((id: string) => ({ id }))
                } : undefined
            },
            include: {
                orders: true,
                carrier: true
            }
        });

        // Optionally update the status of linked orders to 'SHIPPED' or 'IN_TRANSIT' 
        // if the shipment status warrants it, but we'll leave that for a separate logic layer for now.

        return NextResponse.json(newShipment);
    } catch (error) {
        console.error('Failed to create shipment:', error);
        return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
    }
}
