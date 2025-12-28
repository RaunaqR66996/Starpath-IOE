import { NextRequest, NextResponse } from 'next/server'
import { automatedOrderProcessor } from '@/lib/services/automated-order-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Process the order through the automated workflow
    const result = await automatedOrderProcessor.processOrderToShipping(orderId)

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Order processing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to process order'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check if order is stuck in staging
    const isStuck = await automatedOrderProcessor.checkStagingAlerts()
    const orderAlert = isStuck.find(alert => alert.orderId === orderId)

    return NextResponse.json({
      success: true,
      orderId,
      isStuckInStaging: !!orderAlert,
      alert: orderAlert || null
    })
  } catch (error) {
    console.error('Error checking order status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
