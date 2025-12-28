import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// TODO: Add Exception model to schema
// Temporarily returning empty/mock data to unblock build

// GET /api/tms/exceptions - Get all exceptions with filtering
export async function GET(request: Request) {
  try {
    // Return empty array until Exception model is added to schema
    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching exceptions:', error)
    return NextResponse.json({ error: 'Failed to fetch exceptions' }, { status: 500 })
  }
}

// POST /api/tms/exceptions - Create new exception
export async function POST(request: Request) {
  try {
    const data = await request.json()
    // Return mock response until Exception model is added to schema
    return NextResponse.json({
      id: `EXC-${Date.now()}`,
      ...data,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating exception:', error)
    return NextResponse.json({ error: 'Failed to create exception' }, { status: 500 })
  }
}

// PUT /api/tms/exceptions/[id] - Update exception
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const exceptionId = searchParams.get('id')

    if (!exceptionId) {
      return NextResponse.json({ error: 'Exception ID is required' }, { status: 400 })
    }

    const data = await request.json()
    // Return mock response until Exception model is added to schema
    return NextResponse.json({
      id: exceptionId,
      ...data,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating exception:', error)
    return NextResponse.json({ error: 'Failed to update exception' }, { status: 500 })
  }
}

// DELETE /api/tms/exceptions/[id] - Delete exception
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const exceptionId = searchParams.get('id')

    if (!exceptionId) {
      return NextResponse.json({ error: 'Exception ID is required' }, { status: 400 })
    }

    // Return success until Exception model is added to schema
    return NextResponse.json({ message: 'Exception deleted successfully' })
  } catch (error) {
    console.error('Error deleting exception:', error)
    return NextResponse.json({ error: 'Failed to delete exception' }, { status: 500 })
  }
}
