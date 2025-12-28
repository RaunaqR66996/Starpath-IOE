'use server'

import { prisma } from '@/lib/prisma'
import { Shipment, ShipmentStatus, ShipmentLine } from '@/types/shipment'

export async function getShipments(): Promise<Shipment[]> {
    try {
        const dbShipments = await prisma.shipment.findMany({
            include: {
                pieces: {
                    include: {
                        orderItem: {
                            include: {
                                order: {
                                    include: {
                                        customer: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return dbShipments.map(s => {
            // Map Prisma Shipment to Frontend Shipment Interface
            const lines: ShipmentLine[] = s.pieces.map(p => ({
                id: p.id,
                orderId: p.orderId || '',
                orderLineId: p.orderItemId || '',
                sku: p.sku,
                description: p.description || '',
                quantity: p.quantity,
                uom: 'EA' // Default
            }))

            // Get order details from first piece if available
            const firstOrder = s.pieces[0]?.orderItem?.order

            // Parse metadata safely
            const metadata = typeof s.metadata === 'object' ? s.metadata : {}

            return {
                id: s.id,
                orderId: firstOrder?.id || '',
                status: (s.status.toLowerCase() as ShipmentStatus) || 'planned',
                carrier: s.carrierId || undefined,
                reference: s.shipmentNumber,
                plannedPickup: s.pickupDate || undefined,
                plannedDelivery: s.estimatedDelivery || undefined,
                actualDelivery: s.actualDelivery || undefined,
                origin: {
                    city: 'Origin City', // Placeholder
                    state: 'ST'
                },
                destination: {
                    city: firstOrder?.customer?.city || '',
                    state: firstOrder?.customer?.state || ''
                },
                lines: lines,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                milestones: [] // Populate if we have a milestones table
            }
        })
    } catch (error) {
        console.error('Failed to fetch shipments:', error)
        return []
    }
}

export async function getShipmentDetails(shipmentId: string) {
    try {
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                pieces: {
                    include: {
                        orderItem: {
                            include: {
                                order: {
                                    include: {
                                        customer: true
                                    }
                                }
                            }
                        }
                    }
                },
                carrier: true,
                organization: true
            }
        })

        if (!shipment) return null

        // Assume first piece's order customer is the consignee for now
        const firstOrder = shipment.pieces[0]?.orderItem?.order
        const customer = firstOrder?.customer

        return {
            bolNumber: shipment.shipmentNumber,
            date: shipment.createdAt.toLocaleDateString(),
            carrier: shipment.carrier?.carrierName || 'TBD',
            shipper: {
                name: 'BlueShip Logistics', // Default shipper
                address: '123 Logistics Way',
                city: 'New York',
                state: 'NY',
                zip: '10001'
            },
            consignee: {
                name: customer?.customerName || 'Unknown',
                address: customer?.addressLine1 || '',
                city: customer?.city || '',
                state: customer?.state || '',
                zip: customer?.zipCode || ''
            },
            commodities: shipment.pieces.map(p => ({
                pieces: p.quantity,
                type: 'Pallet', // Default
                weight: Number(p.weight || 0),
                description: p.description || 'General Freight',
                class: '50'
            })),
            totalWeight: Number(shipment.totalWeight || 0),
            totalPieces: shipment.pieces.reduce((sum, p) => sum + p.quantity, 0)
        }
    } catch (error) {
        console.error('Failed to fetch shipment details:', error)
        return null
    }
}

export async function getPackingSlipDetails(shipmentId: string) {
    try {
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                pieces: {
                    include: {
                        orderItem: {
                            include: {
                                item: true,
                                order: {
                                    include: {
                                        customer: true
                                    }
                                }
                            }
                        }
                    }
                },
                organization: true
            }
        })

        if (!shipment) return null

        const firstOrder = shipment.pieces[0]?.orderItem?.order
        const customer = firstOrder?.customer

        // Group pieces by SKU for packing slip
        const itemsMap = new Map<string, { description: string, quantity: number, type: string }>()

        shipment.pieces.forEach(p => {
            const sku = p.sku
            const current = itemsMap.get(sku) || { description: p.description || '', quantity: 0, type: p.orderItem?.item?.productName || 'Item' }
            current.quantity += p.quantity
            itemsMap.set(sku, current)
        })

        return {
            bolNumber: shipment.shipmentNumber, // Using shipment number as reference
            date: shipment.createdAt.toLocaleDateString(),
            carrier: shipment.carrierName || 'TBD',
            shipper: {
                name: 'BlueShip Logistics',
                address: '123 Logistics Way',
                city: 'New York',
                state: 'NY',
                zip: '10001'
            },
            consignee: {
                name: customer?.customerName || 'Unknown',
                address: customer?.addressLine1 || '',
                city: customer?.city || '',
                state: customer?.state || '',
                zip: customer?.zipCode || ''
            },
            commodities: Array.from(itemsMap.entries()).map(([sku, data]) => ({
                pieces: data.quantity,
                type: sku,
                weight: 0, // Not critical for packing slip
                description: data.description || data.type,
                class: ''
            })),
            totalWeight: Number(shipment.totalWeight || 0),
            totalPieces: shipment.pieces.reduce((sum, p) => sum + p.quantity, 0)
        }
    } catch (error) {
        console.error('Failed to fetch packing slip details:', error)
        return null
    }
}

export async function getPickTicketDetails(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        item: true,
                        allocations: {
                            include: {
                                inventoryItem: {
                                    include: {
                                        location: true,
                                        warehouse: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!order) return null

        const items = order.orderItems.map(item => {
            // Try to find location from allocations
            const allocation = item.allocations[0]
            const locationName = allocation?.inventoryItem?.location?.locationType
                ? `${allocation.inventoryItem.warehouseCode}-${allocation.inventoryItem.location?.locationType}`
                : (allocation?.inventoryItem?.warehouseCode || 'Unassigned')

            return {
                sku: item.item.sku,
                description: item.item.productName,
                quantity: item.quantity,
                location: locationName
            }
        })

        return {
            orderNumber: order.orderNumber,
            date: order.createdAt.toLocaleDateString(),
            items: items
        }
    } catch (error) {
        console.error('Failed to fetch pick ticket details:', error)
        return null
    }
}
