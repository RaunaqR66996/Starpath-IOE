import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get real-time metrics from database
    const [
      activeShipments,
      delayedShipments,
      totalValue
    ] = await Promise.all([
      // Active shipments
      prisma.shipment.count({
        where: {
          status: { in: ['IN_TRANSIT', 'PICKED_UP'] }
        }
      }),
      // Delayed shipments (approximated by overdue deliveries)
      prisma.shipment.count({
        where: {
          status: { in: ['IN_TRANSIT', 'PICKED_UP'] },
          estimatedDelivery: { lt: new Date() }
        }
      }),
      // Total value of active orders
      prisma.order.aggregate({
        where: {
          status: { in: ['CREATED', 'CONFIRMED', 'PICKING', 'SHIPPED'] }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // Calculate on-time delivery rate
    const totalDelivered = await prisma.shipment.count({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: oneHourAgo }
      }
    });

    // For now, use a simplified on-time calculation
    // TODO: Implement proper comparison between actualDelivery and estimatedDelivery
    const onTimeDelivered = totalDelivered > 0 ? Math.floor(totalDelivered * 0.95) : 0; // Mock 95% on-time rate
    const onTimeDelivery = totalDelivered > 0 ? (onTimeDelivered / totalDelivered) * 100 : 0;

    // Determine system health based on delayed shipments
    const systemHealth = delayedShipments === 0 ? 'healthy' : 
                        delayedShipments <= 3 ? 'warning' : 'critical';

    const realTimeData = {
      activeShipments,
      delayedShipments,
      onTimeDelivery: Math.round(onTimeDelivery * 10) / 10,
      totalValue: Number(totalValue._sum.totalAmount || 0),
      activeAlerts: 0, // No alerts model for now
      systemHealth
    };

    return NextResponse.json(realTimeData);
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time data' },
      { status: 500 }
    );
  }
}










