import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'API is working', timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      message: 'POST endpoint working', 
      receivedData: body,
      timestamp: new Date().toISOString() 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to parse JSON',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 400 })
  }
}






























































