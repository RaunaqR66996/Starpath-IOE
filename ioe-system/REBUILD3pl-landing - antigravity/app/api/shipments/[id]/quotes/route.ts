import { NextRequest, NextResponse } from 'next/server';
import { addQuote } from '@/lib/api/tms-shipments';

// POST /api/shipments/[id]/quotes - Add quote
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return addQuote(id, request);
}



