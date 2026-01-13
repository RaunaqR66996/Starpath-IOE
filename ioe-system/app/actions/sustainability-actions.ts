"use server";

export interface SustainabilityMetrics {
    totalCarbonKg: number;
    greenEnergyPercent: number;
    wasteRecycledKg: number;
    offsetCredits: number;
}

import { db } from "@/lib/db";

export async function getSustainabilityMetrics() {
    let totalCarbon = 0;

    // FETCH REAL DATA
    if (db) {
        try {
            // Count emissions for all active or delivered shipments
            const shipments = await db.shipment.findMany({
                where: {
                    status: { in: ['IN_TRANSIT', 'DELIVERED', 'ARRIVED'] }
                }
            });

            // Calculate emission for each shipment
            for (const s of shipments) {
                // Heuristic: If we don't have real distance, assume 'Long Haul' (2000km) vs 'Local' (100km)
                // In a real refined system, we'd calculate geodesic distance between origin/dest coords
                const distance = 2000;
                const weight = 1000; // Assume 1 ton per shipment if unknown

                // roughly 0.1 kg CO2 per ton-km for truck
                const emissionFactor = 0.1;

                totalCarbon += (distance * (weight / 1000) * emissionFactor);
            }

        } catch (e) {
            console.warn("Failed to fetch shipments for ESG:", e);
        }
    }

    return {
        totalCarbonKg: Number(totalCarbon.toFixed(1)),
        // These properties remain semi-static or simulated until we have Facility management modules
        greenEnergyPercent: 68,
        wasteRecycledKg: 1240,
        offsetCredits: Math.floor(totalCarbon * 0.2) // Assume we offset 20% automatically
    };
}

export async function calculateShipmentEmission(distanceKm: number, weightKg: number, mode: 'AIR' | 'TRUCK' | 'SEA') {
    // Emission factors (kg CO2 per ton-km)
    const factors = {
        AIR: 0.5,
        TRUCK: 0.1,
        SEA: 0.01
    };

    const tonRate = weightKg / 1000;
    const emission = distanceKm * tonRate * factors[mode];

    return {
        emissionKg: Number(emission.toFixed(2)),
        offsetCost: Number((emission * 0.02).toFixed(2)) // $0.02 per kg CO2
    };
}

export async function generateSustainabilityReport() {
    // In a real app, this would query aggregated data from DB
    return {
        id: `ESG-${new Date().getFullYear()}-Q4`,
        generatedAt: new Date().toISOString(),
        nodes: [
            { name: "LA Facility", rating: "A", energySource: "Solar/Grid" },
            { name: "Laredo Hub", rating: "B+", energySource: "Grid (Wind Offset)" },
            { name: "East Coast Node", rating: "A-", energySource: "Hydro" }
        ],
        totalReduction: "12% YoY"
    };
}
