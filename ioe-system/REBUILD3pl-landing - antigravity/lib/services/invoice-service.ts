import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InvoiceService {
    /**
     * Generates an invoice for a specific order.
     * @param orderId The ID of the order to invoice.
     */
    static async generateInvoiceForOrder(orderId: string) {
        // 1. Fetch the order with items and customer
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: true,
                customer: true,
                organization: true
            }
        });

        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        // 2. Check if invoice already exists
        const existingInvoice = await prisma.invoice.findFirst({
            where: { orderId: orderId }
        });

        if (existingInvoice) {
            return existingInvoice;
        }

        // 3. Calculate totals (simple sum for now, can add tax/shipping later)
        // Assuming order.totalAmount is already correct, but let's recalculate from items to be safe
        const calculatedTotal = order.orderItems.reduce((sum, item) => {
            return sum + (Number(item.totalPrice) || 0);
        }, 0);

        // 4. Create the Invoice record
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // Net 30 default

        const invoice = await prisma.invoice.create({
            data: {
                organizationId: order.organizationId,
                invoiceNumber: invoiceNumber,
                orderId: order.id,
                customerId: order.customerId,
                amount: String(calculatedTotal),
                currency: order.currency,
                status: 'DRAFT',
                dueDate: dueDate,
                metadata: {
                    generatedBy: 'system',
                    originalOrderNumber: order.orderNumber
                }
            }
        });

        console.log(`Generated Invoice ${invoice.invoiceNumber} for Order ${order.orderNumber}`);

        // 5. (Stub) Trigger PDF generation or Email
        // await EmailService.sendInvoice(invoice.id);

        return invoice;
    }

    /**
     * Lists invoices with optional filtering.
     */
    static async listInvoices(params: { organizationId?: string, status?: string, search?: string, limit?: number }) {
        const where: any = {};

        if (params.organizationId) {
            where.organizationId = params.organizationId;
        }

        if (params.status) {
            where.status = params.status;
        }

        if (params.search) {
            where.OR = [
                { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
                { customer: { customerName: { contains: params.search, mode: 'insensitive' } } }
            ];
        }

        return prisma.invoice.findMany({
            where,
            include: {
                customer: true,
                order: true
            },
            take: params.limit || 50,
            orderBy: { createdAt: 'desc' }
        });
    }
}
