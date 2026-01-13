"use server";

import { db } from "@/lib/db";
import { MOCK_ORDERS, MOCK_SHIPMENTS, MOCK_TASKS, MOCK_INVENTORY } from "@/lib/data-mocks";
import { ShipmentMapData } from "@/components/ioe/ShipmentsMap";

export interface SystemHealth {
    nodes: NodeStatus[];
    links: TopologyLink[];
    metrics: {
        openOrders: number;
        activeShipments: number;
        pendingTasks: number;
        inventoryValue: number;
    };
    alerts: Alert[];
    activeShipmentsData: ShipmentMapData[];
}

export interface NodeStatus {
    id: string;
    name: string;
    type: 'WAREHOUSE' | 'HUB' | 'STORE' | 'CUSTOMER';
    coords: [number, number];
    status: 'HEALTHY' | 'BUSY' | 'CRITICAL' | 'OFFLINE';
    loadPct: number;
    inventoryCount: number;
}

export interface TopologyLink {
    source: string;
    target: string;
    value: number; // e.g., number of shipments
    status: 'ACTIVE' | 'IDLE';
}

export interface Alert {
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    domain: 'ERP' | 'TMS' | 'WMS';
    message: string;
    timestamp: string;
}

// Simple Coordinate Lookup for Demo Cities
const CITY_COORDS: Record<string, [number, number]> = {
    "Los Angeles": [-118.2437, 34.0522],
    "New York": [-74.0060, 40.7128],
    "Laredo": [-99.5075, 27.5306],
    "Chicago": [-87.6298, 41.8781],
    "Dallas": [-96.7970, 32.7767],
    "Seattle": [-122.3321, 47.6062],
    "Miami": [-80.1918, 25.7617],
    "Phoenix": [-112.0740, 33.4484],
    "Denver": [-104.9903, 39.7392],
    "San Francisco": [-122.4194, 37.7749],
    "Atlanta": [-84.3880, 33.7490]
};

function getCoordsForCity(city: string): [number, number] {
    // Fuzzy match or default
    const key = Object.keys(CITY_COORDS).find(k => city.includes(k) || k.includes(city));
    return CITY_COORDS[key || "Los Angeles"] || [-118.2437, 34.0522];
}

/**
 * The "Brain" of the operation. Aggregates data from ERP, TMS, and WMS
 * into a single unified status report.
 */
