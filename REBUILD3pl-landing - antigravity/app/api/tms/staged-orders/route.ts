import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tms/staged-orders - Fetch orders ready for load planning
export async function GET(request: NextRequest) {
    try {
        const stagedItems = await prisma.stagingItem.findMany({
            where: {
                status: 'STAGED'
            },
            include: {
                order: {
                    include: {
                        customer: true,
                        orderItems: {
                            include: {
                                item: true
                            }
                        },
                        shipments: true
                    }
                },
                stagingZone: true
            },
            orderBy: {
                stagedAt: 'asc' // FIFO
            }
        })

        const formattedOrders = stagedItems.map(item => ({
            id: item.order.id,
            stagingId: item.id,
            orderNumber: item.order.orderNumber,
            customer: item.order.customer?.customerName || 'Unknown',
            destination: item.order.customer?.city + ', ' + item.order.customer?.state,
            zone: item.stagingZone.zoneCode,
            stagedAt: item.stagedAt,
            items: item.order.orderItems.length,
            weight: item.order.orderItems.reduce((sum, oi) => sum + (Number(oi.item.unitWeightKG) * oi.quantity || 0), 0),
            volume: item.order.orderItems.reduce((sum, oi) => sum + (Number(oi.item.unitVolumeM3) * oi.quantity || 0), 0),
            erpnextOrderNumber: item.order.externalId
        }))

        return NextResponse.json({
            success: true,
            data: formattedOrders
        })
    } catch (error) {
        console.error('TMS Staged Orders API Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch staged orders' },
            { status: 500 }
        )
    }
}
