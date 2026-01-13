// AI Agent System Configuration
// This file manages all configuration settings for the BlueShip Sync AI Agent System

export interface AIAgentConfig {
  openai: {
    apiKey: string;
    baseURL: string;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
  };
  agents: {
    enabled: boolean;
    timeout: number;
    retryAttempts: number;
    maxConcurrentTasks: number;
  };
  websocket: {
    port: number;
    host: string;
  };
  costControl: {
    dailyBudgetLimit: number;
    monthlyBudgetLimit: number;
    alertThreshold: number;
  };
  agentModels: {
    planning: string;
    purchasing: string;
    logistics: string;
    support: string;
  };
  monitoring: {
    logLevel: string;
    enablePerformanceLogging: boolean;
    enableCostTracking: boolean;
  };
}

// Default configuration
const defaultConfig: AIAgentConfig = {
  openai: {
    apiKey: '', // Will be set from environment or user input
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4-turbo',
    maxTokens: 4096,
    temperature: 0.7,
  },
  agents: {
    enabled: true,
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    maxConcurrentTasks: 10,
  },
  websocket: {
    port: 8080,
    host: 'localhost',
  },
  costControl: {
    dailyBudgetLimit: 100.00,
    monthlyBudgetLimit: 3000.00,
    alertThreshold: 80.00, // Alert at 80% of budget
  },
  agentModels: {
    planning: 'gpt-4-turbo',
    purchasing: 'gpt-3.5-turbo',
    logistics: 'gpt-4-turbo',
    support: 'gpt-3.5-turbo',
  },
  monitoring: {
    logLevel: 'info',
    enablePerformanceLogging: true,
    enableCostTracking: true,
  },
};

// Configuration singleton
class AIAgentConfigManager {
  private config: AIAgentConfig;
  private initialized = false;

  constructor() {
    this.config = { ...defaultConfig };
  }

  /**
   * Initialize configuration with environment variables or user-provided settings
   */
  initialize(customConfig?: Partial<AIAgentConfig>): void {
    if (this.initialized) {
      console.warn('AI Agent configuration already initialized');
      return;
    }

    // Load from environment variables (server-side)
    try {
      if (typeof window === 'undefined') {
        this.loadFromEnvironment();
      }
    } catch (error) {
      // Environment not available (client-side)
      console.log('Environment variables not available in client context');
    }

    // Apply custom configuration
    if (customConfig) {
      this.config = this.mergeConfig(this.config, customConfig);
    }

    this.initialized = true;
    console.log('AI Agent configuration initialized');
  }

  /**
   * Set OpenAI API key
   */
  setOpenAIKey(apiKey: string): void {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }
    
