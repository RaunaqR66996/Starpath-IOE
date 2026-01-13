import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tms/load-plans - Fetch active load plans
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const where: any = {}
        if (status) {
            where.status = status.toUpperCase()
        }

        const loadPlans = await prisma.loadPlan.findMany({
            where,
            include: {
                orders: {
                    select: {
                        orderNumber: true,
                        customer: {
                            select: { customerName: true }
                        },
                        totalAmount: true
                    }
                },
                carrier: {
                    select: { carrierName: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: loadPlans
        })
    } catch (error) {
        console.error('TMS Load Plans API Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch load plans' },
            { status: 500 }
        )
    }
}

// POST /api/tms/load-plans - Create load plan
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderIds, equipmentType, carrierId } = body

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No orders selected' },
                { status: 400 }
            )
        }

        // Fetch first order to get organizationId
        const firstOrder = await prisma.order.findUnique({
            where: { id: orderIds[0] }
        })

        if (!firstOrder) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            )
        }

        // Generate plan number
        const planNumber = `LP-${Date.now()}`

        // Create Load Plan
        const loadPlan = await prisma.loadPlan.create({
            data: {
                organizationId: firstOrder.organizationId,
                planNumber,
                status: 'DRAFT',
                equipmentType: equipmentType || '53FT_TRAILER',
                carrierId: carrierId || null,
                orders: {
                    connect: orderIds.map(id => ({ id }))
                }
            },
            include: {
                orders: true
            }
        })

        // Update orders workflow state and StagingItems
        await prisma.$transaction(async (tx) => {
            // Update orders
            await tx.order.updateMany({
                where: { id: { in: orderIds } },
                data: { workflowState: 'LOAD_PLANNED' }
            })

            // Update staging items
            await tx.stagingItem.updateMany({
                where: { orderId: { in: orderIds } },
                data: {
                    status: 'RELEASED_TO_TMS',
                    releasedAt: new Date()
                }
            })
        })

        return NextResponse.json({
            success: true,
            data: loadPlan
        }, { status: 201 })

    } catch (error) {
        console.error('Create Load Plan Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create load plan' },
            { status: 500 }
        )
    }
}
