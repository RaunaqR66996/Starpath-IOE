/**
 * WMS Inventory API
 * Handles inventory management, adjustments, and queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

// Validation schemas
const createInventorySchema = z.object({
  siteId: z.string(),
  itemSku: z.string(),
  locationCode: z.string(),
  quantity: z.number().int().nonnegative(),
  lotNumber: z.string().optional(),
  serialNumber: z.string().optional(),
})

const adjustInventorySchema = z.object({
  inventoryId: z.string(),
  quantityChange: z.number().int(),
  reason: z.string(),
})

// GET /api/wms/inventory - List inventory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const sku = searchParams.get('sku')
    const locationCode = searchParams.get('locationCode')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Find warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { code: siteId },
    })

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: `Warehouse ${siteId} not found` },
        { status: 404 }
      )
    }

    // Build where clause
    const where: any = {
      location: {
        warehouseId: warehouse.id,
      },
    }

    if (sku) {
      where.item = {
        sku: { contains: sku, mode: 'insensitive' },
      }
    }

    if (locationCode) {
      where.location = {
        ...where.location,
        code: locationCode,
      }
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    // Query inventory
    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          item: {
            select: {
              sku: true,
              name: true,
              description: true,
            },
          },
          location: {
            select: {
              code: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          item: {
            sku: 'asc',
          },
        },
        skip,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ])

    logger.info('Fetched inventory', {
      siteId,
      count: inventory.length,
    })

    return NextResponse.json({
      success: true,
      data: inventory.map(inv => ({
        ...inv,
        // Add ERPNext fields
        erpnextItemCode: inv.item?.externalId || null,
        erpnextWarehouseCode: inv.location?.warehouse?.externalId || null,
        isERPNextItem: !!inv.item?.externalId,
        isERPNextWarehouse: !!inv.location?.warehouse?.externalId
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    logger.error('Error fetching inventory', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inventory',
      },
      { status: 500 }
    )
  }
}

// POST /api/wms/inventory - Create inventory record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createInventorySchema.parse(body)

    // Find warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { code: validatedData.siteId },
    })

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: `Warehouse ${validatedData.siteId} not found` },
        { status: 404 }
      )
    }

    // Find item
    const item = await prisma.item.findUnique({
      where: { sku: validatedData.itemSku },
    })

    if (!item) {
      return NextResponse.json(
        { success: false, error: `Item ${validatedData.itemSku} not found` },
        { status: 404 }
      )
    }

    // Find location
    const location = await prisma.location.findFirst({
      where: {
        warehouseId: warehouse.id,
        code: validatedData.locationCode,
      },
    })

    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location ${validatedData.locationCode} not found` },
        { status: 404 }
      )
    }

    // Create inventory record
    const inventory = await prisma.inventory.create({
      data: {
        itemId: item.id,
        locationId: location.id,
        quantity: validatedData.quantity,
        quantityAvailable: validatedData.quantity,
        quantityReserved: 0,
        quantityAllocated: 0,
        status: 'AVAILABLE',
      },
      include: {
        item: true,
        location: true,
      },
    })

    logger.info('Inventory created', {
      siteId: validatedData.siteId,
      itemSku: validatedData.itemSku,
      locationCode: validatedData.locationCode,
      quantity: validatedData.quantity,
    })

    return NextResponse.json({
      success: true,
      data: inventory,
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

    logger.error('Error creating inventory', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create inventory',
      },
      { status: 500 }
    )
  }
}

// PUT /api/wms/inventory - Adjust inventory quantities
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = adjustInventorySchema.parse(body)

    // Find inventory
    const inventory = await prisma.inventory.findUnique({
      where: { id: validatedData.inventoryId },
      include: {
        item: true,
        location: true,
      },
    })

    if (!inventory) {
      return NextResponse.json(
        { success: false, error: `Inventory record ${validatedData.inventoryId} not found` },
        { status: 404 }
      )
    }

    // Calculate new quantities
    const newQuantity = inventory.quantity + validatedData.quantityChange
    const newAvailable = inventory.quantityAvailable + validatedData.quantityChange

    if (newQuantity < 0 || newAvailable < 0) {
      return NextResponse.json(
        { success: false, error: 'Adjustment would result in negative inventory' },
        { status: 400 }
      )
    }

    // Update inventory
    const updatedInventory = await prisma.inventory.update({
      where: { id: validatedData.inventoryId },
      data: {
        quantity: newQuantity,
        quantityAvailable: newAvailable,
      },
      include: {
        item: true,
        location: true,
      },
    })

    logger.info('Inventory adjusted', {
      inventoryId: validatedData.inventoryId,
      itemSku: inventory.item.sku,
      quantityChange: validatedData.quantityChange,
      reason: validatedData.reason,
    })

    return NextResponse.json({
      success: true,
      data: updatedInventory,
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

    logger.error('Error adjusting inventory', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to adjust inventory',
      },
      { status: 500 }
    )
  }
}


