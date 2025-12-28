import { NextRequest, NextResponse } from 'next/server';
import { selectQuote } from '@/lib/api/tms-shipments';

// POST /api/shipments/[id]/quotes/[quoteId]/select - Select quote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quoteId: string }> }
) {
  const { id, quoteId } = await params;
  return selectQuote(id, quoteId);
}



