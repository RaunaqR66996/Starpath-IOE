import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ChooseQuoteRequest, ChooseQuoteResponse, TmsError } from '@/types/tms'

const prisma = new PrismaClient()

// POST /api/tms/choose-quote
export async function POST(request: NextRequest) {
  try {
    const body: ChooseQuoteRequest = await request.json()

    if (!body.shipment_id || !body.carrier || !body.service || !body.cost) {
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'shipment_id, carrier, service, and cost are required' },
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

    // Update shipment with selected quote
    const updatedShipment = await prisma.shipment.update({
      where: { id: body.shipment_id },
      data: {
        status: 'RATED',
        carrierId: body.carrier,
        carrierName: body.carrier, // In real implementation, lookup carrier name
        serviceLevel: body.service,
        updatedAt: new Date()
      },
      include: {
        pieces: true,
        stops: true,
        events: true,
        // orderShipments field doesn't exist in Shipment model
      }
    })

    // Add rating event
    await prisma.trackingEvent.create({
      data: {
        shipmentId: body.shipment_id,
        type: 'CREATED', // Use existing event type
        description: `Quote selected: ${body.carrier} ${body.service} - $${body.cost}`,
        nfcVerified: false
      }
    })

    // Transform to DTO format
    const shipmentDTO = {
      id: updatedShipment.id,
      shipmentNumber: updatedShipment.shipmentNumber,
      status: updatedShipment.status,
      mode: updatedShipment.mode,
      consolidation: updatedShipment.consolidation,
      createdAt: updatedShipment.createdAt.toISOString(),
      updatedAt: updatedShipment.updatedAt.toISOString(),
      orderIds: [], // orderShipments field not available
      pieces: updatedShipment.pieces.map(piece => ({
        id: piece.id,
        shipmentId: piece.shipmentId,
        orderId: piece.orderId,
        orderLineId: piece.orderItemId, // Fixed: use orderItemId instead of orderLineId
        sku: piece.sku,
        description: piece.description,
        quantity: piece.quantity,
        weight: piece.weight,
        length: piece.length,
        width: piece.width,
        height: piece.height,
        orientation: piece.orientation,
        stackable: piece.stackable,
        stopSequence: piece.stopSequence,
        unitValue: piece.unitValue,
        totalValue: piece.totalValue,
        loadPlanId: piece.loadPlanId,
        positionX: piece.positionX,
        positionY: piece.positionY,
        positionZ: piece.positionZ,
        placedOrientation: piece.placedOrientation
      })),
      stops: updatedShipment.stops.map(stop => ({
        id: stop.id,
        shipmentId: stop.shipmentId,
        sequence: stop.sequence,
        type: stop.type,
        name: stop.name,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        zipCode: stop.zipCode,
        country: stop.country,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        contactEmail: stop.contactEmail,
        scheduledDate: stop.scheduledDate?.toISOString(),
        actualDate: stop.actualDate?.toISOString(),
        timeWindow: stop.timeWindow,
        status: stop.status,
        notes: stop.notes
      })),
      events: updatedShipment.events.map(event => ({
        id: event.id,
        shipmentId: event.shipmentId,
        type: event.type,
        timestamp: event.timestamp.toISOString(),
        location: event.location,
        description: event.description,
        nfcDeviceId: event.nfcDeviceId,
        nfcVerified: event.nfcVerified,
        handshakeAction: event.handshakeAction,
        metadata: event.metadata
      })),
      totalWeight: updatedShipment.totalWeight,
      totalValue: updatedShipment.totalValue,
      declaredValue: updatedShipment.declaredValue,
      carrierId: updatedShipment.carrierId,
      carrierName: updatedShipment.carrierName,
      serviceLevel: updatedShipment.serviceLevel,
      trackingNumber: updatedShipment.trackingNumber,
      referenceNumber: updatedShipment.referenceNumber
    }

    const response: ChooseQuoteResponse = {
      status: 'QUOTE_SELECTED',
      shipment: shipmentDTO
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to choose quote:', error)
    return NextResponse.json(
      { code: 'CHOOSE_QUOTE_ERROR', message: 'Failed to choose quote' },
      { status: 500 }
    )
  }
}








































































