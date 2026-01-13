import { db } from "@/lib/db";

export interface CapacityLoad {
    workCenterId: string;
    code: string;
    capacityHours: number;
    loadedHours: number;
    utilization: number;
    activeJobs: number;
}

export async function calculateCapacityLoad(): Promise<CapacityLoad[]> {
    // 1. Fetch Work Centers
    const workCenters = await db.workCenter.findMany();

    // Map for aggregation
    const loadMap = new Map<string, CapacityLoad>();

    workCenters.forEach(wc => {
        loadMap.set(wc.id, {
            workCenterId: wc.id,
            code: wc.code,
            capacityHours: wc.capacityHours || 8,
            loadedHours: 0,
            utilization: 0,
            activeJobs: 0
        });
    });

    // 2. Fetch Active Production Orders
    // We only care about orders that consume capacity (Released/In Progress/Planned)
    const activeOrders = await db.productionOrder.findMany({
        where: {
            status: { in: ['PLANNED', 'RELEASED', 'IN_PROGRESS'] }
        },
        include: {
            item: {
                include: {
                    routings: {
                        where: { isActive: true },
                        take: 1
                    }
                }
            }
        }
    });

    // 3. Calculate Load
    for (const order of activeOrders) {
        const routing = order.item.routings[0];
        if (!routing || !routing.steps) continue;

        let steps: any[] = [];
        try {
            steps = JSON.parse(routing.steps);
            // Expected format: [{ sequence: 10, workCenterId: "...", setupTime: 10, runTime: 5 }]
            // Times assumed in Minutes
        } catch (e) {
            console.warn(`Failed to parse routing steps for ${order.item.sku}`);
            continue;
        }

        for (const step of steps) {
            if (loadMap.has(step.workCenterId)) {
                const wc = loadMap.get(step.workCenterId)!;

                // Load = (RunTime * Qty) + SetupTime (Minutes)
                const runLoad = (step.runTime || 0) * order.quantity;
                const setLoad = (step.setupTime || 0);

                // Convert to Hours for the accumulator
                wc.loadedHours += (runLoad + setLoad) / 60;
                wc.activeJobs++;
            }
        }
    }

    // 4. Finalize Utilization
    const results: CapacityLoad[] = [];
    loadMap.forEach(wc => {
        if (wc.capacityHours > 0) {
            wc.utilization = Math.round((wc.loadedHours / wc.capacityHours) * 100);
        } else {
            wc.utilization = 100; // Overload if capacity is 0
        }
        results.push(wc);
    });

    return results.sort((a, b) => b.utilization - a.utilization);
}
