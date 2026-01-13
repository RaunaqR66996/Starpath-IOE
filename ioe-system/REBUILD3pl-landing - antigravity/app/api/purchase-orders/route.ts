import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const take = Number(searchParams.get('take') || 50)
    const skip = Number(searchParams.get('skip') || 0)

    // Mock purchase orders data
    const total = 1
    const data = [
      {
        id: 'po-1',
        poNumber: 'PO-2024-001',
        status: 'pending',
        supplier: {
          id: 'supplier-1',
          name: 'Sample Supplier'
        },
        items: [
          {
            id: 'item-1',
            sku: 'SKU001',
            quantity: 100,
            unitPrice: 10.50
          }
        ],
        createdAt: new Date()
      }
    ]

    return NextResponse.json({ success: true, total, data })
  } catch (error) {
    console.error('Failed to fetch purchase orders', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}



