import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const [
      totalShipments,
      inTransit,
      delivered,
      delayed,
      onTimeDeliveries,
      totalDeliveries
    ] = await Promise.all([
      // Total shipments
      prisma.shipment.count(),
      // In transit shipments
      prisma.shipment.count({
        where: {
          status: { in: ['in_transit', 'picked_up', 'out_for_delivery'] }
        }
      }),
      // Delivered shipments
      prisma.shipment.count({
        where: { status: 'delivered' }
      }),
      // Delayed shipments - using actualDelivery vs estimatedDelivery
      prisma.shipment.count({
        where: {
          status: { in: ['in_transit', 'picked_up', 'out_for_delivery'] },
          actualDelivery: { not: null },
          estimatedDelivery: { not: null }
        }
      }),
      // On-time deliveries
      prisma.shipment.count({
        where: {
          status: 'delivered',
          actualDelivery: { not: null },
          estimatedDelivery: { not: null }
        }
      }),
      // Total deliveries
      prisma.shipment.count({
        where: { status: 'delivered' }
      })
    ]);

    const onTimeDelivery = totalDeliveries > 0 ?
      (onTimeDeliveries / totalDeliveries) * 100 : 0;

    const summary = {
      totalShipments,
      inTransit,
      delivered,
      delayed,
      onTimeDelivery: Math.round(onTimeDelivery * 10) / 10
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching shipment summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment summary' },
      { status: 500 }
    );
  }
}










