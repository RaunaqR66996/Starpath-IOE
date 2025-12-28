import { NextRequest, NextResponse } from 'next/server'
import { SpecShipmentService } from '@/lib/spec/services/shipment-service'

const service = new SpecShipmentService()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await service.pack(id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to pack' }, { status: 400 })
  }
}


























