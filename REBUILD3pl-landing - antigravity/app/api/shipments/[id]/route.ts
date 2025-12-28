import { NextRequest, NextResponse } from 'next/server';
import { 
  getShipmentById, 
  updateShipment, 
  deleteShipment,
  addTrackingEvent,
  addQuote,
  selectQuote,
  createLoadPlan
} from '@/lib/api/tms-shipments';

// GET /api/shipments/[id] - Get single shipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return getShipmentById(id);
}

// PUT /api/shipments/[id] - Update shipment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return updateShipment(id, request);
}

// DELETE /api/shipments/[id] - Delete shipment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return deleteShipment(id);
}
