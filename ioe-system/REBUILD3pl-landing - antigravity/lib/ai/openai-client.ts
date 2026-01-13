import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'

// Validate OpenAI API key on module load
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not found in environment variables. AI features will use fallback responses.')
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 second timeout
    })
  : null

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIChatResponse {
  message: string
  actions?: Array<{
    type: string
    label: string
    data: any
  }>
  suggestions?: string[]
  tokensUsed?: number
}

/**
 * Get context-aware system prompt based on domain
 */
function getSystemPrompt(context: 'tms' | 'wms' | 'general', warehouseId?: string): string {
  const warehouseName = getWarehouseName(warehouseId)
  
  if (context === 'wms') {
    return `You are Ethan, an AI warehouse management assistant for ${warehouseName}. You help warehouse operators with:

- Inventory management: Check stock levels, locate items, cycle counting
- Order fulfillment: Pick wave planning, pack optimization, shipping
- Inbound operations: Receiving, ASN processing, putaway strategies
- Location management: Bin optimization, slotting, inventory movements

You have access to real-time warehouse data. Be concise, actionable, and professional. When users ask about inventory, you can provide specific SKU information if available.`
  }
  
  if (context === 'tms') {
    return `You are Ethan, an AI transportation management assistant. You help logistics teams with:

- Shipment tracking: Real-time GPS monitoring, ETA calculations, delivery status
- Route optimization: Multi-stop planning, fuel efficiency, delivery windows
- Load planning: 3D trailer optimization, weight distribution, DOT compliance
- Carrier management: Rate shopping, carrier selection, performance tracking
- Driver dispatch: Assignment, compliance monitoring, route adjustments

Be concise, data-driven, and focus on actionable insights.`
  }
  
  return `You are Ethan, an AI logistics assistant for a comprehensive TMS/WMS platform. You help with:

- Transportation Management: Route optimization, shipment tracking, load planning
- Warehouse Management: Inventory control, order fulfillment, receiving operations
- Supply Chain Intelligence: Analytics, forecasting, optimization

Provide helpful, professional responses and guide users to the right features.`
}

/**
 * Get warehouse name from ID
 */
function getWarehouseName(warehouseId?: string): string {
  switch (warehouseId) {
    case 'warehouse-001': return 'KuehneNagel - East Warehouse - NY'
    case 'warehouse-002': return 'L-Angeles - Dual West Warehouse - LA'
    case 'warehouse-003': return 'Laredo - South Warehouse - TX'
    default: return 'the warehouse'
  }
}

/**
 * Get inventory data for context (for WMS queries)
 */
async function getInventoryContext(warehouseId?: string, sku?: string): Promise<string> {
  try {
    if (!warehouseId) return ''

    // Map warehouse IDs to actual warehouse codes
    // warehouse-001 -> 001, warehouse-002 -> 002, etc.
    const warehouseCode = warehouseId.replace('warehouse-', '')
    
    // Try to find warehouse and get inventory summary
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        code: warehouseCode
      },
      include: {
        locations: {
          include: {
            inventory: {
              include: {
                item: true
              },
              take: 20
            }
          }
        }
      }
    })

    if (!warehouse) {
      // Try alternative warehouse code formats
      const altWarehouse = await prisma.warehouse.findFirst({
        include: {
          locations: {
            include: {
              inventory: {
                include: {
                  item: true
                },
                take: 20
              }
            }
          }
        }
      })
      if (!altWarehouse) return ''
      return getInventorySummary(altWarehouse, sku)
    }

    return getInventorySummary(warehouse, sku)
  } catch (error) {
    console.error('Error fetching inventory context:', error)
    return ''
  }
}

/**
 * Helper to format inventory summary
 */
