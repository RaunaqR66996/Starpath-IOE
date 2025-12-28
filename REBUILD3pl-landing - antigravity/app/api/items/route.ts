import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const organizationId = searchParams.get('organizationId') || 'default-org'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      organizationId,
      activeStatus: 'Active',
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Query items from database
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: {
          sku: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ])

    logger.info('Fetched items', {
      organizationId,
      count: items.length,
      search,
    })

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    logger.error('Get items error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const organizationId = body.organizationId || 'default-org'

    // Validate required fields
    if (!body.sku || !body.name) {
      return NextResponse.json(
        { error: 'SKU and name are required' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existing = await prisma.item.findFirst({
      where: {
        sku: body.sku,
        organizationId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      )
    }

    // Create item
    const newItem = await prisma.item.create({
      data: {
        organizationId,
        sku: body.sku,
        productName: body.name,
        name: body.name, // Legacy support
        description: body.description,
        category: body.category || 'General',
        primaryUOM: body.uom || 'EA',
        unitPrice: body.unitPrice || 0,
        activeStatus: 'Active',
      },
    })

    logger.info('Item created', {
      itemId: newItem.id,
      sku: newItem.sku,
      organizationId,
    })

    return NextResponse.json(newItem, { status: 201 })

  } catch (error) {
    logger.error('Create item error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}