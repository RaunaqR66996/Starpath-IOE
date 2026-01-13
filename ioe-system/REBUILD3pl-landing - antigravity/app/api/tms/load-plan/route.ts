import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PlanRequest, PlanResult, PlacedPiece, PlanWarning, PlanViolation, TmsError } from '@/types/tms'

const prisma = new PrismaClient()

// POST /api/tms/load-plan
export async function POST(request: NextRequest) {
  try {
    const body: PlanRequest = await request.json()

    // Validate required fields
    if (!body.shipmentId || !body.equipmentType || !body.equipmentSpecs || !body.pieces) {
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'shipmentId, equipmentType, equipmentSpecs, and pieces are required' },
        { status: 400 }
      )
    }

    // Validate shipment exists
    const shipment = await prisma.shipment.findUnique({
      where: { id: body.shipmentId },
      include: {
        pieces: true
      }
    })

    if (!shipment) {
      return NextResponse.json(
        { code: 'SHIPMENT_NOT_FOUND', message: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Run 3D load optimization algorithm
    const result = await optimizeLoad(body)

    // Save load plan to database
    const loadPlan = await prisma.loadPlan.create({
      data: {
        shipmentId: body.shipmentId,
        equipmentType: body.equipmentType,
        success: result.success,
        weightUtilization: result.weightUtilization,
        volumeUtilization: result.volumeUtilization,
        cubeUtilization: result.cubeUtilization,
        totalPieces: result.totalPieces,
        placedPieces: result.placedPieces,
        unplacedPieces: result.unplacedPieces,
        warnings: result.warnings,
        violations: result.violations
      }
    })

    // Update pieces with their positions
    for (const placedPiece of result.placedPieces) {
      await prisma.piece.update({
        where: { id: placedPiece.pieceId },
        data: {
          loadPlanId: loadPlan.id,
          positionX: placedPiece.positionX,
          positionY: placedPiece.positionY,
          positionZ: placedPiece.positionZ,
          placedOrientation: placedPiece.orientation
        }
      })
    }

    const planResult: PlanResult = {
      id: loadPlan.id,
      shipmentId: body.shipmentId,
      equipmentType: body.equipmentType,
      success: result.success,
      weightUtilization: result.weightUtilization,
      volumeUtilization: result.volumeUtilization,
      cubeUtilization: result.cubeUtilization,
      placedPieces: result.placedPieces,
      warnings: result.warnings,
      violations: result.violations,
      totalPieces: result.totalPieces,
      placedPieces: result.placedPieces.length,
      unplacedPieces: result.unplacedPieces,
      createdAt: loadPlan.createdAt.toISOString()
    }

    return NextResponse.json(planResult)
  } catch (error) {
    console.error('Failed to create load plan:', error)
    return NextResponse.json(
      { code: 'LOAD_PLAN_ERROR', message: 'Failed to create load plan' },
      { status: 500 }
    )
  }
}

// 3D Load Optimization Algorithm
async function optimizeLoad(request: PlanRequest) {
  const { equipmentSpecs, pieces, constraints } = request
  
  // Sort pieces by stop sequence DESC, area DESC, height DESC
  const sortedPieces = [...pieces].sort((a, b) => {
    // First by stop sequence (descending - deliver last stops first)
    if (a.stopSequence !== b.stopSequence) {
      return b.stopSequence - a.stopSequence
    }
    // Then by area (descending - larger pieces first)
    const areaA = a.length * a.width
    const areaB = b.length * b.width
    if (areaA !== areaB) {
      return areaB - areaA
    }
    // Finally by height (descending - taller pieces first)
    return b.height - a.height
  })

  // Initialize container grid
  const container = {
    length: equipmentSpecs.length,
    width: equipmentSpecs.width,
    height: equipmentSpecs.height,
    maxWeight: equipmentSpecs.maxWeight
  }

  // Track placed pieces and utilization
  const placedPieces: PlacedPiece[] = []
  const warnings: PlanWarning[] = []
  const violations: PlanViolation[] = []
  
  let totalWeight = 0
  let totalVolume = 0
  let currentLayers: Array<{ x: number; y: number; width: number; length: number; height: number; pieceId: string }> = []

  // Process each piece
  for (const piece of sortedPieces) {
    const pieceWeight = piece.weight * piece.quantity
    const pieceVolume = piece.length * piece.width * piece.height * piece.quantity

    // Check weight limit
    if (totalWeight + pieceWeight > container.maxWeight) {
      violations.push({
        type: 'WEIGHT_EXCEEDED',
        message: `Piece ${piece.sku} would exceed weight limit`,
        pieceIds: [piece.id]
      })
      continue
    }

    // Try to place piece
    const placement = findPlacement(piece, currentLayers, container, constraints)
    
    if (placement) {
      // Place the piece
      placedPieces.push({
        pieceId: piece.id,
        sku: piece.sku,
        positionX: placement.x,
        positionY: placement.y,
        positionZ: placement.z,
        orientation: placement.orientation,
        layer: placement.layer,
        stopSequence: piece.stopSequence
      })

      // Update tracking
      totalWeight += pieceWeight
      totalVolume += pieceVolume
      currentLayers.push({
        x: placement.x,
        y: placement.y,
        width: placement.width,
        length: placement.length,
        height: placement.height,
        pieceId: piece.id
      })

      // Check for warnings
      if (piece.isFragile && placement.layer > 0) {
        warnings.push({
          type: 'FRAGILE_STACKING',
          message: `Fragile piece ${piece.sku} is being stacked`,
          severity: 'MEDIUM',
          pieceIds: [piece.id]
        })
      }

      if (piece.isHazardous) {
        warnings.push({
          type: 'HAZARDOUS_PROXIMITY',
          message: `Hazardous piece ${piece.sku} requires special handling`,
          severity: 'HIGH',
          pieceIds: [piece.id]
        })
      }
    } else {
      violations.push({
        type: 'COLLISION',
        message: `Cannot place piece ${piece.sku} - no available space`,
        pieceIds: [piece.id]
      })
    }
  }

  // Calculate utilization percentages
  const maxVolume = container.length * container.width * container.height
  const weightUtilization = (totalWeight / container.maxWeight) * 100
  const volumeUtilization = (totalVolume / maxVolume) * 100
  const cubeUtilization = Math.max(weightUtilization, volumeUtilization)

  return {
    success: violations.length === 0,
    weightUtilization,
    volumeUtilization,
    cubeUtilization,
    placedPieces,
    warnings,
    violations,
    totalPieces: pieces.length,
    unplacedPieces: pieces.length - placedPieces.length
  }
}

// Find optimal placement for a piece
function findPlacement(
  piece: any,
  currentLayers: any[],
  container: any,
  constraints: any
): { x: number; y: number; z: number; width: number; length: number; height: number; orientation: string; layer: number } | null {
  
  const orientations = constraints.allowRotation 
    ? ['NORMAL', 'ROTATED_90', 'ROTATED_180', 'ROTATED_270']
    : ['NORMAL']

  for (const orientation of orientations) {
    const dimensions = getDimensions(piece, orientation)
    
    // Try to place at ground level first
    const groundPlacement = findGroundPlacement(dimensions, currentLayers, container)
    if (groundPlacement) {
      return {
        ...groundPlacement,
        orientation,
        layer: 0
      }
    }

    // Try to stack on existing pieces
    const stackPlacement = findStackPlacement(dimensions, currentLayers, container, constraints)
    if (stackPlacement) {
      return {
        ...stackPlacement,
        orientation,
        layer: stackPlacement.layer
      }
    }
  }

  return null
}

// Get dimensions for a given orientation
function getDimensions(piece: any, orientation: string) {
  switch (orientation) {
    case 'ROTATED_90':
      return { length: piece.width, width: piece.length, height: piece.height }
    case 'ROTATED_180':
      return { length: piece.length, width: piece.width, height: piece.height }
    case 'ROTATED_270':
      return { length: piece.width, width: piece.length, height: piece.height }
    default:
      return { length: piece.length, width: piece.width, height: piece.height }
  }
}

// Find placement at ground level
function findGroundPlacement(dimensions: any, currentLayers: any[], container: any) {
  // Simple greedy placement - find first available spot
  for (let x = 0; x <= container.length - dimensions.length; x += 10) {
    for (let y = 0; y <= container.width - dimensions.width; y += 10) {
      if (!hasCollision(x, y, 0, dimensions, currentLayers)) {
        return { x, y, z: 0, ...dimensions }
      }
    }
  }
  return null
}

// Find placement by stacking
function findStackPlacement(dimensions: any, currentLayers: any[], container: any, constraints: any) {
  // Find the highest layer we can stack on
  const maxLayer = Math.max(...currentLayers.map(l => l.height), 0)
  
  if (constraints.maxStackHeight && maxLayer + dimensions.height > constraints.maxStackHeight) {
    return null
  }

  // Try to place on top of existing pieces
  for (const layer of currentLayers) {
    if (layer.height === maxLayer) {
      const x = layer.x
      const y = layer.y
      const z = layer.height
      
      if (!hasCollision(x, y, z, dimensions, currentLayers)) {
        return { x, y, z, ...dimensions, layer: 1 }
      }
    }
  }

  return null
}

// Check for collisions
function hasCollision(x: number, y: number, z: number, dimensions: any, currentLayers: any[]) {
  for (const layer of currentLayers) {
    if (
      x < layer.x + layer.width &&
      x + dimensions.length > layer.x &&
      y < layer.y + layer.length &&
      y + dimensions.width > layer.y &&
      z < layer.height &&
      z + dimensions.height > 0
    ) {
      return true
    }
  }
  return false
}








































































