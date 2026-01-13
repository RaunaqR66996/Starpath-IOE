/**
 * WMS Receiving Confirmation API
 * Confirms physical receipt of items
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReceivingService } from '@/lib/services/wms/receiving-service'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const receivedItemSchema = z.object({
  sku: z.string(),
  quantity: z.number().int().positive(),
  locationCode: z.string(),
  lotNumber: z.string().optional(),
  serialNumber: z.string().optional(),
})

const confirmReceiptSchema = z.object({
  siteId: z.string(),
  receivedItems: z.array(receivedItemSchema).min(1),
})

// POST /api/wms/receiving/[id]/confirm - Confirm physical receipt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: receiptId } = await params
    const body = await request.json()

    // Validate input
    const validatedData = confirmReceiptSchema.parse(body)

    // Confirm receipt using service
    const result = await ReceivingService.receiveItems(
      validatedData.siteId,
      receiptId,
      validatedData.receivedItems
    )

    logger.info('Receipt confirmed', {
      receiptId,
      siteId: validatedData.siteId,
      itemsReceived: validatedData.receivedItems.length,
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

    logger.error('Error confirming receipt', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm receipt',
      },
      { status: 500 }
    )
  }
}


