import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tms/orders - Fetch real orders from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customer = searchParams.get('customer')

    // Build query
    const where: any = {}
    
    if (status) {
      where.status = status.toUpperCase()
    }

    if (customer) {
      where.customer = {
        customerName: { contains: customer, mode: 'insensitive' }
      }
    }

    // Fetch orders from database
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerName: true,
            contactEmail: true
          }
        },
        orderItems: {
          include: {
            item: {
              select: {
                sku: true,
                name: true,
                description: true
              }
            }
          }
        },
        shipments: {
          select: {
            id: true,
            status: true,
            carrier: true,
            trackingNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    // Transform to TMS format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.customer?.customerName || 'Unknown Customer',
      customerId: order.customerId,
      origin: 'TBD', // TODO: Add origin from order
      destination: 'TBD', // TODO: Add destination from order
      status: order.status.toLowerCase(),
      workflowState: order.workflowState || 'RECEIVED',
      priority: order.priority?.toLowerCase() || 'medium',
      value: order.totalAmount || 0,
      weight: order.orderItems?.reduce((sum: number, item: any) => sum + (item.weight || 0), 0) || 0,
      carrier: order.shipments?.[0]?.carrier || null,
      created: order.createdAt.toISOString().split('T')[0],
      deliveryDate: order.expectedDelivery?.toISOString().split('T')[0] || null,
      // ERPNext fields
      erpnextOrderNumber: order.externalId,
      isERPNextOrder: !!order.externalId,
      source: order.externalId ? 'erpnext' : 'manual'
    }))

    return NextResponse.json({
      success: true,
      data: transformedOrders,
      total: transformedOrders.length
    })
  } catch (error) {
    console.error('TMS Orders API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders', data: [], total: 0 },
      { status: 500 }
    )
  }
}

// POST /api/tms/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.customer || !body.origin || !body.destination) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { customerName: body.customer }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          customerName: body.customer,
          customerCode: `CUST-${Date.now()}`,
          organizationId: 'default-org'
        }
      })
    }
    
    // Generate order number
    const lastOrder = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true }
    })

    const orderCount = lastOrder
      ? parseInt(lastOrder.orderNumber.split('-').pop() || '0') + 1
      : 1
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount).padStart(6, '0')}`

    // Create order
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: 'CREATED',
        workflowState: 'RECEIVED',
        priority: (body.priority || 'MEDIUM').toUpperCase(),
        totalAmount: body.value || 0,
        expectedDelivery: body.deliveryDate ? new Date(body.deliveryDate) : null,
        organizationId: 'default-org'
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customer: newOrder.customer?.customerName,
        status: newOrder.status.toLowerCase(),
        created: newOrder.createdAt.toISOString().split('T')[0]
      }
    }, { status: 201 })
  } catch (error) {
    console.error('TMS Create Order Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
