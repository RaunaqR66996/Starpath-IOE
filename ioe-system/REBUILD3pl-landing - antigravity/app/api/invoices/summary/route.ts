import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock summary data for now
    const summary = {
      totalInvoices: 15,
      pendingInvoices: 8,
      paidInvoices: 5,
      overdueInvoices: 2,
      totalAmount: 12500.50,
      pendingAmount: 8500.25
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching invoice summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice summary' },
      { status: 500 }
    );
  }
}