export async function getSystemHealth(): Promise<SystemHealth> {
    try {
        // Parallel data fetch for performance
        // If DB is not available, we fall back to mocks at the array level for safety

        let orders, shipments, tasks, inventory;

        if (db) {
            [orders, shipments, tasks, inventory] = await Promise.all([
                db.order.findMany({ where: { status: { not: 'DELIVERED' } } }),
                db.shipment.findMany({ where: { status: { not: 'ARRIVED' } }, include: { orders: true } }),
                db.warehouseTask.findMany({ where: { status: 'PENDING' } }),
                db.inventory.findMany({ include: { item: true } })
            ]);
        } else {
            // Fallback to Mocks if DB connection failed/missing
            orders = MOCK_ORDERS;
            shipments = MOCK_SHIPMENTS;
            tasks = MOCK_TASKS;
            inventory = MOCK_INVENTORY;
        }

        // Calculate Metrics
        const openOrders = orders.length;
        const activeShipments = shipments.length;
        const pendingTasks = tasks.length;

        // Precise Inventory Value Calculation
        const inventoryValue = inventory.reduce((sum, row) => {
            const cost = (row as any).item?.cost || 0; // Type assertion since mock data might lack relations
            return sum + (row.quantity * cost);
        }, 0);

        // Process Shipments for Map Visualization
        const activeShipmentsData: ShipmentMapData[] = shipments.map(s => {
            // Unpack Address JSON if stored as such, or use typed fields
            // Assuming s.origin is an object { city: string, ... } as per schema
            const originCity = (s.origin as any)?.city || "Los Angeles";
            const destCity = (s.destination as any)?.city || "New York";

            return {
                id: s.id,
                origin: getCoordsForCity(originCity),
                destination: getCoordsForCity(destCity),
                label: `${s.id} (${s.carrierId})`,
                color: s.status === 'IN_TRANSIT' ? '#3b82f6' : '#64748b' // Blue if moving, Slate if planning
            };
        });


        // Generate Node Status based on Inventory & Task Load
        // In a real app, this would be grouped by 'warehouseId' or 'locationId'
        const nodes: NodeStatus[] = [
            {
                id: 'WH-LAX-01',
                name: 'Kuehne Nagel East',
                type: 'WAREHOUSE',
                coords: [-118.2437, 34.0522],
                status: pendingTasks > 50 ? 'CRITICAL' : pendingTasks > 20 ? 'BUSY' : 'HEALTHY',
                loadPct: Math.min(100, Math.floor((pendingTasks / 100) * 100)),
                inventoryCount: inventory.length
            },
            {
                id: 'HUB-TX',
                name: 'Laredo Hub',
                type: 'HUB',
                coords: [-99.5075, 27.5306],
                status: 'HEALTHY',
                loadPct: 45,
                inventoryCount: Math.floor(inventory.length * 0.4)
            },
            {
                id: 'WH-NJ',
                name: 'East Coast Node',
                type: 'WAREHOUSE',
                coords: [-74.0060, 40.7128],
                status: 'HEALTHY',
                loadPct: 22,
                inventoryCount: Math.floor(inventory.length * 0.2)
            }
        ];

        // Generate Links from Shipments
        // We aggregate shipments between same Origin-Destination pairs
        const linkMap = new Map<string, TopologyLink>();

        shipments.forEach(s => {
            const originCit = (s.origin as any)?.city || "Los Angeles";
            const destCit = (s.destination as any)?.city || "New York";

            // Map cities to our known Nodes if possible, otherwise generic
            // For this demo, let's map cities to specific Node IDs
            let sourceId = originCit.includes("Los Angeles") ? 'WH-LAX-01' :
                originCit.includes("Laredo") ? 'HUB-TX' :
                    originCit.includes("New Jersey") ? 'WH-NJ' : 'UNKNOWN';

            // If source is unknown, we act like it's an external supplier or customer node
            // For visualization, we might strictly only show links between known nodes for now
            // Or we add dynamic nodes. Let's stick to links between known nodes + one 'Customer' node

            let targetId = destCit.includes("New Jersey") ? 'WH-NJ' :
                destCit.includes("Laredo") ? 'HUB-TX' : 'CUST-METRO';

            const key = `${sourceId}-${targetId}`;
            if (!linkMap.has(key)) {
                linkMap.set(key, { source: sourceId, target: targetId, value: 0, status: 'IDLE' });
            }
            const link = linkMap.get(key)!;
            link.value += 1;
            if (s.status === 'IN_TRANSIT') link.status = 'ACTIVE';
        });

        // Add a Customer Node if we have shipments going there
        if (Array.from(linkMap.values()).some(l => l.target === 'CUST-METRO')) {
            nodes.push({
                id: 'CUST-METRO',
                name: 'Metro Distribution',
                type: 'CUSTOMER',
                coords: [-87.6298, 41.8781], // Chicago-ish
                status: 'HEALTHY',
                loadPct: 10,
                inventoryCount: 0
            });
        }

        const links = Array.from(linkMap.values());

        // Generate Intelligent Alerts
        const alerts: Alert[] = [];

        if (pendingTasks > 10) {
            alerts.push({
                id: 'ALT-WMS-01',
                severity: 'HIGH',
                domain: 'WMS',
                message: `${pendingTasks} picking tasks pending release`,
                timestamp: new Date().toISOString()
            });
        }

        if (activeShipments > 5) {
            alerts.push({
                id: 'ALT-TMS-01',
                severity: 'MEDIUM',
                domain: 'TMS',
                message: `High volume: ${activeShipments} shipments in pipeline`,
                timestamp: new Date().toISOString()
            });
        }

        return {
            nodes,
            links,
            metrics: {
                openOrders,
                activeShipments,
                pendingTasks,
                inventoryValue
            },
            alerts,
            activeShipmentsData
        };

    } catch (error) {
        console.error("Failed to fetch system health:", error);
        return {
            nodes: [],
            links: [],
            metrics: { openOrders: 0, activeShipments: 0, pendingTasks: 0, inventoryValue: 0 },
            alerts: [],
            activeShipmentsData: []
        };
    }
}