    this.config.openai.apiKey = apiKey;
    console.log('OpenAI API key configured successfully');
  }

  /**
   * Get configuration
   */
  getConfig(): AIAgentConfig {
    if (!this.initialized) {
      console.warn('Configuration not initialized, using defaults');
    }
    return { ...this.config };
  }

  /**
   * Update specific configuration section
   */
  updateConfig(section: keyof AIAgentConfig, updates: any): void {
    this.config[section] = { ...this.config[section], ...updates };
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate OpenAI API key
    if (!this.config.openai.apiKey) {
      errors.push('OpenAI API key is required');
    } else if (!this.config.openai.apiKey.startsWith('sk-')) {
      errors.push('Invalid OpenAI API key format');
    }

    // Validate cost limits
    if (this.config.costControl.dailyBudgetLimit <= 0) {
      errors.push('Daily budget limit must be greater than 0');
    }

    if (this.config.costControl.monthlyBudgetLimit <= 0) {
      errors.push('Monthly budget limit must be greater than 0');
    }

    // Validate agent settings
    if (this.config.agents.timeout <= 0) {
      errors.push('Agent timeout must be greater than 0');
    }

    if (this.config.agents.maxConcurrentTasks <= 0) {
      errors.push('Max concurrent tasks must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get environment-safe configuration (excludes sensitive data)
   */
  getPublicConfig(): Partial<AIAgentConfig> {
    const { openai, ...publicConfig } = this.config;
    return {
      ...publicConfig,
      openai: {
        baseURL: openai.baseURL,
        defaultModel: openai.defaultModel,
        maxTokens: openai.maxTokens,
        temperature: openai.temperature,
        apiKey: openai.apiKey ? '***configured***' : 'not-set'
      }
    };
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    // Environment variables are only available server-side
    const env = (globalThis as any).process?.env || {};

    // OpenAI configuration
    if (env.OPENAI_API_KEY) {
      this.config.openai.apiKey = env.OPENAI_API_KEY;
    }
    if (env.OPENAI_API_BASE_URL) {
      this.config.openai.baseURL = env.OPENAI_API_BASE_URL;
    }
    if (env.AI_AGENT_DEFAULT_MODEL) {
      this.config.openai.defaultModel = env.AI_AGENT_DEFAULT_MODEL;
    }
    if (env.AI_AGENT_MAX_TOKENS) {
      this.config.openai.maxTokens = parseInt(env.AI_AGENT_MAX_TOKENS);
    }
    if (env.AI_AGENT_TEMPERATURE) {
      this.config.openai.temperature = parseFloat(env.AI_AGENT_TEMPERATURE);
    }

    // Agent configuration
    if (env.AI_AGENT_ENABLED) {
      this.config.agents.enabled = env.AI_AGENT_ENABLED === 'true';
    }
    if (env.AI_AGENT_TIMEOUT) {
      this.config.agents.timeout = parseInt(env.AI_AGENT_TIMEOUT);
    }
    if (env.AI_AGENT_RETRY_ATTEMPTS) {
      this.config.agents.retryAttempts = parseInt(env.AI_AGENT_RETRY_ATTEMPTS);
    }
    if (env.AI_AGENT_MAX_CONCURRENT_TASKS) {
      this.config.agents.maxConcurrentTasks = parseInt(env.AI_AGENT_MAX_CONCURRENT_TASKS);
    }

    // WebSocket configuration
    if (env.WS_PORT) {
      this.config.websocket.port = parseInt(env.WS_PORT);
    }
    if (env.WS_HOST) {
      this.config.websocket.host = env.WS_HOST;
    }

    // Cost control
    if (env.AI_DAILY_BUDGET_LIMIT) {
      this.config.costControl.dailyBudgetLimit = parseFloat(env.AI_DAILY_BUDGET_LIMIT);
    }
    if (env.AI_MONTHLY_BUDGET_LIMIT) {
      this.config.costControl.monthlyBudgetLimit = parseFloat(env.AI_MONTHLY_BUDGET_LIMIT);
    }
    if (env.AI_COST_ALERT_THRESHOLD) {
      this.config.costControl.alertThreshold = parseFloat(env.AI_COST_ALERT_THRESHOLD);
    }

    // Agent-specific models
    if (env.PLANNING_AGENT_MODEL) {
      this.config.agentModels.planning = env.PLANNING_AGENT_MODEL;
    }
    if (env.PURCHASING_AGENT_MODEL) {
      this.config.agentModels.purchasing = env.PURCHASING_AGENT_MODEL;
    }
    if (env.LOGISTICS_AGENT_MODEL) {
      this.config.agentModels.logistics = env.LOGISTICS_AGENT_MODEL;
    }
    if (env.SUPPORT_AGENT_MODEL) {
      this.config.agentModels.support = env.SUPPORT_AGENT_MODEL;
    }

    // Monitoring
    if (env.LOG_LEVEL) {
      this.config.monitoring.logLevel = env.LOG_LEVEL;
    }
    if (env.ENABLE_PERFORMANCE_LOGGING) {
      this.config.monitoring.enablePerformanceLogging = env.ENABLE_PERFORMANCE_LOGGING === 'true';
    }
    if (env.ENABLE_COST_TRACKING) {
      this.config.monitoring.enableCostTracking = env.ENABLE_COST_TRACKING === 'true';
    }
  }

  /**
   * Merge configurations recursively
   */
  private mergeConfig(base: AIAgentConfig, override: Partial<AIAgentConfig>): AIAgentConfig {
    const result = { ...base };
    
    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        const value = override[key as keyof AIAgentConfig];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key as keyof AIAgentConfig] = {
            ...result[key as keyof AIAgentConfig],
            ...value
          } as any;
        } else {
          result[key as keyof AIAgentConfig] = value as any;
        }
      }
    }
    
    return result;
  }
}

// Export singleton instance
export const configManager = new AIAgentConfigManager();

// Convenience functions
export function initializeAIConfig(customConfig?: Partial<AIAgentConfig>): void {
  configManager.initialize(customConfig);
}

export function setOpenAIKey(apiKey: string): void {
  configManager.setOpenAIKey(apiKey);
}

export function getAIConfig(): AIAgentConfig {
  return configManager.getConfig();
}

export function updateAIConfig(section: keyof AIAgentConfig, updates: any): void {
  configManager.updateConfig(section, updates);
}

export function validateAIConfig(): { valid: boolean; errors: string[] } {
  return configManager.validate();
}

export function getPublicAIConfig(): Partial<AIAgentConfig> {
  return configManager.getPublicConfig();
}

// Initialize with your OpenAI API key
export function quickSetup(apiKey: string): void {
  configManager.initialize();
  configManager.setOpenAIKey(apiKey);
  
  const validation = configManager.validate();
  if (!validation.valid) {
    console.error('Configuration validation failed:', validation.errors);
    throw new Error('Invalid configuration');
  }
  
  console.log('AI Agent system configured successfully');
} 