import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/monitoring/logger'

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
    const sku = searchParams.get('sku')
    const locationCode = searchParams.get('loc')
    const status = searchParams.get('status')
    const warehouseId = searchParams.get('warehouseId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    // Cache disabled for now

    const where: any = {}

    if (sku) {
      where.item = { sku: { contains: sku, mode: 'insensitive' } }
    }

    if (locationCode) {
      where.location = { code: { contains: locationCode, mode: 'insensitive' } }
    }

    if (status) {
      where.status = status
    }

    if (warehouseId) {
      where.location = {
        ...where.location,
        warehouseId
      }
    }

    // Query real inventory from database
    let inventory: any[] = []
    let total = 0

    try {
      // Build Prisma query
      const inventoryQuery = {
        where: {
          ...(sku && {
            item: {
              sku: { contains: sku, mode: 'insensitive' as const }
            }
          }),
          ...(locationCode && {
            location: {
              locationId: { contains: locationCode, mode: 'insensitive' as const }
            }
          }),
          ...(status && { status }),
          ...(warehouseId && {
            warehouse: {
              id: warehouseId
            }
          })
        },
        include: {
          item: true,
          location: {
            include: {
              warehouse: true
            }
          },
          warehouse: true
        },
        skip,
        take: limit
      }

      // Query real inventory from database
      // @ts-ignore - Prisma client generation might be pending
      inventory = await prisma.inventoryItem.findMany(inventoryQuery)

      // Get total count
      // @ts-ignore
      total = await prisma.inventoryItem.count({
        where: inventoryQuery.where
      })

      // Transform to match expected format
      inventory = inventory.map((inv: any) => ({
        id: inv.id,
        item: {
          id: inv.item?.id || inv.itemId,
          sku: inv.item?.sku || 'UNKNOWN',
          name: inv.item?.productName || inv.item?.name || 'Unknown Item'
        },
        location: {
          id: inv.location?.id || inv.locationId,
          code: inv.location?.locationId || 'UNKNOWN',
          warehouse: {
            id: inv.warehouse?.id || inv.location?.warehouse?.id || 'unknown',
            name: inv.warehouse?.warehouseName || inv.location?.warehouse?.warehouseName || 'Unknown Warehouse'
          }
        },
        quantityAvailable: inv.quantityAvailable || 0,
        quantityReserved: inv.quantityReserved || 0,
        quantityAllocated: 0 // Not directly in schema, assuming 0 or derived
      }))
    } catch (dbError) {
      console.error('Database query error:', dbError)
      // Return empty result instead of error for graceful degradation
      inventory = []
      total = 0
    }

    const result = {
      inventory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Get inventory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




















































