import { NextRequest, NextResponse } from 'next/server'
import { publishEvent, EventType } from '@/lib/events/kafka-client'

// POST /api/shipments/from-orders
export async function POST(request: NextRequest) {
  try {
    console.log('=== Shipment Creation API Called ===')

    const body = await request.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.order_ids || !Array.isArray(body.order_ids) || body.order_ids.length === 0) {
      console.log('Validation failed: missing or invalid order_ids')
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'order_ids array is required' },
        { status: 400 }
      )
    }

    if (!body.mode || !body.consolidation) {
      console.log('Validation failed: missing mode or consolidation')
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'mode and consolidation are required' },
        { status: 400 }
      )
    }

    console.log('Validation passed. Creating shipment for orders:', body.order_ids)

    // Generate unique shipment number
    const timestamp = Date.now()
    const shipmentNumber = `SH-${new Date().getFullYear()}-${String(timestamp).slice(-4)}`
    console.log('Generated shipment number:', shipmentNumber)

    // Create mock shipment data
    const shipmentId = `shipment-${timestamp}`
    const shipment = {
      id: shipmentId,
      shipmentNumber,
      status: 'CREATED',
      mode: body.mode,
      consolidation: body.consolidation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderIds: body.order_ids,
      pieces: body.order_ids.map((orderId: string, index: number) => ({
        id: `piece-${timestamp}-${index}`,
        shipmentId: shipmentId,
        orderId: orderId,
        orderLineId: `line-${timestamp}-${index}`,
        sku: `SKU-${String(index + 1).padStart(3, '0')}`,
        description: `Sample Item ${index + 1}`,
        quantity: 10,
        weight: 2.0,
        length: 10.0,
        width: 8.0,
        height: 6.0,
        orientation: 'NORMAL',
        stackable: 'YES',
        stopSequence: 1,
        unitValue: 25.00,
        totalValue: 250.00
      })),
      stops: [
        {
          id: `stop-pickup-${timestamp}`,
          shipmentId: shipmentId,
          sequence: 1,
          type: 'PICKUP',
          name: 'Main Warehouse',
          address: '123 Warehouse Blvd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA',
          status: 'PENDING'
        },
        {
          id: `stop-delivery-${timestamp}`,
          shipmentId: shipmentId,
          sequence: 2,
          type: 'DELIVERY',
          name: 'Customer Location',
          address: '456 Customer Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          status: 'PENDING'
        }
      ],
      events: [
        {
          id: `event-${timestamp}`,
          shipmentId: shipmentId,
          type: 'CREATED',
          timestamp: new Date().toISOString(),
          location: 'Main Warehouse',
          description: `Shipment created from ${body.order_ids.length} order(s)`,
          nfcVerified: false
        }
      ],
      totalWeight: body.order_ids.length * 20.0,
      totalValue: body.order_ids.length * 250.0
    }

    console.log('Mock shipment created successfully:', shipment.id)

    // Publish Kafka event
    try {
      await publishEvent('shipments', EventType.SHIPMENT_CREATED, {
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        orderIds: body.order_ids,
        mode: body.mode,
        consolidation: body.consolidation,
        status: 'CREATED'
      })
      console.log('✅ Shipment creation event published to Kafka')
    } catch (kafkaError) {
      console.warn('⚠️ Failed to publish Kafka event (continuing):', kafkaError)
    }

    const response = {
      shipment_id: shipment.id,
      shipment: shipment
    }

    console.log('Sending response...')
    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('=== Shipment Creation Error ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')

    // Ensure we always return valid JSON
    const errorResponse = {
      code: 'SHIPMENT_ERROR',
      message: 'Failed to create shipment: ' + (error instanceof Error ? error.message : String(error)),
      timestamp: new Date().toISOString()
    }

    console.log('Returning error response:', JSON.stringify(errorResponse, null, 2))

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}