/**
 * WMS Cycle Count API
 * Handles cycle counting and inventory variance resolution
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const initiateCycleCountSchema = z.object({
  siteId: z.string(),
  locationCodes: z.array(z.string()).optional(),
  itemSkus: z.array(z.string()).optional(),
  countType: z.enum(['LOCATION', 'ITEM', 'FULL']).default('LOCATION'),
})

const recordCountSchema = z.object({
  cycleCountId: z.string(),
  counts: z.array(z.object({
    itemSku: z.string(),
    locationCode: z.string(),
    countedQuantity: z.number().int().nonnegative(),
    systemQuantity: z.number().int().nonnegative(),
  })),
})

// POST /api/wms/inventory/cycle-count - Initiate cycle count
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = initiateCycleCountSchema.parse(body)

    // Find warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { code: validatedData.siteId },
    })

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: `Warehouse ${validatedData.siteId} not found` },
        { status: 404 }
      )
    }

    // Build inventory query based on count type
    const where: any = {
      location: {
        warehouseId: warehouse.id,
      },
    }

    if (validatedData.locationCodes && validatedData.locationCodes.length > 0) {
      where.location.code = { in: validatedData.locationCodes }
    }

    if (validatedData.itemSkus && validatedData.itemSkus.length > 0) {
      where.item = {
        sku: { in: validatedData.itemSkus },
      }
    }

    // Get inventory to count
    const inventoryToCount = await prisma.inventory.findMany({
      where,
      include: {
        item: {
          select: {
            sku: true,
            name: true,
          },
        },
        location: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      take: 100, // Limit cycle count size
    })

    const cycleCountId = `CC-${Date.now()}`

    const cycleCount = {
      id: cycleCountId,
      siteId: validatedData.siteId,
      countType: validatedData.countType,
      status: 'IN_PROGRESS',
      itemsToCount: inventoryToCount.length,
      itemsCounted: 0,
      createdAt: new Date(),
      items: inventoryToCount.map((inv) => ({
        itemSku: inv.item.sku,
        itemName: inv.item.name,
        locationCode: inv.location.code,
        systemQuantity: inv.quantity,
        countedQuantity: null,
      })),
    }

    logger.info('Cycle count initiated', {
      cycleCountId,
      siteId: validatedData.siteId,
      itemsToCount: inventoryToCount.length,
    })

    return NextResponse.json({
      success: true,
      data: cycleCount,
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

    logger.error('Error initiating cycle count', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate cycle count',
      },
      { status: 500 }
    )
  }
}

// PUT /api/wms/inventory/cycle-count - Record count results
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = recordCountSchema.parse(body)

    const variances: any[] = []
    const adjustments: any[] = []

    // Process each count
    for (const count of validatedData.counts) {
      const variance = count.countedQuantity - count.systemQuantity

      if (variance !== 0) {
        variances.push({
          itemSku: count.itemSku,
          locationCode: count.locationCode,
          systemQuantity: count.systemQuantity,
          countedQuantity: count.countedQuantity,
          variance,
        })

        // Find and adjust inventory
        const item = await prisma.item.findUnique({
          where: { sku: count.itemSku },
        })

        if (item) {
          const location = await prisma.location.findFirst({
            where: { code: count.locationCode },
          })

          if (location) {
            const inventory = await prisma.inventory.findFirst({
              where: {
                itemId: item.id,
                locationId: location.id,
              },
            })

            if (inventory) {
              await prisma.inventory.update({
                where: { id: inventory.id },
                data: {
                  quantity: count.countedQuantity,
                  quantityAvailable: count.countedQuantity,
                },
              })

              adjustments.push({
                itemSku: count.itemSku,
                locationCode: count.locationCode,
                adjustment: variance,
              })
            }
          }
        }
      }
    }

    logger.info('Cycle count completed', {
      cycleCountId: validatedData.cycleCountId,
      variancesFound: variances.length,
      adjustmentsMade: adjustments.length,
    })

    return NextResponse.json({
      success: true,
      data: {
        cycleCountId: validatedData.cycleCountId,
        status: 'COMPLETED',
        variances,
        adjustments,
      },
    })

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

    logger.error('Error recording cycle count', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record cycle count',
      },
      { status: 500 }
    )
  }
}


