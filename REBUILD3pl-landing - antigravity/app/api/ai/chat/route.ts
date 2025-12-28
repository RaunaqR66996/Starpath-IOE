import { NextRequest, NextResponse } from 'next/server'
import { getAIResponse, ChatMessage, getFallbackResponse } from '@/lib/ai/openai-client'

interface ChatRequest {
  messages: ChatMessage[]
  context?: 'tms' | 'wms' | 'general'
  warehouseId?: string
}

export async function POST(request: NextRequest) {
  console.log('[API /ai/chat] Request received')
  
  let requestBody: ChatRequest
  
  // Parse request body with error handling
  try {
    requestBody = await request.json()
    console.log('[API /ai/chat] Request body parsed:', { 
      messageCount: requestBody.messages?.length,
      context: requestBody.context,
      warehouseId: requestBody.warehouseId 
    })
  } catch (parseError) {
    console.error('[API /ai/chat] Failed to parse request body:', parseError)
    return NextResponse.json(
      { 
        error: 'Invalid request format',
        message: 'Please ensure your request is valid JSON with a messages array.'
      },
      { status: 400 }
    )
  }

  // Validate request
  const { messages, context = 'general', warehouseId } = requestBody
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.warn('[API /ai/chat] Invalid or empty messages array')
    return NextResponse.json(
      { 
        error: 'No messages provided',
        message: 'Please provide at least one message in the messages array.'
      },
      { status: 400 }
    )
  }

  // Validate message format
  const invalidMessages = messages.filter(msg => !msg.content || !msg.role)
  if (invalidMessages.length > 0) {
    console.warn('[API /ai/chat] Invalid message format detected:', invalidMessages)
    return NextResponse.json(
      { 
        error: 'Invalid message format',
        message: 'Each message must have both "role" and "content" fields.'
      },
      { status: 400 }
    )
  }

  try {
    console.log('[API /ai/chat] Calling getAIResponse...')
    
    // Use real OpenAI integration (with fallback)
    const aiResponse = await getAIResponse(messages, context, warehouseId)

    console.log('[API /ai/chat] AI response received:', {
      hasMessage: !!aiResponse.message,
      messageLength: aiResponse.message?.length,
      hasSuggestions: !!aiResponse.suggestions,
      tokensUsed: aiResponse.tokensUsed
    })

    // Ensure we always have a message
    if (!aiResponse || !aiResponse.message) {
      console.warn('[API /ai/chat] AI response missing message, using fallback')
      const lastMessage = messages[messages.length - 1]?.content || ''
      const fallbackResponse = getFallbackResponse(lastMessage, context, warehouseId)
      
      return NextResponse.json({
        message: fallbackResponse.message || 'I apologize, but I couldn\'t generate a response. Please try again.',
        actions: fallbackResponse.actions,
        suggestions: fallbackResponse.suggestions || [],
        tokensUsed: 0
      })
    }

    return NextResponse.json({
      message: aiResponse.message,
      actions: aiResponse.actions,
      suggestions: aiResponse.suggestions,
      tokensUsed: aiResponse.tokensUsed
    })

  } catch (error: any) {
    console.error('[API /ai/chat] Error processing chat request:', {
      error: error?.message || error,
      stack: error?.stack,
      context,
      warehouseId
    })

    // Try to provide a fallback response even on error
    try {
      const lastMessage = messages[messages.length - 1]?.content || ''
      const fallbackResponse = getFallbackResponse(lastMessage, context, warehouseId)
      
      console.log('[API /ai/chat] Using fallback response due to error')
      
      return NextResponse.json({
        message: fallbackResponse.message || 'I encountered an error, but I can still help you. What would you like to know?',
        actions: fallbackResponse.actions,
        suggestions: fallbackResponse.suggestions || [],
        tokensUsed: 0,
        error: 'AI service temporarily unavailable, using fallback response'
      })
    } catch (fallbackError) {
      console.error('[API /ai/chat] Fallback also failed:', fallbackError)
      
      return NextResponse.json(
        { 
          error: 'Internal server error',
          message: 'Sorry, I encountered an error processing your request. Please try again in a moment.'
        },
        { status: 500 }
      )
    }
  }
}
