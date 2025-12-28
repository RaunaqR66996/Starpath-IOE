/**
 * API Endpoint to push inventory updates to ERPNext
 * POST /api/integration/erpnext/push-inventory
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { erpnextSyncService } from '@/lib/services/erpnext-sync-service'
import { logger } from '@/lib/monitoring/logger'

const pushInventorySchema = z.object({
  organizationId: z.string(),
  itemCode: z.string(),
  warehouse: z.string(),
  qty: z.number(),
  availableQty: z.number()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await pushInventorySchema.parseAsync(body)

    const connector = erpnextSyncService.getConnector(data.organizationId)
    if (!connector) {
      return NextResponse.json(
        { success: false, error: 'ERPNext connector not initialized for this organization' },
        { status: 400 }
      )
    }

    const success = await connector.pushInventoryUpdate(
      data.itemCode,
      data.warehouse,
      data.qty,
      data.availableQty
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to push inventory to ERPNext' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory pushed to ERPNext successfully'
    })
  } catch (error) {
    logger.error('erpnext_push_inventory_api_failed', error as Error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