function getInventorySummary(warehouse: any, sku?: string): string {
  const inventorySummary = warehouse.locations.flatMap((location: any) => 
    location.inventory.map((inv: any) => ({
      sku: inv.item.sku,
      name: inv.item.name || inv.item.sku,
      location: location.code,
      quantity: inv.quantity,
      available: inv.quantityAvailable
    }))
  )

  if (inventorySummary.length === 0) return ''

  // If SKU specified, filter to that SKU
  if (sku) {
    const filtered = inventorySummary.filter((inv: any) => 
      inv.sku.toLowerCase().includes(sku.toLowerCase())
    )
    if (filtered.length > 0) {
      return `Current inventory at ${warehouse.name}:\n${filtered.map((inv: any) => 
        `- ${inv.sku} (${inv.name}): ${inv.available} available units in location ${inv.location}`
      ).join('\n')}`
    }
  }

  // Return summary of top items
  const topItems = inventorySummary
    .filter((inv: any) => inv.available > 0)
    .sort((a: any, b: any) => b.available - a.available)
    .slice(0, 5)

  if (topItems.length === 0) return ''

  return `Inventory summary for ${warehouse.name}: ${inventorySummary.length} unique SKUs across ${warehouse.locations.length} locations. Top items: ${topItems.map((inv: any) => `${inv.sku} (${inv.available} available)`).join(', ')}`
}

/**
 * Get order/shipment data for context (for TMS queries)
 */
async function getTMSContext(): Promise<string> {
  try {
    const [orders, shipments] = await Promise.all([
      prisma.order.count({
        where: { status: { in: ['PROCESSING', 'ALLOCATED', 'PICKING'] } }
      }),
      prisma.shipment.count({
        where: { status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] } }
      })
    ])

    return `Current operations: ${orders} active orders, ${shipments} shipments in transit.`
  } catch (error) {
    console.error('Error fetching TMS context:', error)
    return ''
  }
}

/**
 * Generate AI response using OpenAI with database context
 */
export async function getAIResponse(
  messages: ChatMessage[],
  context: 'tms' | 'wms' | 'general' = 'general',
  warehouseId?: string
): Promise<AIChatResponse> {
  // Fallback if OpenAI is not configured
  if (!openai) {
    console.log('[getAIResponse] OpenAI not configured, using fallback response')
    const lastMessage = messages[messages.length - 1]?.content || ''
    return getFallbackResponse(lastMessage, context, warehouseId)
  }

  try {
    const systemPrompt = getSystemPrompt(context, warehouseId)
    const lastMessage = messages[messages.length - 1]?.content || ''
    
    // Get database context based on query
    let dbContext = ''
    if (context === 'wms') {
      // Extract SKU from message if mentioned
      const skuMatch = lastMessage.match(/\b([A-Z]{2,}-[A-Z0-9]+)\b/i)
      const sku = skuMatch ? skuMatch[1] : undefined
      dbContext = await getInventoryContext(warehouseId, sku)
    } else if (context === 'tms') {
      dbContext = await getTMSContext()
    }

    // Enhance system prompt with database context
    const enhancedSystemPrompt = dbContext 
      ? `${systemPrompt}\n\nCurrent system data:\n${dbContext}\n\nUse this data to provide accurate, specific responses.`
      : systemPrompt
    
    // Prepare messages for OpenAI
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt
      },
      ...messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }))
    ]

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openAIMessages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'text' }
    })

    const aiMessage = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.'
    const tokensUsed = completion.usage?.total_tokens

    // Extract actions and suggestions from the response
    const response: AIChatResponse = {
      message: aiMessage,
      tokensUsed,
      suggestions: generateContextualSuggestions(context, warehouseId)
    }

    return response
  } catch (error: any) {
    console.error('[getAIResponse] OpenAI API error:', {
      error: error?.message || error,
      errorType: error?.constructor?.name,
      context,
      warehouseId
    })
    
    // Fallback to rule-based responses on error
    console.log('[getAIResponse] Falling back to rule-based response due to error')
    const lastMessage = messages[messages.length - 1]?.content || ''
    return getFallbackResponse(lastMessage, context, warehouseId)
  }
}

/**
 * Generate contextual suggestions based on domain
 */
function generateContextualSuggestions(
  context: 'tms' | 'wms' | 'general',
  warehouseId?: string
): string[] {
  if (context === 'wms') {
    return [
      'Check inventory levels',
      'Create pick wave',
      'Process receiving',
      'View staging areas'
    ]
  }
  
  if (context === 'tms') {
    return [
      'Track shipments',
      'Optimize routes',
      'Plan loads',
      'View carrier rates'
    ]
  }
  
  return [
    'Access TMS operations',
    'Access WMS operations',
    'Generate reports',
    'View analytics'
  ]
}

/**
 * Fallback response when OpenAI is unavailable
 */
