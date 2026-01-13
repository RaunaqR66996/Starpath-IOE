export interface PlanningSystemConfig {
  // AI Provider Configuration
  providers: {
    openai: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      rateLimit: number;
      timeout: number;
      maxTokens: number;
      temperature: number;
      specializedPrompts: {
        strategic_planning: string;
        supplier_evaluation: string;
        exception_handling: string;
        demand_forecasting: string;
        inventory_optimization: string;
        production_scheduling: string;
      };
    };
    google: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      rateLimit: number;
      timeout: number;
      maxTokens: number;
      temperature: number;
      specializedPrompts: {
        pattern_recognition: string;
        real_time_processing: string;
        trend_analysis: string;
        demand_sensing: string;
        inventory_management: string;
      };
    };
    deepseek: {
      apiKey: string;
      baseUrl?: string;
      models: string[];
      rateLimit: number;
      timeout: number;
      maxTokens: number;
      temperature: number;
      specializedPrompts: {
        mathematical_optimization: string;
        constraint_solving: string;
        genetic_algorithms: string;
        production_optimization: string;
        resource_allocation: string;
      };
    };
  };

  // System Configuration
  system: {
    planningCycleInterval: number; // milliseconds
    autoRefreshInterval: number; // milliseconds
    maxConcurrentTasks: number;
    defaultTimeout: number; // milliseconds
    retryAttempts: number;
    retryDelay: number; // milliseconds
  };

  // Agent Configuration
  agents: {
    master: {
      id: string;
      name: string;
      provider: string;
      maxConcurrent: number;
      priority: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
    demand: {
      id: string;
      name: string;
      provider: string;
      maxConcurrent: number;
      priority: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
    inventory: {
      id: string;
      name: string;
      provider: string;
      maxConcurrent: number;
      priority: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
    production: {
      id: string;
      name: string;
      provider: string;
      maxConcurrent: number;
      priority: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
    supplier: {
      id: string;
      name: string;
      provider: string;
      maxConcurrent: number;
      priority: string;
      model: string;
      temperature: number;
      maxTokens: number;
    };
  };

  // ERP Integration Configuration
  erp: {
    sap: {
      enabled: boolean;
      connectionString: string;
      tables: string[];
      syncFrequency: number; // milliseconds
    };
    oracle: {
      enabled: boolean;
      connectionString: string;
      tables: string[];
      syncFrequency: number; // milliseconds
    };
    dynamics: {
      enabled: boolean;
      connectionString: string;
      entities: string[];
      syncFrequency: number; // milliseconds
    };
  };

  // WebSocket Configuration
  websocket: {
    port: number;
    cors: {
      origin: string[];
      methods: string[];
    };
    heartbeatInterval: number; // milliseconds
    maxReconnectAttempts: number;
    reconnectDelay: number; // milliseconds
  };

  // Performance Monitoring
  monitoring: {
    enabled: boolean;
    metricsInterval: number; // milliseconds
    alertThresholds: {
      successRate: number;
      responseTime: number;
      errorRate: number;
      systemHealth: number;
    };
  };

  // Security Configuration
  security: {
    jwtSecret: string;
    jwtExpiry: string;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
}

export const defaultConfig: PlanningSystemConfig = {
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      rateLimit: 100,
      timeout: 30000,
      maxTokens: 4000,
      temperature: 0.1, // Low for consistent planning decisions
      specializedPrompts: {
        strategic_planning: `You are a Master Planning Coordinator with expertise in supply chain strategy. Analyze cross-functional planning data and provide strategic recommendations for optimal resource allocation and long-term planning decisions. Focus on:
        - Cross-functional coordination and alignment
        - Strategic planning horizon management (2-5 years)
        - S&OP integration and optimization
        - Exception handling and escalation protocols
        - Performance monitoring across all planning functions
        - Cost-benefit analysis and ROI optimization
        Provide actionable insights with specific recommendations and implementation timelines.`,
        
        supplier_evaluation: `You are a Supplier Planning Specialist with deep expertise in supplier relationship management and strategic sourcing. Evaluate supplier performance data and recommend optimal sourcing strategies based on:
        - Supplier performance scoring and evaluation
        - Risk assessment and mitigation strategies
        - Cost optimization and total cost of ownership analysis
        - Quality metrics and compliance assessment
        - Delivery performance and lead time optimization
        - Contract optimization and negotiation support
        - Alternative sourcing strategy development
        - Supplier relationship management automation
        Provide detailed analysis with specific recommendations for supplier selection, development, and risk mitigation.`,
        
        exception_handling: `You are a Planning Exception Manager responsible for coordinating responses to planning disruptions across the entire supply chain. Analyze planning exceptions and coordinate resolution strategies for:
        - Demand spikes and sudden changes
        - Supply disruptions and supplier issues
        - Production capacity constraints
        - Inventory shortages and stockouts
        - Quality issues and compliance problems
        - Transportation and logistics disruptions
        - Resource allocation conflicts
        Coordinate cross-functional responses and provide escalation protocols with clear action items and timelines.`,
        
        demand_forecasting: `You are a Demand Planning Expert specializing in advanced forecasting techniques and market analysis. Analyze demand patterns and provide accurate forecasts considering:
        - Historical demand analysis and trend identification
        - Seasonal patterns and cyclical variations
        - Market trends and competitive analysis
        - Customer behavior prediction and segmentation
        - Promotional impact modeling and assessment
        - Real-time demand sensing and adjustment
        - Statistical forecasting models (ARIMA, Prophet, Neural Networks)
        Provide detailed forecasts with confidence intervals and scenario analysis.`,
        
        inventory_optimization: `You are an Inventory Optimization Specialist focused on multi-echelon inventory management and service level optimization. Optimize inventory levels considering:
        - Safety stock optimization across multiple locations
        - Reorder point calculations with demand variability
        - ABC analysis automation and classification
        - Multi-echelon inventory optimization
        - Supplier lead time management and risk assessment
        - Inventory turnover optimization
        - Service level target achievement
        - Cost optimization and working capital management
        Provide specific inventory policies with reorder points, safety stocks, and service level targets.`,
        
        production_scheduling: `You are a Production Planning Expert specializing in finite capacity scheduling and resource optimization. Create optimal production schedules considering:
        - Finite capacity scheduling optimization
        - Resource allocation and constraint management
        - Work order generation and sequencing
        - Bottleneck identification and resolution
        - Quality control planning integration
        - Changeover optimization and setup reduction
        - Maintenance planning integration
        - Cost minimization and efficiency optimization
        Provide detailed production schedules with resource allocation and constraint management.`
      }
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY || '',
      baseUrl: process.env.GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com',
      models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      rateLimit: 150,
      timeout: 25000,
      maxTokens: 8000,
      temperature: 0.2, // Slightly higher for creative pattern recognition
      specializedPrompts: {
        pattern_recognition: `You are a Pattern Recognition Specialist using Google's advanced AI capabilities. Identify complex patterns in supply chain data including:
        - Demand pattern analysis and trend identification
        - Seasonal variations and cyclical patterns
        - Anomaly detection and outlier identification
        - Correlation analysis between variables
        - Predictive pattern modeling
        - Real-time pattern recognition in streaming data
        Provide detailed pattern analysis with confidence scores and predictive insights.`,
        
        real_time_processing: `You are a Real-Time Processing Expert specializing in live data analysis and instant decision-making. Process real-time supply chain data for:
        - Live demand sensing and adjustment
        - Real-time inventory level monitoring
        - Instant production status updates
        - Live supplier performance tracking
        - Real-time exception detection and alerting
        - Dynamic resource allocation
        - Instant optimization recommendations
        Provide immediate insights and recommendations based on current data streams.`,
        
        trend_analysis: `You are a Trend Analysis Specialist focused on identifying and predicting market and operational trends. Analyze trends in:
        - Market demand trends and customer preferences
        - Supplier performance trends and reliability patterns
        - Production efficiency trends and improvement opportunities
        - Cost trends and optimization potential
        - Technology adoption trends and innovation opportunities
        - Competitive landscape trends and market positioning
        Provide trend analysis with future predictions and strategic implications.`,
        
        demand_sensing: `You are a Demand Sensing Expert specializing in real-time demand detection and response. Sense and respond to demand changes through:
        - Real-time demand signal processing
        - Instant demand pattern recognition
        - Dynamic demand adjustment algorithms
        - Predictive demand modeling
        - Customer behavior analysis
        - Market condition monitoring
        - Rapid response planning
        Provide immediate demand insights and adjustment recommendations.`,
        
        inventory_management: `You are an Inventory Management Specialist focused on real-time inventory optimization. Manage inventory through:
        - Real-time stock level monitoring
        - Dynamic reorder point calculation
        - Instant inventory optimization
        - Live ABC analysis updates
        - Real-time safety stock adjustment
        - Dynamic lead time management
        - Instant inventory alerts and notifications
        Provide real-time inventory recommendations and optimization strategies.`
      }
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      models: ['deepseek-chat', 'deepseek-coder'],
      rateLimit: 80,
      timeout: 35000,
      maxTokens: 4000,
      temperature: 0.05, // Very low for precise mathematical optimization
      specializedPrompts: {
        mathematical_optimization: `You are a Mathematical Optimization Expert specializing in advanced optimization algorithms. Solve complex optimization problems including:
        - Linear programming and integer programming
        - Mixed-integer programming for production planning
        - Multi-objective optimization with constraints
        - Stochastic optimization for uncertainty handling
        - Dynamic programming for sequential decisions
        - Network optimization for supply chain design
        - Combinatorial optimization for scheduling
        Provide optimal solutions with mathematical proofs and sensitivity analysis.`,
        
        constraint_solving: `You are a Constraint Solving Specialist focused on complex constraint satisfaction problems. Solve constraints in:
        - Production capacity constraints
        - Resource availability constraints
        - Time window constraints
        - Quality and compliance constraints
        - Budget and cost constraints
        - Supplier capacity constraints
        - Transportation and logistics constraints
        Provide constraint satisfaction solutions with feasibility analysis and relaxation strategies.`,
        
        genetic_algorithms: `You are a Genetic Algorithm Expert specializing in evolutionary optimization techniques. Apply genetic algorithms to:
        - Production schedule optimization
        - Resource allocation problems
        - Route optimization and vehicle routing
        - Facility location and network design
        - Multi-objective optimization problems
        - Dynamic optimization scenarios
        - Complex combinatorial problems
        Provide evolutionary solutions with convergence analysis and performance metrics.`,
        
        production_optimization: `You are a Production Optimization Specialist using advanced mathematical techniques. Optimize production through:
        - Finite capacity scheduling optimization
        - Work order sequencing and prioritization
        - Resource allocation and utilization
        - Bottleneck identification and resolution
        - Changeover optimization and setup reduction
        - Quality control integration
        - Maintenance planning optimization
        Provide optimal production plans with mathematical validation and performance guarantees.`,
        
        resource_allocation: `You are a Resource Allocation Expert specializing in optimal resource distribution. Allocate resources for:
        - Production capacity allocation
        - Workforce scheduling and assignment
        - Equipment utilization optimization
        - Material resource planning
        - Financial resource allocation
        - Time resource management
        - Energy and utility optimization
        Provide optimal resource allocation with efficiency metrics and utilization analysis.`
      }
    }
  },

  system: {
    planningCycleInterval: 300000, // 5 minutes
    autoRefreshInterval: 10000, // 10 seconds
    maxConcurrentTasks: 50,
    defaultTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  },

  agents: {
    master: {
      id: 'master-001',
      name: 'Master Planning Agent',
      provider: 'openai',
      maxConcurrent: 10,
      priority: 'high',
      model: 'gpt-4-turbo',
      temperature: 0.1,
      maxTokens: 4000
    },
    demand: {
      id: 'demand-001',
      name: 'Demand Planning Agent',
      provider: 'google',
      maxConcurrent: 15,
      priority: 'high',
      model: 'gemini-1.5-pro',
      temperature: 0.2,
      maxTokens: 8000
    },
    inventory: {
      id: 'inventory-001',
      name: 'Inventory Planning Agent',
      provider: 'google',
      maxConcurrent: 12,
      priority: 'medium',
      model: 'gemini-1.5-flash',
      temperature: 0.2,
      maxTokens: 8000
    },
    production: {
      id: 'production-001',
      name: 'Production Planning Agent',
      provider: 'deepseek',
      maxConcurrent: 12,
      priority: 'high',
      model: 'deepseek-chat',
      temperature: 0.05,
      maxTokens: 4000
    },
    supplier: {
      id: 'supplier-001',
      name: 'Supplier Planning Agent',
      provider: 'openai',
      maxConcurrent: 8,
      priority: 'medium',
      model: 'gpt-4-turbo',
      temperature: 0.1,
      maxTokens: 4000
    }
  },

  erp: {
    sap: {
      enabled: process.env.SAP_ENABLED === 'true',
      connectionString: process.env.SAP_CONNECTION_STRING || '',
      tables: ['VBAK', 'VBAP', 'MARD', 'MARC', 'VBFA', 'VBKD'],
      syncFrequency: 300000 // 5 minutes
    },
    oracle: {
      enabled: process.env.ORACLE_ENABLED === 'true',
      connectionString: process.env.ORACLE_CONNECTION_STRING || '',
      tables: ['OE_ORDER_HEADERS_ALL', 'MTL_SYSTEM_ITEMS_B', 'OE_CUSTOMERS', 'PO_HEADERS_ALL'],
      syncFrequency: 600000 // 10 minutes
    },
    dynamics: {
      enabled: process.env.DYNAMICS_ENABLED === 'true',
      connectionString: process.env.DYNAMICS_CONNECTION_STRING || '',
      entities: ['SalesOrder', 'Item', 'Customer', 'PurchaseOrder'],
      syncFrequency: 300000 // 5 minutes
    }
  },

  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '3001'),
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST']
    },
    heartbeatInterval: 30000, // 30 seconds
    maxReconnectAttempts: 5,
    reconnectDelay: 1000 // 1 second
  },

  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsInterval: 60000, // 1 minute
    alertThresholds: {
      successRate: 90,
      responseTime: 5000, // 5 seconds
      errorRate: 5,
      systemHealth: 80
    }
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }
  }
};

