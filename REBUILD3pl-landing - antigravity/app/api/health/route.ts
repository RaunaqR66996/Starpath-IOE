import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()

  const health: {
    status: string
    timestamp: string
    uptime: number
    environment: string
    checks: {
      database: string
      api: string
      error?: string
    }
    responseTime: number
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'unknown',
      api: 'ok'
    },
    responseTime: 0
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = 'ok'
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database = 'error'
    health.checks.error = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(health, { status: 503 })
  }

  health.responseTime = Date.now() - startTime

  return NextResponse.json(health)
}




