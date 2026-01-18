// @ts-nocheck
import { db } from "@/lib/db";
import { Order, OrderStatus, Priority, Customer, Address, Shipment, ShipmentStatus, InventoryItem, WarehouseTask, TaskType, TaskStatus } from "@/lib/types";

// Re-map Prisma result to our internal Order interface
function mapPrismaOrder(pOrder: any): Order {
    return {
        id: pOrder.id,
        erpReference: pOrder.erpReference,
        customerId: pOrder.customerId,
        customerName: pOrder.customerName,
        originId: pOrder.originId,
        destination: pOrder.destination as any, // Cast JSON
        status: pOrder.status as OrderStatus,
        priority: pOrder.priority as Priority,
        requestedDeliveryDate: pOrder.requestedDeliveryDate.toISOString(),
        totalWeight: pOrder.totalWeight,
        totalValue: pOrder.totalValue,
        lines: pOrder.lines?.map((l: any) => ({
            lineNumber: l.lineNumber,
            itemId: l.itemId,
            item: l.item, // Extra data from include
            qtyOrdered: l.qtyOrdered,
            qtyAllocated: l.qtyAllocated,
            qtyPicked: l.qtyPicked,
            qtyShipped: l.qtyShipped,
            unitPrice: l.unitPrice
        })),
        invoice: pOrder.invoice ? {
            ...pOrder.invoice,
            amount: Number(pOrder.invoice.amount),
            status: pOrder.invoice.status,
            dueDate: pOrder.invoice.dueDate.toISOString(),
            createdAt: pOrder.invoice.createdAt.toISOString(),
            updatedAt: pOrder.invoice.updatedAt.toISOString(),
            paidAt: pOrder.invoice.paidAt?.toISOString()
        } : undefined,
        shipmentId: pOrder.shipmentId,
        tags: pOrder.tags,
        createdAt: pOrder.createdAt.toISOString(),
        updatedAt: pOrder.updatedAt.toISOString(),
    };
}

export async function getOrders(): Promise<Order[]> {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const prismaOrders = await db.order.findMany({
            include: {
                lines: true,
                customer: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return prismaOrders.map(mapPrismaOrder);
    } catch (error) {
        console.error("Failed to fetch orders from DB:", error);
        return [];
    }
}

export async function getOrder(id: string): Promise<Order | null> {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const order = await db.order.findUnique({
            where: { id },
            include: {
                lines: {
                    include: { item: true }
                },
                customer: true,
                invoice: true
            }
        });

        if (!order) return null;
        return mapPrismaOrder(order);
    } catch (error) {
        console.error(`Failed to fetch order ${id}:`, error);
        return null;
    }
}

function mapPrismaCustomer(pCust: any): Customer {
    return {
        id: pCust.id,
        name: pCust.name,
        tier: pCust.tier as "Standard" | "Premuim" | "Strategic",
        defaultAddress: pCust.defaultAddress as unknown as Address,
    }
}

export async function getCustomers(): Promise<Customer[]> {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const customers = await db.customer.findMany({
            orderBy: { name: 'asc' }
        });
        return customers.map(mapPrismaCustomer);
    } catch (error) {
        console.error("Failed to fetch customers:", error);
        return [];
    }
}

function mapPrismaShipment(pShip: any): Shipment {
    return {
        id: pShip.id,
        carrierId: pShip.carrierId,
        serviceLevel: pShip.serviceLevel as any,
        truckId: pShip.truckId,
        driverName: pShip.driverName,
        origin: pShip.origin as unknown as Address,
        destination: pShip.destination as unknown as Address,
        status: pShip.status as ShipmentStatus,
        currentLocation: pShip.currentLocation as unknown as [number, number],
        eta: pShip.eta?.toISOString(),
        orderIds: [], // We might need to fetch this separately if needed
        totalWeight: pShip.totalWeight,
        cost: pShip.cost
    }
}

export async function getShipments(): Promise<Shipment[]> {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const shipments = await db.shipment.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return shipments.map(mapPrismaShipment);
    } catch (error) {
        console.error("Failed to fetch shipments:", error);
        return [];
    }
}

export async function getShipment(id: string): Promise<Shipment | null> {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const shipment = await db.shipment.findUnique({
            where: { id }
        });
        if (!shipment) return null;
        return mapPrismaShipment(shipment);
    } catch (error) {
        console.error(`Failed to fetch shipment ${id}:`, error);
        return null;
    }
}

function mapPrismaInventory(pInv: any): InventoryItem {
    return {
        id: pInv.id,
        itemId: pInv.itemId,
        quantity: pInv.quantity,
        locationId: pInv.locationId,
        warehouseId: pInv.warehouseId
    }
}

export async function getInventory(warehouseId?: string): Promise<InventoryItem[]> {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const where = warehouseId ? { warehouseId } : {};
        const inventory = await db.inventory.findMany({
            where
        });
        return inventory.map(mapPrismaInventory);
    } catch (error) {
        console.error("Failed to fetch inventory:", error);
        return [];
    }
}

// --- Warehouse Tasks ---

function mapPrismaTask(pTask: any): WarehouseTask {
    return {
        id: pTask.id,
        type: pTask.type as TaskType,
        status: pTask.status as TaskStatus,
        priority: pTask.priority as any,
        orderId: pTask.orderId,
        itemId: pTask.itemId,
        qty: pTask.qty,
        locationId: pTask.locationId,
        toLocationId: pTask.toLocationId,
        assignedUser: pTask.assignedUser,
        createdAt: pTask.createdAt.toISOString(),
        updatedAt: pTask.updatedAt.toISOString()
    }
}

export async function getTasks(status?: TaskStatus): Promise<WarehouseTask[]> {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const where = status ? { status } : {};
        const tasks = await db.warehouseTask.findMany({
            where,
            orderBy: { createdAt: 'asc' }
        });
        return tasks.map(mapPrismaTask);
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return [];
    }
}

export async function createTask(taskData: Partial<WarehouseTask>) {
    try {
        if (!db) throw new Error("DB Client not initialized");
        const task = await db.warehouseTask.create({
            data: {
                type: taskData.type || "PICK",
                status: "PENDING",
                priority: taskData.priority || "NORMAL",
                orderId: taskData.orderId,
                itemId: taskData.itemId,
                qty: taskData.qty,
                locationId: taskData.locationId,
                toLocationId: taskData.toLocationId,
                assignedUser: taskData.assignedUser
            }
        });
        return mapPrismaTask(task);
    } catch (error) {
        console.error("Failed to create task:", error);
        return null;
    }
}
