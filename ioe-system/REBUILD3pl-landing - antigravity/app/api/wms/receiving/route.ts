/**
 * WMS Receiving API
 * Handles ASN processing and receiving workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { ReceivingService, ASNData } from '@/lib/services/wms/receiving-service'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

// Validation schemas
const asnLineSchema = z.object({
  sku: z.string(),
  quantity: z.number().int().positive(),
  uom: z.string().optional(),
  lotNumber: z.string().optional(),
  expirationDate: z.string().datetime().optional(),
})

const processASNSchema = z.object({
  siteId: z.string(),
  asnNumber: z.string(),
  poNumber: z.string(),
  supplierCode: z.string().optional(),
  expectedItems: z.array(asnLineSchema).min(1),
  expectedDate: z.string().datetime().optional(),
})

// GET /api/wms/receiving - List receiving records and pending ASNs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const action = searchParams.get('action')

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'siteId is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'pending':
        // Get pending ASNs
        const pendingASNs = await ReceivingService.getPendingASNs(siteId)
        return NextResponse.json({
          success: true,
          data: pendingASNs,
        })

      case 'exceptions':
        // Get receiving exceptions
        const exceptions = await ReceivingService.getReceivingExceptions(siteId)
        return NextResponse.json({
          success: true,
          data: exceptions,
        })

      default:
        // Get all receiving records (default)
        const asns = await ReceivingService.getPendingASNs(siteId)
        return NextResponse.json({
          success: true,
          data: asns,
        })
    }
  } catch (error) {
    logger.error('Error fetching receiving records', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch receiving records',
      },
      { status: 500 }
    )
  }
}

// POST /api/wms/receiving - Process ASN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = processASNSchema.parse(body)

    const asnData: ASNData = {
      asnNumber: validatedData.asnNumber,
      poNumber: validatedData.poNumber,
      supplierCode: validatedData.supplierCode,
      expectedItems: validatedData.expectedItems.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        uom: item.uom,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
      })),
      expectedDate: validatedData.expectedDate ? new Date(validatedData.expectedDate) : undefined,
    }

    // Process ASN using service
    const result = await ReceivingService.processASN(validatedData.siteId, asnData)

    logger.info('ASN processed successfully', {
      siteId: validatedData.siteId,
      asnNumber: asnData.asnNumber,
      receiptId: result.receiptId,
    })

    return NextResponse.json({
      success: true,
      data: result,
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

    logger.error('Error processing ASN', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process ASN',
      },
      { status: 500 }
    )
  }
}


