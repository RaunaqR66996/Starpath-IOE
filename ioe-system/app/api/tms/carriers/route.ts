import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: List all Carriers
export async function GET(request: Request) {
    try {
        const carriers = await prisma.carrier.findMany({
            include: {
                services: true,
                contracts: true,
                _count: {
                    select: { shipments: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(carriers);
    } catch (error) {
        console.error('Failed to fetch carriers:', error);
        return NextResponse.json({ error: 'Failed to fetch carriers' }, { status: 500 });
    }
}

// POST: Create a new Carrier
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, scac, mode, rating, services } = body;

        // Validation
        if (!name || !scac || !mode) {
            return NextResponse.json({ error: 'Missing required fields: name, scac, mode' }, { status: 400 });
        }

        const newCarrier = await prisma.carrier.create({
            data: {
                name,
                scac,
                mode,
                rating: rating || 0,
                // Create services if provided
                services: services ? {
                    create: services.map((s: any) => ({
                        name: s.name,
                        code: s.code,
                        description: s.description
                    }))
                } : undefined
            },
            include: {
                services: true
            }
        });

        return NextResponse.json(newCarrier);
    } catch (error) {
        console.error('Failed to create carrier:', error);
        return NextResponse.json({ error: 'Failed to create carrier' }, { status: 500 });
    }
}
