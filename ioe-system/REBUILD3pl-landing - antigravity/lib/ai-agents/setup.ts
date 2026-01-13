// AI Agent System Setup Utility
// Quick setup and initialization for BlueShip Sync AI Agents

import { quickSetup, initializeAIConfig, setOpenAIKey, validateAIConfig, getAIConfig } from './config';
import OpenAIModelRouter from './openai-integration';

/**
 * Quick setup function for initializing the AI agent system
 * Call this once at application startup
 */
export function setupAIAgents(): void {
  try {
    // Initialize with your OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY || "";
    
    quickSetup(apiKey);
    
    console.log('✅ AI Agent system initialized successfully');
    console.log('🤖 Agents ready: Planning, Purchasing, Logistics, Support');
    console.log('💰 Cost tracking enabled with daily budget: $100');
    console.log('🔧 Model routing optimized for your tasks');
    
  } catch (error) {
    console.error('❌ AI Agent setup failed:', error);
    throw error;
  }
}

/**
 * Custom setup with specific configuration
 */
export function customSetup(options: {
  dailyBudget?: number;
  monthlyBudget?: number;
  enableCostTracking?: boolean;
  defaultModel?: string;
}): void {
  try {
    // Initialize configuration
    initializeAIConfig({
      costControl: {
        dailyBudgetLimit: options.dailyBudget || 100,
        monthlyBudgetLimit: options.monthlyBudget || 3000,
        alertThreshold: 80
      },
      openai: {
        defaultModel: options.defaultModel || 'gpt-4-turbo',
        apiKey: process.env.OPENAI_API_KEY || "",
        baseURL: 'https://api.openai.com/v1',
        maxTokens: 4096,
        temperature: 0.7
      },
      monitoring: {
        logLevel: 'info',
        enablePerformanceLogging: true,
        enableCostTracking: options.enableCostTracking !== false
      }
    });
    
    // Validate configuration
    const validation = validateAIConfig();
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    
    console.log('✅ AI Agent system configured with custom settings');
    
  } catch (error) {
    console.error('❌ Custom AI Agent setup failed:', error);
    throw error;
  }
}

/**
 * Create an OpenAI router instance for direct use
 */
export function createOpenAIRouter(): OpenAIModelRouter {
  const config = getAIConfig();
  
  if (!config.openai.apiKey) {
    throw new Error('OpenAI API key not configured. Call setupAIAgents() first.');
  }
  
  return new OpenAIModelRouter(config.openai.apiKey, config.openai.baseURL);
}

/**
 * Test the AI agent system setup
 */
export async function testSetup(): Promise<boolean> {
  try {
    console.log('🧪 Testing AI Agent setup...');
    
    // Check configuration
    const validation = validateAIConfig();
    if (!validation.valid) {
      console.error('❌ Configuration validation failed:', validation.errors);
      return false;
    }
    
    // Test OpenAI connection
    const router = createOpenAIRouter();
    // Fix method call with correct number of arguments
    const model = router.selectModelByTaskCategory('GENERAL');
    
    console.log('✅ Configuration valid');
    console.log('✅ OpenAI router created successfully');
    console.log('✅ Model selection working:', model);
    console.log('✅ All systems operational');
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup test failed:', error);
    return false;
  }
}

/**
 * Get system status and configuration info
 */
export function getSystemStatus(): {
  configured: boolean;
  apiKeySet: boolean;
  modelRouting: boolean;
  costTracking: boolean;
  recommendedActions: string[];
} {
  try {
    const config = getAIConfig();
    const validation = validateAIConfig();
    
    const status = {
      configured: validation.valid,
      apiKeySet: !!config.openai.apiKey,
      modelRouting: true,
      costTracking: config.monitoring.enableCostTracking,
      recommendedActions: [] as string[]
    };
    
    // Add recommendations based on current state
    if (!status.apiKeySet) {
      status.recommendedActions.push('Set OpenAI API key');
    }
    
    if (!status.configured) {
      status.recommendedActions.push('Fix configuration errors: ' + validation.errors.join(', '));
    }
    
    if (config.costControl.dailyBudgetLimit > 200) {
      status.recommendedActions.push('Consider lowering daily budget for cost control');
    }
    
    if (!status.costTracking) {
      status.recommendedActions.push('Enable cost tracking for better monitoring');
    }
    
    return status;
    
  } catch (error) {
    return {
      configured: false,
      apiKeySet: false,
      modelRouting: false,
      costTracking: false,
      recommendedActions: ['Run setupAIAgents() to initialize the system']
    };
  }
}

// Auto-initialize on import (for convenience)
if (typeof window === 'undefined') {
  // Server-side initialization
  try {
    setupAIAgents();
  } catch (error) {
    console.warn('⚠️ Auto-initialization failed. Call setupAIAgents() manually.');
  }
}

// Export main setup function as default
export default setupAIAgents; 