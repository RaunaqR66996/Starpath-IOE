import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

export class ERPSyncService {
  /**
   * Syncs an order from ERPNext to Prisma
   */
  static async syncOrderFromERP(erpOrder: any, organizationId: string = 'default-org') {
    try {
      logger.info('Syncing order from ERPNext', { orderNumber: erpOrder.name })

      // 1. Sync Customer
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { customerId: erpOrder.customer },
            { customerName: erpOrder.customer_name }
          ]
        }
      })

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            organizationId,
            customerId: erpOrder.customer,
            customerName: erpOrder.customer_name,
            customerType: 'Wholesale', // Default
            paymentTerms: 'NET30', // Default
            contactEmail: erpOrder.contact_email || null,
            contactPhone: erpOrder.contact_mobile || null,
            addressLine1: erpOrder.shipping_address || 'TBD', // Simplified
            city: 'TBD',
            state: 'TBD',
            zipCode: '00000',
            country: 'USA'
          }
        })
      }

      // 2. Sync Items
      for (const item of erpOrder.items) {
        let dbItem = await prisma.item.findUnique({
          where: {
            organizationId_sku: {
              organizationId,
              sku: item.item_code
            }
          }
        })

        if (!dbItem) {
          dbItem = await prisma.item.create({
            data: {
              organizationId,
              sku: item.item_code,
              productName: item.item_name,
              primaryUOM: item.uom || 'EA',
              unitPrice: item.rate,
              activeStatus: 'Active'
            }
          })
        }
      }

      // 3. Create/Update Order
      const orderData = {
        organizationId,
        customerId: customer.id,
        orderNumber: erpOrder.name, // Use ERP order number as internal number for now, or use externalId
        externalId: erpOrder.name,
        status: 'CREATED',
        workflowState: 'RECEIVED',
        totalAmount: erpOrder.grand_total,
        currency: erpOrder.currency,
        orderDate: new Date(erpOrder.transaction_date),
        expectedDelivery: erpOrder.delivery_date ? new Date(erpOrder.delivery_date) : null,
        notes: erpOrder.remarks,
        erpnextDeliveryNote: null // Will be updated later
      }

      const order = await prisma.order.upsert({
        where: { orderNumber: erpOrder.name },
        update: orderData,
        create: orderData
      })

      // 4. Sync Order Items
      // First delete existing items to avoid duplicates on update
      await prisma.orderItem.deleteMany({
        where: { orderId: order.id }
      })

      for (const item of erpOrder.items) {
        const dbItem = await prisma.item.findUnique({
          where: {
            organizationId_sku: {
              organizationId,
              sku: item.item_code
            }
          }
        })

        if (dbItem) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              itemId: dbItem.id,
              quantity: item.qty,
              unitPrice: item.rate,
              totalPrice: item.amount
            }
          })
        }
      }

      logger.info('Order synced successfully', { orderId: order.id })
      return order

    } catch (error) {
      logger.error('Error syncing order from ERPNext', error as Error)
      throw error
    }
  }
}
