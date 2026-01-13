
import { Order, OrderStatus, Priority, Customer, Address, Shipment, ShipmentStatus, InventoryItem, WarehouseTask, TaskType, TaskStatus } from "@/lib/types";

export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: "CUST-001",
        name: "Acme Corp (Mock)",
        tier: "Standard",
        defaultAddress: {
            street: "123 Industrial Pkwy",
            city: "Los Angeles",
            state: "CA",
            zip: "90001",
            country: "USA"
        }
    },
    {
        id: "CUST-002",
        name: "Global Tech (Mock)",
        tier: "Strategic",
        defaultAddress: {
            street: "456 Tech Blvd",
            city: "San Francisco",
            state: "CA",
            zip: "94105",
            country: "USA"
        }
    }
];

export const MOCK_ORDERS: Order[] = [
    {
        id: "ORD-MOCK-001",
        erpReference: "PO-998877",
        customerId: "CUST-001",
        customerName: "Acme Corp",
        originId: "WH-LAX-01",
        destination: {
            street: "100 Industrial Way",
            city: "Phoenix",
            state: "AZ",
            zip: "85001",
            country: "USA"
        },
        status: "PLANNED",
        priority: "NORMAL",
        requestedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        totalWeight: 1500.5,
        totalValue: 50000,
        lines: [
            {
                lineNumber: 1,
                itemId: "SKU-A-101",
                qtyOrdered: 100,
                qtyAllocated: 100,
                qtyPicked: 0,
                qtyShipped: 0,
                unitPrice: 50
            }
        ],
        shipmentId: "SHP-mock-1",
        tags: ["Urgent", "Retail"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "ORD-MOCK-102",
        erpReference: "PO-998878",
        customerId: "CUST-002",
        customerName: "Global Tech",
        originId: "WH-LAX-01",
        destination: {
            street: "200 Commerce Dr",
            city: "Las Vegas",
            state: "NV",
            zip: "89101",
            country: "USA"
        },
        status: "CONFIRMED",
        priority: "HIGH",
        requestedDeliveryDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        totalWeight: 800.0,
        totalValue: 12500,
        lines: [],
        tags: ["Standard"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: "ORD-MOCK-103",
        erpReference: "PO-998879",
        customerId: "CUST-001",
        customerName: "Acme Corp",
        originId: "WH-LAX-01",
        destination: { street: "123 Mock St", city: "Mock City", state: "CA", zip: "90001", country: "USA" },
        status: "SHIPPED",
        priority: "LOW",
        requestedDeliveryDate: new Date(Date.now() - 86400000).toISOString(),
        totalWeight: 200,
        totalValue: 1000,
        lines: [],
        tags: ["Past Due"],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const MOCK_SHIPMENTS: Shipment[] = [
    {
        id: "SHP-mock-1",
        carrierId: "UPS",
        serviceLevel: "LTL",
        truckId: "TRK-001",
        driverName: "John Doe",
        origin: { street: "Warehouse A", city: "Los Angeles", state: "CA", zip: "90000", country: "USA" },
        destination: { street: "Distribution Hub", city: "Phoenix", state: "AZ", zip: "85000", country: "USA" },
        status: "PLANNING",
        totalWeight: 1500.5,
        cost: 450.0,
        orderIds: ["ORD-MOCK-001"]
    }
];

export const MOCK_INVENTORY: InventoryItem[] = [
    {
        id: "INV-001",
        itemId: "SKU-A-101",
        quantity: 500,
        locationId: "bin-ZONE-A-1-1-1",
        warehouseId: "WH-LAX-01"
    },
    {
        id: "INV-002",
        itemId: "SKU-B-202",
        quantity: 1200,
        locationId: "bin-ZONE-A-1-2-1",
        warehouseId: "WH-LAX-01"
    }
];

export const MOCK_TASKS: WarehouseTask[] = [
    {
        id: "TSK-001",
        type: "PICK",
        status: "PENDING",
        priority: "HIGH",
        orderId: "ORD-MOCK-001",
        itemId: "SKU-A-101",
        qty: 50,
        locationId: "bin-ZONE-A-1-1-1",
        toLocationId: "lane-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];
