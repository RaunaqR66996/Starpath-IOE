// TMS Shipments API - Enterprise Grade
// Comprehensive shipment management with full CRUD operations

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { 
  CreateShipmentSchema, 
  UpdateShipmentSchema, 
  ShipmentQuerySchema,
  TrackingEventSchema,
  QuoteSchema,
  LoadPlanSchema,
  handleApiError,
  validateRequest,
  parseQueryParams,
  successResponse,
  createPaginationMeta,
  ShipmentValidator,
  ValidationError,
  NotFoundError,
  ConflictError
} from '@/lib/api/tms-validation'

const prisma = new PrismaClient()

// GET /api/shipments - List shipments with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const params = parseQueryParams(request, ShipmentQuerySchema)
    
    // Build where clause
    const where: any = {
      organizationId: 'default-org' // TODO: Get from auth
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.mode) {
      where.mode = params.mode
    }

    if (params.carrierId) {
      where.carrierId = params.carrierId
    }

    if (params.customerId) {
      where.orders = {
        some: {
          customerId: params.customerId
        }
      }
    }

    if (params.orderId) {
      where.orders = {
        some: {
          id: params.orderId
        }
      }
    }

    if (params.search) {
      where.OR = [
        { shipmentNumber: { contains: params.search, mode: 'insensitive' } },
        { carrierName: { contains: params.search, mode: 'insensitive' } },
        { trackingNumber: { contains: params.search, mode: 'insensitive' } },
        { referenceNumber: { contains: params.search, mode: 'insensitive' } }
      ]
    }

    // Execute query with relations
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          carrier: true,
          stops: {
            orderBy: { sequence: 'asc' }
          },
          pieces: true,
          events: {
            orderBy: { timestamp: 'desc' },
            take: 5 // Latest 5 events
          },
          quotes: {
            where: { isSelected: true },
            include: { carrier: true }
          },
          loadPlans: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Latest load plan
          }
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        take: params.limit,
        skip: params.offset
      }),
      prisma.shipment.count({ where })
    ])

    return successResponse(shipments, createPaginationMeta(total, params.limit, params.offset))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/shipments - Create new shipment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(CreateShipmentSchema, body)

    // Business logic validation
    ShipmentValidator.validateStops(data.stops)
    ShipmentValidator.validatePieces(data.pieces)

    // Generate shipment number
    const lastShipment = await prisma.shipment.findFirst({
      where: { organizationId: 'default-org' },
      orderBy: { createdAt: 'desc' },
      select: { shipmentNumber: true }
    })

    const shipmentCount = lastShipment 
      ? parseInt(lastShipment.shipmentNumber.split('-').pop() || '0') + 1 
      : 1
    const shipmentNumber = `SHIP-${new Date().getFullYear()}-${String(shipmentCount).padStart(6, '0')}`

    // Calculate totals
    const totalWeight = data.pieces.reduce((sum, piece) => sum + (piece.weight || 0), 0)
    const totalValue = data.pieces.reduce((sum, piece) => sum + (piece.totalValue || 0), 0)

    // Create shipment with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create shipment
      const shipment = await tx.shipment.create({
        data: {
          organizationId: 'default-org',
          shipmentNumber,
          status: 'CREATED',
          mode: data.mode,
          consolidation: data.consolidation,
          totalWeight: data.totalWeight || totalWeight,
          totalValue: data.totalValue || totalValue,
          declaredValue: data.declaredValue,
          isHazardous: data.isHazardous,
          requiresSignature: data.requiresSignature,
          isCod: data.isCod,
          codAmount: data.codAmount,
          notes: data.notes,
          metadata: data.metadata
        }
      })

      // Create stops
      await tx.shipmentStop.createMany({
        data: data.stops.map(stop => ({
          shipmentId: shipment.id,
          sequence: stop.sequence,
          type: stop.type,
          name: stop.name,
          company: stop.company,
          addressLine1: stop.addressLine1,
          addressLine2: stop.addressLine2,
          city: stop.city,
          state: stop.state,
          zipCode: stop.zipCode,
          country: stop.country,
          latitude: stop.latitude,
          longitude: stop.longitude,
          contactName: stop.contactName,
          contactPhone: stop.contactPhone,
          contactEmail: stop.contactEmail,
          scheduledDate: stop.scheduledDate ? new Date(stop.scheduledDate) : null,
          timeWindowStart: stop.timeWindowStart ? new Date(stop.timeWindowStart) : null,
          timeWindowEnd: stop.timeWindowEnd ? new Date(stop.timeWindowEnd) : null,
          accessInstructions: stop.accessInstructions,
          dockRequirements: stop.dockRequirements,
          equipmentNeeded: stop.equipmentNeeded
        }))
      })

      // Create pieces
      await tx.shipmentPiece.createMany({
        data: data.pieces.map(piece => ({
          shipmentId: shipment.id,
          sku: piece.sku,
          description: piece.description,
          quantity: piece.quantity,
          weight: piece.weight,
          length: piece.length,
          width: piece.width,
          height: piece.height,
          volume: piece.volume,
          orientation: piece.orientation,
          stackable: piece.stackable,
          stopSequence: piece.stopSequence,
          unitValue: piece.unitValue,
          totalValue: piece.totalValue
        }))
      })

      // Create initial tracking event
      await tx.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          type: 'CREATED',
          description: 'Shipment created',
          metadata: { source: 'api' }
        }
      })

      return shipment
    })

    // Return created shipment with relations
    const createdShipment = await prisma.shipment.findUnique({
      where: { id: result.id },
      include: {
        carrier: true,
        stops: { orderBy: { sequence: 'asc' } },
        pieces: true,
        events: { orderBy: { timestamp: 'desc' }, take: 1 }
      }
    })

    return successResponse(createdShipment, undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/shipments/[id] - Get single shipment
export async function getShipmentById(id: string) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { 
        id,
        organizationId: 'default-org' // TODO: Get from auth
      },
      include: {
        carrier: true,
        stops: { orderBy: { sequence: 'asc' } },
        pieces: true,
        events: { orderBy: { timestamp: 'desc' } },
        quotes: { include: { carrier: true } },
        loadPlans: { 
          orderBy: { createdAt: 'desc' },
          include: { loadPlanPieces: true }
        }
      }
    })

    if (!shipment) {
      throw new NotFoundError('Shipment', id)
    }

    return successResponse(shipment)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/shipments/[id] - Update shipment
