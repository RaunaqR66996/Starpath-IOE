import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params

    if (!shipmentId) {
      return NextResponse.json({ error: 'shipmentId is required' }, { status: 400 })
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { carrier: true }
    })

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    return NextResponse.json(shipment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params
    const body = await request.json()

    if (!shipmentId) {
      return NextResponse.json({ error: 'shipmentId is required' }, { status: 400 })
    }

    const shipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: body?.status ?? undefined,
        carrierId: body?.carrierId ?? undefined,
        trackingNumber: body?.trackingNumber ?? undefined,
        pickupDate: body?.pickupDate ? new Date(body.pickupDate) : undefined,
        deliveryDate: body?.deliveryDate ? new Date(body.deliveryDate) : undefined,
        notes: body?.notes ?? undefined
      }
    })

    return NextResponse.json(shipment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
