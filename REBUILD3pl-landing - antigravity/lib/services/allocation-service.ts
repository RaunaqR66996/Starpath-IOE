import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AllocationService {
    /**
     * Allocates inventory for a given order using FIFO strategy.
     * @param orderId The ID of the order to allocate.
     */
    static async allocateOrder(orderId: string) {
        console.log(`Allocating Order: ${orderId}`);

        // 1. Fetch Order and Items
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        });

        if (!order) throw new Error(`Order ${orderId} not found`);

        let allItemsAllocated = true;

        // 2. Iterate through Order Items
        for (const orderItem of order.orderItems) {
            const quantityNeeded = orderItem.quantity;
            let quantityAllocated = 0;

            // 3. Find Inventory (FIFO: Sort by receivedDate ASC)
            const inventoryItems = await prisma.inventoryItem.findMany({
                where: {
                    organizationId: order.organizationId,
                    itemId: orderItem.itemId,
                    quantityAvailable: { gt: 0 }
                },
                orderBy: { receivedDate: 'asc' }
            });

            // 4. Allocate from Inventory
            for (const invItem of inventoryItems) {
                if (quantityAllocated >= quantityNeeded) break;

                const remainingNeed = quantityNeeded - quantityAllocated;
                const take = Math.min(remainingNeed, invItem.quantityAvailable);

                // Create Allocation Record
                await prisma.allocation.create({
                    data: {
                        organizationId: order.organizationId,
                        orderId: order.id,
                        orderItemId: orderItem.id,
                        inventoryItemId: invItem.id,
                        quantity: take,
                        status: 'RESERVED'
                    }
                });

                // Update Inventory Item
                await prisma.inventoryItem.update({
                    where: { id: invItem.id },
                    data: {
                        quantityAvailable: { decrement: take },
                        quantityReserved: { increment: take }
                    }
                });

                quantityAllocated += take;
            }

            if (quantityAllocated < quantityNeeded) {
                allItemsAllocated = false;
                console.warn(`Partial allocation for Item ${orderItem.itemId}: ${quantityAllocated}/${quantityNeeded}`);
            }
        }

        // 5. Update Order Status
        const newStatus = allItemsAllocated ? 'ALLOCATED' : 'BACKORDER';
        await prisma.order.update({
            where: { id: order.id },
            data: { status: newStatus }
        });

        console.log(`Order ${order.orderNumber} status updated to: ${newStatus}`);
        return { orderId, status: newStatus };
    }
}
