import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { LabelsRequest, LabelsResponse, Label, TmsError } from '@/types/tms'

const prisma = new PrismaClient()

// POST /api/tms/labels
export async function POST(request: NextRequest) {
  try {
    const body: LabelsRequest = await request.json()

    if (!body.shipment_id) {
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'shipment_id is required' },
        { status: 400 }
      )
    }

    // Validate shipment exists and is rated
    const shipment = await prisma.shipment.findUnique({
      where: { id: body.shipment_id }
    })

    if (!shipment) {
      return NextResponse.json(
        { code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' },
        { status: 404 }
      )
    }

    if (shipment.status !== 'RATED') {
      return NextResponse.json(
        { code: 'SHIPMENT_NOT_RATED', message: 'Shipment must be rated before generating labels' },
        { status: 400 }
      )
    }

    // Generate labels (mock implementation)
    const labels = await generateLabels(shipment)

    // Update shipment status
    await prisma.shipment.update({
      where: { id: body.shipment_id },
      data: {
        status: 'LABELED',
        updatedAt: new Date()
      }
    })

    // Add labeling event
    await prisma.trackingEvent.create({
      data: {
        shipmentId: body.shipment_id,
        type: 'CREATED', // Use existing event type
        description: `Labels generated: ${labels.length} labels created`,
        nfcVerified: false
      }
    })

    const response: LabelsResponse = {
      labels
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to generate labels:', error)
    return NextResponse.json(
      { code: 'LABELS_ERROR', message: 'Failed to generate labels' },
      { status: 500 }
    )
  }
}

// Mock label generation
async function generateLabels(shipment: any): Promise<Label[]> {
  const labels: Label[] = []
  const timestamp = new Date().toISOString()

  // Shipping label
  labels.push({
    id: `label-${shipment.id}-shipping`,
    type: 'SHIPPING_LABEL',
    url: `/api/labels/${shipment.id}/shipping.pdf`,
    format: 'PDF',
    size: '4x6',
    generatedAt: timestamp
  })

  // Bill of Lading
  labels.push({
    id: `label-${shipment.id}-bol`,
    type: 'BOL',
    url: `/api/labels/${shipment.id}/bol.pdf`,
    format: 'PDF',
    size: '8.5x11',
    generatedAt: timestamp
  })

  // Packing slip
  labels.push({
    id: `label-${shipment.id}-packing`,
    type: 'PACKING_SLIP',
    url: `/api/labels/${shipment.id}/packing.pdf`,
    format: 'PDF',
    size: '8.5x11',
    generatedAt: timestamp
  })

  // ZPL label for warehouse
  labels.push({
    id: `label-${shipment.id}-zpl`,
    type: 'SHIPPING_LABEL',
    url: `/api/labels/${shipment.id}/shipping.zpl`,
    format: 'ZPL',
    size: '4x6',
    generatedAt: timestamp
  })

  return labels
}








































































