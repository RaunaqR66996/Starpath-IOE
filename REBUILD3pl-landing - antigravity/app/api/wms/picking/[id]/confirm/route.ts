/**
 * WMS Pick Confirmation API
 * Confirms pick task completion
 */

import { NextRequest, NextResponse } from 'next/server'
import { PickingService, PickConfirmation } from '@/lib/services/wms/picking-service'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const confirmPickSchema = z.object({
  siteId: z.string(),
  locationCode: z.string(),
  itemSku: z.string(),
  quantityPicked: z.number().int().positive(),
  quantityExpected: z.number().int().positive(),
  lotNumber: z.string().optional(),
})

// POST /api/wms/picking/[id]/confirm - Confirm pick completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pickId } = await params
    const body = await request.json()

    // Validate input
    const validatedData = confirmPickSchema.parse(body)

    const confirmation: PickConfirmation = {
      pickId,
      locationCode: validatedData.locationCode,
      itemSku: validatedData.itemSku,
      quantityPicked: validatedData.quantityPicked,
      quantityExpected: validatedData.quantityExpected,
      lotNumber: validatedData.lotNumber,
      timestamp: new Date(),
    }

    // Confirm pick using service
    const result = await PickingService.confirmPick(
      validatedData.siteId,
      confirmation
    )

    logger.info('Pick confirmed', {
      pickId,
      siteId: validatedData.siteId,
      itemSku: validatedData.itemSku,
      quantityPicked: validatedData.quantityPicked,
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

    logger.error('Error confirming pick', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm pick',
      },
      { status: 500 }
    )
  }
}


