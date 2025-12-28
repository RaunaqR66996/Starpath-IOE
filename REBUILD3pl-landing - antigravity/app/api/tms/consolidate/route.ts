import { NextRequest, NextResponse } from 'next/server'
import { featureFlags } from '@/lib/config/featureFlags'

type ShipmentLike = {
  id: string
  orderIds: string[]
  weightKg?: number
  volumeM3?: number
  origin?: string
  destination?: string
  readyAt?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!featureFlags.phase3AdvancedWorkflows) {
      return NextResponse.json({ error: 'Phase 3 features disabled' }, { status: 403 })
    }

    const body = await request.json()
    const { candidates, constraints } = body as { candidates: ShipmentLike[]; constraints?: any }

    if (!Array.isArray(candidates) || candidates.length < 2) {
      return NextResponse.json({ error: 'At least two candidate shipments required' }, { status: 400 })
    }

    // Simple consolidation: merge shipments with same destination and similar readyAt
    const byDest: Record<string, ShipmentLike[]> = {}
    for (const s of candidates) {
      const key = `${s.destination || 'UNK'}`
      byDest[key] = byDest[key] || []
      byDest[key].push(s)
    }

    const consolidated: any[] = []
    for (const group of Object.values(byDest)) {
      if (group.length === 1) continue
      const merged = mergeShipments(group)
      consolidated.push(merged)
    }

    return NextResponse.json({ consolidated })
  } catch (error) {
    console.error('Consolidation error:', error)
    return NextResponse.json({ error: 'Failed to consolidate shipments' }, { status: 500 })
  }
}

function mergeShipments(list: ShipmentLike[]) {
  const id = `consol-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const orderIds = Array.from(new Set(list.flatMap((s) => s.orderIds)))
  const weightKg = list.reduce((s, x) => s + (x.weightKg || 0), 0)
  const volumeM3 = list.reduce((s, x) => s + (x.volumeM3 || 0), 0)
  const origin = mostCommon(list.map((s) => s.origin || ''))
  const destination = mostCommon(list.map((s) => s.destination || ''))
  const readyAt = earliest(list.map((s) => s.readyAt))
  return { id, orderIds, weightKg, volumeM3, origin, destination, readyAt }
}

function mostCommon(values: string[]) {
  const c: Record<string, number> = {}
  for (const v of values) c[v] = (c[v] || 0) + 1
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

function earliest(isoDates: (string | undefined)[]) {
  const nums = isoDates.filter(Boolean).map((d) => new Date(d as string).getTime())
  return nums.length ? new Date(Math.min(...nums)).toISOString() : undefined
}


