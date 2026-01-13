export type OrderStatus =
    | "DRAFT"
    | "CONFIRMED"
    | "PLANNED" // TMS Planned
    | "RELEASED" // WMS Released
    | "PICKING"
    | "SHIPPED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "INVOICED";

export type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

// --- ERP Layer ---
export interface InventoryItem {
    id: string;
    itemId: string;
    quantity: number;
    locationId: string;
    warehouseId: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    coordinates?: [number, number]; // [lng, lat] for TMS
}

export interface Customer {
    id: string;
    name: string;
    tier: "Standard" | "Premuim" | "Strategic";
    defaultAddress: Address;
}

export interface SKU {
    id: string; // "SKU-101"
    name: string;
    category: string;
    unitWeight: number; // kg
    dims: [number, number, number]; // LxWxH cm
    hazmat: boolean;
}

export interface OrderLine {
    lineNumber: number;
    itemId: string;
    qtyOrdered: number;
    qtyAllocated: number;
    qtyPicked: number;
    qtyShipped: number;
    unitPrice: number;
}

// --- The Core "Unified Order" ---
export interface Order {
    id: string; // "ORD-2025-001"
    erpReference: string; // "PO-998877"

    customerId: string;
    customerName: string; // Denormalized for convenient UI

    originId: string; // Warehouse ID
    destination: Address;

    status: OrderStatus;
    priority: Priority;

    requestedDeliveryDate: string; // ISO Date
    totalWeight: number;
    totalValue: number;

    lines: OrderLine[];

    // Links to other domains
    shipmentId?: string; // TMS Link
    waveId?: string; // WMS Link
    invoiceId?: string; // Finance Link

    tags: string[];
    invoice?: Invoice;
    createdAt: string;
    updatedAt: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    status: "UNPAID" | "PAID" | "VOID" | "OVERDUE";
    orderId: string;
    amount: number;
    dueDate: string;
    paidAt?: string;
    createdAt: string;
    updatedAt: string;
}


// --- TMS Layer ---
export type ShipmentStatus = "PLANNING" | "TENDERED" | "DISPATCHED" | "IN_TRANSIT" | "ARRIVED";

export interface Shipment {
    id: string; // "SHP-5050"
    carrierId: string; // "UPS", "FEDEX", "KN"
    serviceLevel: "Ground" | "Air" | "LTL" | "FTL";

    truckId?: string;
    driverName?: string;

    origin: Address;
    destination: Address;

    status: ShipmentStatus;
    currentLocation?: [number, number];
    eta?: string;

    orderIds: string[]; // Grouped orders
    totalWeight: number;
    cost: number;
}

// --- WMS Layer ---
// --- WMS / Execution Layer ---
export type TaskType = "PICK" | "CREDIT_CHECK" | "PACK" | "SHIP_RELEASE";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface WarehouseTask {
    id: string; // "TSK-001"
    type: TaskType;
    status: TaskStatus;
    priority: Priority;

    orderId?: string;
    itemId?: string;
    qty?: number;

    locationId?: string; // Source
    toLocationId?: string; // Dest

    assignedUser?: string;
    createdAt: string;
    updatedAt: string;
}
