// Core Types for BlueShip Sync AI Agent System

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  version: string;
  description: string;
  capabilities: string[];
  lastActive: Date;
  createdAt: Date;
  config: AgentConfig;
  metrics: AgentMetrics;
}

export enum AgentType {
  PLANNING = 'planning',
  PURCHASING = 'purchasing', 
  PROCUREMENT = 'procurement',
  LOGISTICS = 'logistics',
  CUSTOMER_SUPPORT = 'customer_support',
  ORCHESTRATOR = 'orchestrator'
}

export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle', 
  PROCESSING = 'processing',
  ERROR = 'error',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  timeout: number;
  retryAttempts: number;
  modelPreferences: ModelPreferences;
  enabledFeatures: string[];
  customPrompts?: Record<string, string>;
}

export interface ModelPreferences {
  primary: OpenAIModel;
  fallback: OpenAIModel;
  taskSpecific?: Record<string, OpenAIModel>;
}

export enum OpenAIModel {
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-1106-preview',
  GPT_4_VISION = 'gpt-4-vision-preview',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_3_5_TURBO_16K = 'gpt-3.5-turbo-16k'
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  averageResponseTime: number;
  successRate: number;
  uptime: number;
  lastErrorMessage?: string;
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  cpuPercent: number;
  memoryMB: number;
  tokensUsed: number;
  apiCallsToday: number;
  costToday: number;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  retryCount: number;
  metadata: TaskMetadata;
}

export enum TaskType {
  // Planning Agent Tasks
  DEMAND_FORECAST = 'demand_forecast',
  INVENTORY_OPTIMIZATION = 'inventory_optimization',
  SUPPLY_PLANNING = 'supply_planning',
  RISK_ASSESSMENT = 'risk_assessment',
  CAPACITY_PLANNING = 'capacity_planning',
  SCENARIO_MODELING = 'scenario_modeling',
  COLLABORATIVE_PLANNING = 'collaborative_planning',
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  
  // Purchasing Agent Tasks
  PO_GENERATION = 'po_generation',
  SUPPLIER_COMPARISON = 'supplier_comparison',
  COST_ANALYSIS = 'cost_analysis',
  APPROVAL_WORKFLOW = 'approval_workflow',
  
  // Procurement Agent Tasks
  SUPPLIER_EVALUATION = 'supplier_evaluation',
  RFP_GENERATION = 'rfp_generation',
  CONTRACT_ANALYSIS = 'contract_analysis',
  PERFORMANCE_MONITORING = 'performance_monitoring',
  
  // Logistics Agent Tasks
  ROUTE_OPTIMIZATION = 'route_optimization',
  CARRIER_SELECTION = 'carrier_selection',
  SHIPMENT_TRACKING = 'shipment_tracking',
  EXCEPTION_HANDLING = 'exception_handling',
  
  // Customer Support Agent Tasks
  CHAT_RESPONSE = 'chat_response',
  ESCALATION_HANDLING = 'escalation_handling',
  KNOWLEDGE_BASE_QUERY = 'knowledge_base_query',
  TICKET_CLASSIFICATION = 'ticket_classification'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum TaskStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRY = 'retry'
}

export interface TaskMetadata {
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  correlationId?: string;
  source: string;
  tags: string[];
  customData?: Record<string, any>;
}

export interface AgentCommunication {
  id: string;
  fromAgentId: string;
  toAgentId?: string; // null for broadcast
  messageType: CommunicationMessageType;
  content: any;
  timestamp: Date;
  priority: MessagePriority;
  acknowledged: boolean;
  response?: any;
}

export enum CommunicationMessageType {
  TASK_REQUEST = 'task_request',
  TASK_RESPONSE = 'task_response',
  STATUS_UPDATE = 'status_update',
  ERROR_REPORT = 'error_report',
  COORDINATION_REQUEST = 'coordination_request',
  HEALTH_CHECK = 'health_check',
  BROADCAST = 'broadcast'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// OpenAI Integration Types
export interface ModelSelectionCriteria {
  taskType: TaskType;
  complexityScore: number;
  tokenEstimate: number;
  responseTimeRequirement: number;
  costBudget?: number;
  qualityRequirement: 'fast' | 'balanced' | 'quality';
}

export interface ModelSelectionResult {
  selectedModel: OpenAIModel;
  reasoning: string;
  estimatedCost: number;
  estimatedResponseTime: number;
  fallbackModel?: OpenAIModel;
}

export interface OpenAIRequest {
  model: OpenAIModel;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  functions?: OpenAIFunction[];
  functionCall?: 'none' | 'auto' | { name: string };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: OpenAIModel;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Agent-Specific Response Types
export interface PlanningAgentResponse {
  forecastData?: {
    demandPredictions: Array<{ period: string; demand: number; confidence: number }>;
    inventoryRecommendations: Array<{ item: string; currentLevel: number; recommendedLevel: number; reasoning: string }>;
    riskFactors: Array<{ factor: string; impact: 'low' | 'medium' | 'high'; mitigation: string }>;
  };
  optimizationResults?: {
    currentCosts: number;
    optimizedCosts: number;
    savings: number;
    changes: Array<{ item: string; action: string; impact: string }>;
  };
}

export interface PurchasingAgentResponse {
  purchaseOrder?: {
    items: Array<{ sku: string; quantity: number; unitPrice: number; supplier: string }>;
    totalAmount: number;
    deliveryDate: Date;
    terms: string;
  };
  supplierComparison?: {
    suppliers: Array<{
      name: string;
      price: number;
      quality: number;
      deliveryTime: number;
      reliability: number;
      overallScore: number;
    }>;
    recommendation: string;
  };
}

export interface LogisticsAgentResponse {
  routeOptimization?: {
    optimizedRoute: Array<{ stop: string; estimatedTime: Date; distance: number }>;
    totalDistance: number;
    totalTime: number;
    fuelCost: number;
    savings: number;
  };
  carrierSelection?: {
    carriers: Array<{
      name: string;
      service: string;
      cost: number;
      transitTime: number;
      reliability: number;
      score: number;
    }>;
    recommendation: string;
  };
}

export interface SupportAgentResponse {
  chatResponse?: {
    message: string;
    confidence: number;
    suggestedActions: string[];
    escalationRequired: boolean;
  };
  ticketClassification?: {
    category: string;
    priority: TaskPriority;
    estimatedResolutionTime: number;
    assignedTeam: string;
  };
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: Date;
  correlationId?: string;
}

export enum WebSocketMessageType {
  AGENT_STATUS_UPDATE = 'agent_status_update',
  TASK_UPDATE = 'task_update',
  METRICS_UPDATE = 'metrics_update',
  ERROR_NOTIFICATION = 'error_notification',
  SYSTEM_ALERT = 'system_alert',
  CHAT_MESSAGE = 'chat_message'
}

// Database Models
export interface AgentExecution {
  id: string;
  agentId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  status: TaskStatus;
  input: any;
  output?: any;
  error?: string;
  modelUsed: OpenAIModel;
  tokensUsed: number;
  cost: number;
  duration: number;
  retryCount: number;
  metadata: Record<string, any>;
}

export interface AgentPerformanceLog {
  id: string;
  agentId: string;
  timestamp: Date;
  metrics: AgentMetrics;
  systemLoad: number;
  queueSize: number;
  activeConnections: number;
} 