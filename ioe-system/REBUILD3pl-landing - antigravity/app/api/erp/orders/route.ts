import { NextRequest, NextResponse } from 'next/server';
import { ERPService } from '@/lib/services/erp-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // In a real app, we would validate an API Key header here
        // const apiKey = request.headers.get('x-api-key');

        // Hardcoded organization ID for MVP (The "G-Shock" Org)
        // In production, this would come from the API Key mapping
        const organizationId = 'org-1';

        const result = await ERPService.ingestOrder(body, organizationId);

        return NextResponse.json({
            success: true,
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            invoiceId: result.invoice.id,
            invoiceNumber: result.invoice.invoiceNumber,
            status: 'Order Ingested & Invoice Generated'
        }, { status: 201 });

    } catch (error: any) {
        console.error('ERP Ingestion Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
