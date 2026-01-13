import { NextRequest, NextResponse } from 'next/server'
import { ReceivingService, ASNData } from '@/lib/services/wms/receiving-service'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const asnLineSchema = z.object({
  sku: z.string(),
  qty: z.number().int().positive(),
  uom: z.enum(['EACH', 'CASE', 'PALLET']).default('EACH'),
  lotNumber: z.string().optional()
})

const asnSchema = z.object({
  asnNumber: z.string(),
  poNumber: z.string(),
  supplierCode: z.string().optional(),
  warehouseId: z.string(),
  lines: z.array(asnLineSchema).min(1),
  dueDate: z.string().datetime().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = asnSchema.parse(body)

    // Convert to ReceivingService format
    const asnData: ASNData = {
      asnNumber: data.asnNumber,
      poNumber: data.poNumber,
      supplierCode: data.supplierCode,
      expectedItems: data.lines.map((line) => ({
        sku: line.sku,
        quantity: line.qty,
        uom: line.uom,
        lotNumber: line.lotNumber,
      })),
      expectedDate: data.dueDate ? new Date(data.dueDate) : undefined,
    }

    // Process ASN using ReceivingService
    const result = await ReceivingService.processASN(data.warehouseId, asnData)

    logger.info('ASN processed successfully', {
      asnNumber: data.asnNumber,
      warehouseId: data.warehouseId,
      receiptId: result.receiptId,
      matchedItems: result.matchedItems,
    })

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Create ASN error', error as Error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
































































