import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock distance function (in a real app, use Google Maps or OSRM)
function calculateDistance(origin: string, dest: string): number {
    // Basic hash of strings to deterministic number for demo purposes
    // Returns miles
    const hash = (str: string) => str.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const d1 = hash(origin);
    const d2 = hash(dest);
    return Math.abs(d1 - d2) % 500 + 50; // Random distance 50-550 miles
}

// Optimization Logic
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { shipmentIds, scenarioName } = body;

        if (!shipmentIds || shipmentIds.length === 0) {
            return NextResponse.json({ error: 'No shipments selected' }, { status: 400 });
        }

        // 1. Fetch Shipments
        const shipments = await prisma.shipment.findMany({
            where: { id: { in: shipmentIds } },
            include: { orders: true }
        });

        // 2. Initialize "Scenario"
        const scenario = await prisma.optimizationScenario.create({
            data: {
                name: scenarioName || `RUN-${Date.now()}`,
                status: 'RUNNING',
                parameters: JSON.stringify({ shipments: shipmentIds.length })
            }
        });

        // 3. Simple Heuristic: Group by Destination Region (Zip Code prefix) as a proxy for "Savings"
        // In reality, we'd loop through pairs and calculate Clarke-Wright savings.
        // Group Logic: matches first 3 chars of destination string
        const routesMap = new Map<string, typeof shipments>();

        for (const s of shipments) {
            const region = (s.destination || "UNK").substring(0, 3); // "NYC", "LAX"
            if (!routesMap.has(region)) routesMap.set(region, []);
            routesMap.get(region)?.push(s);
        }

        const stats = { routesCreated: 0, savings: 0 };

        // 4. Create Routes from Groups
        for (const [region, shpGroup] of routesMap.entries()) {
            if (shpGroup.length === 0) continue;

            // Create a Route
            const totalWeight = shpGroup.reduce((sum, s) => sum + s.totalWeight, 0);

            // Assume 100 miles per stop + 500 miles trunk line
            const estimatedMiles = 500 + (shpGroup.length * 50);
            // Cost calculation: $2.50 per mile
            const cost = estimatedMiles * 2.50;

            // Compare vs singleton cost: (500 miles * 2.50) * N shipments
            const singletonCost = (500 * 2.50) * shpGroup.length;
            const savings = singletonCost - cost;
            stats.savings += savings;

            const route = await prisma.route.create({
                data: {
                    name: `Route ${region}-${Date.now().toString().slice(-4)}`,
                    status: 'OPTIMIZED',
                    totalDistance: estimatedMiles,
                    totalCost: cost,
                    savings: savings,
                    scenarioId: scenario.id
                }
            });

            // Create Stops
            let seq = 1;
            for (const s of shpGroup) {
                // Add Delivery Stop
                await prisma.routeStop.create({
                    data: {
                        routeId: route.id,
                        shipmentId: s.id,
                        sequence: seq++,
                        type: 'DELIVERY',
                        location: s.destination
                    }
                });

                // Update Shipment
                await prisma.shipment.update({
                    where: { id: s.id },
                    data: {
                        // Link logic could involve adding routeId to shipment directly if we wanted strict linking, 
                        // but RouteStop handles the M:N via the relation.
                        status: 'OPTIMIZED'
                    }
                });
            }
            stats.routesCreated++;
        }

        // 5. Wrap up
        await prisma.optimizationScenario.update({
            where: { id: scenario.id },
            data: {
                status: 'COMPLETED',
                // store results summary if needed
            }
        });

        return NextResponse.json({ success: true, scenarioId: scenario.id, ...stats });

    } catch (error) {
        console.error('Optimization Error:', error);
        return NextResponse.json({ error: 'Optimization failed' }, { status: 500 });
    }
}
