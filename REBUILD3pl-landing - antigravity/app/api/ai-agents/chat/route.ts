import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkInventory, bookTruck } from '@/lib/ai-tools';

// Cache the AI instance for better performance
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

function getModel() {
  // Check for API key in multiple possible environment variable names
  const apiKey = process.env.GEMINI_API_KEY 
    || process.env.GOOGLE_API_KEY 
    || process.env.GOOGLE_AI_API_KEY 
    || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
    || '';
  
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_AI_API_KEY in your .env file.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  if (!model) {
    // Use gemini-2.0-flash for faster responses (latest and fastest model)
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'You are Ethan, a helpful logistics assistant. Be concise and helpful. When users ask to check inventory or book trucks, use the appropriate function.',
    });
  }
  return model;
}

const tools = {
  checkInventory,
  bookTruck,
};

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    // Limit history to last 10 messages to reduce payload and improve speed
    const recentHistory = history.slice(-10);

    const modelInstance = getModel();
    const chat = modelInstance.startChat({
      history: recentHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      tools: [
        {
          functionDeclarations: [
            {
              name: 'checkInventory',
              description: 'Checks inventory stock levels for a given SKU across all warehouses.',
              parameters: {
                type: 'OBJECT',
                properties: {
                  sku: {
                    type: 'STRING',
                    description: 'The SKU code to check (e.g., SKU001, SKU002).',
                  },
                },
                required: ['sku'],
              },
            },
            {
              name: 'bookTruck',
              description: 'Books a truck for shipping. Use this when user asks to book, schedule, or arrange transportation.',
              parameters: {
                type: 'OBJECT',
                properties: {
                  shipmentDetails: {
                    type: 'OBJECT',
                    properties: {
                      origin: { type: 'STRING', description: 'Pickup location' },
                      destination: { type: 'STRING', description: 'Delivery location' },
                      weight: { type: 'NUMBER', description: 'Weight in pounds' },
                      date: { type: 'STRING', description: 'Preferred shipping date' },
                    },
                    required: ['origin', 'destination'],
                  },
                },
                required: ['shipmentDetails'],
              },
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const call = result.response.functionCalls()?.[0];

    if (call) {
      const { name, args } = call;
      // Execute tool quickly
      // @ts-ignore
      const toolResult = await tools[name](args);
      
      // Generate final response with tool result (use proper function response format)
      const finalResponse = await chat.sendMessage([
        {
          functionResponse: {
            name: call.name,
            response: toolResult,
          },
        },
      ]);

      return NextResponse.json({
        message: finalResponse.response.text(),
        toolCall: { name, args },
        toolResult: toolResult,
      });
    }

    return NextResponse.json({ message: result.response.text() });
  } catch (error: any) {
    console.error('AI Chat API error:', error);
    
    // Check if it's an API key error
    if (error?.message?.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'API Key Missing',
          message: 'Gemini API key is not configured. Please add GEMINI_API_KEY or GOOGLE_API_KEY to your .env file. Get your key at: https://aistudio.google.com/app/apikey',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Sorry, I encountered an error. Please try again.',
      },
      { status: 500 }
    );
  }
}
