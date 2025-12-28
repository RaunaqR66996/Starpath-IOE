import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    const organizationId = searchParams.get('organization_id') || 'default-org'

    try {
      // Build where clause
      const where: any = {
        organizationId
      }

      if (status) {
        where.status = status.toUpperCase()
      }

      if (search) {
        where.OR = [
          { shipmentNumber: { contains: search, mode: 'insensitive' } },
          { carrierName: { contains: search, mode: 'insensitive' } },
          { trackingNumber: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Query shipments with relations
      const [shipments, total] = await Promise.all([
        prisma.shipment.findMany({
          where,
          include: {
            carrier: {
              select: {
                id: true,
                carrierName: true,
                carrierCode: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.shipment.count({ where })
      ])

      // Transform to match expected format
      const transformedShipments = shipments.map(shipment => ({
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        status: shipment.status.toLowerCase(),
        mode: shipment.mode,
        totalWeight: shipment.totalWeight,
        totalValue: shipment.totalValue,
        shippingCost: shipment.shippingCost,
        carrierName: shipment.carrierName || shipment.carrier?.carrierName,
        carrierId: shipment.carrierId,
        trackingNumber: shipment.trackingNumber,
        serviceLevel: shipment.serviceLevel,
        pickupDate: shipment.pickupDate?.toISOString(),
        deliveryDate: shipment.deliveryDate?.toISOString(),
        estimatedDelivery: shipment.estimatedDelivery?.toISOString(),
        notes: shipment.notes,
        createdAt: shipment.createdAt.toISOString(),
        updatedAt: shipment.updatedAt.toISOString(),
        stops: [], // Will be populated when Stop model is added
        pieces: [], // Will be populated when Piece model is added
        events: [] // Will be populated when TrackingEvent model is added
      }))

      logger.info('Fetched shipments', { count: transformedShipments.length, status })

      return NextResponse.json({
        success: true,
        data: transformedShipments,
        meta: {
          total,
          limit,
          page,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (dbError) {
      logger.error('Database error fetching shipments', dbError as Error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_SHIPMENTS_ERROR',
            message: 'Failed to fetch shipments'
          }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error fetching shipments', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const organizationId = body.organization_id || 'default-org'

    try {
      // Generate shipment number
      const lastShipment = await prisma.shipment.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        select: { shipmentNumber: true }
      })

      const shipmentCount = lastShipment
        ? parseInt(lastShipment.shipmentNumber.split('-').pop() || '0') + 1
        : 1
      const shipmentNumber = `SHIP-${new Date().getFullYear()}-${String(shipmentCount).padStart(6, '0')}`

      // Create shipment
      const newShipment = await prisma.shipment.create({
        data: {
          organizationId,
          shipmentNumber,
          status: (body.status || 'CREATED').toUpperCase(),
          mode: (body.mode || 'PARCEL').toUpperCase(),
          carrierName: body.carrier,
          carrierId: body.carrierId,
          trackingNumber: body.trackingNumber,
          totalWeight: body.weight || 0,
          totalValue: body.value || 0,
          shippingCost: body.shippingCost,
          serviceLevel: body.serviceLevel,
          notes: body.notes,
          pickupDate: body.pickupDate ? new Date(body.pickupDate) : null,
          estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null
        },
        include: {
          carrier: true
        }
      })

      logger.info('Created shipment', { shipmentId: newShipment.id, shipmentNumber })

      return NextResponse.json({
        success: true,
        data: {
          id: newShipment.id,
          shipmentNumber: newShipment.shipmentNumber,
          status: newShipment.status,
          mode: newShipment.mode,
          carrierName: newShipment.carrierName,
          trackingNumber: newShipment.trackingNumber,
          createdAt: newShipment.createdAt.toISOString()
        }
      }, { status: 201 })
    } catch (dbError) {
      logger.error('Database error creating shipment', dbError as Error)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CREATE_SHIPMENT_ERROR',
            message: 'Failed to create shipment'
          }
        },
        { status: 500 }
      )
    }
  } catch (error) {
    logger.error('Error creating shipment', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      },
      { status: 500 }
    )
  }
}