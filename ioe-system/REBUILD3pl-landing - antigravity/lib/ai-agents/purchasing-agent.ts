import { generatePurchasingContent, generateContent, AIResponse } from '../ai/google-ai-integration';
import { MockAIService } from '../ai/mock-ai-integration';

export interface PurchasingAgentResponse {
  content: string;
  agentType: 'purchasing';
  timestamp: Date;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
  model: string;
}

export class PurchasingAgent {
  static async generatePurchaseOrder(data: {
    selectedVendor: any;
    items: any[];
    deliveryDetails: any;
    terms: any;
  }, modelId: string = 'gemini-2.0-flash'): Promise<PurchasingAgentResponse> {
    try {
      // Try Google AI first
      const task = 'Generate a professional purchase order';
      const context = { data, taskType: 'PO_GENERATION' };
      const response = await generatePurchasingContent(task, context, modelId);
      
      return {
        content: response.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0, // Google AI pricing is different
        model: response.model
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      
      // Fallback to mock AI
      const mockResponse = await MockAIService.generatePurchaseOrder(data);
      
      return {
        content: mockResponse.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: mockResponse.usage,
        cost: mockResponse.cost,
        model: mockResponse.model
      };
    }
  }

  static async evaluateVendors(data: {
    vendors: any[];
    requirements: any;
    evaluationCriteria: any;
  }, modelId: string = 'gemini-2.0-flash'): Promise<PurchasingAgentResponse> {
    try {
      // Try Google AI first
      const task = 'Evaluate and compare vendors based on requirements';
      const context = { data, taskType: 'SUPPLIER_COMPARISON' };
      const response = await generatePurchasingContent(task, context, modelId);
      
      return {
        content: response.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0, // Google AI pricing is different
        model: response.model
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      
      // Fallback to mock AI
      const mockResponse = await MockAIService.evaluateVendors(data);
      
      return {
        content: mockResponse.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: mockResponse.usage,
        cost: mockResponse.cost,
        model: mockResponse.model
      };
    }
  }

  static async optimizeCosts(data: {
    currentSpend: any;
    vendorContracts: any[];
    marketData: any;
    constraints: any;
  }, modelId: string = 'gemini-2.0-flash'): Promise<PurchasingAgentResponse> {
    try {
      // Try Google AI first
      const task = 'Analyze and optimize costs based on spending data';
      const context = { data, taskType: 'COST_ANALYSIS' };
      const response = await generatePurchasingContent(task, context, modelId);
      
      return {
        content: response.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0, // Google AI pricing is different
        model: response.model
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      
      // Fallback to mock AI
      const mockResponse = await MockAIService.optimizeCosts(data);
      
      return {
        content: mockResponse.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: mockResponse.usage,
        cost: mockResponse.cost,
        model: mockResponse.model
      };
    }
  }

  static async analyzeSpending(data: {
    historicalData: any[];
    categories: string[];
    timeRange: string;
  }): Promise<PurchasingAgentResponse> {
    const prompt = `
You are an AI purchasing analyst. Analyze the following spending data:

Historical Data: ${JSON.stringify(data.historicalData)}
Categories: ${JSON.stringify(data.categories)}
Time Range: ${data.timeRange}

Please provide:
1. Spending trends analysis
2. Category-wise breakdown
3. Anomaly detection
4. Budget optimization recommendations
5. Cost reduction opportunities

Format the response as a detailed spending analysis report.
    `;

    try {
      // Try Google AI first
      const response = await GoogleAIService.generateGeneralResponse(prompt);
      
      return {
        content: response.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: response.usage,
        cost: response.cost,
        model: response.model
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      
      // Fallback to mock AI
      const mockResponse = await MockAIService.generateGeneralResponse(prompt);
      
      return {
        content: mockResponse.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: mockResponse.usage,
        cost: mockResponse.cost,
        model: mockResponse.model
      };
    }
  }

  static async generateSupplierReport(data: {
    supplierId: string;
    supplierData: any;
    performanceMetrics: any;
    contractHistory: any[];
  }): Promise<PurchasingAgentResponse> {
    const prompt = `
You are an AI purchasing analyst. Generate a comprehensive supplier report:

Supplier Data: ${JSON.stringify(data.supplierData)}
Performance Metrics: ${JSON.stringify(data.performanceMetrics)}
Contract History: ${JSON.stringify(data.contractHistory)}

Please provide:
1. Supplier overview and capabilities
2. Performance analysis
3. Risk assessment
4. Contract evaluation
5. Recommendations for future engagement

Format the response as a professional supplier report.
    `;

    try {
      // Try Google AI first
      const response = await GoogleAIService.generateGeneralResponse(prompt);
      
      return {
        content: response.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: response.usage,
        cost: response.cost,
        model: response.model
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      
      // Fallback to mock AI
      const mockResponse = await MockAIService.generateGeneralResponse(prompt);
      
      return {
        content: mockResponse.content,
        agentType: 'purchasing',
        timestamp: new Date(),
        usage: mockResponse.usage,
        cost: mockResponse.cost,
        model: mockResponse.model
      };
    }
  }
}

// Export a default instance for easy importing
export const purchasingAgent = new PurchasingAgent(); 