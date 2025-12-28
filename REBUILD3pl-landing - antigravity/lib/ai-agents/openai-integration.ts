// OpenAI Integration with Intelligent Model Routing for BlueShip Sync AI Agents

import { 
  OpenAIModel, 
  ModelSelectionCriteria, 
  ModelSelectionResult, 
  OpenAIRequest, 
  OpenAIResponse,
  TaskType,
  ChatMessage,
  OpenAIFunction
} from './types';

// Re-export OpenAIModel for external use
export { OpenAIModel } from './types';

interface ModelCapabilities {
  maxTokens: number;
  costPer1KTokens: number;
  averageResponseTime: number;
  qualityScore: number;
  specialties: TaskType[];
  contextWindow: number;
  speed: 'fast' | 'medium' | 'slow';
  accuracy: 'medium' | 'high' | 'highest';
  tasks: string[];
}

// Enhanced model configuration based on user specifications
const MODEL_SPECIFICATIONS: Record<OpenAIModel, ModelCapabilities> = {
  [OpenAIModel.GPT_4]: {
    maxTokens: 8192,
    costPer1KTokens: 0.06, // Highest cost for critical decisions
    averageResponseTime: 4000, // Slower but most accurate
    qualityScore: 98, // Highest accuracy
    specialties: [
      TaskType.RISK_ASSESSMENT,
      TaskType.CONTRACT_ANALYSIS,
      TaskType.SUPPLIER_EVALUATION,
      TaskType.ESCALATION_HANDLING
    ],
    contextWindow: 8192,
    speed: 'slow',
    accuracy: 'highest',
    tasks: ['critical-decisions', 'complex-reasoning']
  },
  [OpenAIModel.GPT_4_TURBO]: {
    maxTokens: 4096,
    costPer1KTokens: 0.03, // Medium cost for complex analysis
    averageResponseTime: 2000, // Medium speed
    qualityScore: 92, // High accuracy
    specialties: [
      TaskType.ROUTE_OPTIMIZATION,
      TaskType.INVENTORY_OPTIMIZATION,
      TaskType.PO_GENERATION,
      TaskType.DEMAND_FORECAST
    ],
    contextWindow: 128000,
    speed: 'medium',
    accuracy: 'high',
    tasks: ['complex-analysis', 'strategic-planning']
  },
  [OpenAIModel.GPT_4_VISION]: {
    maxTokens: 4096,
    costPer1KTokens: 0.03,
    averageResponseTime: 2500,
    qualityScore: 90,
    specialties: [
      TaskType.PERFORMANCE_MONITORING,
      TaskType.SHIPMENT_TRACKING
    ],
    contextWindow: 128000,
    speed: 'medium',
    accuracy: 'high',
    tasks: ['visual-analysis', 'document-processing']
  },
  [OpenAIModel.GPT_3_5_TURBO]: {
    maxTokens: 4096,
    costPer1KTokens: 0.002, // Lowest cost for routine operations
    averageResponseTime: 800, // Fastest response
    qualityScore: 85, // Medium accuracy
    specialties: [
      TaskType.CHAT_RESPONSE,
      TaskType.TICKET_CLASSIFICATION,
      TaskType.COST_ANALYSIS,
      TaskType.SUPPLIER_COMPARISON
    ],
    contextWindow: 16385,
    speed: 'fast',
    accuracy: 'medium',
    tasks: ['routine-operations', 'quick-responses']
  },
  [OpenAIModel.GPT_3_5_TURBO_16K]: {
    maxTokens: 16384,
    costPer1KTokens: 0.004,
    averageResponseTime: 1200,
    qualityScore: 85,
    specialties: [
      TaskType.RFP_GENERATION,
      TaskType.KNOWLEDGE_BASE_QUERY,
      TaskType.SUPPLY_PLANNING
    ],
    contextWindow: 16385,
    speed: 'fast',
    accuracy: 'medium',
    tasks: ['routine-operations', 'document-generation']
  }
};

