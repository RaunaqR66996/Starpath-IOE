/**
 * WMS Task Assignment API
 * Assigns tasks to workers
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

const assignTaskSchema = z.object({
  assignee: z.string(),
  notes: z.string().optional(),
})

// POST /api/wms/tasks/[id]/assign - Assign task to worker
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()

    // Validate input
    const validatedData = assignTaskSchema.parse(body)

    // For MVP, return assigned task
    // In production, update Task model
    const task = {
      id: taskId,
      assignee: validatedData.assignee,
      status: 'ASSIGNED',
      notes: validatedData.notes,
      assignedAt: new Date(),
    }

    logger.info('Task assigned', {
      taskId,
      assignee: validatedData.assignee,
    })

    return NextResponse.json({
      success: true,
      data: task,
    })

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

    logger.error('Error assigning task', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign task',
      },
      { status: 500 }
    )
  }
}


