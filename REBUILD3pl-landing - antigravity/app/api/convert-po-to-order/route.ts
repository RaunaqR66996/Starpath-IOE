import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { purchaseOrderId, customerId } = body as { purchaseOrderId: string; customerId: string }

    if (!purchaseOrderId || !customerId) {
      return NextResponse.json({ success: false, error: 'purchaseOrderId and customerId are required' }, { status: 400 })
    }

    // Mock purchase order conversion
    const orderNumber = `SO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000+1000)}`
    const orderId = 'order-' + Date.now()

    return NextResponse.json({ success: true, data: { orderId, orderNumber } })
  } catch (error) {
    console.error('Failed to convert PO', error)
    return NextResponse.json({ success: false, error: 'Failed to convert purchase order' }, { status: 500 })
  }
}



