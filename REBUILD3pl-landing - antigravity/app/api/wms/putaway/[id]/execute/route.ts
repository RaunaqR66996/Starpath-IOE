/**
 * WMS Putaway Execution API
 * Executes putaway operation (moves inventory to storage)
 */

import { NextRequest, NextResponse } from 'next/server'
import { PutawayService } from '@/lib/services/wms/putaway-service'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const executePutawaySchema = z.object({
  siteId: z.string(),
  fromLocationId: z.string(),
  toLocationId: z.string(),
  itemSku: z.string(),
  quantity: z.number().int().positive(),
})

// POST /api/wms/putaway/[id]/execute - Execute putaway
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: putawayId } = await params
    const body = await request.json()

    // Validate input
    const validatedData = executePutawaySchema.parse(body)

    // Execute putaway using service
    const result = await PutawayService.executePutaway(
      validatedData.siteId,
      validatedData.fromLocationId,
      validatedData.toLocationId,
      validatedData.itemSku,
      validatedData.quantity
    )

    logger.info('Putaway executed', {
      putawayId,
      siteId: validatedData.siteId,
      itemSku: validatedData.itemSku,
      from: validatedData.fromLocationId,
      to: validatedData.toLocationId,
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

    logger.error('Error executing putaway', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute putaway',
      },
      { status: 500 }
    )
  }
}


