import { NextRequest, NextResponse } from 'next/server'
import { SpecShipmentService } from '@/lib/spec/services/shipment-service'

const service = new SpecShipmentService()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await service.dispatch(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    const status = e.message?.includes('Insufficient reserved') ? 409 : 400
    return NextResponse.json({ success: false, error: e.message || 'Failed to dispatch' }, { status })
  }
}


























