import { PrismaClient } from '@prisma/client';
import { InvoiceService } from './invoice-service';
import { AllocationService } from './allocation-service';
import { TMSService } from './tms-service';

const prisma = new PrismaClient();

export interface ERPOrderPayload {
    erpOrderId: string;
    customerCode: string; // Maps to Customer.customerId
    orderDate: string;
    requiredDate?: string;
    items: {
        sku: string;
        quantity: number;
        unitPrice: number;
    }[];
}

export class ERPService {
    /**
     * Ingests an order from an external ERP system.
     * @param payload The JSON payload from the ERP.
     * @param organizationId The organization context.
     */
    static async ingestOrder(payload: ERPOrderPayload, organizationId: string) {
        // 1. Find Customer
        const customer = await prisma.customer.findFirst({
            where: {
                organizationId,
                customerId: payload.customerCode
            }
        });

        if (!customer) {
            throw new Error(`Customer with code ${payload.customerCode} not found`);
        }

        // 2. Validate Items and Calculate Total
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of payload.items) {
            const dbItem = await prisma.item.findFirst({
                where: { organizationId, sku: item.sku }
            });

            if (!dbItem) {
                throw new Error(`Item SKU ${item.sku} not found`);
            }

            const lineTotal = item.quantity * item.unitPrice;
            totalAmount += lineTotal;

            orderItemsData.push({
                itemId: dbItem.id,
                quantity: item.quantity,
                unitPrice: String(item.unitPrice),
                totalPrice: String(lineTotal)
            });
        }

        // 3. Create Order
        const order = await prisma.order.create({
            data: {
                organizationId,
                customerId: customer.id,
                orderNumber: payload.erpOrderId, // Use ERP ID as our Order Number for now
                externalId: payload.erpOrderId,
                status: 'CREATED',
                orderDate: new Date(payload.orderDate),
                requiredDeliveryDate: payload.requiredDate ? new Date(payload.requiredDate) : null,
                totalAmount: totalAmount,
                orderItems: {
                    create: orderItemsData
                }
            }
        });

        // 4. Auto-generate Invoice
        const invoice = await InvoiceService.generateInvoiceForOrder(order.id);

        // 5. Unified Flow: Allocate & Plan
        console.log('Triggering Unified Flow...');
        const allocationResult = await AllocationService.allocateOrder(order.id);

        let shipment = null;
        if (allocationResult.status === 'ALLOCATED') {
            shipment = await TMSService.autoBuildShipment(order.id);
        }

        return { order, invoice, shipment };
    }
}
