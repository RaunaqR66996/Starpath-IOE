import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'
import { processErpWebhook } from '@/lib/integrations/erp-webhook'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-erp-signature') || request.headers.get('authorization')

    console.log('Webhook received:', {
      hasBody: !!rawBody,
      bodyLength: rawBody.length,
      hasSignature: !!signature,
      contentType: request.headers.get('content-type')
    })

    const result = await processErpWebhook(rawBody, signature)
    
    if (!result.success) {
      console.error('Webhook processing failed:', result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: result.status })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully'
    })
  } catch (error) {
    console.error('Webhook error:', error)
    logger.error('erp_webhook_failed', error as Error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process webhook',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
