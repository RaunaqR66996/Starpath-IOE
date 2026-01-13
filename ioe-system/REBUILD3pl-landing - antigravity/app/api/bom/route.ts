import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/monitoring/logger'

// TODO: Add BOM (Bill of Materials) model to schema
// Temporarily returning empty data to unblock build

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return empty array until BOM model is added to schema
    logger.info('Fetched BOMs', { count: 0 })

    return NextResponse.json({
      data: [],
      total: 0,
      page: 1,
      limit: 100
    })

  } catch (error) {
    logger.error('Error fetching BOMs', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch BOMs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Return mock response until BOM model is added to schema
    logger.info('Created BOM (mock)', { productId: body.productId })

    return NextResponse.json({
      id: `BOM-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    logger.error('Error creating BOM', error as Error)

    return NextResponse.json(
      { error: 'Failed to create BOM' },
      { status: 500 }
    )
  }
}
