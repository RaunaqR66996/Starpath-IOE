import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/orders/[id]/allocate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order status to ALLOCATED
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'ALLOCATED',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      status: updatedOrder.status as any
    })
  } catch (error) {
    console.error('Failed to allocate order:', error)
    return NextResponse.json(
      { code: 'ALLOCATE_ORDER_ERROR', message: 'Failed to allocate order' },
      { status: 500 }
    )
  }
}
