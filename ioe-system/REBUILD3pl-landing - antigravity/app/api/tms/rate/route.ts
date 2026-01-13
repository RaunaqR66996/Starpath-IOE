import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { RateRequest, RateResponse, Quote, TmsError } from '@/types/tms'

const prisma = new PrismaClient()

// POST /api/tms/rate
export async function POST(request: NextRequest) {
  try {
    const body: RateRequest = await request.json()

    if (!body.shipment_id) {
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'shipment_id is required' },
        { status: 400 }
      )
    }

    // Validate shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { id: body.shipment_id },
      include: {
        pieces: true,
        stops: true
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Mock rating logic - in real implementation, this would call carrier APIs
    const quotes = await generateQuotes(shipment)

    const response: RateResponse = {
      quotes
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to rate shipment:', error)
    return NextResponse.json(
      { code: 'RATE_ERROR', message: 'Failed to rate shipment' },
      { status: 500 }
    )
  }
}

// Mock quote generation
async function generateQuotes(shipment: any): Promise<Quote[]> {
  const quotes: Quote[] = []

  // Calculate shipment characteristics
  const totalWeight = shipment.totalWeight
  const totalValue = shipment.totalValue
  const stopCount = shipment.stops.length
  const isLTL = totalWeight > 150 || stopCount > 2

  if (isLTL) {
    // LTL quotes
    quotes.push({
      carrierId: 'FEDEX_FREIGHT',
      carrierName: 'FedEx Freight',
      serviceLevel: 'Standard LTL',
      cost: Math.max(150, totalWeight * 0.85 + stopCount * 25),
      currency: 'USD',
      transitDays: 3,
      guaranteed: false,
      features: ['LTL Service', 'Multi-stop', 'Tracking']
    })

    quotes.push({
      carrierId: 'UPS_FREIGHT',
      carrierName: 'UPS Freight',
      serviceLevel: 'Standard LTL',
      cost: Math.max(140, totalWeight * 0.80 + stopCount * 30),
      currency: 'USD',
      transitDays: 2,
      guaranteed: true,
      features: ['LTL Service', 'Guaranteed Delivery', 'Multi-stop']
    })

    quotes.push({
      carrierId: 'ODFL',
      carrierName: 'Old Dominion',
      serviceLevel: 'Standard LTL',
      cost: Math.max(130, totalWeight * 0.75 + stopCount * 20),
      currency: 'USD',
      transitDays: 4,
      guaranteed: false,
      features: ['LTL Service', 'Multi-stop', 'Insurance']
    })
  } else {
    // Parcel quotes
    quotes.push({
      carrierId: 'FEDEX_GROUND',
      carrierName: 'FedEx Ground',
      serviceLevel: 'Ground',
      cost: Math.max(8, totalWeight * 0.45 + 5),
      currency: 'USD',
      transitDays: 2,
      guaranteed: false,
      features: ['Ground Service', 'Tracking', 'Signature Required']
    })

    quotes.push({
      carrierId: 'UPS_GROUND',
      carrierName: 'UPS Ground',
      serviceLevel: 'Ground',
      cost: Math.max(7, totalWeight * 0.42 + 4),
      currency: 'USD',
      transitDays: 2,
      guaranteed: false,
      features: ['Ground Service', 'Tracking', 'Insurance']
    })

    quotes.push({
      carrierId: 'FEDEX_EXPRESS',
      carrierName: 'FedEx Express',
      serviceLevel: 'Overnight',
      cost: Math.max(25, totalWeight * 1.2 + 15),
      currency: 'USD',
      transitDays: 1,
      guaranteed: true,
      features: ['Overnight', 'Guaranteed Delivery', 'Priority Handling']
    })
  }

  // Sort by cost
  return quotes.sort((a, b) => a.cost - b.cost)
}








































































