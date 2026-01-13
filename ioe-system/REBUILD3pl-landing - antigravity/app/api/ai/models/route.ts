import { NextRequest, NextResponse } from 'next/server';
import { getAvailableModels } from '@/lib/ai/google-ai-integration';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching available AI models...');
    
    const models = await getAvailableModels();
    
    console.log('✅ Available models:', models.map(m => `${m.name} (${m.available ? 'available' : 'unavailable'})`));
    
    return NextResponse.json({
      success: true,
      models,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching models:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch models',
      models: [],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 