import { NextRequest, NextResponse } from 'next/server';
import { InvoiceService } from '@/lib/services/invoice-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Hardcoded org for MVP
    const organizationId = 'org-1';

    const invoices = await InvoiceService.listInvoices({
      organizationId,
      search,
      status,
      limit
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    const invoice = await InvoiceService.generateInvoiceForOrder(body.orderId);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invoice' },
      { status: 500 }
    );
  }
}











