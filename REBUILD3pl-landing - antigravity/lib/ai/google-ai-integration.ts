import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.warn('Warning: GOOGLE_AI_API_KEY is not set. AI features will fail or return mock responses.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Available Gemini models
export const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest and fastest model' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'High-performance model' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient model' },
  { id: 'gemini-pro', name: 'Gemini Pro', description: 'Standard model' }
];

// Default model
const DEFAULT_MODEL = 'gemini-2.0-flash';

export interface AIResponse {
  content: string;
  model: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  error?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  available: boolean;
}

// Get available models
export async function getAvailableModels(): Promise<AIModel[]> {
  try {
    const models: AIModel[] = [];

    if (!genAI) {
      return GEMINI_MODELS.map(model => ({ ...model, available: false }));
    }

    for (const modelInfo of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelInfo.id });
        // Test if model is available by making a simple request
        const result = await model.generateContent('test');
        await result.response;

        models.push({
          ...modelInfo,
          available: true
        });
      } catch (error) {
        models.push({
          ...modelInfo,
          available: false
        });
      }
    }

    return models;
  } catch (error) {
    console.error('Error getting available models:', error);
    return GEMINI_MODELS.map(model => ({ ...model, available: false }));
  }
}

// Generate content with specified model
export async function generateContent(prompt: string, modelId: string = DEFAULT_MODEL): Promise<AIResponse> {
  try {
    console.log(`🤖 Using model: ${modelId}`);

    if (!genAI) {
      throw new Error('Google AI API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: modelId });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      model: modelId,
      tokens: {
        prompt: result.response.usageMetadata?.promptTokenCount || 0,
        completion: result.response.usageMetadata?.candidatesTokenCount || 0,
        total: result.response.usageMetadata?.totalTokenCount || 0
      }
    };
  } catch (error) {
    console.error('Error generating content with Google AI:', error);

    // Fallback to default model if specified model fails
    if (modelId !== DEFAULT_MODEL && genAI) {
      console.log(`🔄 Falling back to default model: ${DEFAULT_MODEL}`);
      return generateContent(prompt, DEFAULT_MODEL);
    }

    return {
      content: 'Sorry, I encountered an error processing your request. Please try again.',
      model: modelId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate content for purchasing tasks
export async function generatePurchasingContent(task: string, context: any, modelId: string = DEFAULT_MODEL): Promise<AIResponse> {
  const prompt = `You are an AI purchasing agent. Please help with the following task:

Task: ${task}

Context: ${JSON.stringify(context, null, 2)}

Please provide a professional, concise response that includes:
1. Analysis of the situation
2. Recommendations or solutions
3. Next steps if applicable

Keep the response focused and actionable.`;

  return generateContent(prompt, modelId);
}

// Generate content for planning tasks
export async function generatePlanningContent(task: string, context: any, modelId: string = DEFAULT_MODEL): Promise<AIResponse> {
  const prompt = `You are an AI supply chain planning agent. Please help with the following task:

Task: ${task}

Context: ${JSON.stringify(context, null, 2)}

Please provide a detailed, data-driven response that includes:
1. Forecast analysis or optimization strategy
2. Risk assessment (stockouts, overstock)
3. Actionable recommendations
4. Confidence level in the prediction

Keep the response focused on operational efficiency and inventory health.`;

  return generateContent(prompt, modelId);
} 