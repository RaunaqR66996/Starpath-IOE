/**
 * WMS Shipping API
 * Handles shipment confirmation and handoff to TMS
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const confirmShipmentSchema = z.object({
  orderId: z.string(),
  siteId: z.string(),
  carrierId: z.string().optional(),
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  serviceLevel: z.string().optional(),
  shippingCost: z.number().nonnegative().optional(),
  shipmentDate: z.string().datetime().optional(),
})

// GET /api/wms/shipping - List orders ready to ship
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Get orders in PACKED status (ready to ship)
    const orders = await prisma.order.findMany({
      where: {
        organizationId: siteId,
        status: 'PACKED',
      },
      include: {
        customer: {
          select: {
            customerName: true,
            addressLine1: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        orderItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50,
    })

    // Transform to shipping tasks
    const shippingTasks = orders.map((order) => ({
      id: `ship-${order.id}`,
      orderNumber: order.orderNumber,
      orderId: order.id,
      customer: {
        name: order.customer?.customerName,
        address: `${order.customer?.addressLine1}, ${order.customer?.city}, ${order.customer?.state} ${order.customer?.zipCode}`,
      },
      itemCount: order.orderItems.length,
      totalValue: order.totalAmount,
      status: 'READY_TO_SHIP',
      priority: order.priority || 'NORMAL',
      createdAt: order.createdAt,
    }))

    logger.info('Fetched shipping tasks', {
      siteId,
      count: shippingTasks.length,
    })

    return NextResponse.json({
      success: true,
      data: shippingTasks,
      total: shippingTasks.length,
    })

  } catch (error) {
    logger.error('Error fetching shipping tasks', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shipping tasks',
      },
      { status: 500 }
    )
  }
}

// POST /api/wms/shipping - Confirm shipment ready
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = confirmShipmentSchema.parse(body)

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: validatedData.orderId },
      include: {
        customer: true,
        orderItems: {
          include: {
            item: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order ${validatedData.orderId} not found` },
        { status: 404 }
      )
    }

    if (order.status !== 'PACKED') {
      return NextResponse.json(
        { success: false, error: `Order must be PACKED before shipping. Current status: ${order.status}` },
        { status: 400 }
      )
    }

    // Generate shipment number
    const lastShipment = await prisma.shipment.findFirst({
      where: { organizationId: validatedData.siteId },
      orderBy: { createdAt: 'desc' },
      select: { shipmentNumber: true },
    })

    const shipmentCount = lastShipment
      ? parseInt(lastShipment.shipmentNumber.split('-').pop() || '0') + 1
      : 1
    const shipmentNumber = `SHIP-${new Date().getFullYear()}-${String(shipmentCount).padStart(6, '0')}`

    // Create shipment record
    const shipment = await prisma.shipment.create({
      data: {
        organizationId: validatedData.siteId,
        shipmentNumber,
        status: 'CREATED',
        mode: 'PARCEL',
        carrierId: validatedData.carrierId,
        carrierName: validatedData.carrierName,
        trackingNumber: validatedData.trackingNumber,
        serviceLevel: validatedData.serviceLevel,
        shippingCost: validatedData.shippingCost,
        totalWeight: order.orderItems.reduce((sum, item) => sum + (item.quantity * 1), 0), // Assume 1kg per item
        totalValue: order.totalAmount,
        pickupDate: validatedData.shipmentDate ? new Date(validatedData.shipmentDate) : new Date(),
      },
    })

    // Update order status to SHIPPED
    await prisma.order.update({
      where: { id: validatedData.orderId },
      data: {
        status: 'SHIPPED',
        updatedAt: new Date(),
      },
    })

    logger.info('Shipment confirmed', {
      shipmentId: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      orderId: validatedData.orderId,
      siteId: validatedData.siteId,
    })

    return NextResponse.json({
      success: true,
      data: {
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        orderId: validatedData.orderId,
        status: 'SHIPPED',
        trackingNumber: validatedData.trackingNumber,
      },
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    logger.error('Error confirming shipment', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm shipment',
      },
      { status: 500 }
    )
  }
}


