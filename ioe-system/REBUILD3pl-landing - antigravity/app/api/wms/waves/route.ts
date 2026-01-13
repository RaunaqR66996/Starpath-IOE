/**
 * WMS Waves API
 * Handles wave planning and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { PickingService } from '@/lib/services/wms/picking-service'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'
import { z } from 'zod'

// Validation schemas
const createWaveSchema = z.object({
  siteId: z.string(),
  orderIds: z.array(z.string()).min(1),
  carrierCode: z.string().optional(),
  zoneCode: z.string().optional(),
  maxItemsPerWave: z.number().int().positive().optional(),
})

// GET /api/wms/waves - List waves
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status')

    if (!siteId) {
      return NextResponse.json(
        { success: false, error: 'siteId is required' },
        { status: 400 }
      )
    }

    // Query orders grouped by wave status
    const where: any = {
      organizationId: siteId,
      status: status ? status.toUpperCase() : { in: ['CONFIRMED', 'PICKING', 'PICKED'] },
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    })

    // Group orders into waves (simplified - by carrier or date)
    const waves = orders.reduce((acc: any[], order) => {
      const waveKey = `WAVE-${order.createdAt.toISOString().split('T')[0]}`
      
      let wave = acc.find((w) => w.waveId === waveKey)
      
      if (!wave) {
        wave = {
          waveId: waveKey,
          status: order.status === 'PICKED' ? 'COMPLETED' : order.status === 'PICKING' ? 'IN_PROGRESS' : 'PENDING',
          orderCount: 0,
          itemCount: 0,
          orders: [],
          createdAt: order.createdAt,
        }
        acc.push(wave)
      }

      wave.orderCount++
      wave.itemCount += order.orderItems.length
      wave.orders.push(order.orderNumber)

      return acc
    }, [])

    logger.info('Fetched waves', {
      siteId,
      count: waves.length,
    })

    return NextResponse.json({
      success: true,
      data: waves,
      total: waves.length,
    })

  } catch (error) {
    logger.error('Error fetching waves', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch waves',
      },
      { status: 500 }
    )
  }
}

// POST /api/wms/waves - Create pick wave
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createWaveSchema.parse(body)

    // Plan wave using service
    const wavePlan = await PickingService.planWave(
      validatedData.siteId,
      validatedData.orderIds,
      {
        carrierCode: validatedData.carrierCode,
        zoneCode: validatedData.zoneCode,
        maxItemsPerWave: validatedData.maxItemsPerWave,
      }
    )

    logger.info('Wave created', {
      siteId: validatedData.siteId,
      waveId: wavePlan.waveId,
      orderCount: wavePlan.orders.length,
      pickStops: wavePlan.pickPath.length,
    })

    return NextResponse.json({
      success: true,
      data: wavePlan,
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

    logger.error('Error creating wave', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create wave',
      },
      { status: 500 }
    )
  }
}


