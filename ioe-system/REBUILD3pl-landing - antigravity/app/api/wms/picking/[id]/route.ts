import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/wms/picking/[id] - Fetch single pick list
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const id = params.id

        const pickList = await prisma.pickList.findUnique({
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
                },
                user: {
                    select: {
                        fullName: true
                    }
                }
            }
        })

        if (!pickList) {
            return NextResponse.json(
                { success: false, error: 'Pick list not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: pickList
        })
    } catch (error) {
        console.error('Fetch Pick List Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch pick list' },
            { status: 500 }
        )
    }
}

// PUT /api/wms/picking/[id] - Update pick list (e.g. complete item)
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const id = params.id
        const body = await request.json()
        const { action, itemId, quantity } = body

        if (action === 'PICK_ITEM') {
            // Update picked quantity for an item
            const item = await prisma.pickListItem.findFirst({
                where: {
                    pickListId: id,
                    itemId: itemId
                }
            })

            if (!item) {
                return NextResponse.json(
                    { success: false, error: 'Item not found in pick list' },
                    { status: 404 }
                )
            }

            await prisma.pickListItem.update({
                where: { id: item.id },
                data: {
                    pickedQuantity: quantity,
                    picked: quantity >= item.quantity
                }
            })

            // Check if all items are picked
            const updatedPickList = await prisma.pickList.findUnique({
                where: { id },
                include: { items: true }
            })

            const allPicked = updatedPickList?.items.every(i => i.picked)

            if (allPicked) {
                await prisma.pickList.update({
                    where: { id },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date()
                    }
                })

                // Update order status
                await prisma.order.update({
                    where: { id: updatedPickList?.orderId },
                    data: { workflowState: 'PICKED' }
                })
            }

            return NextResponse.json({
                success: true,
                data: updatedPickList
            })
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        )

    } catch (error) {
        console.error('Update Pick List Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update pick list' },
            { status: 500 }
        )
    }
}
