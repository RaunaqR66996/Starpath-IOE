import { Order, OrderStatus, Priority, Shipment, ShipmentStatus } from "./types";

// Helper to generate IDs
const generateId = (prefix: string, index: number) => `${prefix}-${2025000 + index}`;

// Mock Addresses
const ADDRESSES = [
    { street: "123 Logistics Way", city: "Atlanta", state: "GA", zip: "30303", country: "USA", coordinates: [-84.3880, 33.7490] as [number, number] },
    { street: "456 Commerce Blvd", city: "Dallas", state: "TX", zip: "75201", country: "USA", coordinates: [-96.7970, 32.7767] as [number, number] },
    { street: "789 Supply Chain Dr", city: "Chicago", state: "IL", zip: "60601", country: "USA", coordinates: [-87.6298, 41.8781] as [number, number] },
    { street: "101 Warehouse Rd", city: "Los Angeles", state: "CA", zip: "90012", country: "USA", coordinates: [-118.2437, 34.0522] as [number, number] },
    { street: "202 Dockside Ave", city: "Elizabeth", state: "NJ", zip: "07201", country: "USA", coordinates: [-74.2107, 40.6640] as [number, number] },
];

export const MOCK_ORDERS: Order[] = Array.from({ length: 50 }).map((_, i) => {
    const statusIdx = Math.floor(Math.random() * 9);
    const statuses: OrderStatus[] = ["DRAFT", "CONFIRMED", "PLANNED", "RELEASED", "PICKING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "INVOICED"];

    return {
        id: generateId("ORD", i),
        erpReference: `PO-${99000 + i}`,
        customerId: `CUST-${100 + (i % 5)}`,
        customerName: ["Acme Corp", "Globex Inc", "Soylent Corp", "Initech", "Umbrella Corp"][i % 5],
        originId: ["Kuehne Nagel East", "Los Angeles", "Texas"][i % 3],
        destination: ADDRESSES[i % ADDRESSES.length],
        status: statuses[statusIdx],
        priority: (Math.random() > 0.8 ? "HIGH" : "NORMAL") as Priority,
        requestedDeliveryDate: new Date(Date.now() + Math.random() * 1000000000).toISOString(),
        totalWeight: Math.floor(Math.random() * 500) + 10,
        totalValue: Math.floor(Math.random() * 5000) + 100,
        lines: [
            {
                lineNumber: 1,
                itemId: "SKU-1001",
                qtyOrdered: 10,
                qtyAllocated: 10,
                qtyPicked: 0,
                qtyShipped: 0,
                unitPrice: 50
            }
        ],
        tags: Math.random() > 0.7 ? ["Expedited"] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
});

export const MOCK_SHIPMENTS: Shipment[] = Array.from({ length: 10 }).map((_, i) => {
    const status: ShipmentStatus = ["PLANNING", "TENDERED", "DISPATCHED", "IN_TRANSIT", "ARRIVED"][i % 5] as ShipmentStatus;

    return {
        id: generateId("SHP", i),
        carrierId: ["UPS", "FedEx", "DHL", "XPO"][i % 4],
        serviceLevel: "LTL",
        origin: ADDRESSES[0],
        destination: ADDRESSES[1],
        status: status,
        orderIds: [MOCK_ORDERS[i].id, MOCK_ORDERS[i + 1]?.id].filter(Boolean),
        totalWeight: 500,
        cost: 1200,
        currentLocation: status === "IN_TRANSIT" ? [-90.0 + i, 35.0 + i] : undefined
    };
});
