import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wms/picking - Fetch active pick lists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }

    const pickLists = await prisma.pickList.findMany({
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
        },
        user: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: pickLists
    })
  } catch (error) {
    console.error('WMS Picking API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pick lists' },
      { status: 500 }
    )
  }
}

// POST /api/wms/picking - Create pick list for order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, assignedTo } = body

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

    // Generate pick list number
    const pickListNumber = `PL-${order.orderNumber}`

    // Check if pick list already exists
    const existingPickList = await prisma.pickList.findUnique({
      where: { pickListNumber }
    })

    if (existingPickList) {
      return NextResponse.json({
        success: true,
        data: existingPickList,
        message: 'Pick list already exists'
      })
    }

    // Create pick list
    const pickList = await prisma.pickList.create({
      data: {
        organizationId: order.organizationId,
        pickListNumber,
        orderId: order.id,
        status: 'PENDING',
        assignedTo: assignedTo || null,
        items: {
          create: order.orderItems.map(oi => ({
            itemId: oi.itemId,
            quantity: oi.quantity,
            binLocation: 'A-01-01', // TODO: Real bin allocation logic
            picked: false
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
      data: { workflowState: 'PICKING' }
    })

    return NextResponse.json({
      success: true,
      data: pickList
    }, { status: 201 })

  } catch (error) {
    console.error('Create Pick List Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create pick list' },
      { status: 500 }
    )
  }
}