function getFallbackResponse(
  userInput: string,
  context: 'tms' | 'wms' | 'general',
  warehouseId?: string
): AIChatResponse {
  console.log('[getFallbackResponse] Using fallback response', { userInput: userInput?.substring(0, 50), context, warehouseId })
  
  // Handle edge cases
  if (!userInput || typeof userInput !== 'string') {
    userInput = ''
  }
  
  const warehouseName = getWarehouseName(warehouseId)
  const lowerInput = userInput.toLowerCase().trim()

  // WMS-specific responses
  if (context === 'wms') {
    if (lowerInput.includes('inventory') || lowerInput.includes('stock') || lowerInput.includes('sku')) {
      return {
        message: `I can help you manage inventory at ${warehouseName}. I can check stock levels, locate items by SKU or bin location, and assist with cycle counting. What would you like to know?`,
        suggestions: ['Check inventory levels', 'Find item location', 'Start cycle count']
      }
    }
    
    if (lowerInput.includes('pick') || lowerInput.includes('order') || lowerInput.includes('fulfill')) {
      return {
        message: `I can help with order fulfillment at ${warehouseName}. I can create pick waves, optimize pick paths, and track order status. What do you need?`,
        suggestions: ['Create pick wave', 'Track orders', 'View pick tasks']
      }
    }
    
    if (lowerInput.includes('receiv') || lowerInput.includes('inbound') || lowerInput.includes('asn')) {
      return {
        message: `I can help with inbound operations at ${warehouseName}. I can process receiving, handle ASNs, and manage putaway tasks. What would you like to do?`,
        suggestions: ['Process receiving', 'View ASNs', 'Create putaway task']
      }
    }
    
    if (lowerInput.includes('ship') || lowerInput.includes('outbound') || lowerInput.includes('pack')) {
      return {
        message: `I can help with outbound operations at ${warehouseName}. I can assist with packing, shipping, and delivery coordination. How can I help?`,
        suggestions: ['View shipments', 'Track deliveries', 'Manage packing']
      }
    }
    
    if (lowerInput.includes('location') || lowerInput.includes('bin') || lowerInput.includes('slot')) {
      return {
        message: `I can help with location management at ${warehouseName}. I can find bin locations, optimize slotting, and manage storage assignments. What do you need?`,
        suggestions: ['Find location', 'View slotting', 'Optimize storage']
      }
    }
  }

  // TMS-specific responses
  if (context === 'tms') {
    if (lowerInput.includes('track') || lowerInput.includes('shipment') || lowerInput.includes('deliver')) {
      return {
        message: 'I can help you track shipments in real-time. I can show you current locations, ETAs, and delivery status. What shipment would you like to track?',
        suggestions: ['Track by ID', 'View all active', 'Check deliveries']
      }
    }
    
    if (lowerInput.includes('route') || lowerInput.includes('optimize') || lowerInput.includes('plan')) {
      return {
        message: 'I can help optimize routes for better fuel efficiency and on-time delivery. I can plan multi-stop routes and suggest carrier assignments.',
        suggestions: ['Plan route', 'Optimize existing', 'View routes']
      }
    }
    
    if (lowerInput.includes('load') || lowerInput.includes('trailer') || lowerInput.includes('cargo')) {
      return {
        message: 'I can help with load planning and optimization. I can assist with 3D load planning, weight distribution, and compliance checking.',
        suggestions: ['Plan load', 'Optimize trailer', 'Check compliance']
      }
    }
    
    if (lowerInput.includes('carrier') || lowerInput.includes('rate') || lowerInput.includes('quote')) {
      return {
        message: 'I can help with carrier management and rate shopping. I can find the best rates, compare carriers, and manage contracts.',
        suggestions: ['Shop rates', 'View carriers', 'Compare quotes']
      }
    }
  }

  // General/fallback response
  const defaultMessage = context === 'wms' 
    ? `I'm Ethan, your warehouse management assistant for ${warehouseName}. I can help with inventory, orders, receiving, and shipping. How can I help you today?`
    : context === 'tms'
    ? 'I\'m Ethan, your transportation management assistant. I can help with tracking, routing, load planning, and carrier management. How can I assist you?'
    : 'I\'m Ethan, your logistics AI assistant. I can help with both warehouse and transportation management. How can I help?'

  return {
    message: defaultMessage,
    suggestions: generateContextualSuggestions(context, warehouseId)
  }
}

export { openai }
export { getWarehouseName }
export { getFallbackResponse }

