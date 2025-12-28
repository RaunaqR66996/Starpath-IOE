import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function extractId(text: string): string | undefined {
  const m = text.match(/[A-Za-z0-9]{8,}/)
  return m?.[0]
}

function extractSku(text: string): string | undefined {
  const m = text.match(/[A-Z0-9\-]{3,}/)
  return m?.[0]
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    const t = String(text || '').toLowerCase()

    // TODO: Restore spec models in Prisma schema
    // Temporarily disabled due to missing specOrder, specOrderLine, specShipment, specInventory models
    
    return NextResponse.json({ success: true, message: 'AI Agent API temporarily disabled. Models need to be added to Prisma schema.' })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Agent failed' }, { status: 400 })
  }
}


























