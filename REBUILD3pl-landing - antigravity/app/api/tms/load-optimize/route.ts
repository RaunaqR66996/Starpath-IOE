import { NextRequest, NextResponse } from 'next/server'
import { HeuristicOptimizer } from '@/lib/optimization/heuristic-engine'
import { TrailerSpec } from '@/lib/types/trailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cargo, trailer } = body
    
    // Use passed trailer or default to 53ft
    const trailerSpec: TrailerSpec = trailer || {
        id: '53ft-dry',
        name: '53ft Dry Van',
        innerLength: 53,
        innerWidth: 8.5,
        innerHeight: 9,
        maxGrossWeight: 45000
    }

    const optimizer = new HeuristicOptimizer(trailerSpec)
    const result = optimizer.optimize(cargo)
    
    // Transform heuristic result to API format expected by UI
    const formattedResult = {
      utilization: result.utilization,
      placedItems: result.placedItems.length,
      unplacedItems: result.unplacedItems.length,
      stabilityScore: 85, // Placeholder for now
      centerOfGravity: result.centerOfGravity,
      axleLoads: [
        { axle: 1, load: result.totalWeight * 0.3, maxLoad: 12000, percentage: (result.totalWeight * 0.3 / 12000) * 100 },
        { axle: 2, load: result.totalWeight * 0.7, maxLoad: 34000, percentage: (result.totalWeight * 0.7 / 34000) * 100 }
      ],
      violations: [],
      placed: result.placedItems.map(item => ({
        ...item,
        position: { x: item.x, y: item.y, z: item.z },
        rotation: { x: 0, y: item.rotationY, z: 0 }
      })),
      unplaced: result.unplacedItems
    }
    
    return NextResponse.json({
      success: true,
      data: formattedResult
    })
  } catch (error) {
    console.error('Optimization error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to optimize load' },
      { status: 500 }
    )
  }
}
