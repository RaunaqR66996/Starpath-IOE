import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/tms/analytics - Get analytics data with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')

    const where: any = {}

    if (eventType) where.eventType = eventType
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (userId) where.userId = userId

    if (startDate || endDate) {
      where.eventTimestamp = {}
      if (startDate) where.eventTimestamp.gte = new Date(startDate)
      if (endDate) where.eventTimestamp.lte = new Date(endDate)
    }

    // TODO: Restore analyticsEvent model in Prisma schema
    const events: any[] = []
    // const events = await prisma.analyticsEvent.findMany({
    //   where,
    //   orderBy: { eventTimestamp: 'desc' },
    //   take: 1000 // Limit to prevent large responses
    // })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching analytics events:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics events' }, { status: 500 })
  }
}

// POST /api/tms/analytics - Create new analytics event
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = ['eventType', 'entityType', 'entityId', 'eventData']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // TODO: Restore analyticsEvent model in Prisma schema
    const event: any = { id: 'temp-id', ...data }
    // const event = await prisma.analyticsEvent.create({
    //   data: {
    //     organizationId: data.organizationId || 'default-org', // In real app, get from auth
    //     eventType: data.eventType,
    //     entityType: data.entityType,
    //     entityId: data.entityId,
    //     eventData: data.eventData,
    //     metrics: data.metrics || {},
    //     userId: data.userId,
    //     sessionId: data.sessionId,
    //     ipAddress: data.ipAddress,
    //     userAgent: data.userAgent,
    //     eventTimestamp: data.eventTimestamp ? new Date(data.eventTimestamp) : new Date()
    //   }
    // })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating analytics event:', error)
    return NextResponse.json({ error: 'Failed to create analytics event' }, { status: 500 })
  }
}






