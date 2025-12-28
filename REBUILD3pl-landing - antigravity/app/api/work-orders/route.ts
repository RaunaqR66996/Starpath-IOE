import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/monitoring/logger'
import { workOrderCreateSchema, workOrderFilterSchema } from '@/lib/validation/workorder-schema'

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const rawFilters = {
      status: searchParams.get('status'),
      bomId: searchParams.get('bomId'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    }
    
    // Validate and parse filters
    const filters = workOrderFilterSchema.parse(rawFilters)
    const { page = 1, limit = 100, status, bomId } = filters
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (bomId) where.bomId = bomId
    // Note: organizationId should be extracted from user context
    // For MVP, we'll filter by organization later
    
    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          bom: {
            include: {
              product: true
            }
          },
          items: {
            include: {
              item: true
            }
          },
          organization: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.workOrder.count({ where })
    ])
    
    logger.info('Fetched work orders', { count: workOrders.length, status })
    
    return NextResponse.json({
      data: workOrders,
      total,
      page,
      limit
    })
    
  } catch (error) {
    logger.error('Error fetching work orders', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validate input
    const validatedData = workOrderCreateSchema.parse(body)
    
    // Generate work order number
    const woCount = await prisma.workOrder.count()
    const woNumber = `WO-${new Date().getFullYear()}-${String(woCount + 1).padStart(6, '0')}`
    
    // If BOM ID is provided, explode it to get required items
    let workOrderItems: any[] = []
    if (validatedData.bomId) {
      const bom = await prisma.bOM.findUnique({
        where: { id: validatedData.bomId },
        include: {
          components: {
            include: {
              item: true
            }
          },
          product: true
        }
      })
      
      if (!bom) {
        return NextResponse.json(
          { error: 'BOM not found' },
          { status: 404 }
        )
      }
      
      // Create input items from BOM components
      workOrderItems = bom.components.map((comp: any) => ({
        itemId: comp.itemId,
        sku: comp.item.sku,
        description: comp.item.name || comp.item.sku,
        quantity: comp.quantity * validatedData.quantity,
        consumedQty: 0,
        producedQty: 0,
        type: 'input'
      }))
      
      // Create output item (the product)
      workOrderItems.push({
        itemId: bom.productId,
        sku: bom.product.sku,
        description: bom.product.name || bom.product.sku,
        quantity: validatedData.quantity,
        consumedQty: 0,
        producedQty: 0,
        type: 'output'
      })
    }
    
    // Create work order with items
    const newWorkOrder = await prisma.workOrder.create({
      data: {
        organizationId: validatedData.organizationId,
        woNumber,
        bomId: validatedData.bomId,
        quantity: validatedData.quantity,
        priority: validatedData.priority,
        plannedStart: validatedData.plannedStart ? new Date(validatedData.plannedStart) : null,
        plannedEnd: validatedData.plannedEnd ? new Date(validatedData.plannedEnd) : null,
        notes: validatedData.notes,
        status: 'planned',
        items: {
          create: workOrderItems
        }
      },
      include: {
        bom: {
          include: {
            product: true,
            components: {
              include: {
                item: true
              }
            }
          }
        },
        items: {
          include: {
            item: true
          }
        },
        organization: true
      }
    })
    
    logger.info('Created work order', { woNumber, bomId: validatedData.bomId })
    
    return NextResponse.json(newWorkOrder, { status: 201 })
    
  } catch (error) {
    logger.error('Error creating work order', error as Error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    )
  }
}




