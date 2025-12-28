import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/tms/lanes - Get all lanes with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
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

    const lanes = await prisma.lane.findMany({
      where,
      orderBy: { lastUpdated: 'desc' }
    })

    return NextResponse.json(lanes)
  } catch (error) {
    console.error('Error fetching lanes:', error)
    return NextResponse.json({ error: 'Failed to fetch lanes' }, { status: 500 })
  }
}

// POST /api/tms/lanes - Create new lane
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['originCountry', 'destinationCountry']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const lane = await prisma.lane.create({
      data: {
        organizationId: data.organizationId || 'default-org', // In real app, get from auth
        originCountry: data.originCountry,
        originState: data.originState,
        originCity: data.originCity,
        originZip: data.originZip,
        destinationCountry: data.destinationCountry,
        destinationState: data.destinationState,
        destinationCity: data.destinationCity,
        destinationZip: data.destinationZip,
        distanceMiles: data.distanceMiles,
        transitDays: data.transitDays,
        averageCost: data.averageCost,
        volumeShipped: data.volumeShipped,
        onTimePercentage: data.onTimePercentage,
        preferredCarriers: data.preferredCarriers || [],
        costTrends: data.costTrends || {},
        capacityForecast: data.capacityForecast || {},
        riskFactors: data.riskFactors || [],
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })

    return NextResponse.json(lane, { status: 201 })
  } catch (error) {
    console.error('Error creating lane:', error)
    return NextResponse.json({ error: 'Failed to create lane' }, { status: 500 })
  }
}

// PUT /api/tms/lanes/[id] - Update lane
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const laneId = searchParams.get('id')
    
    if (!laneId) {
      return NextResponse.json({ error: 'Lane ID is required' }, { status: 400 })
    }

    const data = await request.json()
    
    const lane = await prisma.lane.update({
      where: { id: laneId },
      data: {
        distanceMiles: data.distanceMiles,
        transitDays: data.transitDays,
        averageCost: data.averageCost,
        volumeShipped: data.volumeShipped,
        onTimePercentage: data.onTimePercentage,
        preferredCarriers: data.preferredCarriers,
        costTrends: data.costTrends,
        capacityForecast: data.capacityForecast,
        riskFactors: data.riskFactors,
        isActive: data.isActive,
        lastUpdated: new Date()
      }
    })

    return NextResponse.json(lane)
  } catch (error) {
    console.error('Error updating lane:', error)
    return NextResponse.json({ error: 'Failed to update lane' }, { status: 500 })
  }
}

// DELETE /api/tms/lanes/[id] - Delete lane
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const laneId = searchParams.get('id')
    
    if (!laneId) {
      return NextResponse.json({ error: 'Lane ID is required' }, { status: 400 })
    }

    await prisma.lane.delete({
      where: { id: laneId }
    })

    return NextResponse.json({ message: 'Lane deleted successfully' })
  } catch (error) {
    console.error('Error deleting lane:', error)
    return NextResponse.json({ error: 'Failed to delete lane' }, { status: 500 })
  }
}





