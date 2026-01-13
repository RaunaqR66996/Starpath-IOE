import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const searchTerm = query.toLowerCase();
    const results: any[] = [];

    // Search orders
    try {
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
            { status: { contains: searchTerm, mode: 'insensitive' } },
            { customer: { customerName: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        },
        include: {
          customer: {
            select: { customerName: true, contactEmail: true }
          }
        },
        take: 5
      });

      orders.forEach(order => {
        results.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Order ${order.orderNumber}`,
          description: `Status: ${order.status} | Customer: ${order.customer?.customerName || 'Unknown'}`,
          status: order.status,
          actionLabel: 'View Order',
          actionUrl: `/orders/${order.id}`
        });
      });
    } catch (error) {
      console.error('Error searching orders:', error);
    }

    // Search inventory
    try {
      const inventory = await prisma.item.findMany({
        where: {
          OR: [
            { sku: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 5
      });

      inventory.forEach(item => {
        results.push({
          id: `inventory-${item.id}`,
          type: 'inventory',
          title: `${item.sku} - ${item.name}`,
          description: `Description: ${item.description || 'No description'}`,
          status: 'Available',
          actionLabel: 'View Details',
          actionUrl: `/inventory/${item.id}`
        });
      });
    } catch (error) {
      console.error('Error searching inventory:', error);
    }

    // Search shipments
    try {
      const shipments = await prisma.shipment.findMany({
        where: {
          OR: [
            { trackingNumber: { contains: searchTerm, mode: 'insensitive' } },
            { status: { contains: searchTerm, mode: 'insensitive' } },
            { stops: { some: { city: { contains: searchTerm, mode: 'insensitive' } } } }
          ]
        },
        take: 5,
        include: {
          stops: {
            orderBy: { sequence: 'asc' },
            take: 2
          }
        }
      });

      shipments.forEach(shipment => {
        const origin = shipment.stops[0]?.city || 'Unknown';
        const destination = shipment.stops[shipment.stops.length - 1]?.city || 'Unknown';
        results.push({
          id: `shipment-${shipment.id}`,
          type: 'truck',
          title: `Shipment ${shipment.trackingNumber}`,
          description: `From: ${origin} | To: ${destination}`,
          status: shipment.status,
          actionLabel: 'Track Shipment',
          actionUrl: `/shipments/${shipment.id}`
        });
      });
    } catch (error) {
      console.error('Error searching shipments:', error);
    }

    // Search suppliers
    try {
      const suppliers = await prisma.supplier.findMany({
        where: {
          OR: [
            { supplierName: { contains: searchTerm, mode: 'insensitive' } },
            { supplierType: { contains: searchTerm, mode: 'insensitive' } },
            { city: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 3
      });

      suppliers.forEach(supplier => {
        results.push({
          id: `supplier-${supplier.id}`,
          type: 'location',
          title: `Supplier: ${supplier.supplierName}`,
          description: `Type: ${supplier.supplierType} | Location: ${supplier.city}`,
          status: 'Active',
          actionLabel: 'View Supplier',
          actionUrl: `/suppliers/${supplier.id}`
        });
      });
    } catch (error) {
      console.error('Error searching suppliers:', error);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










