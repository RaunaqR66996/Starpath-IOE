import { z } from 'zod'

export const bomComponentSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().positive(),
  waste: z.number().nonnegative().optional().default(0),
  position: z.number().int().optional(),
})

export const bomCreateSchema = z.object({
  organizationId: z.string().min(1),
  productId: z.string().min(1),
  version: z.string().optional().default('1.0'),
  description: z.string().optional(),
  components: z.array(bomComponentSchema).min(1),
})

export const bomUpdateSchema = z.object({
  version: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  components: z.array(bomComponentSchema).optional(),
})

export const bomFilterSchema = z.object({
  organizationId: z.string().optional(),
  productId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
})

export type BOMComponent = z.infer<typeof bomComponentSchema>
export type BOMCreate = z.infer<typeof bomCreateSchema>
export type BOMUpdate = z.infer<typeof bomUpdateSchema>
export type BOMFilter = z.infer<typeof bomFilterSchema>




