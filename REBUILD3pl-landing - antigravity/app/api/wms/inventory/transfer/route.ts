/**
 * WMS Inventory Transfer API
 * Handles inventory transfers between locations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const transferSchema = z.object({
  siteId: z.string(),
  itemSku: z.string(),
  fromLocationCode: z.string(),
  toLocationCode: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
})

// POST /api/wms/inventory/transfer - Transfer inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = transferSchema.parse(body)

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

    // Find item
    const item = await prisma.item.findUnique({
      where: { sku: validatedData.itemSku },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: `Item ${validatedData.itemSku} not found` },
        { status: 404 }
      )
    }

    // Find from location
    const fromLocation = await prisma.location.findFirst({
      where: {
        warehouseId: warehouse.id,
        code: validatedData.fromLocationCode,
      },
    })

    if (!fromLocation) {
      return NextResponse.json(
        { success: false, error: `From location ${validatedData.fromLocationCode} not found` },
        { status: 404 }
      )
    }

    // Find to location
    const toLocation = await prisma.location.findFirst({
      where: {
        warehouseId: warehouse.id,
        code: validatedData.toLocationCode,
      },
    })

    if (!toLocation) {
      return NextResponse.json(
        { success: false, error: `To location ${validatedData.toLocationCode} not found` },
        { status: 404 }
      )
    }

    // Find source inventory
    const sourceInventory = await prisma.inventory.findFirst({
      where: {
        itemId: item.id,
        locationId: fromLocation.id,
      },
    })

    if (!sourceInventory) {
      return NextResponse.json(
        { success: false, error: `No inventory found at ${validatedData.fromLocationCode}` },
        { status: 404 }
      )
    }

    if (sourceInventory.quantityAvailable < validatedData.quantity) {
      return NextResponse.json(
        { success: false, error: `Insufficient inventory. Available: ${sourceInventory.quantityAvailable}` },
        { status: 400 }
      )
    }

    // Execute transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from source
      await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: {
          quantity: sourceInventory.quantity - validatedData.quantity,
          quantityAvailable: sourceInventory.quantityAvailable - validatedData.quantity,
        },
      })

      // Add to destination
      const destInventory = await tx.inventory.findFirst({
        where: {
          itemId: item.id,
          locationId: toLocation.id,
        },
      })

      if (destInventory) {
        await tx.inventory.update({
          where: { id: destInventory.id },
          data: {
            quantity: destInventory.quantity + validatedData.quantity,
            quantityAvailable: destInventory.quantityAvailable + validatedData.quantity,
          },
        })
      } else {
        await tx.inventory.create({
          data: {
            itemId: item.id,
            locationId: toLocation.id,
            quantity: validatedData.quantity,
            quantityAvailable: validatedData.quantity,
            quantityReserved: 0,
            quantityAllocated: 0,
            status: 'AVAILABLE',
          },
        })
      }

      return {
        success: true,
        message: `Transferred ${validatedData.quantity} of ${validatedData.itemSku} from ${validatedData.fromLocationCode} to ${validatedData.toLocationCode}`,
      }
    })

    logger.info('Inventory transferred', {
      siteId: validatedData.siteId,
      itemSku: validatedData.itemSku,
      from: validatedData.fromLocationCode,
      to: validatedData.toLocationCode,
      quantity: validatedData.quantity,
    })

    return NextResponse.json({
      success: true,
      data: result,
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

    logger.error('Error transferring inventory', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transfer inventory',
      },
      { status: 500 }
    )
  }
}


