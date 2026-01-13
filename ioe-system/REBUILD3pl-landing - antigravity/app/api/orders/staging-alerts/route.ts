import { NextRequest, NextResponse } from 'next/server'
import { stagingMonitorService } from '@/lib/services/staging-monitor-service'

/**
 * GET /api/orders/staging-alerts
 * Retrieve all current staging alerts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeMetrics = searchParams.get('metrics') === 'true'

    // Get staging alerts
    const alerts = await stagingMonitorService.getStagingAlerts()

    // Optionally include metrics
    let metrics = null
    if (includeMetrics) {
      metrics = await stagingMonitorService.getStagingMetrics()
    }

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      warningCount: alerts.filter(a => a.alertLevel === 'warning').length,
      criticalCount: alerts.filter(a => a.alertLevel === 'critical').length,
      metrics: metrics || undefined
    })
  } catch (error) {
    console.error('Staging alerts error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders/staging-alerts
 * Process all staging alerts (auto-handoff stuck orders)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { alertId } = body

    // Process single alert or all alerts
    if (alertId) {
      // Process specific alert
      const result = await stagingMonitorService.processAlert(alertId)
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        shipmentId: result.shipmentId
      })
    } else {
      // Process all alerts
      const results = await stagingMonitorService.processAllAlerts()
      
      return NextResponse.json({
        success: true,
        message: 'Staging alerts processed',
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        results: results.results
      })
    }
  } catch (error) {
    console.error('Process staging alerts error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
