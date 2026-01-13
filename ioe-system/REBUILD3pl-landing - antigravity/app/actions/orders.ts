'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createOrder(data: {
    orderNumber: string
    customerName: string
    customerEmail: string
    shippingAddress: string
    shippingCity: string
    shippingState: string
    shippingZip: string
    priority: string
    expectedDelivery?: string
}) {
    try {
        // For MVP, we'll use the first organization we find, or create one
        let organization = await prisma.organization.findFirst()
        if (!organization) {
            organization = await prisma.organization.create({
                data: {
                    name: 'Demo Organization',
                    slug: 'demo-org',
                }
            })
        }

        // Find or create customer
        let customer = await prisma.customer.findFirst({
            where: {
                organizationId: organization.id,
                customerName: data.customerName
            }
        })

        if (!customer) {
            // Generate a unique customerId
            const customerId = `CUST-${data.customerName.toUpperCase().substring(0, 10).replace(/\s/g, '')}-${Date.now().toString().slice(-4)}`

            customer = await prisma.customer.create({
                data: {
                    organizationId: organization.id,
                    customerId: customerId,
                    customerName: data.customerName,
                    customerType: 'STANDARD',
                    addressLine1: data.shippingAddress,
                    city: data.shippingCity,
                    state: data.shippingState,
                    zipCode: data.shippingZip,
                    country: 'USA',
                    contactEmail: data.customerEmail,
                    paymentTerms: 'NET30'
                }
            })
        }

        const order = await prisma.order.create({
            data: {
                organizationId: organization.id,
                customerId: customer.id,
                orderNumber: data.orderNumber,
                priority: data.priority.toUpperCase(),
                status: 'CREATED',
                requiredDeliveryDate: data.expectedDelivery ? new Date(data.expectedDelivery) : null,
                totalAmount: 0, // Default for MVP
            }
        })

        try {
            revalidatePath('/tms3/orders')
        } catch (e) {
            // Ignore revalidatePath error in scripts
        }
        return { success: true, order }
    } catch (error) {
        console.error('Failed to create order:', error)
        return { success: false, error: 'Failed to create order' }
    }
}

export async function getOrders() {
    try {
        const orders = await prisma.order.findMany({
            include: {
                customer: true,
                orderItems: {
                    include: {
                        item: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Map Prisma result to Order interface
        return orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            status: order.status as any,
            priority: order.priority.toLowerCase() as any,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            expectedDelivery: order.requiredDeliveryDate || undefined,

            // Map to complex nested structures expected by frontend
            customerDetails: {
                customer: {
                    id: order.customer.id,
                    name: order.customer.customerName,
                    email: order.customer.contactEmail || '',
                    phone: order.customer.contactPhone || '',
                    shippingAddress: {
                        street: order.customer.addressLine1,
                        city: order.customer.city,
                        state: order.customer.state,
                        zipCode: order.customer.zipCode,
                        country: order.customer.country
                    }
                },
                addresses: {
                    shipping: {
                        street: order.customer.addressLine1,
                        city: order.customer.city,
                        state: order.customer.state,
                        zipCode: order.customer.zipCode,
                        country: order.customer.country
                    }
                }
            },
            financials: {
                totalAmount: order.totalAmount
            },
            // Map items for Load Optimizer
            items: order.orderItems.map(oi => ({
                id: oi.item.id,
                sku: oi.item.sku,
                name: oi.item.productName,
                quantity: oi.quantity,
                // Convert inches to feet (DB stores inches, Optimizer needs feet)
                // Default to standard pallet (48x40x48 inches) if missing
                length: (Number(oi.item.length) || 48) / 12,
                width: (Number(oi.item.width) || 40) / 12,
                height: (Number(oi.item.height) || 48) / 12,
                weight: Number(oi.item.weight) || 2000,
                stackable: oi.item.stackable === 'YES'
            }))
        }))
    } catch (error) {
        console.error('Failed to fetch orders:', error)
        return []
    }
}