export default class OpenAIModelRouter {
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private metrics: Map<string, ModelMetrics> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeMetrics();
  }

  /**
   * Intelligently select the best OpenAI model based on task requirements
   * Enhanced with speed, cost, and accuracy optimization
   */
  selectModel(criteria: ModelSelectionCriteria): ModelSelectionResult {
    const {
      taskType,
      complexityScore,
      tokenEstimate,
      responseTimeRequirement,
      costBudget,
      qualityRequirement
    } = criteria;

    const candidates = this.getModelCandidates(taskType, tokenEstimate);
    const scores = candidates.map(model => {
      const spec = MODEL_SPECIFICATIONS[model];
      
      // Calculate various scoring factors
      const qualityScore = this.calculateQualityScore(spec, taskType, complexityScore);
      const speedScore = this.calculateSpeedScore(spec.averageResponseTime, responseTimeRequirement);
      const costScore = this.calculateCostScore(spec.costPer1KTokens, tokenEstimate, costBudget);
      const specialtyScore = this.calculateSpecialtyScore(spec.specialties, taskType);
      
      // Weight scores based on quality requirement
      let weightedScore: number;
      switch (qualityRequirement) {
        case 'fast':
          weightedScore = speedScore * 0.5 + costScore * 0.3 + qualityScore * 0.15 + specialtyScore * 0.05;
          break;
        case 'balanced':
          weightedScore = speedScore * 0.25 + costScore * 0.25 + qualityScore * 0.35 + specialtyScore * 0.15;
          break;
        case 'quality':
          weightedScore = speedScore * 0.1 + costScore * 0.15 + qualityScore * 0.6 + specialtyScore * 0.15;
          break;
        default:
          weightedScore = speedScore * 0.25 + costScore * 0.25 + qualityScore * 0.35 + specialtyScore * 0.15;
      }

      return {
        model,
        score: weightedScore,
        qualityScore,
        speedScore,
        costScore,
        specialtyScore
      };
    });

    // Sort by score and select the best
    scores.sort((a, b) => b.score - a.score);
    const bestModel = scores[0];
    const fallbackModel = scores[1]?.model;

    const selectedSpec = MODEL_SPECIFICATIONS[bestModel.model];
    const estimatedCost = this.calculateEstimatedCost(selectedSpec.costPer1KTokens, tokenEstimate);

    return {
      selectedModel: bestModel.model,
      reasoning: this.generateSelectionReasoning(bestModel, criteria),
      estimatedCost,
      estimatedResponseTime: selectedSpec.averageResponseTime,
      fallbackModel
    };
  }

  /**
   * Execute OpenAI API request with automatic retries and fallback
   */
  async executeRequest(
    request: OpenAIRequest, 
    retryCount = 3,
    fallbackModel?: OpenAIModel
  ): Promise<OpenAIResponse> {
    let currentModel = request.model;
    let attempts = 0;

    while (attempts <= retryCount) {
      try {
        const response = await this.makeAPICall(currentModel, request);
        
        // Track usage
        this.trackUsage(currentModel, response.usage.totalTokens, 1);
        
        return response;
      } catch (error) {
        attempts++;
        
        if (attempts <= retryCount) {
          // Try fallback model if available
          if (fallbackModel && attempts === 1) {
            currentModel = fallbackModel;
            console.warn(`Switching to fallback model ${fallbackModel} after error:`, error);
            continue;
          }
          
          // Wait before retry with exponential backoff
          await this.sleep(Math.pow(2, attempts) * 1000);
          console.warn(`Retrying OpenAI request (attempt ${attempts}/${retryCount}):`, error);
        } else {
          throw new Error(`OpenAI request failed after ${retryCount} retries: ${error}`);
        }
      }
    }

    throw new Error('OpenAI request failed - should not reach here');
  }

  /**
   * Enhanced request execution with caching, streaming, and advanced error handling
   */
  async executeEnhancedRequest(
    request: OpenAIRequest, 
    options: {
      enableCache?: boolean;
      cacheTimeoutMs?: number;
      enableStreaming?: boolean;
      onStreamChunk?: (chunk: string) => void;
      retryCount?: number;
      fallbackModel?: OpenAIModel;
      enableFunctionCalling?: boolean;
      functions?: OpenAIFunction[];
    } = {}
  ): Promise<OpenAIResponse> {
    const {
      enableCache = true,
      cacheTimeoutMs = 300000, // 5 minutes default
      enableStreaming = false,
      onStreamChunk,
      retryCount = 3,
      fallbackModel,
      enableFunctionCalling = false,
      functions = []
    } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    if (enableCache && this.isCacheValid(cacheKey)) {
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        return { ...cachedResponse, cached: true };
      }
    }

    // Rate limit check
    if (this.isRateLimited(request.model)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      // Prepare enhanced request
      const enhancedRequest = {
        ...request,
        stream: enableStreaming,
        functions: enableFunctionCalling ? functions : undefined,
        function_call: enableFunctionCalling ? 'auto' : undefined
      };

      const response = await this.executeRequest(
        enhancedRequest, 
        retryCount, 
        fallbackModel
      );

      // Update metrics
      this.updateMetrics(request.model, response);

      // Cache successful response
      if (enableCache && response && response.choices && response.choices.length > 0) {
        this.cache.set(cacheKey, response);
        this.cacheExpiry.set(cacheKey, Date.now() + cacheTimeoutMs);
      }

      return response;

    } catch (error) {
      this.updateErrorMetrics(request.model, error);
      throw error;
    }
  }

  /**
   * Streaming response handler
   */
  private async executeStreamingRequest(
    request: any,
    onStreamChunk?: (chunk: string) => void
  ): Promise<OpenAIResponse> {
    return new Promise((resolve, reject) => {
      let fullContent = '';
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      // Simulated streaming (in real implementation, use OpenAI streaming API)
      const simulateStreaming = async () => {
        try {
          const response = await this.makeAPICall(request);
          const content = response.choices[0].message.content;
          
          // Simulate chunk delivery
          const chunks = content.split(' ');
          for (const chunk of chunks) {
            fullContent += chunk + ' ';
            if (onStreamChunk) {
              onStreamChunk(chunk + ' ');
            }
            // Small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          resolve({
            choices: [{
              message: { content: fullContent.trim() },
              finishReason: 'stop'
            }],
            usage: response.usage,
            cached: false,
            success: true
          });
        } catch (error) {
          reject(error);
        }
      };

      simulateStreaming();
    });
  }

  /**
   * Function calling capabilities
   */
  async executeFunctionCall(
    request: OpenAIRequest,
    functions: OpenAIFunction[],
    maxIterations: number = 5
  ): Promise<{ response: OpenAIResponse; functionCalls: any[] }> {
    const functionCalls: any[] = [];
    let currentRequest = {
      ...request,
      functions,
      function_call: 'auto' as const
    };

    for (let i = 0; i < maxIterations; i++) {
      const response = await this.executeRequest(currentRequest, 1);
      
      if (response.choices[0].message.function_call) {
        const functionCall = response.choices[0].message.function_call;
        functionCalls.push(functionCall);

        // Execute the function (this would be implemented based on your function definitions)
        const functionResult = await this.executeFunctionHandler(functionCall);

        // Add function result to conversation
        currentRequest.messages.push({
          role: 'function',
          name: functionCall.name,
          content: JSON.stringify(functionResult)
        });
      } else {
        // No more function calls needed
        return { response, functionCalls };
      }
    }

    throw new Error('Maximum function call iterations exceeded');
  }

  /**
   * Batch processing for multiple requests
   */
  async executeBatch(
    requests: OpenAIRequest[],
    options: {
      maxConcurrency?: number;
      enableCache?: boolean;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<OpenAIResponse[]> {
    const { maxConcurrency = 5, enableCache = true, onProgress } = options;
    const results: OpenAIResponse[] = [];
    let completed = 0;

    // Process requests in batches
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      const batch = requests.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (request, index) => {
        try {
          const response = await this.executeEnhancedRequest(request, { enableCache });
          if (onProgress) {
            completed++;
            onProgress(completed, requests.length);
          }
          return response;
        } catch (error) {
          console.error(`Batch request ${i + index} failed:`, error);
          return {
            choices: [{ message: { content: '' }, finishReason: 'error' }],
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            cached: false,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Advanced model selection with performance feedback
   */
  selectOptimalModel(criteria: {
    taskType: TaskType;
    performanceHistory?: boolean;
    costBudget?: number;
    timeConstraint?: number;
    qualityThreshold?: number;
  }): ModelSelectionResult {
    const { taskType, performanceHistory = true, costBudget, timeConstraint, qualityThreshold } = criteria;

    // Get performance history if enabled
    const performanceData = performanceHistory ? this.getPerformanceHistory(taskType) : null;

    // Enhanced selection logic considering real performance data
    let candidates: OpenAIModel[] = Object.values(OpenAIModel);

    // Filter by cost budget
    if (costBudget) {
      candidates = candidates.filter(model => {
        const modelConfig = MODEL_SPECIFICATIONS[model];
        return modelConfig.costPer1KTokens <= costBudget / 1000;
      });
    }

    // Filter by time constraint
    if (timeConstraint) {
      candidates = candidates.filter(model => {
        const modelConfig = MODEL_SPECIFICATIONS[model];
        const avgTime = performanceData?.[model]?.averageResponseTime || modelConfig.averageResponseTime;
        return avgTime <= timeConstraint;
      });
    }

    // Filter by quality threshold
    if (qualityThreshold) {
      candidates = candidates.filter(model => {
        const modelConfig = MODEL_SPECIFICATIONS[model];
        const quality = performanceData?.[model]?.qualityScore || modelConfig.qualityScore;
        return quality >= qualityThreshold;
      });
    }

    if (candidates.length === 0) {
      candidates = [OpenAIModel.GPT_3_5_TURBO]; // Fallback
    }

    // Select best candidate based on weighted scoring
    const scored = candidates.map(model => {
      const config = MODEL_SPECIFICATIONS[model];
      const perf = performanceData?.[model];
      
      const score = this.calculateModelScore(config, perf, criteria);
      return { model, score, config };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0];

    return {
      selectedModel: selected.model,
      fallbackModel: scored[1]?.model || OpenAIModel.GPT_3_5_TURBO,
      reasoning: `Selected ${selected.model} based on weighted performance score: ${selected.score.toFixed(2)}`,
      estimatedCost: selected.config.costPer1KTokens,
      estimatedResponseTime: selected.config.averageResponseTime,
      confidenceScore: selected.score / 100
    };
  }

  /**
   * Get usage statistics for monitoring and cost control
   */
  getUsageStatistics(): Record<OpenAIModel, { tokens: number; requests: number; cost: number }> {
    const stats: Record<string, any> = {};
    this.usageTracking.forEach((usage, model) => {
      stats[model] = { ...usage };
    });
    return stats;
  }

  /**
   * Reset usage tracking (typically called daily)
   */
  resetUsageTracking(): void {
    this.usageTracking.forEach((usage, model) => {
      this.usageTracking.set(model, { tokens: 0, requests: 0, cost: 0 });
    });
  }

  // Private helper methods
  private getModelCandidates(taskType: TaskType, tokenEstimate: number): OpenAIModel[] {
    return Object.entries(MODEL_SPECIFICATIONS)
      .filter(([_, spec]) => spec.maxTokens >= tokenEstimate)
      .map(([model, _]) => model as OpenAIModel);
  }

  private calculateQualityScore(spec: ModelCapabilities, taskType: TaskType, complexityScore: number): number {
    const baseQuality = spec.qualityScore / 100;
    const complexityBonus = complexityScore > 0.7 ? 0.1 : 0;
    const specialtyBonus = spec.specialties.includes(taskType) ? 0.15 : 0;
    
    return Math.min(1.0, baseQuality + complexityBonus + specialtyBonus);
  }

  private calculateSpeedScore(responseTime: number, requirement: number): number {
    if (responseTime <= requirement) return 1.0;
    return Math.max(0.1, requirement / responseTime);
  }

  private calculateCostScore(costPer1K: number, tokenEstimate: number, budget?: number): number {
    const estimatedCost = this.calculateEstimatedCost(costPer1K, tokenEstimate);
    
    if (!budget) {
      // Prefer lower cost when no budget constraint
      const maxCost = 0.1; // $0.10 as reasonable max
      return Math.max(0.1, (maxCost - estimatedCost) / maxCost);
    }
    
    if (estimatedCost <= budget) return 1.0;
    return Math.max(0.1, budget / estimatedCost);
  }

  private calculateSpecialtyScore(specialties: TaskType[], taskType: TaskType): number {
    return specialties.includes(taskType) ? 1.0 : 0.5;
  }

  private calculateEstimatedCost(costPer1K: number, tokenEstimate: number): number {
    return (tokenEstimate / 1000) * costPer1K;
  }

  private generateSelectionReasoning(
    bestModel: any, 
    criteria: ModelSelectionCriteria
  ): string {
    const factors = [];
    
    if (bestModel.specialtyScore === 1.0) {
      factors.push(`specialized for ${criteria.taskType}`);
    }
    
    if (bestModel.qualityScore > 0.8) {
      factors.push('high quality output');
    }
    
    if (bestModel.speedScore > 0.8) {
      factors.push('fast response time');
    }
    
    if (bestModel.costScore > 0.8) {
      factors.push('cost-effective');
    }

    return `Selected based on: ${factors.join(', ')}. Overall score: ${bestModel.score.toFixed(2)}`;
  }

  private async makeAPICall(model: OpenAIModel, request: OpenAIRequest): Promise<OpenAIResponse> {
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const payload = {
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 1000,
      top_p: request.topP ?? 1,
      frequency_penalty: request.frequencyPenalty ?? 0,
      presence_penalty: request.presencePenalty ?? 0,
      ...(request.functions && { functions: request.functions }),
      ...(request.functionCall && { function_call: request.functionCall })
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  }

  private trackUsage(model: OpenAIModel, tokens: number, requests: number): void {
    const current = this.usageTracking.get(model) || { tokens: 0, requests: 0, cost: 0 };
    const spec = MODEL_SPECIFICATIONS[model];
    const cost = this.calculateEstimatedCost(spec.costPer1KTokens, tokens);
    
    this.usageTracking.set(model, {
      tokens: current.tokens + tokens,
      requests: current.requests + requests,
      cost: current.cost + cost
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateCacheKey(request: OpenAIRequest): string {
    const key = JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      maxTokens: request.maxTokens
    });
    return btoa(key).substring(0, 32); // Base64 encode and truncate
  }

  private isCacheValid(cacheKey: string): boolean {
    const expiry = this.cacheExpiry.get(cacheKey);
    return expiry !== undefined && Date.now() < expiry;
  }

  private isRateLimited(model: OpenAIModel): boolean {
    const limit = this.rateLimits.get(model);
    if (!limit) return false;
    
    return Date.now() < limit.resetTime && limit.count >= 60; // 60 RPM limit
  }

  private updateMetrics(model: OpenAIModel, response: OpenAIResponse): void {
    const existing = this.metrics.get(model) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      lastUsed: Date.now()
    };

    existing.totalRequests++;
    if (response.success) {
      existing.successfulRequests++;
    }
    existing.totalTokens += response.usage.totalTokens;
    existing.totalCost += this.calculateCost(response.usage.totalTokens, model);
    existing.lastUsed = Date.now();

    this.metrics.set(model, existing);
  }

  private updateErrorMetrics(model: OpenAIModel, error: any): void {
    const existing = this.metrics.get(model) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      lastUsed: Date.now()
    };

    existing.totalRequests++;
    existing.failedRequests++;
    existing.lastUsed = Date.now();

    this.metrics.set(model, existing);
  }

  private calculateModelScore(
    config: ModelCapabilities, 
    performance: any, 
    criteria: any
  ): number {
    let score = 0;
    
    // Quality weight (40%)
    score += (config.qualityScore / 100) * 40;
    
    // Speed weight (30%)
    const speedScore = config.speed === 'fast' ? 100 : config.speed === 'medium' ? 70 : 40;
    score += (speedScore / 100) * 30;
    
    // Cost efficiency weight (20%)
    const costScore = Math.max(0, 100 - (config.costPer1KTokens * 1000));
    score += (costScore / 100) * 20;
    
    // Task specialty weight (10%)
    const specialtyBonus = config.specialties.includes(criteria.taskType) ? 10 : 0;
    score += specialtyBonus;

    return score;
  }

  private getPerformanceHistory(taskType: TaskType): Record<string, any> | null {
    // This would retrieve actual performance data from database/cache
    // For now, return null to use default specifications
    return null;
  }

  private async executeFunctionHandler(functionCall: any): Promise<any> {
    // This would implement actual function execution
    // For now, return a mock result
    return { status: 'success', result: `Executed ${functionCall.name}` };
  }

  private calculateCost(tokens: number, model: OpenAIModel): number {
    const config = MODEL_SPECIFICATIONS[model];
    return (tokens / 1000) * config.costPer1KTokens;
  }

  private initializeMetrics(): void {
    for (const model of Object.values(OpenAIModel)) {
      this.metrics.set(model, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        lastUsed: 0
      });
    }
  }

  /**
   * Get comprehensive analytics and metrics
   */
  getAnalytics(): {
    modelUsage: Record<string, ModelMetrics>;
    totalCost: number;
    totalRequests: number;
    averageSuccessRate: number;
    recommendations: string[];
  } {
    const modelUsage: Record<string, ModelMetrics> = {};
    let totalCost = 0;
    let totalRequests = 0;
    let totalSuccess = 0;

    for (const [model, metrics] of this.metrics.entries()) {
      modelUsage[model] = metrics;
      totalCost += metrics.totalCost;
      totalRequests += metrics.totalRequests;
      totalSuccess += metrics.successfulRequests;
    }

    const averageSuccessRate = totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageSuccessRate < 95) {
      recommendations.push('Consider implementing more robust error handling');
    }
    if (totalCost > 100) {
      recommendations.push('Monitor API costs - consider optimizing model selection');
    }

    return {
      modelUsage,
      totalCost,
      totalRequests,
      averageSuccessRate,
      recommendations
    };
  }

  // Add missing methods to OpenAIModelRouter class
  async executeRequestWithRetry(request: any, maxRetries: number = 3): Promise<any> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeRequest(request);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError;
  }

  selectModelByTaskCategory(
    taskCategory: string, 
    prioritizeSpeed?: boolean, 
    costBudget?: number
  ): string {
    const modelMap: Record<string, string> = {
      'ANALYTICS': 'gpt-4',
      'OPTIMIZATION': 'gpt-4',
      'NLP': 'gpt-3.5-turbo',
      'GENERAL': 'gpt-4'
    };
    
    return modelMap[taskCategory] || 'gpt-4';
  }
}

interface ModelMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  lastUsed: number;
}

// Factory function to create pre-configured functions for different agent types
export function createOpenAIFunctions(agentType: string): OpenAIFunction[] {
  const commonFunctions: OpenAIFunction[] = [
    {
      name: 'log_decision',
      description: 'Log important decisions and reasoning for audit trail',
      parameters: {
        type: 'object',
        properties: {
          decision: { type: 'string', description: 'The decision made' },
          reasoning: { type: 'string', description: 'Reasoning behind the decision' },
          confidence: { type: 'number', description: 'Confidence level (0-1)' },
          alternatives: { type: 'array', items: { type: 'string' }, description: 'Alternative options considered' }
        },
        required: ['decision', 'reasoning', 'confidence']
      }
    }
  ];

  const agentSpecificFunctions: Record<string, OpenAIFunction[]> = {
    planning: [
      {
        name: 'generate_forecast',
        description: 'Generate demand forecast with confidence intervals',
        parameters: {
          type: 'object',
          properties: {
            periods: { type: 'array', items: { type: 'object' } },
            methodology: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          },
          required: ['periods', 'methodology']
        }
      },
      {
        name: 'optimize_inventory',
        description: 'Calculate optimal inventory levels',
        parameters: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object' } },
            constraints: { type: 'object' },
            optimization_goals: { type: 'array', items: { type: 'string' } }
          },
          required: ['items', 'constraints']
        }
      }
    ],
    
    purchasing: [
      {
        name: 'create_purchase_order',
        description: 'Create a new purchase order',
        parameters: {
          type: 'object',
          properties: {
            supplier: { type: 'string' },
            items: { type: 'array', items: { type: 'object' } },
            total_amount: { type: 'number' },
            delivery_date: { type: 'string' },
            terms: { type: 'string' }
          },
          required: ['supplier', 'items', 'total_amount']
        }
      },
      {
        name: 'compare_suppliers',
        description: 'Compare suppliers across multiple criteria',
        parameters: {
          type: 'object',
          properties: {
            suppliers: { type: 'array', items: { type: 'object' } },
            criteria: { type: 'array', items: { type: 'string' } },
            weights: { type: 'object' }
          },
          required: ['suppliers', 'criteria']
        }
      }
    ],
    
    logistics: [
      {
        name: 'optimize_route',
        description: 'Optimize delivery route',
        parameters: {
          type: 'object',
          properties: {
            stops: { type: 'array', items: { type: 'object' } },
            vehicle_type: { type: 'string' },
            constraints: { type: 'object' }
          },
          required: ['stops', 'vehicle_type']
        }
      },
      {
        name: 'select_carrier',
        description: 'Select optimal carrier for shipment',
        parameters: {
          type: 'object',
          properties: {
            shipment_details: { type: 'object' },
            available_carriers: { type: 'array', items: { type: 'object' } },
            selection_criteria: { type: 'object' }
          },
          required: ['shipment_details', 'available_carriers']
        }
      }
    ],
    
    support: [
      {
        name: 'classify_ticket',
        description: 'Classify support ticket',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            priority: { type: 'string' },
            estimated_resolution_time: { type: 'number' },
            assigned_team: { type: 'string' }
          },
          required: ['category', 'priority']
        }
      },
      {
        name: 'escalate_issue',
        description: 'Escalate issue to higher support tier',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
            target_tier: { type: 'string' },
            context: { type: 'object' }
          },
          required: ['reason', 'target_tier']
        }
      }
    ]
  };

  return [...commonFunctions, ...(agentSpecificFunctions[agentType] || [])];
}

// Utility functions for easy model selection
export function getOptimalModelForTask(
  taskCategory: 'routine-operations' | 'quick-responses' | 'complex-analysis' | 'strategic-planning' | 'critical-decisions' | 'complex-reasoning',
  options?: {
    prioritizeSpeed?: boolean;
    costBudget?: number;
    apiKey?: string;
  }
): { model: OpenAIModel; reasoning: string; estimatedCost: number } {
  const router = new OpenAIModelRouter(options?.apiKey || '');
  const selectedModel = router.selectModelByTaskCategory(taskCategory);
  
  return {
    model: selectedModel as OpenAIModel,
    reasoning: `Selected ${selectedModel} for ${taskCategory}`,
    estimatedCost: 0.01 // Default cost
  };
}

export function getModelCapabilities(model: OpenAIModel): ModelCapabilities {
  return MODEL_SPECIFICATIONS[model];
}

export function getAllModelConfigs(): Record<OpenAIModel, ModelCapabilities> {
  return MODEL_SPECIFICATIONS;
}

// Export the enhanced model configuration for direct access
export { MODEL_SPECIFICATIONS as modelConfig }; 