import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const organizationId = searchParams.get('organizationId') || 'default-org'
    
    // Build where clause
    const where: any = {
      organizationId,
      isActive: status ? status === 'active' : true,
    }
    
    if (type) {
      where.serviceType = type
    }
    
    // Query carriers from database
    const carriers = await prisma.carrier.findMany({
      where,
      orderBy: {
        carrierName: 'asc',
      },
    })

    // Transform to expected format
    const data = carriers.map((carrier) => ({
      id: carrier.id,
      carrierId: carrier.id, // Use id as carrierId
      name: carrier.name || carrier.code || 'Unknown',
      code: carrier.code || '',
      type: carrier.type || 'Ground',
      status: carrier.isActive ? 'active' : 'inactive',
      contact: {
        phone: carrier.contactPhone,
        email: carrier.contactEmail,
      },
      address: 'N/A', // Address fields not in schema
      scac: carrier.code || 'N/A', // Use code field
      isActive: carrier.isActive,
    }))

    logger.info('Fetched carriers', {
      organizationId,
      count: data.length,
      status,
    })
    
    return NextResponse.json({
      success: true,
      data,
      total: data.length
    })
  } catch (error) {
    logger.error('Failed to fetch carriers', error as Error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch carriers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const organizationId = body.organizationId || 'default-org'
    
    // Validate required fields
    if (!body.name || !body.carrierCode) {
      return NextResponse.json(
        { success: false, error: 'name and carrierCode are required' },
        { status: 400 }
      )
    }
    
    // Check if carrier code already exists
    const existing = await prisma.carrier.findFirst({
      where: {
        code: body.carrierCode,
        organizationId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Carrier code already exists' },
        { status: 409 }
      )
    }

    // Generate carrier code
    const lastCarrier = await prisma.carrier.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    })

    const carrierCount = lastCarrier && lastCarrier.code
      ? parseInt(lastCarrier.code.split('-').pop() || '0') + 1
      : 1
    const carrierCode = body.carrierCode || `CARR-${String(carrierCount).padStart(4, '0')}`
    
    // Create new carrier
    const newCarrier = await prisma.carrier.create({
      data: {
        organizationId,
        carrierCode: carrierCode,
        carrierName: body.name,
        transportMode: 'ROAD',
        serviceLevel: 'STANDARD',
        code: carrierCode,
        name: body.name,
        type: body.type || 'Ground',
        contactName: body.contactName || null,
        contactEmail: body.contact?.email || null,
        contactPhone: body.contact?.phone || null,
        isActive: true,
      },
    })

    logger.info('Carrier created', {
      id: newCarrier.id,
      code: newCarrier.code,
      organizationId,
    })
    
    return NextResponse.json({
      success: true,
      data: newCarrier
    }, { status: 201 })
  } catch (error) {
    logger.error('Failed to create carrier', error as Error)
    return NextResponse.json(
      { success: false, error: 'Failed to create carrier' },
      { status: 500 }
    )
  }
}





