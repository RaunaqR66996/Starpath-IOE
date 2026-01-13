// TMS API Validation & Error Handling
// Enterprise-grade validation and error management

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

// Custom Error Classes
export class TmsError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'TmsError'
  }
}

export class ValidationError extends TmsError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details)
  }
}

export class NotFoundError extends TmsError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', `${resource} not found${id ? ` with id: ${id}` : ''}`, 404)
  }
}

export class ConflictError extends TmsError {
  constructor(message: string, details?: any) {
    super('CONFLICT', message, 409, details)
  }
}

export class UnauthorizedError extends TmsError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
  }
}

export class ForbiddenError extends TmsError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403)
  }
}

// Validation Schemas
export const ShipmentStatusSchema = z.enum([
  'CREATED', 'RATED', 'LABELED', 'TENDERED', 
  'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'
])

export const ShipmentModeSchema = z.enum(['PARCEL', 'LTL', 'FTL', 'INTERMODAL'])

export const ConsolidationSchema = z.enum(['NONE', 'MULTI_STOP', 'CONSOLIDATED'])

export const StopTypeSchema = z.enum(['PICKUP', 'DELIVERY', 'CONSOLIDATION'])

export const TrackingEventTypeSchema = z.enum([
  'CREATED', 'PICKED_UP', 'IN_TRANSIT', 
  'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'
])

// Address Schema
export const AddressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('USA'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  accessInstructions: z.string().optional(),
  dockRequirements: z.string().optional(),
  equipmentNeeded: z.array(z.string()).default([])
})

// Shipment Stop Schema
export const ShipmentStopSchema = z.object({
  sequence: z.number().int().min(1),
  type: StopTypeSchema,
  scheduledDate: z.string().datetime().optional(),
  timeWindowStart: z.string().optional(),
  timeWindowEnd: z.string().optional(),
  ...AddressSchema.shape
})

// Shipment Piece Schema
export const ShipmentPieceSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  weight: z.number().positive().optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  orientation: z.enum(['NORMAL', 'ROTATED_90', 'ROTATED_180', 'ROTATED_270']).default('NORMAL'),
  stackable: z.enum(['YES', 'NO', 'TOP_ONLY']).default('YES'),
  stopSequence: z.number().int().min(1).default(1),
  unitValue: z.number().positive().optional(),
  totalValue: z.number().positive().optional()
})

// Create Shipment Schema
export const CreateShipmentSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, 'At least one order ID is required'),
  mode: ShipmentModeSchema,
  consolidation: ConsolidationSchema.default('NONE'),
  stops: z.array(ShipmentStopSchema).min(2, 'At least 2 stops required (pickup and delivery)'),
  pieces: z.array(ShipmentPieceSchema).min(1, 'At least one piece is required'),
  totalWeight: z.number().positive().optional(),
  totalValue: z.number().positive().optional(),
  declaredValue: z.number().positive().optional(),
  isHazardous: z.boolean().default(false),
  requiresSignature: z.boolean().default(false),
  isCod: z.boolean().default(false),
  codAmount: z.number().positive().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({})
})

// Update Shipment Schema
export const UpdateShipmentSchema = z.object({
  status: ShipmentStatusSchema.optional(),
  carrierId: z.string().uuid().optional(),
  carrierName: z.string().optional(),
  serviceLevel: z.string().optional(),
  trackingNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  pickupDate: z.string().datetime().optional(),
  deliveryDate: z.string().datetime().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  actualDelivery: z.string().datetime().optional(),
  shippingCost: z.number().positive().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

// Tracking Event Schema
export const TrackingEventSchema = z.object({
  type: TrackingEventTypeSchema,
  location: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  nfcDeviceId: z.string().optional(),
  nfcVerified: z.boolean().default(false),
  handshakeAction: z.enum(['pickup', 'deliver']).optional(),
  metadata: z.record(z.any()).default({})
})

// Quote Schema
export const QuoteSchema = z.object({
  carrierId: z.string().uuid(),
  serviceLevel: z.string().min(1, 'Service level is required'),
  cost: z.number().positive('Cost must be positive'),
  currency: z.string().length(3).default('USD'),
  transitDays: z.number().int().positive().optional(),
  guaranteed: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  validUntil: z.string().datetime().optional()
})

// Load Plan Schema
export const LoadPlanSchema = z.object({
  equipmentType: z.enum(['TRAILER_53', 'TRAILER_48', 'CONTAINER_20', 'CONTAINER_40', 'VAN']),
  equipmentSpecs: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    maxWeight: z.number().positive()
  }),
  constraints: z.object({
    allowRotation: z.boolean().default(true),
    maxStackHeight: z.number().positive().optional(),
    fragileOnTop: z.boolean().default(true),
    hazardousSeparation: z.boolean().default(true)
  })
})

// Query Parameters Schema
export const ShipmentQuerySchema = z.object({
  status: ShipmentStatusSchema.optional(),
  mode: ShipmentModeSchema.optional(),
  carrierId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'shipment_number', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    total?: number
    limit?: number
    offset?: number
    hasMore?: boolean
  }
}

// Error Handler
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof TmsError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      } as ApiResponse,
      { status: error.statusCode }
    )
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.errors
        }
      } as ApiResponse,
      { status: 400 }
    )
  }

  // Unknown error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      }
    } as ApiResponse,
    { status: 500 }
    )
}

// Validation Helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors)
    }
    throw error
  }
}

// Query Parameters Helper
export function parseQueryParams(request: NextRequest, schema: z.ZodSchema) {
  const { searchParams } = new URL(request.url)
  const params: Record<string, any> = {}
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }
  
  return validateRequest(schema, params)
}

// Success Response Helper
export function successResponse<T>(data: T, meta?: any): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    meta
  } as ApiResponse<T>)
}

// Pagination Helper
export function createPaginationMeta(total: number, limit: number, offset: number) {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  }
}

// Business Logic Validation
export class ShipmentValidator {
  static validateStops(stops: any[]) {
    if (stops.length < 2) {
      throw new ValidationError('At least 2 stops required (pickup and delivery)')
    }

    const pickupStops = stops.filter(s => s.type === 'PICKUP')
    const deliveryStops = stops.filter(s => s.type === 'DELIVERY')

    if (pickupStops.length === 0) {
      throw new ValidationError('At least one pickup stop is required')
    }

    if (deliveryStops.length === 0) {
      throw new ValidationError('At least one delivery stop is required')
    }

    // Validate sequence numbers
    const sequences = stops.map(s => s.sequence).sort((a, b) => a - b)
    for (let i = 0; i < sequences.length; i++) {
      if (sequences[i] !== i + 1) {
        throw new ValidationError('Stop sequences must be consecutive starting from 1')
      }
    }
  }

  static validatePieces(pieces: any[]) {
    if (pieces.length === 0) {
      throw new ValidationError('At least one piece is required')
    }

    // Validate stop sequences exist
    const stopSequences = pieces.map(p => p.stopSequence)
    const uniqueSequences = [...new Set(stopSequences)]
    
    if (uniqueSequences.length !== stopSequences.length) {
      throw new ValidationError('All pieces must have unique stop sequences')
    }
  }

  static validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      'CREATED': ['RATED', 'CANCELLED'],
      'RATED': ['LABELED', 'CANCELLED'],
      'LABELED': ['TENDERED', 'CANCELLED'],
      'TENDERED': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
      'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
      'DELIVERED': [], // Terminal state
      'CANCELLED': [] // Terminal state
    }

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      )
    }
  }
}













