'use server';

import { PrismaClient } from '@prisma/client';
import { CargoItem } from '@/lib/types/trailer';

const prisma = new PrismaClient();

export async function getReadyToShipItems(warehouseCode: string = 'WH-WEST-01'): Promise<CargoItem[]> {
    // Fetch orders that are created but not yet shipped
    const orders = await prisma.order.findMany({
        where: {
            status: 'CREATED',
            // In a real app, we'd filter by warehouse via Order -> Warehouse relation or similar
        },
        include: {
            orderItems: {
                include: {
                    item: true
                }
            }
        }
    });

    const cargoItems: CargoItem[] = [];

    for (const order of orders) {
        for (const orderItem of order.orderItems) {
            const item = orderItem.item;

            // Parse dimensions
            // Use legacy fields if available, otherwise default
            // Note: Prisma types might need casting if fields are optional or legacy
            const l_ft = (Number((item as any).length) || 48) / 12; // inches to feet
            const w_ft = (Number((item as any).width) || 40) / 12;
            const h_ft = (Number((item as any).height) || 48) / 12;
            const weight_lbs = Number((item as any).weight) || 100;

            // Create a cargo item for each quantity
            for (let i = 0; i < orderItem.quantity; i++) {
                cargoItems.push({
                    id: `${order.orderNumber}-${item.sku}-${i + 1}`,
                    l: Number(l_ft.toFixed(2)),
                    w: Number(w_ft.toFixed(2)),
                    h: Number(h_ft.toFixed(2)),
                    weight_lbs: weight_lbs,
                    stackable: true, // Default
                    orientations: [[0, 1, 2], [1, 0, 2]] // Allow rotation on base
                });
            }
        }
    }

    return cargoItems;
}

// Stub function for createLoad - to be implemented
import { TMSService } from '@/lib/services/tms-service';



export async function createLoad(orderIds: string[]) {
    console.log('createLoad called with:', orderIds);

    try {
        const results = [];
        for (const orderId of orderIds) {
            // In a real app, we might group these into one shipment
            // For MVP, we'll auto-build one shipment per order using our service
            const shipment = await TMSService.autoBuildShipment(orderId);
            if (shipment) {
                results.push(shipment);
            }
        }

        return { success: true, count: results.length };
    } catch (error) {
        console.error('Failed to create load:', error);
        return { success: false, error: 'Failed to create load' };
    }
}
