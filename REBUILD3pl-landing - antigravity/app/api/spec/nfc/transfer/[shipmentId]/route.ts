import { NextRequest, NextResponse } from 'next/server'
import { SpecNFCService } from '@/lib/spec/services/nfc-service'
import { SpecBillingService } from '@/lib/spec/services/billing-service'

const nfc = new SpecNFCService()
const billing = new SpecBillingService()

export async function POST(request: NextRequest, { params }: { params: Promise<{ shipmentId: string }> }) {
  try {
    const { shipmentId } = await params;
    const idemKey = request.headers.get('Idempotency-Key') || undefined
    const result = await nfc.transfer(shipmentId, idemKey)
    // On success, trigger billing flow
    // TODO: Restore invoiceOnNFC method in SpecBillingService
    // await billing.invoiceOnNFC(shipmentId)
    return NextResponse.json({ success: true, data: result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed NFC transfer' }, { status: 400 })
  }
}


























