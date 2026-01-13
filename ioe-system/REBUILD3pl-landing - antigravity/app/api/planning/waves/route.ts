import { NextRequest, NextResponse } from 'next/server'
import { PlanningAgent } from '@/lib/ai-agents/planning-agent'
import { featureFlags } from '@/lib/config/featureFlags'

export async function POST(request: NextRequest) {
  try {
    if (!featureFlags.phase3AdvancedWorkflows) {
      return NextResponse.json({ error: 'Phase 3 features disabled' }, { status: 403 })
    }

    const body = await request.json()
    const { orderLines, constraints } = body as {
      orderLines: any[]
      constraints?: { maxLinesPerWave?: number; maxWeightKgPerWave?: number; allowMixPriority?: boolean }
    }

    if (!Array.isArray(orderLines) || orderLines.length === 0) {
      return NextResponse.json({ error: 'orderLines required' }, { status: 400 })
    }

    const waves = PlanningAgent.planWaves(orderLines, {
      maxLinesPerWave: constraints?.maxLinesPerWave ?? 25,
      maxWeightKgPerWave: constraints?.maxWeightKgPerWave,
      allowMixPriority: constraints?.allowMixPriority ?? true,
    })

    return NextResponse.json({ waves })
  } catch (error) {
    console.error('Wave planning error:', error)
    return NextResponse.json({ error: 'Failed to plan waves' }, { status: 500 })
  }
}


