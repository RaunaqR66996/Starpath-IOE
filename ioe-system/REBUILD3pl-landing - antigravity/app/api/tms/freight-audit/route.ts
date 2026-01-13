import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/tms/freight-audit - Get all freight audits with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shipmentId = searchParams.get('shipmentId')
    const carrierId = searchParams.get('carrierId')
    const status = searchParams.get('status')
    const auditType = searchParams.get('auditType')

    const where: any = {}
    
    if (shipmentId) where.shipmentId = shipmentId
    if (carrierId) where.carrierId = carrierId
    if (status) where.status = status
    if (auditType) where.auditType = auditType

    const audits = await prisma.freightAudit.findMany({
      where,
      include: {
        shipment: {
          select: {
            id: true,
            shipmentNumber: true,
            status: true
          }
        },
        carrier: {
          select: {
            id: true,
            carrierName: true,
            carrierCode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(audits)
  } catch (error) {
    console.error('Error fetching freight audits:', error)
    return NextResponse.json({ error: 'Failed to fetch freight audits' }, { status: 500 })
  }
}

// POST /api/tms/freight-audit - Create new freight audit
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate required fields
    const requiredFields = ['invoiceNumber', 'billedAmount']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Calculate variance if audited amount is provided
    const varianceAmount = data.auditedAmount ? 
      data.billedAmount - data.auditedAmount : null
    const variancePercentage = varianceAmount && data.billedAmount > 0 ? 
      (varianceAmount / data.billedAmount) * 100 : null

    const audit = await prisma.freightAudit.create({
      data: {
        organizationId: data.organizationId || 'default-org', // In real app, get from auth
        shipmentId: data.shipmentId,
        carrierId: data.carrierId,
        invoiceNumber: data.invoiceNumber,
        billedAmount: data.billedAmount,
        auditedAmount: data.auditedAmount,
        varianceAmount: varianceAmount,
        variancePercentage: variancePercentage,
        status: data.status || 'PENDING',
        auditType: data.auditType || 'AUTOMATIC',
        discrepancies: data.discrepancies || [],
        notes: data.notes,
        processedBy: data.processedBy,
        processedAt: data.processedAt ? new Date(data.processedAt) : null,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : null,
        metadata: data.metadata || {}
      },
      include: {
        shipment: {
          select: {
            id: true,
            shipmentNumber: true,
            status: true
          }
        },
        carrier: {
          select: {
            id: true,
            carrierName: true,
            carrierCode: true
          }
        }
      }
    })

    return NextResponse.json(audit, { status: 201 })
  } catch (error) {
    console.error('Error creating freight audit:', error)
    return NextResponse.json({ error: 'Failed to create freight audit' }, { status: 500 })
  }
}

// PUT /api/tms/freight-audit/[id] - Update freight audit
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('id')
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    const data = await request.json()
    
    // Recalculate variance if audited amount is being updated
    let varianceAmount = data.varianceAmount
    let variancePercentage = data.variancePercentage
    
    if (data.auditedAmount !== undefined) {
      const currentAudit = await prisma.freightAudit.findUnique({
        where: { id: auditId },
        select: { billedAmount: true }
      })
      
      if (currentAudit) {
        varianceAmount = currentAudit.billedAmount - data.auditedAmount
        variancePercentage = currentAudit.billedAmount > 0 ? 
          (varianceAmount / currentAudit.billedAmount) * 100 : null
      }
    }

    const audit = await prisma.freightAudit.update({
      where: { id: auditId },
      data: {
        auditedAmount: data.auditedAmount,
        varianceAmount: varianceAmount,
        variancePercentage: variancePercentage,
        status: data.status,
        auditType: data.auditType,
        discrepancies: data.discrepancies,
        notes: data.notes,
        processedBy: data.processedBy,
        processedAt: data.processedAt ? new Date(data.processedAt) : undefined,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : undefined,
        metadata: data.metadata
      },
      include: {
        shipment: {
          select: {
            id: true,
            shipmentNumber: true,
            status: true
          }
        },
        carrier: {
          select: {
            id: true,
            carrierName: true,
            carrierCode: true
          }
        }
      }
    })

    return NextResponse.json(audit)
  } catch (error) {
    console.error('Error updating freight audit:', error)
    return NextResponse.json({ error: 'Failed to update freight audit' }, { status: 500 })
  }
}

// DELETE /api/tms/freight-audit/[id] - Delete freight audit
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('id')
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    await prisma.freightAudit.delete({
      where: { id: auditId }
    })

    return NextResponse.json({ message: 'Freight audit deleted successfully' })
  } catch (error) {
    console.error('Error deleting freight audit:', error)
    return NextResponse.json({ error: 'Failed to delete freight audit' }, { status: 500 })
  }
}





