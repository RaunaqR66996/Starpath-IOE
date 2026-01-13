'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getOutboundOrders(siteId: string) {
    try {
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['CREATED', 'ALLOCATED', 'STAGED', 'PICKED', 'PACKED', 'SHIPPED', 'LOAD_PLANNED']
                }
            },
            include: {
                customer: true,
                orderItems: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: order.customer.customerName,
            items: order.orderItems.length,
            status: order.status,
            priority: order.priority
        }))
    } catch (error) {
        console.error('Failed to fetch outbound orders:', error)
        return []
    }
}

export async function allocateOrder(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { orderItems: true }
        })

        if (!order) throw new Error('Order not found')

        // 1. Check Inventory for all items
        for (const item of order.orderItems) {
            const inventory = await prisma.inventoryItem.findFirst({
                where: { itemId: item.itemId }
            })

            if (!inventory || inventory.quantityAvailable < item.quantity) {
                throw new Error(`Insufficient inventory for item ${item.itemId}`)
            }
        }

        // 2. Transaction: Reserve Inventory
        const result = await prisma.$transaction(async (tx) => {
            // Reserve Inventory
            for (const item of order.orderItems) {
                const inventory = await tx.inventoryItem.findFirst({
                    where: { itemId: item.itemId }
                })

                if (inventory) {
                    await tx.inventoryItem.update({
                        where: { id: inventory.id },
                        data: {
                            quantityAvailable: { decrement: item.quantity },
                            quantityReserved: { increment: item.quantity }
                        }
                    })
                }
            }

            // Update Order Status
            return await tx.order.update({
                where: { id: orderId },
                data: { status: 'ALLOCATED' }
            })
        })

        try {
            revalidatePath('/wms-create/outbound')
            revalidatePath('/tms3/orders')
        } catch (e) {
            // Ignore revalidatePath error in scripts
        }
        return { success: true, order: result }
    } catch (error: any) {
        console.error('Failed to allocate order:', error)
        return { success: false, error: error.message || 'Failed to allocate order' }
    }
}

export async function pickOrder(orderId: string) {
    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PICKED' }
        })

        try {
            revalidatePath('/wms-create/outbound')
            revalidatePath('/tms3/orders')
        } catch (e) {
            // Ignore revalidatePath error in scripts
        }
        return { success: true, order }
    } catch (error) {
        console.error('Failed to pick order:', error)
        return { success: false, error: 'Failed to pick order' }
    }
}

export async function packOrder(orderId: string) {
    try {
        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PACKED' }
        })

        try {
            revalidatePath('/wms-create/outbound')
            revalidatePath('/tms3/orders')
        } catch (e) {
            // Ignore revalidatePath error in scripts
        }
        return { success: true, order }
    } catch (error) {
        console.error('Failed to pack order:', error)
        return { success: false, error: 'Failed to pack order' }
    }
}

export async function shipOrder(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true }
        })

        if (!order) throw new Error('Order not found')

        // Transaction: Update Order Status AND Create Shipment
        const result = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: 'SHIPPED' }
            })

            const shipment = await tx.shipment.create({
                data: {
                    organizationId: order.organizationId,
                    shipmentNumber: `SHP-${order.orderNumber}`,
                    status: 'SHIPPED',
                    carrierName: 'FedEx', // Default for MVP
                    trackingNumber: `TRK-${Math.floor(Math.random() * 1000000)}`,
                    totalWeight: 10, // Default
                    totalValue: order.totalAmount
                }
            })

            return { updatedOrder, shipment }
        })

        try {
            revalidatePath('/wms-create/outbound')
            revalidatePath('/tms3/orders')
        } catch (e) {
            // Ignore revalidatePath error in scripts
        }
        return { success: true, result }
    } catch (error) {
        console.error('Failed to ship order:', error)
        return { success: false, error: 'Failed to ship order' }
    }
}
