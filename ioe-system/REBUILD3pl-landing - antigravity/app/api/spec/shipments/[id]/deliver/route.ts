import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // TODO: Restore specShipment model in Prisma schema
    // await prisma.specShipment.update({ where: { id }, data: { status: 'DELIVERED' } })
    return NextResponse.json({ success: true, message: 'Spec API temporarily disabled' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to deliver' }, { status: 400 })
  }
}


























