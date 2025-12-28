import { z } from 'zod'

export const inventoryFilterSchema = z.object({
  sku: z.string().optional(),
  locationCode: z.string().optional(),
  status: z.string().optional(),
  warehouseId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
})

export const inventoryCreateSchema = z.object({
  itemId: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.number().int().nonnegative(),
  quantityReserved: z.number().int().nonnegative().optional().default(0),
  quantityAllocated: z.number().int().nonnegative().optional().default(0),
  status: z.enum(['AVAILABLE', 'ALLOCATED', 'RESERVED', 'DAMAGED', 'HOLD', 'IN_TRANSIT']).optional().default('AVAILABLE'),
})

export const inventoryUpdateSchema = inventoryCreateSchema.partial()
  .extend({ id: z.string() })

export type InventoryFilter = z.infer<typeof inventoryFilterSchema>
export type InventoryCreate = z.infer<typeof inventoryCreateSchema>
export type InventoryUpdate = z.infer<typeof inventoryUpdateSchema>




