import { NextRequest, NextResponse } from 'next/server';
import { createLoadPlan } from '@/lib/api/tms-shipments';

// POST /api/shipments/[id]/load-plan - Create load plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return createLoadPlan(id, request);
}



