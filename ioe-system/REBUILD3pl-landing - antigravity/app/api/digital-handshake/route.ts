import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1),
  timestamp: z.string().datetime()
})

const NFCDataSchema = z.object({
  deviceId: z.string().min(1),
  tagId: z.string().min(1),
  encryptedPayload: z.string().min(1),
  signature: z.string().min(1),
  timestamp: z.string().datetime(),
  deviceCapabilities: z.array(z.string())
})

const BiometricDataSchema = z.object({
  type: z.enum(['fingerprint', 'face', 'voice', 'signature']),
  data: z.string().min(1),
  confidence: z.number().min(0).max(100),
  timestamp: z.string().datetime()
}).optional()

const AdditionalVerificationSchema = z.object({
  photoProof: z.string().optional(),
  customerSignature: z.string().optional(),
  otp: z.string().optional(),
  securityQuestions: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).optional()
}).optional()

const HandshakeRequestSchema = z.object({
  shipmentId: z.string().min(1),
  deliveryPersonId: z.string().min(1),
  recipientId: z.string().optional(),
  deliveryLocation: LocationSchema,
  nfcData: NFCDataSchema,
  biometricData: BiometricDataSchema,
  additionalVerification: AdditionalVerificationSchema
})

/**
 * POST /api/digital-handshake - Process digital handshake for proof of delivery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = HandshakeRequestSchema.parse(body)

    // Simulate processing the digital handshake
    const proofOfDeliveryId = `POD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    const blockchainTransactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    
    // Calculate verification score based on available data
    let verificationScore = 70 // Base score
    
    if (validatedData.biometricData) {
      verificationScore += 15
    }
    
    if (validatedData.additionalVerification?.photoProof) {
      verificationScore += 10
    }
    
    if (validatedData.additionalVerification?.customerSignature) {
      verificationScore += 5
    }

    const result = {
      success: true,
      proofOfDeliveryId,
      blockchainTransactionId,
      verificationScore: Math.min(verificationScore, 100),
      timestamp: new Date().toISOString(),
      errors: [],
      warnings: []
    }

    return NextResponse.json({
      success: result.success,
      data: {
        proofOfDeliveryId: result.proofOfDeliveryId,
        blockchainTransactionId: result.blockchainTransactionId,
        verificationScore: result.verificationScore,
        timestamp: result.timestamp,
        status: result.verificationScore >= 85 ? 'VERIFIED' : 'PENDING_REVIEW'
      },
      errors: result.errors,
      warnings: result.warnings,
      message: result.success ? 'Digital handshake completed successfully' : 'Digital handshake failed'
    }, { 
      status: result.success ? 200 : 400 
    })

  } catch (error) {
    console.error('Digital handshake API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to process digital handshake'
    }, { status: 500 })
  }
}

/**
 * GET /api/digital-handshake - Get digital handshake status and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')
    const proofOfDeliveryId = searchParams.get('proofOfDeliveryId')
    const deliveryPersonId = searchParams.get('deliveryPersonId')

    if (!shipmentId && !proofOfDeliveryId && !deliveryPersonId) {
      return NextResponse.json({
        success: false,
        error: 'At least one query parameter is required (shipmentId, proofOfDeliveryId, or deliveryPersonId)'
      }, { status: 400 })
    }

    // Simulate retrieving handshake records
    const mockRecords = [
      {
        id: 'POD-001',
        shipmentId: 'SHIP-001',
        deliveryPersonId: 'USER-001',
        status: 'VERIFIED',
        verificationScore: 92,
        deliveryTimestamp: new Date('2025-01-19T10:30:00Z'),
        verificationMethods: ['nfc', 'biometric_fingerprint', 'geolocation', 'photo_proof'],
        blockchainTransactionId: 'TXN-001-ABC123'
      },
      {
        id: 'POD-002',
        shipmentId: 'SHIP-002',
        deliveryPersonId: 'USER-001',
        status: 'PENDING_REVIEW',
        verificationScore: 76,
        deliveryTimestamp: new Date('2025-01-19T11:15:00Z'),
        verificationMethods: ['nfc', 'geolocation'],
        blockchainTransactionId: null
      }
    ]

    let filteredRecords = mockRecords

    if (shipmentId) {
      filteredRecords = filteredRecords.filter(r => r.shipmentId === shipmentId)
    }

    if (proofOfDeliveryId) {
      filteredRecords = filteredRecords.filter(r => r.id === proofOfDeliveryId)
    }

    if (deliveryPersonId) {
      filteredRecords = filteredRecords.filter(r => r.deliveryPersonId === deliveryPersonId)
    }

    return NextResponse.json({
      success: true,
      data: filteredRecords,
      count: filteredRecords.length
    })

  } catch (error) {
    console.error('Digital handshake retrieval error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve digital handshake records'
    }, { status: 500 })
  }
} 