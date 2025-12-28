import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/wms/stage - Move order to staging (WMS → TMS handoff)
export async function POST(request: NextRequest) {
    try {
        const { orderId, zoneCode } = await request.json()

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'orderId is required' },
                { status: 400 }
            )
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        })

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            )
        }

        // Find or create default warehouse
        let warehouse = await prisma.warehouse.findFirst()
        if (!warehouse) {
            warehouse = await prisma.warehouse.create({
                data: {
                    organizationId: order.organizationId,
                    warehouseCode: 'WH-DEFAULT',
                    warehouseName: 'Main Warehouse',
                    warehouseType: 'Distribution Center',
                    addressLine1: '123 Logistics Way',
                    city: 'Logistics City',
                    state: 'CA',
                    zipCode: '90210'
                }
            })
        }

        // Find or create staging zone
        const targetZoneCode = zoneCode || 'ZONE-A'
        let zone = await prisma.stagingZone.findUnique({
            where: { zoneCode: targetZoneCode }
        })

        if (!zone) {
            zone = await prisma.stagingZone.create({
                data: {
                    organizationId: order.organizationId,
                    warehouseCode: warehouse.warehouseCode,
                    zoneCode: targetZoneCode,
                    name: `Staging Zone ${targetZoneCode.split('-').pop()}`,
                    capacity: 50
                }
            })
        }

        // Create StagingItem
        const stagingItem = await prisma.stagingItem.create({
            data: {
                organizationId: order.organizationId,
                orderId: order.id,
                stagingZoneId: zone.id,
                status: 'STAGED',
                stagedAt: new Date()
            }
        })

        // Update order to STAGED workflow state
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'STAGED',
                workflowState: 'STAGED',
                updatedAt: new Date()
            },
            include: {
                customer: true
            }
        })

        // Update zone load
        await prisma.stagingZone.update({
            where: { id: zone.id },
            data: {
                currentLoad: { increment: 1 }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Order moved to staging',
            data: {
                order: updatedOrder,
                stagingItem,
                zone
            }
        })
    } catch (error) {
        console.error('WMS Stage API Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to move order to staging' },
            { status: 500 }
        )
    }
}

// GET /api/wms/stage - Get all staged orders
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
                        }
                    }
                },
                stagingZone: true
            },
            orderBy: {
                stagedAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: stagedItems.map(item => ({
                id: item.order.id,
                orderNumber: item.order.orderNumber,
                customer: item.order.customer?.customerName || 'Unknown',
                status: item.order.status,
                workflowState: item.order.workflowState,
                totalAmount: item.order.totalAmount,
                itemCount: item.order.orderItems?.length || 0,
                stagedAt: item.stagedAt,
                zone: item.stagingZone.zoneCode,
                isERPNextOrder: !!item.order.externalId,
                erpnextOrderNumber: item.order.externalId
            })),
            total: stagedItems.length
        })
    } catch (error) {
        console.error('WMS Stage GET Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch staged orders', data: [], total: 0 },
            { status: 500 }
        )
    }
}