export async function updateShipment(id: string, request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(UpdateShipmentSchema, body)

    // Check if shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { 
        id,
        organizationId: 'default-org' // TODO: Get from auth
      },
      select: { status: true }
    })

    if (!existingShipment) {
      throw new NotFoundError('Shipment', id)
    }

    // Validate status transition
    if (data.status && data.status !== existingShipment.status) {
      ShipmentValidator.validateStatusTransition(existingShipment.status, data.status)
    }

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        carrier: true,
        stops: { orderBy: { sequence: 'asc' } },
        pieces: true,
        events: { orderBy: { timestamp: 'desc' }, take: 5 }
      }
    })

    // Create tracking event if status changed
    if (data.status && data.status !== existingShipment.status) {
      await prisma.trackingEvent.create({
        data: {
          shipmentId: id,
          type: data.status as any,
          description: `Shipment status updated to ${data.status}`,
          metadata: { source: 'api', previousStatus: existingShipment.status }
        }
      })
    }

    return successResponse(updatedShipment)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/shipments/[id] - Delete shipment
export async function deleteShipment(id: string) {
  try {
    // Check if shipment exists and can be deleted
    const shipment = await prisma.shipment.findUnique({
      where: { 
        id,
        organizationId: 'default-org' // TODO: Get from auth
      },
      select: { status: true }
    })

    if (!shipment) {
      throw new NotFoundError('Shipment', id)
    }

    // Only allow deletion of CREATED shipments
    if (shipment.status !== 'CREATED') {
      throw new ConflictError('Cannot delete shipment that has been processed')
    }

    // Delete shipment (cascade will handle related records)
    await prisma.shipment.delete({
      where: { id }
    })

    return successResponse({ deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/shipments/[id]/events - Add tracking event
export async function addTrackingEvent(id: string, request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(TrackingEventSchema, body)

    // Check if shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { 
        id,
        organizationId: 'default-org' // TODO: Get from auth
      },
      select: { id: true }
    })

    if (!shipment) {
      throw new NotFoundError('Shipment', id)
    }

    // Create tracking event
    const event = await prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        type: data.type,
        location: data.location,
        description: data.description,
        nfcDeviceId: data.nfcDeviceId,
        nfcVerified: data.nfcVerified,
        handshakeAction: data.handshakeAction,
        metadata: data.metadata
      }
    })

    return successResponse(event, undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/shipments/[id]/quotes - Add quote
export async function addQuote(id: string, request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(QuoteSchema, body)

    // Check if shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { 
        id,
        organizationId: 'default-org' // TODO: Get from auth
      },
      select: { id: true }
    })

    if (!shipment) {
      throw new NotFoundError('Shipment', id)
    }

    // Check if carrier exists
    const carrier = await prisma.carrier.findUnique({
      where: { id: data.carrierId }
    })

    if (!carrier) {
      throw new NotFoundError('Carrier', data.carrierId)
    }

    // Create quote
    const quote = await prisma.shipmentQuote.create({
      data: {
        shipmentId: id,
        carrierId: data.carrierId,
        serviceLevel: data.serviceLevel,
        cost: data.cost,
        currency: data.currency,
        transitDays: data.transitDays,
        guaranteed: data.guaranteed,
        features: data.features,
        validUntil: data.validUntil ? new Date(data.validUntil) : null
      },
      include: { carrier: true }
    })

    return successResponse(quote, undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/shipments/[id]/quotes/[quoteId]/select - Select quote
export async function selectQuote(id: string, quoteId: string) {
  try {
    // Check if shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { 
        id,
        organizationId: 'default-org' // TODO: Get from auth
      },
      select: { id: true }
    })

    if (!shipment) {
      throw new NotFoundError('Shipment', id)
    }

    // Update quote selection in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deselect all quotes for this shipment
      await tx.shipmentQuote.updateMany({
        where: { shipmentId: id },
        data: { isSelected: false }
      })

      // Select the specified quote
      const selectedQuote = await tx.shipmentQuote.update({
        where: { id: quoteId },
        data: { isSelected: true },
        include: { carrier: true }
      })

      // Update shipment with carrier info
      await tx.shipment.update({
        where: { id },
        data: {
          carrierId: selectedQuote.carrierId,
          carrierName: selectedQuote.carrier.name,
          serviceLevel: selectedQuote.serviceLevel,
          shippingCost: selectedQuote.cost,
          status: 'RATED'
        }
      })

      return selectedQuote
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/shipments/[id]/load-plan - Create load plan
export async function createLoadPlan(id: string, request: NextRequest) {
  try {
    const body = await request.json()
    const data = validateRequest(LoadPlanSchema, body)

    // Check if shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { 
        id,
        organizationId: 'default-org' // TODO: Get from auth
      },
      include: { pieces: true }
    })

    if (!shipment) {
      throw new NotFoundError('Shipment', id)
    }

    // TODO: Implement actual 3D load planning algorithm
    // For now, create a mock load plan
    const mockLoadPlan = {
      success: true,
      weightUtilization: 85.5,
      volumeUtilization: 78.2,
      cubeUtilization: 91.3,
      totalPieces: shipment.pieces.length,
      placedPieces: shipment.pieces.length,
      unplacedPieces: 0,
      warnings: [],
      violations: []
    }

    // Create load plan
    const loadPlan = await prisma.loadPlan.create({
      data: {
        shipmentId: id,
        equipmentType: data.equipmentType,
        equipmentSpecs: data.equipmentSpecs,
        success: mockLoadPlan.success,
        weightUtilization: mockLoadPlan.weightUtilization,
        volumeUtilization: mockLoadPlan.volumeUtilization,
        cubeUtilization: mockLoadPlan.cubeUtilization,
        totalPieces: mockLoadPlan.totalPieces,
        placedPieces: mockLoadPlan.placedPieces,
        unplacedPieces: mockLoadPlan.unplacedPieces,
        warnings: mockLoadPlan.warnings,
        violations: mockLoadPlan.violations
      }
    })

    // Create load plan pieces (mock positions)
    const loadPlanPieces = await Promise.all(
      shipment.pieces.map((piece, index) =>
        prisma.loadPlanPiece.create({
          data: {
            loadPlanId: loadPlan.id,
            pieceId: piece.id,
            positionX: (index % 5) * 20, // Mock X position
            positionY: Math.floor(index / 5) * 20, // Mock Y position
            positionZ: 0, // Mock Z position
            orientation: piece.orientation,
            layer: 1,
            stopSequence: piece.stopSequence
          }
        })
      )
    )

    return successResponse({
      ...loadPlan,
      loadPlanPieces
    }, undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}













