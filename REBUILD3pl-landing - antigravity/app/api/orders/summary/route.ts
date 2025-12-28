import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get order statistics
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalValue,
      onTimeDeliveries,
      totalDeliveries
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      // Pending orders
      prisma.order.count({
        where: { status: 'pending' }
      }),
      // Processing orders
      prisma.order.count({
        where: { status: 'processing' }
      }),
      // Shipped orders
      prisma.order.count({
        where: { status: 'shipped' }
      }),
      // Delivered orders
      prisma.order.count({
        where: { status: 'delivered' }
      }),
      // Total value
      prisma.order.aggregate({
        where: {
          status: { in: ['pending', 'processing', 'shipped', 'delivered'] }
        },
        _sum: { totalAmount: true }
      }),
      // On-time deliveries
      prisma.shipment.count({
        where: {
          status: 'delivered',
        }
      }),
      // Total deliveries
      prisma.shipment.count({
        where: {
          status: 'delivered'
        }
      })
    ]);

    const averageOrderValue = totalOrders > 0 ? 
      Number(totalValue._sum.totalAmount || 0) / totalOrders : 0;
    
    const onTimeDelivery = totalDeliveries > 0 ? 
      (onTimeDeliveries / totalDeliveries) * 100 : 0;

    const summary = {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalValue: Number(totalValue._sum.totalAmount || 0),
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      onTimeDelivery: Math.round(onTimeDelivery * 10) / 10
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching order summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order summary' },
      { status: 500 }
    );
  }
}










