import { NextRequest, NextResponse } from 'next/server';
import { addTrackingEvent } from '@/lib/api/tms-shipments';

// POST /api/shipments/[id]/events - Add tracking event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return addTrackingEvent(id, request);
}



