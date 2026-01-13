import { Address } from "@/lib/types";

export interface RouteSegment {
    start: [number, number];
    end: [number, number];
    distance: number; // km
    duration: number; // minutes
    instruction: string;
}

export interface OptimizedRoute {
    segments: RouteSegment[];
    totalDistance: number;
    totalDuration: number;
    eta: string;
}

function getCoords(address: Address): [number, number] {
    return address.coordinates || [-74.006, 40.7128]; // Default NY
}

// Haversine formula for mock distance
function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371; // km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function optimizeRoute(origin: Address, destination: Address): Promise<OptimizedRoute> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const start = getCoords(origin);
    const end = getCoords(destination);

    // Create a mock curved path or weighpoints
    const dist = calculateDistance(start, end);
    const speed = 80; // km/h
    const duration = (dist / speed) * 60; // minutes

    // Mock segments - just a start and end for now, maybe a midpoint
    const segments: RouteSegment[] = [
        {
            start: start,
            end: end,
            distance: dist,
            duration: duration,
            instruction: `Drive from ${origin.city} to ${destination.city}`
        }
    ];

    return {
        segments,
        totalDistance: Math.round(dist),
        totalDuration: Math.round(duration),
        eta: new Date(Date.now() + duration * 60000).toISOString()
    };
}