export function getConfig(): PlanningSystemConfig {
  return defaultConfig;
}

export function validateConfig(config: PlanningSystemConfig): string[] {
  const errors: string[] = [];

  // Validate required API keys
  if (!config.providers.openai.apiKey) {
    errors.push('OpenAI API key is required');
  }
  if (!config.providers.google.apiKey) {
    errors.push('Google API key is required');
  }
  if (!config.providers.deepseek.apiKey) {
    errors.push('DeepSeek API key is required');
  }

  // Validate system configuration
  if (config.system.planningCycleInterval < 60000) {
    errors.push('Planning cycle interval must be at least 60 seconds');
  }
  if (config.system.maxConcurrentTasks < 1) {
    errors.push('Max concurrent tasks must be at least 1');
  }

  // Validate agent configuration
  const validProviders = ['openai', 'google', 'deepseek'];
  Object.entries(config.agents).forEach(([key, agent]) => {
    if (!validProviders.includes(agent.provider)) {
      errors.push(`Invalid provider for ${key} agent: ${agent.provider}`);
    }
    if (agent.maxConcurrent < 1) {
      errors.push(`Max concurrent tasks for ${key} agent must be at least 1`);
    }
    if (agent.temperature < 0 || agent.temperature > 2) {
      errors.push(`Temperature for ${key} agent must be between 0 and 2`);
    }
    if (agent.maxTokens < 1) {
      errors.push(`Max tokens for ${key} agent must be at least 1`);
    }
  });

  // Validate ERP configuration
  if (config.erp.sap.enabled && !config.erp.sap.connectionString) {
    errors.push('SAP connection string is required when SAP is enabled');
  }
  if (config.erp.oracle.enabled && !config.erp.oracle.connectionString) {
    errors.push('Oracle connection string is required when Oracle is enabled');
  }
  if (config.erp.dynamics.enabled && !config.erp.dynamics.connectionString) {
    errors.push('Dynamics connection string is required when Dynamics is enabled');
  }

  // Validate security configuration
  if (config.security.jwtSecret === 'your-secret-key') {
    errors.push('JWT secret should be changed from default value');
  }

  return errors;
}

