/**
 * WMS Tasks API
 * Handles task management across all WMS operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

// Validation schemas
const createTaskSchema = z.object({
  siteId: z.string(),
  type: z.enum(['RECEIVE', 'PUTAWAY', 'PICK', 'PACK', 'SHIP', 'CYCLE_COUNT', 'REPLENISH']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  assignee: z.string().optional(),
  orderId: z.string().optional(),
  itemSku: z.string().optional(),
  locationCode: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional(),
})

const updateTaskSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  assignee: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/wms/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const assignee = searchParams.get('assignee')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'siteId is required' },
        { status: 400 }
      )
    }

    // For MVP, we'll query orders and transform them to tasks
    // In production, you'd have a dedicated Task model
    const where: any = {
      organizationId: siteId,
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            customerName: true,
          },
        },
        orderItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const total = await prisma.order.count({ where })

    // Transform orders to tasks
    const tasks = orders.flatMap((order) => {
      const taskType = order.status === 'CREATED' ? 'RECEIVE' :
                      order.status === 'CONFIRMED' ? 'PICK' :
                      order.status === 'PICKING' ? 'PICK' :
                      order.status === 'PICKED' ? 'PACK' :
                      order.status === 'PACKED' ? 'SHIP' : 'RECEIVE'

      return {
        id: `task-${order.id}`,
        taskNumber: `TASK-${order.orderNumber}`,
        type: taskType,
        status: order.status === 'CREATED' ? 'PENDING' :
                order.status === 'PICKING' ? 'IN_PROGRESS' : 'ASSIGNED',
        priority: order.priority || 'NORMAL',
        orderNumber: order.orderNumber,
        orderId: order.id,
        customer: order.customer?.customerName,
        itemCount: order.orderItems.length,
        createdAt: order.createdAt,
        assignee: null,
      }
    })

    logger.info('Fetched tasks', {
      siteId,
      count: tasks.length,
    })

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    logger.error('Error fetching tasks', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
      },
      { status: 500 }
    )
  }
}

// POST /api/wms/tasks - Create task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createTaskSchema.parse(body)

    // For MVP, create a simple task record
    // In production, use a dedicated Task model
    const task = {
      id: `task-${Date.now()}`,
      taskNumber: `TASK-${Date.now()}`,
      type: validatedData.type,
      status: validatedData.assignee ? 'ASSIGNED' : 'PENDING',
      priority: validatedData.priority,
      siteId: validatedData.siteId,
      assignee: validatedData.assignee,
      orderId: validatedData.orderId,
      itemSku: validatedData.itemSku,
      locationCode: validatedData.locationCode,
      quantity: validatedData.quantity,
      metadata: validatedData.metadata,
      createdAt: new Date(),
    }

    logger.info('Task created', {
      taskId: task.id,
      type: task.type,
      siteId: validatedData.siteId,
    })

    return NextResponse.json({
      success: true,
      data: task,
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

    logger.error('Error creating task', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/wms/tasks - Update task status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, ...updates } = body

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'taskId is required' },
        { status: 400 }
      )
    }

    // Validate updates
    const validatedUpdates = updateTaskSchema.parse(updates)

    // For MVP, return updated task
    // In production, update Task model
    const task = {
      id: taskId,
      ...validatedUpdates,
      updatedAt: new Date(),
    }

    logger.info('Task updated', {
      taskId,
      updates: validatedUpdates,
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

    logger.error('Error updating task', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task',
      },
      { status: 500 }
    )
  }
}


