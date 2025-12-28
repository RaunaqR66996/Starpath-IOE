import { NextResponse } from 'next/server'
import { metrics } from '@/lib/monitoring/metrics'
import { logger } from '@/lib/monitoring/logger'

export async function GET() {
  try {
    const metricsData = metrics.export()
    return new NextResponse(metricsData, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    logger.error('metrics_collection_failed', error as Error)
    return NextResponse.json({ success: false, error: 'Failed to collect metrics' }, { status: 500 })
  }
}
