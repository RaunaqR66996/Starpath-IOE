import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { HandshakeConfirmRequest, HandshakeConfirmResponse, TmsError } from '@/types/tms'

const prisma = new PrismaClient()

// POST /api/handshake/confirm
export async function POST(request: NextRequest) {
  try {
    const body: HandshakeConfirmRequest = await request.json()

    if (!body.shipment_id || !body.action) {
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'shipment_id and action are required' },
        { status: 400 }
      )
    }

    // Validate shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { id: body.shipment_id }
    })

    if (!shipment) {
      return NextResponse.json(
        { code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Determine new status based on action
    let newStatus = shipment.status
    let eventType = 'CREATED'
    let description = ''

    switch (body.action) {
      case 'pickup':
        newStatus = 'PICKED_UP'
        eventType = 'PICKED_UP'
        description = 'Shipment picked up'
        break
      case 'deliver':
        newStatus = 'DELIVERED'
        eventType = 'DELIVERED'
        description = 'Shipment delivered'
        break
      default:
        return NextResponse.json(
          { code: 'INVALID_ACTION', message: 'Action must be pickup or deliver' },
          { status: 400 }
        )
    }

    // Update shipment status
    const updatedShipment = await prisma.shipment.update({
      where: { id: body.shipment_id },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    })

    // Mock tracking event creation
    const event = {
      id: 'event-' + Date.now(),
      shipmentId: body.shipment_id,
      type: eventType,
      timestamp: new Date(),
      location: body.location || 'Unknown',
      description: description,
      nfcDeviceId: body.nfcDeviceId,
      nfcVerified: !!body.nfcDeviceId,
      handshakeAction: body.action,
      metadata: {
        notes: body.notes,
        confirmedAt: new Date().toISOString()
      }
    }

    const response: HandshakeConfirmResponse = {
      event: {
        id: event.id,
        shipmentId: event.shipmentId,
        type: event.type as any,
        timestamp: event.timestamp.toISOString(),
        location: event.location,
        description: event.description,
        nfcDeviceId: event.nfcDeviceId,
        nfcVerified: event.nfcVerified,
        handshakeAction: event.handshakeAction as any,
        metadata: event.metadata as any
      },
      status: newStatus as any
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to confirm handshake:', error)
    return NextResponse.json(
      { code: 'HANDSHAKE_ERROR', message: 'Failed to confirm handshake' },
      { status: 500 }
    )
  }
}








































































