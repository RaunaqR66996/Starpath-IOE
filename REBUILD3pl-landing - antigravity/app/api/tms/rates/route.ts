import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/tms/rates - Get all rates with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const carrierId = searchParams.get('carrierId')
    const serviceLevel = searchParams.get('serviceLevel')
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (carrierId) where.carrierId = carrierId
    if (serviceLevel) where.serviceLevel = serviceLevel
    if (origin) {
      where.OR = [
        { originCity: { contains: origin, mode: 'insensitive' } },
        { originState: { contains: origin, mode: 'insensitive' } },
        { originZip: { contains: origin } }
      ]
    }
    if (destination) {
      where.AND = [
        where.AND || {},
        {
          OR: [
            { destinationCity: { contains: destination, mode: 'insensitive' } },
            { destinationState: { contains: destination, mode: 'insensitive' } },
            { destinationZip: { contains: destination } }
          ]
        }
      ]
    }
    if (isActive !== null) where.isActive = isActive === 'true'

    const rates = await prisma.rate.findMany({
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
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching rates:', error)
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
  }
}

// POST /api/tms/rates - Create new rate
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['carrierId', 'serviceLevel', 'originCountry', 'destinationCountry', 'baseRate']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const rate = await prisma.rate.create({
      data: {
        organizationId: data.organizationId || 'default-org', // In real app, get from auth
        carrierId: data.carrierId,
        serviceLevel: data.serviceLevel,
        originCountry: data.originCountry,
        originState: data.originState,
        originCity: data.originCity,
        originZip: data.originZip,
        destinationCountry: data.destinationCountry,
        destinationState: data.destinationState,
        destinationCity: data.destinationCity,
        destinationZip: data.destinationZip,
        baseRate: data.baseRate,
        ratePerKg: data.ratePerKg,
        ratePerCubicMeter: data.ratePerCubicMeter,
        minimumCharge: data.minimumCharge,
        maximumCharge: data.maximumCharge,
        weightBreak1: data.weightBreak1,
        weightBreak2: data.weightBreak2,
        weightBreak3: data.weightBreak3,
        fuelSurchargePct: data.fuelSurchargePct,
        residentialSurcharge: data.residentialSurcharge,
        deliverySurcharge: data.deliverySurcharge,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes,
        metadata: data.metadata || {}
      },
      include: {
        carrier: {
          select: {
            id: true,
            carrierName: true,
            carrierCode: true
          }
        }
      }
    })

    return NextResponse.json(rate, { status: 201 })
  } catch (error) {
    console.error('Error creating rate:', error)
    return NextResponse.json({ error: 'Failed to create rate' }, { status: 500 })
  }
}

// PUT /api/tms/rates/[id] - Update rate
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rateId = searchParams.get('id')
    
    if (!rateId) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 })
    }

    const data = await request.json()
    
    const rate = await prisma.rate.update({
      where: { id: rateId },
      data: {
        serviceLevel: data.serviceLevel,
        originCountry: data.originCountry,
        originState: data.originState,
        originCity: data.originCity,
        originZip: data.originZip,
        destinationCountry: data.destinationCountry,
        destinationState: data.destinationState,
        destinationCity: data.destinationCity,
        destinationZip: data.destinationZip,
        baseRate: data.baseRate,
        ratePerKg: data.ratePerKg,
        ratePerCubicMeter: data.ratePerCubicMeter,
        minimumCharge: data.minimumCharge,
        maximumCharge: data.maximumCharge,
        weightBreak1: data.weightBreak1,
        weightBreak2: data.weightBreak2,
        weightBreak3: data.weightBreak3,
        fuelSurchargePct: data.fuelSurchargePct,
        residentialSurcharge: data.residentialSurcharge,
        deliverySurcharge: data.deliverySurcharge,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        isActive: data.isActive,
        notes: data.notes,
        metadata: data.metadata
      },
      include: {
        carrier: {
          select: {
            id: true,
            carrierName: true,
            carrierCode: true
          }
        }
      }
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error updating rate:', error)
    return NextResponse.json({ error: 'Failed to update rate' }, { status: 500 })
  }
}

// DELETE /api/tms/rates/[id] - Delete rate
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rateId = searchParams.get('id')
    
    if (!rateId) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 })
    }

    await prisma.rate.delete({
      where: { id: rateId }
    })

    return NextResponse.json({ message: 'Rate deleted successfully' })
  } catch (error) {
    console.error('Error deleting rate:', error)
    return NextResponse.json({ error: 'Failed to delete rate' }, { status: 500 })
  }
}





