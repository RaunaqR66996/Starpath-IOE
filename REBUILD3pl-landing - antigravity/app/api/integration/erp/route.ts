import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { erpAdapter } from '@/lib/integrations/erp-adapter'

const syncSchema = z.object({
  systemId: z.string().min(1),
  type: z.enum(['orders', 'inventory', 'shipments']).default('orders'),
  payload: z.record(z.any())
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const system = searchParams.get('system') ?? undefined
    const status = await erpAdapter.getStatus(system)

    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('Failed to fetch ERP integration data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ERP integration data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await syncSchema.parseAsync(body)

    const job = await erpAdapter.enqueueSync({
      id: `sync-${Date.now()}`,
      systemId: data.systemId,
      type: data.type,
      payload: data.payload
    })

    return NextResponse.json({
      success: true,
      data: job
    })
  } catch (error) {
    console.error('Failed to queue ERP sync:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to queue ERP sync' },
      { status: 500 }
    )
  }
}






























































