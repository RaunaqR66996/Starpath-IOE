/**
 * WMS Putaway API
 * Handles putaway task creation and location optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { PutawayService } from '@/lib/services/wms/putaway-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

// Validation schemas
const createPutawaySchema = z.object({
  siteId: z.string(),
  itemSku: z.string(),
  quantity: z.number().int().positive(),
  fromLocationId: z.string().optional(),
})

// GET /api/wms/putaway - List putaway tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status')

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Find warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { code: siteId },
    })

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: `Warehouse ${siteId} not found` },
        { status: 404 }
      )
    }

    // Get inventory at receiving locations (pending putaway)
    const receivingInventory = await prisma.inventory.findMany({
      where: {
        location: {
          warehouseId: warehouse.id,
          type: 'RECEIVING',
        },
        quantity: {
          gt: 0,
        },
      },
      include: {
        item: true,
        location: true,
      },
    })

    // Transform to putaway tasks
    const putawayTasks = receivingInventory.map((inv) => ({
      id: `putaway-${inv.id}`,
      receiptNumber: `REC-${inv.id.substring(0, 8)}`,
      itemSku: inv.item.sku,
      itemName: inv.item.name,
      quantity: inv.quantity,
      fromLocation: inv.location.code,
      suggestedLocation: 'TBD', // Will be calculated on demand
      status: 'PENDING',
      priority: 'NORMAL',
    }))

    logger.info('Fetched putaway tasks', {
      siteId,
      count: putawayTasks.length,
    })

    return NextResponse.json({
      success: true,
      data: putawayTasks,
      total: putawayTasks.length,
    })

  } catch (error) {
    logger.error('Error fetching putaway tasks', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch putaway tasks',
      },
      { status: 500 }
    )
  }
}

// POST /api/wms/putaway - Create putaway task with optimal location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createPutawaySchema.parse(body)

    // Get optimal location using service
    const optimization = await PutawayService.optimizePutaway(
      validatedData.siteId,
      validatedData.itemSku,
      validatedData.quantity
    )

    logger.info('Putaway optimized', {
      siteId: validatedData.siteId,
      itemSku: validatedData.itemSku,
      recommendedLocation: optimization.recommendedLocation,
    })

    return NextResponse.json({
      success: true,
      data: optimization,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    logger.error('Error creating putaway task', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create putaway task',
      },
      { status: 500 }
    )
  }
}


