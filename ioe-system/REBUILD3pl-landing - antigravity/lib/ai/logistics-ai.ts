import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || 'AIzaSyAa3W9DIZBtSktVTotTvisLVbUmOo1xuE8';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface LogisticsAIRequest {
  type: 'load_optimization' | 'route_planning' | 'inventory_query' | 'general_chat' | 'shipment_analysis';
  query: string;
  context?: any;
}

export interface LogisticsAIResponse {
  answer: string;
  suggestions?: string[];
  data?: any;
  model: string;
  tokens?: number;
}

// AI-Powered Load Optimization Assistant
export async function optimizeLoadWithAI(items: any[], vehicle: any): Promise<LogisticsAIResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert logistics AI specializing in load optimization.

VEHICLE:
- Type: ${vehicle.name}
- Dimensions: ${vehicle.length}m × ${vehicle.width}m × ${vehicle.height}m
- Max Weight: ${vehicle.maxWeight} kg

ITEMS TO LOAD:
${items.map((item, i) => `
${i + 1}. ${item.name}
   - Dimensions: ${item.length}m × ${item.width}m × ${item.height}m
   - Weight: ${item.weight} kg
   - Quantity: ${item.quantity}
   - Stackable: ${item.stackable ? 'Yes' : 'No'}
   - Fragile: ${item.fragile ? 'Yes' : 'No'}
`).join('\n')}

TASK: Provide an optimal loading plan with:
1. Loading sequence (which items to load first)
2. Positioning strategy (how to arrange items)
3. Weight distribution tips
4. Space optimization suggestions
5. Safety recommendations

Provide a clear, actionable plan in JSON format:
{
  "loadingSequence": ["item1", "item2", ...],
  "positioning": "description of positioning strategy",
  "tips": ["tip1", "tip2", ...],
  "estimatedUtilization": {
    "volume": percentage,
    "weight": percentage
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      model: 'gemini-2.0-flash',
      tokens: result.response.usageMetadata?.totalTokenCount
    };
  } catch (error) {
    console.error('AI Load Optimization Error:', error);
    return {
      answer: 'Error optimizing load. Using fallback algorithm.',
      model: 'gemini-2.0-flash',
      data: { error: true }
    };
  }
}

// AI-Powered Route Planning
export async function planRouteWithAI(origin: string, destination: string, stops: string[]): Promise<LogisticsAIResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert logistics AI specializing in route optimization.

ROUTE PLANNING REQUEST:
- Origin: ${origin}
- Destination: ${destination}
- Stops: ${stops.join(', ')}

Provide an optimal route plan with:
1. Best sequence of stops
2. Estimated distance and time
3. Fuel efficiency tips
4. Traffic considerations
5. Alternative routes

Respond in JSON format:
{
  "optimizedRoute": ["stop1", "stop2", ...],
  "estimatedDistance": "miles",
  "estimatedTime": "hours",
  "fuelCost": "estimated USD",
  "tips": ["tip1", "tip2", ...]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      model: 'gemini-2.0-flash',
      tokens: result.response.usageMetadata?.totalTokenCount
    };
  } catch (error) {
    console.error('AI Route Planning Error:', error);
    return {
      answer: 'Error planning route.',
      model: 'gemini-2.0-flash'
    };
  }
}

// AI Copilot - Natural Language Queries
export async function askLogisticsAI(query: string, context?: any): Promise<LogisticsAIResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemContext = context ? `\n\nCONTEXT:\n${JSON.stringify(context, null, 2)}` : '';

  const prompt = `You are an AI assistant for a Transportation Management System (TMS) and Warehouse Management System (WMS).

USER QUERY: ${query}${systemContext}

Provide a helpful, accurate response. If the query involves:
- Load optimization: Give specific loading advice
- Route planning: Suggest optimal routes
- Inventory: Analyze stock levels
- Shipments: Track or analyze shipments
- Costs: Calculate or estimate costs
- General questions: Provide clear logistics guidance

Be concise but thorough. Use professional logistics terminology.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      model: 'gemini-2.0-flash',
      tokens: result.response.usageMetadata?.totalTokenCount
    };
  } catch (error) {
    console.error('AI Copilot Error:', error);
    return {
      answer: 'I apologize, but I encountered an error. Please try rephrasing your question.',
      model: 'gemini-2.0-flash'
    };
  }
}

// AI-Powered Shipment Analysis
export async function analyzeShipmentWithAI(shipmentData: any): Promise<LogisticsAIResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an AI logistics analyst. Analyze this shipment:

SHIPMENT DATA:
${JSON.stringify(shipmentData, null, 2)}

Provide analysis including:
1. Estimated delivery time
2. Potential delays or issues
3. Cost optimization opportunities
4. Route efficiency
5. Recommendations

Respond in a clear, actionable format.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      model: 'gemini-2.0-flash',
      tokens: result.response.usageMetadata?.totalTokenCount
    };
  } catch (error) {
    console.error('AI Shipment Analysis Error:', error);
    return {
      answer: 'Error analyzing shipment.',
      model: 'gemini-2.0-flash'
    };
  }
}

// AI-Powered Container/Vessel Insights
export async function analyzeContainerWithAI(vesselData: any, purchaseOrder?: any): Promise<LogisticsAIResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an AI maritime logistics expert. Analyze this container shipment:

VESSEL: ${vesselData.name}
ROUTE: ${vesselData.origin} → ${vesselData.destination}
ETA: ${vesselData.eta}
CURRENT STATUS: ${vesselData.navigationStatus}
SPEED: ${vesselData.speed} knots
${purchaseOrder ? `\nPURCHASE ORDER: ${purchaseOrder.poNumber}\nValue: $${purchaseOrder.totalValue}\nSupplier: ${purchaseOrder.supplier}` : ''}

Provide insights on:
1. On-time delivery probability
2. Potential delays or risks
3. Cost optimization suggestions
4. Customs preparation advice
5. Next actions

Be specific and actionable.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      answer: text,
      model: 'gemini-2.0-flash',
      tokens: result.response.usageMetadata?.totalTokenCount
    };
  } catch (error) {
    console.error('AI Container Analysis Error:', error);
    return {
      answer: 'Error analyzing container.',
      model: 'gemini-2.0-flash'
    };
  }
}

