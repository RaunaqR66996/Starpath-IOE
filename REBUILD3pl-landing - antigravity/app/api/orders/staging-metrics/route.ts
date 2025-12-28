import { NextRequest, NextResponse } from 'next/server'
import { stagingMonitorService } from '@/lib/services/staging-monitor-service'

/**
 * GET /api/orders/staging-metrics
 * Get staging zone metrics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const metrics = await stagingMonitorService.getStagingMetrics()

    return NextResponse.json({
      success: true,
      metrics
    })
  } catch (error) {
    console.error('Staging metrics error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}