export function getProviderConfig(provider: string) {
  const config = getConfig();
  return config.providers[provider as keyof typeof config.providers];
}

export function getAgentConfig(agentType: string) {
  const config = getConfig();
  return config.agents[agentType as keyof typeof config.agents];
}

export function getERPConfig() {
  const config = getConfig();
  return config.erp;
}

export function getWebSocketConfig() {
  const config = getConfig();
  return config.websocket;
}

export function getMonitoringConfig() {
  const config = getConfig();
  return config.monitoring;
}

export function getSecurityConfig() {
  const config = getConfig();
  return config.security;
}

// Helper function to get specialized prompt for a specific task
export function getSpecializedPrompt(provider: string, taskType: string): string {
  const config = getConfig();
  const providerConfig = config.providers[provider as keyof typeof config.providers];
  
  if (providerConfig && providerConfig.specializedPrompts) {
    const prompts = providerConfig.specializedPrompts as any;
    return prompts[taskType] || prompts.strategic_planning || 'Default planning prompt';
  }
  
  return 'Default planning prompt';
}

// Helper function to get agent-specific configuration
export function getAgentSpecificConfig(agentType: string) {
  const config = getConfig();
  const agentConfig = config.agents[agentType as keyof typeof config.agents];
  const providerConfig = config.providers[agentConfig.provider as keyof typeof config.providers];
  
  return {
    ...agentConfig,
    providerConfig,
    specializedPrompts: providerConfig.specializedPrompts
  };
} 