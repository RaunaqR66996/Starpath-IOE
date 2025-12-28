import crypto from 'crypto'
import { z } from 'zod'
import { erpAdapter, ErpWebhookPayload } from '@/lib/integrations/erp-adapter'

const webhookSchema = z.object({
  id: z.string(),
  organizationId: z.string().optional(),
  eventType: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  payload: z.record(z.any()),
  occurredAt: z.string()
})

export function verifyErpSignature(payload: string, signatureHeader?: string | null, secret = process.env.ERP_WEBHOOK_SECRET) {
  // If no secret is configured, allow requests (for development/testing)
  if (!secret) {
    return true
  }

  // If secret is configured but no signature provided, reject
  if (!signatureHeader) {
    return false
  }

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  if (expected.length !== signatureHeader.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))
}

let adapter = erpAdapter

export function setErpWebhookAdapter(mockAdapter: typeof erpAdapter) {
  adapter = mockAdapter
}

export async function processErpWebhook(rawBody: string, signature: string | null) {
  // For ERPNext, signature verification is optional (can be configured)
  // If ERP_WEBHOOK_SECRET is set, verify signature; otherwise allow requests
  if (process.env.ERP_WEBHOOK_SECRET) {
    const signatureValid = verifyErpSignature(rawBody, signature)
    if (!signatureValid) {
      return { success: false, status: 401, error: 'Invalid signature' } as const
    }
  } else {
    // No secret configured - allow requests (for development)
    // verifyErpSignature will return true when no secret is set
    verifyErpSignature(rawBody, signature)
  }

  const body = JSON.parse(rawBody)

  // Handle ERPNext webhook format (simpler format)
  if (body.eventType && body.entityId && body.payload) {
    // ERPNext webhook format
    await handleERPNextWebhook(body)
    return { success: true, status: 200 } as const
  }

  // Handle standard webhook format
  const parsed = webhookSchema.parse(body) as ErpWebhookPayload
  await adapter.handleWebhook(parsed)

  return { success: true, status: 200 } as const
}

import { ERPSyncService } from '@/lib/services/erp-sync-service'

// ... (keep existing imports and verification logic)

async function handleERPNextWebhook(body: any) {
  const { eventType, payload } = body

  try {
    if (eventType === 'order.created' || eventType === 'order.updated') {
      // Sync order using service
      await ERPSyncService.syncOrderFromERP(payload)
    } else if (eventType === 'warehouse.created' || eventType === 'warehouse.updated') {
      // Handle warehouse sync from ERPNext
      await handleERPNextWarehouseWebhook(body)
    } else if (eventType === 'inventory.updated') {
      // Handle inventory sync from ERPNext
      await handleERPNextInventoryWebhook(body)
    }
  } catch (error) {
    console.error('Error processing ERPNext webhook:', error)
    throw error
  }
}

async function handleERPNextWarehouseWebhook(body: any) {
  const { payload } = body

  const { prisma } = await import('@/lib/prisma')

  try {
    const warehouseData = payload

    // Find or create warehouse
    let warehouse = await prisma.warehouse.findFirst({
      where: {
        warehouseCode: warehouseData.warehouse_code || warehouseData.name
      }
    })

    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          warehouseCode: warehouseData.warehouse_code || warehouseData.name,
          warehouseName: warehouseData.warehouse_name || warehouseData.name,
          warehouseType: warehouseData.warehouse_type || 'Warehouse',
          addressLine1: warehouseData.address_line1 || warehouseData.address_line || '',
          city: warehouseData.city || '',
          state: warehouseData.state || '',
          zipCode: warehouseData.zip_code || warehouseData.pincode || '',
          country: warehouseData.country || 'USA',
          organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default-org'
        }
      })
    } else {
      // Update existing warehouse
      await prisma.warehouse.update({
        where: { id: warehouse.id },
        data: {
          warehouseName: warehouseData.warehouse_name || warehouse.warehouseName,
          warehouseType: warehouseData.warehouse_type || warehouse.warehouseType,
          addressLine1: warehouseData.address_line1 || warehouse.addressLine1,
          city: warehouseData.city || warehouse.city,
          state: warehouseData.state || warehouse.state,
          zipCode: warehouseData.zip_code || warehouse.zipCode
        }
      })
    }
  } catch (error) {
    console.error('Error processing warehouse webhook:', error)
    throw error
  }
}

async function handleERPNextInventoryWebhook(body: any) {
  const { payload } = body

  const { prisma } = await import('@/lib/prisma')

  try {
    const inventoryData = payload

    // Find item
    const item = await prisma.item.findFirst({
      where: {
        sku: inventoryData.item_code
      }
    })

    if (!item) {
      throw new Error(`Item ${inventoryData.item_code} not found`)
    }

    // Find warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        warehouseCode: inventoryData.warehouse
      }
    })

    if (!warehouse) {
      throw new Error(`Warehouse ${inventoryData.warehouse} not found`)
    }

    // Find or create inventory item
    let inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        itemId: item.id,
        warehouseCode: warehouse.warehouseCode
      }
    })

    const qtyOnHand = parseFloat(inventoryData.actual_qty || 0)
    const qtyReserved = parseFloat(inventoryData.reserved_qty || 0)
    const qtyAvailable = qtyOnHand - qtyReserved

    if (!inventoryItem) {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'default-org',
          warehouseCode: warehouse.warehouseCode,
          itemId: item.id,
          sku: item.sku,
          quantityOnHand: qtyOnHand,
          quantityReserved: qtyReserved,
          quantityAvailable: qtyAvailable
        }
      })
    } else {
      await prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantityOnHand: qtyOnHand,
          quantityReserved: qtyReserved,
          quantityAvailable: qtyAvailable
        }
      })
    }
  } catch (error) {
    console.error('Error processing inventory webhook:', error)
    throw error
  }
}

function mapERPNextStatusToBlueShip(erpnextStatus: string): string {
  const statusMap: Record<string, string> = {
    'Draft': 'PENDING',
    'To Deliver': 'CONFIRMED',
    'To Bill': 'CONFIRMED',
    'Completed': 'SHIPPED',
    'Cancelled': 'CANCELLED'
  }
  return statusMap[erpnextStatus] || 'PENDING'
}

