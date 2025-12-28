import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TMSService } from '@/lib/services/tms-service';
import { tool } from 'ai';

export const aiTools = {
    // --- ORDER TOOLS ---
    searchOrders: tool({
        description: 'Search for orders by status, customer name, or order number.',
        parameters: z.object({
            query: z.string().describe('The search term (order number, customer name)'),
            status: z.enum(['CREATED', 'ALLOCATED', 'PLANNED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'BACKORDER']).optional().describe('Filter by order status'),
        }),
        execute: async ({ query, status }: { query: string; status?: string }) => {
            const where: any = {
                OR: [
                    { orderNumber: { contains: query, mode: 'insensitive' } },
                    { customer: { customerName: { contains: query, mode: 'insensitive' } } },
                ],
            };
            if (status) {
                where.status = status;
            }

            const orders = await prisma.order.findMany({
                where,
                take: 5,
                include: { customer: true, orderItems: true },
                orderBy: { createdAt: 'desc' }
            });

            return orders.map(o => ({
                id: o.id,
                number: o.orderNumber,
                customer: o.customer.customerName,
                status: o.status,
                total: o.totalAmount,
                items: o.orderItems.length
            }));
        },
    }),

    // --- INVENTORY TOOLS ---
    checkInventory: tool({
        description: 'Check inventory levels for a specific SKU or Item Name.',
        parameters: z.object({
            sku: z.string().describe('The SKU or Product Name to search for'),
        }),
        execute: async ({ sku }: { sku: string }) => {
            const items = await prisma.inventoryItem.findMany({
                where: {
                    OR: [
                        { sku: { contains: sku, mode: 'insensitive' } },
                        { item: { productName: { contains: sku, mode: 'insensitive' } } }
                    ]
                },
                include: { warehouse: true, item: true }
            });

            if (items.length === 0) return `No inventory found for "${sku}".`;

            return items.map(i => ({
                sku: i.sku,
                name: i.item.productName,
                warehouse: i.warehouse.warehouseName,
                available: i.quantityAvailable,
                reserved: i.quantityReserved,
                onHand: i.quantityOnHand
            }));
        },
    }),

    // --- SHIPMENT TOOLS ---
    getShipmentDetails: tool({
        description: 'Get details of a specific shipment by Shipment Number.',
        parameters: z.object({
            shipmentNumber: z.string().describe('The shipment number (e.g., SHP-123)'),
        }),
        execute: async ({ shipmentNumber }: { shipmentNumber: string }) => {
            const shipment = await prisma.shipment.findUnique({
                where: { shipmentNumber },
                include: { carrier: true, pieces: true }
            });

            if (!shipment) return `Shipment ${shipmentNumber} not found.`;

            return {
                number: shipment.shipmentNumber,
                status: shipment.status,
                carrier: shipment.carrier?.carrierName || 'Unassigned',
                pieces: shipment.pieces.length,
                weight: shipment.totalWeight,
                destination: 'See Order Details' // Simplified for tool response
            };
        },
    }),

    // --- ACTION TOOLS ---
    createLoadForOrder: tool({
        description: 'Create a shipment (load) for a specific Order ID or Order Number.',
        parameters: z.object({
            orderIdentifier: z.string().describe('The Order Number or Order ID'),
        }),
        execute: async ({ orderIdentifier }: { orderIdentifier: string }) => {
            // 1. Find the order first
            const order = await prisma.order.findFirst({
                where: {
                    OR: [
                        { id: orderIdentifier },
                        { orderNumber: orderIdentifier }
                    ]
                }
            });

            if (!order) return `Order ${orderIdentifier} not found.`;
            if (order.status !== 'ALLOCATED') return `Order ${order.orderNumber} is in status ${order.status}. It must be ALLOCATED to create a load.`;

            // 2. Call the service
            try {
                const shipment = await TMSService.autoBuildShipment(order.id);
                if (!shipment) return `Failed to create shipment. Check logs.`;
                return `Successfully created Shipment ${shipment.shipmentNumber} for Order ${order.orderNumber}.`;
            } catch (e: any) {
                return `Error creating load: ${e.message}`;
            }
        },
    }),

    getSystemStatus: tool({
        description: 'Get an overview of the system status (Order counts by status).',
        parameters: z.object({}),
        execute: async () => {
            const statusCounts = await prisma.order.groupBy({
                by: ['status'],
                _count: { status: true }
            });

            const formatted = statusCounts.map(s => `${s.status}: ${s._count.status}`).join(', ');
            return `Current System Status (Order Counts): ${formatted || 'No active orders'}`;
        }
    })
};
