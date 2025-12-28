import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wms/packing/[id] - Fetch single packing slip
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const id = params.id

        const packingSlip = await prisma.packingSlip.findUnique({
            where: { id },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        customer: {
                            select: {
                                customerName: true
                            }
                        }
                    }
                },
                items: {
                    include: {
                        item: true
                    }
                }
            }
        })

        if (!packingSlip) {
            return NextResponse.json(
                { success: false, error: 'Packing slip not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: packingSlip
        })
    } catch (error) {
        console.error('Fetch Packing Slip Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch packing slip' },
            { status: 500 }
        )
    }
}

// PUT /api/wms/packing/[id] - Update packing slip (scan item, complete)
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const id = params.id
        const body = await request.json()
        const { action, itemId } = body

        if (action === 'SCAN_ITEM') {
            // Mark item as scanned
            const item = await prisma.packingSlipItem.findFirst({
                where: {
                    packingSlipId: id,
                    itemId: itemId
                }
            })

            if (!item) {
                return NextResponse.json(
                    { success: false, error: 'Item not found in packing slip' },
                    { status: 404 }
                )
            }

            await prisma.packingSlipItem.update({
                where: { id: item.id },
                data: { scanned: true }
            })

            // Check if all items are scanned
            const updatedSlip = await prisma.packingSlip.findUnique({
                where: { id },
                include: { items: true }
            })

            const allScanned = updatedSlip?.items.every(i => i.scanned)

            if (allScanned) {
                // Auto-complete or wait for explicit complete?
                // Let's wait for explicit complete, but we could update status to 'READY_TO_SHIP'
            }

            return NextResponse.json({
                success: true,
                data: updatedSlip
            })
        }

        if (action === 'COMPLETE_PACKING') {
            const { totalPackages, totalWeight } = body

            await prisma.packingSlip.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    totalPackages: totalPackages || 1,
                    totalWeight: totalWeight || 0
                }
            })

            // Update order status
            const slip = await prisma.packingSlip.findUnique({ where: { id } })
            await prisma.order.update({
                where: { id: slip?.orderId },
                data: { workflowState: 'PACKED' }
            })

            return NextResponse.json({
                success: true,
                message: 'Packing completed'
            })
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        )

    } catch (error) {
        console.error('Update Packing Slip Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update packing slip' },
            { status: 500 }
        )
    }
}
