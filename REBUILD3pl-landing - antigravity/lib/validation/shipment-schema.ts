import { z } from 'zod'

export const shipmentCreateSchema = z.object({
  carrier: z.string().optional(),
  carrierId: z.string().optional(),
  trackingNumber: z.string().optional(),
  weight: z.number().nonnegative().optional().default(0),
  value: z.number().nonnegative().optional().default(0),
  shippingCost: z.number().nonnegative().optional(),
  serviceLevel: z.string().optional(),
  status: z.string().optional(),
  mode: z.string().optional(),
  pickupDate: z.string().datetime().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const shipmentUpdateSchema = shipmentCreateSchema.partial()
  .extend({ id: z.string() })

export const shipmentFilterSchema = z.object({
  status: z.string().optional(),
  carrierId: z.string().optional(),
  carrierName: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
})

export type ShipmentCreate = z.infer<typeof shipmentCreateSchema>
export type ShipmentUpdate = z.infer<typeof shipmentUpdateSchema>
export type ShipmentFilter = z.infer<typeof shipmentFilterSchema>




