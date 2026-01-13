import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Active Shipments (In Transit)
        const activeShipmentsCount = await prisma.shipment.count({
            where: {
                status: {
                    in: ['SHIPPED', 'IN_TRANSIT', 'PICKED_UP', 'OUT_FOR_DELIVERY']
                }
            }
        });

        // 2. Deliveries Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const deliveriesTodayCount = await prisma.shipment.count({
            where: {
                status: 'DELIVERED',
                actualDelivery: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // 3. Recent Activity (Latest Tracking Events)
        const recentActivity = await prisma.trackingEvent.findMany({
            take: 5,
            orderBy: {
                timestamp: 'desc'
            },
            include: {
                shipment: {
                    select: {
                        shipmentNumber: true,
                        status: true
                    }
                }
            }
        });

        // 4. On-Time Delivery Rate (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deliveredShipments = await prisma.shipment.findMany({
            where: {
                status: 'DELIVERED',
                actualDelivery: {
                    gte: thirtyDaysAgo
                },
                estimatedDelivery: {
                    not: null
                }
            },
            select: {
                actualDelivery: true,
                estimatedDelivery: true
            }
        });

        let onTimeCount = 0;
        deliveredShipments.forEach(shipment => {
            if (shipment.actualDelivery && shipment.estimatedDelivery) {
                if (shipment.actualDelivery <= shipment.estimatedDelivery) {
                    onTimeCount++;
                }
            }
        });

        const onTimeDeliveryRate = deliveredShipments.length > 0
            ? (onTimeCount / deliveredShipments.length) * 100
            : 100; // Default to 100% if no data

        return NextResponse.json({
            activeShipments: activeShipmentsCount,
            deliveriesToday: deliveriesTodayCount,
            recentActivity: recentActivity.map(event => ({
                id: event.id,
                description: event.description,
                timestamp: event.timestamp,
                shipmentNumber: event.shipment?.shipmentNumber
            })),
            onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10 // Round to 1 decimal
        });

    } catch (error) {
        console.error('Error fetching TMS dashboard data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
