import { NextRequest, NextResponse } from 'next/server'
import { orderLifecycleService } from '@/lib/services/order-lifecycle-service'
import { OrderEventType } from '@/lib/events/event-store'

type RouteParams = {
  params: Promise<{
    orderId: string
  }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params
    const lifecycle = await orderLifecycleService.getLifecycle(orderId)

    if (!lifecycle) {
      return NextResponse.json(
        { success: false, message: 'Order lifecycle not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: lifecycle })
  } catch (error) {
    console.error('Failed to fetch order lifecycle:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order lifecycle' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { eventType, data, organizationId } = body as {
      eventType: OrderEventType
      data?: Record<string, any>
      organizationId?: string
    }

    if (!eventType) {
      return NextResponse.json(
        { success: false, message: 'eventType is required' },
        { status: 400 }
      )
    }

    const updated = await orderLifecycleService.recordEvent(
      orderId,
      eventType,
      organizationId || 'default-org',
      data || {}
    )

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to record lifecycle event:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to record lifecycle event' },
      { status: 500 }
    )
  }
}



