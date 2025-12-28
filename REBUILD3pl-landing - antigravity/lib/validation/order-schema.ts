import { z } from 'zod'

export const orderLineSchema = z.object({
  sku: z.string().min(1),
  qty: z.number().int().positive(),
})

export const orderCreateSchema = z.object({
  customer_id: z.string().min(1),
  lines: z.array(orderLineSchema).min(1),
  external_id: z.string().optional(),
  required_ship_date: z.string().datetime().optional(),
  required_delivery_date: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const orderUpdateSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional(),
})

export const orderFilterSchema = z.object({
  customer_id: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
})

export type OrderLine = z.infer<typeof orderLineSchema>
export type OrderCreate = z.infer<typeof orderCreateSchema>
export type OrderUpdate = z.infer<typeof orderUpdateSchema>
export type OrderFilter = z.infer<typeof orderFilterSchema>




