// @ts-nocheck
"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function generateInvoice(orderId: string) {
    try {
        // 1. Get order details
        const order = await db.order.findUnique({
            where: { id: orderId },
            include: { lines: true }
        });

        if (!order) throw new Error("Order not found");

        // 1b. Idempotency Check: Prevent duplicate billing
        const existingInvoice = await db.invoice.findUnique({
            where: { orderId: order.id }
        });
        if (existingInvoice) {
            return { success: true, invoice: existingInvoice, message: "Invoice already exists (Idempotent Return)" };
        }

        // 2. Calculate amount
        const amount = order.lines.reduce((sum, line) => sum + (line.qtyOrdered * line.unitPrice), 0);

        // 3. Create Invoice
        const invoice = await db.invoice.create({
            data: {
                invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                orderId: order.id,
                amount: amount,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
                status: "UNPAID"
            }
        });

        revalidatePath('/orders');
        revalidatePath('/finance');
        return { success: true, invoice };

    } catch (error: any) {
        console.error("Invoice Gen Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getInvoices() {
    try {
        const invoices = await db.invoice.findMany({
            include: {
                order: {
                    include: { customer: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return invoices;
    } catch (error) {
        return [];
    }
}

export async function markAsPaid(invoiceId: string) {
    try {
        await db.invoice.update({
            where: { id: invoiceId },
            data: {
                status: "PAID",
                paidAt: new Date()
            }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
