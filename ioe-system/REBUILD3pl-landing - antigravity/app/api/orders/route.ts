import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { orderLifecycleService } from '@/lib/services/order-lifecycle-service'

// GET /api/orders?status=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build query with Prisma
    const where: any = {}
    if (status) {
      where.status = status.toUpperCase()
    }

    try {
      // Query orders from database
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
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
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.order.count({ where })
      ])

      // Transform to match expected format
      const transformedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: order.status.toLowerCase(),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        externalId: order.externalId,
        // ERPNext fields
        erpnextOrderNumber: order.externalId,
        isERPNextOrder: !!order.externalId,
        source: order.externalId ? 'erpnext' : 'manual',
        customer: {
          id: order.customer?.id || order.customerId,
          name: order.customer?.customerName || 'Unknown Customer',
          email: order.customer?.contactEmail || null
        },
        lines: order.orderItems?.map((item: any) => ({
          id: item.id,
          sku: item.item?.sku || 'UNKNOWN',
          qty: item.quantity,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
          item: item.item || { sku: 'UNKNOWN', name: 'Unknown Item' }
        })) || []
      }))

      logger.info('Fetched orders', { count: transformedOrders.length, status })

      return NextResponse.json({
        data: transformedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (dbError) {
      logger.error('Database error fetching orders', dbError as Error)
      // Return empty array for graceful degradation
      return NextResponse.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      })
    }
  } catch (error) {
    logger.error('Failed to fetch orders', error as Error)
    return NextResponse.json(
      { code: 'FETCH_ORDERS_ERROR', message: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const body: {
      customer_id: string
      lines: Array<{ sku: string; qty: number; unitPrice?: number; description?: string }>
      external_id?: string
      organization_id?: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      warehouse_id?: string
    } = await request.json()

    // Validate required fields
    if (!body.customer_id || !body.lines || body.lines.length === 0) {
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'customer_id and lines are required' },
        { status: 400 }
      )
    }

    const organizationId = body.organization_id || 'default-org'
    const priority = (body.priority || 'medium').toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'

    try {
      // Generate order number
      const lastOrder = await prisma.order.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true }
      })

      const orderCount = lastOrder
        ? parseInt(lastOrder.orderNumber.split('-').pop() || '0') + 1
        : 1
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount).padStart(6, '0')}`

      // Calculate total from lines
      let totalAmount = 0
      const orderItems = []

      for (const line of body.lines) {
        // Try to find item by SKU to get price
        const item = await prisma.item.findFirst({
          where: { sku: line.sku },
          select: { id: true }
        }).catch(() => null)

        const unitPrice = line.unitPrice || 0
        const totalPrice = unitPrice * line.qty
        totalAmount += totalPrice

        orderItems.push({
          itemId: item?.id || `item-${line.sku}`,
          quantity: line.qty,
          unitPrice,
          totalPrice
        })
      }

      // Create order with items
      const newOrder = await prisma.order.create({
        data: {
          organizationId,
          customerId: body.customer_id,
          orderNumber,
          status: 'CREATED',
          priority: priority.toUpperCase(),
          totalAmount,
          externalId: body.external_id,
          orderItems: {
            create: orderItems
          }
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              item: true
            }
          }
        }
      })

      // Bootstrap lifecycle orchestration
      try {
        await orderLifecycleService.startLifecycle({
          orderId: newOrder.id,
          organizationId,
          orderNumber: newOrder.orderNumber,
          customerName: newOrder.customer?.customerName || 'Unknown Customer',
          priority,
          totalAmount: newOrder.totalAmount,
          warehouse: body.warehouse_id,
          externalId: newOrder.externalId || undefined,
          lines: newOrder.orderItems?.map((item: any) => ({
            id: item.id,
            sku: item.item?.sku || 'UNKNOWN',
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            description: item.item?.description
          }))
        })
      } catch (lifecycleError) {
        logger.warn('Failed to start order lifecycle', {
          orderId: newOrder.id,
          message: (lifecycleError as Error).message
        })
      }

      logger.info('Created order', { orderId: newOrder.id, orderNumber })

      return NextResponse.json({
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerId: newOrder.customerId,
        status: newOrder.status,
        createdAt: newOrder.createdAt.toISOString(),
        updatedAt: newOrder.updatedAt.toISOString(),
        externalId: newOrder.externalId
      }, { status: 201 })
    } catch (dbError) {
      logger.error('Database error creating order', dbError as Error)
      return NextResponse.json(
        { code: 'CREATE_ORDER_ERROR', message: 'Failed to create order' },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Failed to create order', error as Error)
    return NextResponse.json(
      { code: 'CREATE_ORDER_ERROR', message: 'Failed to create order' },
      { status: 500 }
    )
  }
}








































































