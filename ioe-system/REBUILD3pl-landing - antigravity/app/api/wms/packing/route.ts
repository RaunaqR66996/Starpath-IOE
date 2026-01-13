import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wms/packing - Fetch active packing slips
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }

    const packingSlips = await prisma.packingSlip.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: {
                customerName: true
              }
            }
          }
        },
        items: {
          include: {
            item: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: packingSlips
    })
  } catch (error) {
    console.error('WMS Packing API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packing slips' },
      { status: 500 }
    )
  }
}

// POST /api/wms/packing - Create packing slip (start packing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId' },
        { status: 400 }
      )
    }

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate packing slip number
    const slipNumber = `PS-${order.orderNumber}`

    // Check if packing slip already exists
    const existingSlip = await prisma.packingSlip.findUnique({
      where: { slipNumber }
    })

    if (existingSlip) {
      return NextResponse.json({
        success: true,
        data: existingSlip,
        message: 'Packing slip already exists'
      })
    }

    // Create packing slip
    const packingSlip = await prisma.packingSlip.create({
      data: {
        organizationId: order.organizationId,
        slipNumber,
        orderId: order.id,
        status: 'IN_PROGRESS',
        items: {
          create: order.orderItems.map(oi => ({
            itemId: oi.itemId,
            quantity: oi.quantity,
            scanned: false
          }))
        }
      },
      include: {
        items: true
      }
    })

    // Update order workflow state
    await prisma.order.update({
      where: { id: orderId },
      data: { workflowState: 'PACKING' }
    })

    return NextResponse.json({
      success: true,
      data: packingSlip
    }, { status: 201 })

  } catch (error) {
    console.error('Create Packing Slip Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create packing slip' },
      { status: 500 }
    )
  }
}
