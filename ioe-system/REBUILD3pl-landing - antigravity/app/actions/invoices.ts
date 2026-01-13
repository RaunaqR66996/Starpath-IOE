'use server'

import { prisma } from '@/lib/prisma'

export async function getInvoices() {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                customer: true,
                order: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return invoices.map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            customerName: invoice.customer.customerName,
            amount: Number(invoice.amount),
            status: invoice.status,
            dueDate: invoice.dueDate,
            createdAt: invoice.createdAt,
            orderNumber: invoice.order.orderNumber
        }))
    } catch (error) {
        console.error('Failed to fetch invoices:', error)
        return []
    }
}

export async function getInvoiceDetails(invoiceId: string) {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                order: {
                    include: {
                        orderItems: {
                            include: {
                                item: true
                            }
                        }
                    }
                }
            }
        })

        if (!invoice) return null

        return {
            invoiceNumber: invoice.invoiceNumber,
            date: invoice.createdAt.toLocaleDateString(),
            dueDate: invoice.dueDate.toLocaleDateString(),
            customer: {
                name: invoice.customer.customerName,
                address: invoice.customer.addressLine1,
                city: invoice.customer.city,
                state: invoice.customer.state,
                zip: invoice.customer.zipCode,
                country: invoice.customer.country
            },
            items: invoice.order.orderItems.map(item => ({
                description: item.item.productName,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice || 0),
                total: Number(item.totalPrice || 0)
            })),
            subtotal: Number(invoice.amount),
            tax: 0, // Placeholder
            total: Number(invoice.amount)
        }
    } catch (error) {
        console.error('Failed to fetch invoice details:', error)
        return null
    }
}
