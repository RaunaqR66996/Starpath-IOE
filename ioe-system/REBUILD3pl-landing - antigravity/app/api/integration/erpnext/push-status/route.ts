/**
 * API Endpoint to push shipment status updates to ERPNext
 * POST /api/integration/erpnext/push-status
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { erpnextSyncService } from '@/lib/services/erpnext-sync-service'
import { logger } from '@/lib/monitoring/logger'

const pushStatusSchema = z.object({
  organizationId: z.string(),
  orderId: z.string(),
  shipmentId: z.string(),
  status: z.string(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await pushStatusSchema.parseAsync(body)

    const success = await erpnextSyncService.pushShipmentStatus(
      data.organizationId,
      data.orderId,
      data.shipmentId,
      data.status,
      data.trackingNumber,
      data.carrier
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to push status to ERPNext' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Status pushed to ERPNext successfully'
    })
  } catch (error) {
    logger.error('erpnext_push_status_api_failed', error as Error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

