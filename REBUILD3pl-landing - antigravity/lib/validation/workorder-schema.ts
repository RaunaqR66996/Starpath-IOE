import { z } from 'zod'

export const workOrderCreateSchema = z.object({
  organizationId: z.string().min(1),
  bomId: z.string().optional(),
  quantity: z.number().int().positive(),
  priority: z.enum(['low', 'medium', 'high', 'rush']).optional().default('medium'),
  plannedStart: z.string().datetime().optional(),
  plannedEnd: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const workOrderUpdateSchema = z.object({
  status: z.enum(['planned', 'released', 'in-progress', 'completed', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'rush']).optional(),
  completedQty: z.number().int().nonnegative().optional(),
  scrapQty: z.number().int().nonnegative().optional(),
  actualStart: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const workOrderFilterSchema = z.object({
  organizationId: z.string().optional(),
  status: z.string().optional(),
  bomId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
})

export type WorkOrderCreate = z.infer<typeof workOrderCreateSchema>
export type WorkOrderUpdate = z.infer<typeof workOrderUpdateSchema>
export type WorkOrderFilter = z.infer<typeof workOrderFilterSchema>




