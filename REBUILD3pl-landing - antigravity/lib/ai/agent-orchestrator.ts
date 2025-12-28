import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { EventEmitter } from 'events'
import pLimit from 'p-limit'

// ================================
// AI AGENT TYPES AND INTERFACES
// ================================

interface AITask {
  id: string
  type: AITaskType
  priority: Priority
  payload: any
  model?: string
  maxRetries?: number
  timeout?: number
  createdAt: number
  userId?: string
  organizationId?: string
  tags?: string[]
}

interface AIAgent {
  id: string
  type: AIAgentType
  status: AgentStatus
  capabilities: string[]
  currentLoad: number
  maxConcurrent: number
  averageProcessingTime: number
  successRate: number
  lastActive: number
  version: string
}

interface AIResult {
  taskId: string
  agentId: string
  result: any
  error?: string
  processingTime: number
  timestamp: number
  cached: boolean
  tokensUsed?: number
  cost?: number
}

interface QueueMetrics {
  pending: number
  processing: number
  completed: number
  failed: number
  averageWaitTime: number
  averageProcessingTime: number
  throughput: number
}

type AITaskType = 
  | 'DOCUMENT_ANALYSIS' 
  | 'DEMAND_FORECAST' 
  | 'ROUTE_OPTIMIZATION' 
  | 'INVENTORY_OPTIMIZATION'
  | 'CAPACITY_PLANNING'
  | 'SCENARIO_MODELING'
  | 'COLLABORATIVE_PLANNING'
  | 'PERFORMANCE_ANALYSIS'
  | 'ANOMALY_DETECTION'
  | 'COST_ANALYSIS'
  | 'PO_GENERATION'
  | 'SUPPLIER_COMPARISON'
  | 'APPROVAL_WORKFLOW'
  | 'PREDICTIVE_MAINTENANCE'
  | 'NATURAL_LANGUAGE_QUERY'
  | 'IMAGE_PROCESSING'
  | 'DATA_EXTRACTION'

type AIAgentType = 
  | 'DOCUMENT_PROCESSOR'
  | 'ANALYTICS_ENGINE' 
  | 'OPTIMIZATION_AGENT'
  | 'FORECASTING_AGENT'
  | 'NLP_AGENT'
  | 'VISION_AGENT'
  | 'GENERAL_PURPOSE'

type AgentStatus = 'IDLE' | 'BUSY' | 'OVERLOADED' | 'ERROR' | 'MAINTENANCE'
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'

// ================================
// AI AGENT ORCHESTRATOR
// ================================

export class AIAgentOrchestrator extends EventEmitter {
  private static instance: AIAgentOrchestrator
  private agents: Map<string, AIAgent> = new Map()
  private taskQueue: Map<string, AITask> = new Map()
  private processingTasks: Map<string, { task: AITask; agent: AIAgent; startTime: number }> = new Map()
  private results: Map<string, AIResult> = new Map()
  private limiters: Map<string, any> = new Map()
  private cache: Map<string, { data: any; expiry: number }> = new Map()
  private metrics: QueueMetrics = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    averageWaitTime: 0,
    averageProcessingTime: 0,
    throughput: 0
  }

  private readonly CACHE_TTL = 3600 // 1 hour
  private readonly MAX_QUEUE_SIZE = 10000
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
  private readonly METRICS_INTERVAL = 10000 // 10 seconds

  constructor() {
    super()
    this.initializeAgents()
    this.startHealthCheck()
    this.startTaskProcessor()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AIAgentOrchestrator {
    if (!AIAgentOrchestrator.instance) {
      AIAgentOrchestrator.instance = new AIAgentOrchestrator()
    }
    return AIAgentOrchestrator.instance
  }

  /**
   * Initialize available AI agents
   */
  private initializeAgents(): void {
    const agentConfigs = [
      {
        id: 'planning-001',
        type: 'ANALYTICS_ENGINE' as AIAgentType,
        capabilities: ['DEMAND_FORECAST', 'INVENTORY_OPTIMIZATION', 'CAPACITY_PLANNING'],
        maxConcurrent: 3
      },
      {
        id: 'purchasing-001',
        type: 'OPTIMIZATION_AGENT' as AIAgentType,
        capabilities: ['PO_GENERATION', 'SUPPLIER_COMPARISON', 'COST_ANALYSIS'],
        maxConcurrent: 5
      },
      {
        id: 'logistics-001',
        type: 'OPTIMIZATION_AGENT' as AIAgentType,
        capabilities: ['ROUTE_OPTIMIZATION', 'SHIPMENT_TRACKING'],
        maxConcurrent: 4
      },
      {
        id: 'support-001',
        type: 'NLP_AGENT' as AIAgentType,
        capabilities: ['CHAT_RESPONSE', 'TICKET_CLASSIFICATION'],
        maxConcurrent: 10
      },
      {
        id: 'general-001',
        type: 'GENERAL_PURPOSE' as AIAgentType,
        capabilities: ['DOCUMENT_ANALYSIS', 'DATA_EXTRACTION'],
        maxConcurrent: 6
      }
    ]

    agentConfigs.forEach(config => {
      const agent: AIAgent = {
        id: config.id,
        type: config.type,
        status: 'IDLE',
        capabilities: config.capabilities,
        currentLoad: 0,
        maxConcurrent: config.maxConcurrent,
        averageProcessingTime: 5000,
        successRate: 0.95,
        lastActive: Date.now(),
        version: '1.0.0'
      }
      
      this.agents.set(config.id, agent)
      this.limiters.set(config.id, pLimit(config.maxConcurrent))
    })

    console.log(`Initialized ${this.agents.size} AI agents`)
  }

  /**
   * Submit task for processing
   */
  async submitTask(task: Omit<AITask, 'id' | 'createdAt'>): Promise<string> {
    const taskId = this.generateTaskId()
    const fullTask: AITask = {
      id: taskId,
      createdAt: Date.now(),
      maxRetries: task.maxRetries || 3,
      timeout: task.timeout || 60000,
      ...task
    }

    // Validate task
    if (!this.validateTask(fullTask)) {
      throw new Error('Invalid task parameters')
    }

    // Check cache first
    const cachedResult = await this.getCachedResult(fullTask)
    if (cachedResult) {
      this.results.set(taskId, cachedResult)
      this.metrics.completed++
      this.emit('taskCompleted', cachedResult)
      return taskId
    }

    // Add to queue
    this.taskQueue.set(taskId, fullTask)
    this.metrics.pending++

    // Emit event
    this.emit('taskQueued', { taskId, type: fullTask.type })

    // Try immediate processing
    setImmediate(() => this.processNextTask())

    return taskId
  }

  /**
   * Get task result
   */
  async getResult(taskId: string, timeout: number = 60000): Promise<AIResult> {
    return new Promise((resolve, reject) => {
      // Check if result already exists
      const existing = this.results.get(taskId)
      if (existing) {
        resolve(existing)
        return
      }

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out`))
      }, timeout)

      // Listen for completion
      const onComplete = (result: AIResult) => {
        if (result.taskId === taskId) {
          clearTimeout(timeoutHandle)
          this.off('taskCompleted', onComplete)
          resolve(result)
        }
      }

      this.on('taskCompleted', onComplete)
    })
  }

  /**
   * Process next task in queue
   */
  private async processNextTask(): Promise<void> {
    if (this.taskQueue.size === 0) return

    // Find highest priority task
    const tasks = Array.from(this.taskQueue.values())
    tasks.sort((a, b) => this.getPriorityScore(b) - this.getPriorityScore(a))

    for (const task of tasks) {
      const agent = this.selectOptimalAgent(task)
      if (agent && agent.currentLoad < agent.maxConcurrent) {
        await this.executeTask(task, agent)
        break
      }
    }
  }

  /**
   * Select optimal agent for task
   */
  private selectOptimalAgent(task: AITask): AIAgent | null {
    const eligibleAgents = Array.from(this.agents.values())
      .filter(agent => 
        (agent.status === 'IDLE' || agent.status === 'BUSY') &&
        agent.capabilities.includes(task.type) &&
        agent.currentLoad < agent.maxConcurrent
      )

    if (eligibleAgents.length === 0) return null

    // Score agents based on multiple factors
    const scored = eligibleAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, task)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored[0].agent
  }

  /**
   * Calculate agent suitability score
   */
  private calculateAgentScore(agent: AIAgent, task: AITask): number {
    let score = 0

    // Load factor (30% weight)
    const loadFactor = 1 - (agent.currentLoad / agent.maxConcurrent)
    score += loadFactor * 30

    // Success rate (25% weight)
    score += agent.successRate * 25

    // Response time (20% weight)
    const responseScore = Math.max(0, 20 - (agent.averageProcessingTime / 1000))
    score += responseScore

    // Capability match (15% weight)
    const hasCapability = agent.capabilities.includes(task.type)
    score += hasCapability ? 15 : 0

    // Recent activity (10% weight)
    const timeSinceActive = Date.now() - agent.lastActive
    const activityScore = Math.max(0, 10 - (timeSinceActive / 60000))
    score += activityScore

    return score
  }

  /**
   * Execute task with selected agent
   */
  private async executeTask(task: AITask, agent: AIAgent): Promise<void> {
    try {
      // Remove from queue and update metrics
      this.taskQueue.delete(task.id)
      this.metrics.pending--
      this.metrics.processing++

      // Update agent status
      agent.currentLoad++
      agent.status = agent.currentLoad >= agent.maxConcurrent ? 'OVERLOADED' : 'BUSY'
      agent.lastActive = Date.now()

      // Track processing
      const processing = {
        task,
        agent,
        startTime: Date.now()
      }
      this.processingTasks.set(task.id, processing)

      // Execute with rate limiting
      const limiter = this.limiters.get(agent.id)!
      const result = await limiter(() => this.executeAgentTask(task, agent))

      // Calculate processing time
      const processingTime = Date.now() - processing.startTime

      // Create result
      const taskResult: AIResult = {
        taskId: task.id,
        agentId: agent.id,
        result: result.data,
        processingTime,
        timestamp: Date.now(),
        cached: result.cached || false,
        tokensUsed: result.tokensUsed,
        cost: result.cost
      }

      // Cache successful result
      if (!result.cached) {
        await this.cacheResult(task, taskResult)
      }

      // Update metrics and agent status
      this.updateSuccessMetrics(agent, processingTime)
      this.metrics.processing--
      this.metrics.completed++

      // Store result
      this.results.set(task.id, taskResult)

      // Cleanup and emit
      this.processingTasks.delete(task.id)
      this.emit('taskCompleted', taskResult)

      // Try processing next task
      setImmediate(() => this.processNextTask())

    } catch (error) {
      await this.handleTaskError(task, agent, error)
    }
  }

  /**
   * Execute specific agent task
   */
  private async executeAgentTask(task: AITask, agent: AIAgent): Promise<any> {
    const agentType = agent.type
    
    switch (agentType) {
      case 'ANALYTICS_ENGINE':
        return await this.executeAnalyticsTask(task)
      case 'OPTIMIZATION_AGENT':
        return await this.executeOptimizationTask(task)
      case 'NLP_AGENT':
        return await this.executeNLPTask(task)
      case 'GENERAL_PURPOSE':
        return await this.executeGeneralTask(task)
      default:
        throw new Error(`Unknown agent type: ${agentType}`)
    }
  }

  /**
   * Agent-specific task execution methods
   */
  private async executeAnalyticsTask(task: AITask): Promise<any> {
    // Import and execute with appropriate agent
    const { planningAgent } = await import('../ai-agents/planning-agent')
    
    switch (task.type) {
      case 'DEMAND_FORECAST':
        return await planningAgent.forecastDemand(task.payload)
      case 'INVENTORY_OPTIMIZATION':
        return await planningAgent.optimizeInventory(task.payload)
      case 'CAPACITY_PLANNING':
        return await planningAgent.planCapacity(task.payload)
      default:
        throw new Error(`Unsupported analytics task: ${task.type}`)
    }
  }

  private async executeOptimizationTask(task: AITask): Promise<any> {
    if (task.type.startsWith('PO_') || task.type.includes('SUPPLIER') || task.type.includes('COST')) {
      // Purchasing agent tasks
      const { purchasingAgent } = await import('../ai-agents/purchasing-agent')
      
      switch (task.type) {
        case 'PO_GENERATION':
          return await purchasingAgent.generatePurchaseOrder(task.payload)
        case 'SUPPLIER_COMPARISON':
          return await purchasingAgent.evaluateVendors(task.payload)
        case 'COST_ANALYSIS':
          return await purchasingAgent.optimizeCosts(task.payload)
        default:
          throw new Error(`Unsupported purchasing task: ${task.type}`)
      }
    } else {
      // Logistics optimization tasks
      throw new Error(`Logistics agent not yet implemented for task: ${task.type}`)
    }
  }

  private async executeNLPTask(task: AITask): Promise<any> {
    // Support agent tasks
    throw new Error(`Support agent not yet implemented for task: ${task.type}`)
  }

  private async executeGeneralTask(task: AITask): Promise<any> {
    // General purpose AI tasks
    const { generateText } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: task.payload.prompt || 'Process this request: ' + JSON.stringify(task.payload),
      temperature: 0.7,
      maxTokens: 1000
    })

    return {
      data: text,
      tokensUsed: text.length / 4, // Rough estimate
      cost: (text.length / 4000) * 0.002 // Rough cost estimate
    }
  }

  /**
   * Handle task errors with retry logic
   */
  private async handleTaskError(task: AITask, agent: AIAgent, error: any): Promise<void> {
    console.error(`Task ${task.id} failed on agent ${agent.id}:`, error)

    // Update agent metrics
    this.updateErrorMetrics(agent)
    
    // Update global metrics
    this.metrics.processing--
    this.metrics.failed++

    // Handle retries
    if (task.maxRetries && task.maxRetries > 0) {
      task.maxRetries--
      
      // Re-queue with delay
      setTimeout(() => {
        this.taskQueue.set(task.id, task)
        this.metrics.pending++
        this.processNextTask()
      }, 5000) // 5 second delay before retry
      
    } else {
      // Create error result
      const errorResult: AIResult = {
        taskId: task.id,
        agentId: agent.id,
        result: null,
        error: error instanceof Error ? error.message : String(error),
        processingTime: Date.now() - (this.processingTasks.get(task.id)?.startTime || Date.now()),
        timestamp: Date.now(),
        cached: false
      }

      this.results.set(task.id, errorResult)
      this.processingTasks.delete(task.id)
      this.emit('taskFailed', errorResult)
    }
  }

  /**
   * Health check and monitoring
   */
  private startHealthCheck(): void {
    setInterval(() => {
      this.performHealthCheck()
    }, 30000) // Every 30 seconds
  }

  private performHealthCheck(): void {
    const now = Date.now()
    
    for (const [agentId, agent] of this.agents) {
      // Check for stuck agents
      if (agent.status === 'BUSY' && (now - agent.lastActive) > 300000) {
        console.warn(`Agent ${agentId} appears stuck, resetting...`)
        agent.status = 'ERROR'
        agent.currentLoad = 0
      }

      // Reset error status after cooldown
      if (agent.status === 'ERROR' && (now - agent.lastActive) > 60000) {
        agent.status = 'IDLE'
        console.log(`Agent ${agentId} recovered from error state`)
      }
    }

    // Clean up old results (keep for 1 hour)
    const oneHourAgo = now - 3600000
    for (const [taskId, result] of this.results) {
      if (result.timestamp < oneHourAgo) {
        this.results.delete(taskId)
      }
    }

    // Clean up expired cache entries
    for (const [key, entry] of this.cache) {
      if (entry.expiry < now) {
        this.cache.delete(key)
      }
    }

    // Update throughput metrics
    this.updateThroughputMetrics()
  }

  /**
   * Task processor that runs continuously
   */
  private startTaskProcessor(): void {
    setInterval(() => {
      if (this.taskQueue.size > 0) {
        this.processNextTask()
      }
    }, 1000) // Check every second
  }

  // ================================
  // CACHING SYSTEM
  // ================================

  private generateCacheKey(task: AITask): string {
    const payload = typeof task.payload === 'string' 
      ? task.payload 
      : JSON.stringify(task.payload, Object.keys(task.payload).sort())
    
    return btoa(payload).substring(0, 32) // Base64 encode and truncate
  }

  private async getCachedResult(task: AITask): Promise<AIResult | null> {
    const cacheKey = this.generateCacheKey(task)
    const cached = this.cache.get(cacheKey)
    
    if (cached && cached.expiry > Date.now()) {
      return {
        ...cached.data,
        cached: true
      }
    }
    
    return null
  }

  private async cacheResult(task: AITask, result: AIResult): Promise<void> {
    const cacheKey = this.generateCacheKey(task)
    this.cache.set(cacheKey, {
      data: result,
      expiry: Date.now() + (this.CACHE_TTL * 1000)
    })
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private validateTask(task: AITask): boolean {
    return !!(task.id && task.type && task.payload)
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getPriorityScore(task: AITask): number {
    const priorityScores: Record<Priority, number> = {
      'LOW': 1,
      'NORMAL': 2,
      'HIGH': 3,
      'URGENT': 4,
      'CRITICAL': 5
    }
    return priorityScores[task.priority] || 1
  }

  private updateSuccessMetrics(agent: AIAgent, processingTime: number): void {
    agent.currentLoad = Math.max(0, agent.currentLoad - 1)
    agent.status = agent.currentLoad === 0 ? 'IDLE' : 'BUSY'
    agent.averageProcessingTime = (agent.averageProcessingTime + processingTime) / 2
    agent.lastActive = Date.now()
  }

  private updateErrorMetrics(agent: AIAgent): void {
    agent.currentLoad = Math.max(0, agent.currentLoad - 1)
    agent.status = 'ERROR'
    agent.successRate = Math.max(0.1, agent.successRate - 0.05)
    agent.lastActive = Date.now()
  }

  private updateThroughputMetrics(): void {
    // Calculate throughput based on completed tasks in last minute
    const oneMinuteAgo = Date.now() - 60000
    let recentCompletions = 0
    
    for (const result of this.results.values()) {
      if (result.timestamp > oneMinuteAgo) {
        recentCompletions++
      }
    }
    
    this.metrics.throughput = recentCompletions
  }

  // ================================
  // PUBLIC API METHODS
  // ================================

  async getAgentStatus(): Promise<AIAgent[]> {
    return Array.from(this.agents.values())
  }

  async getQueueMetrics(): Promise<QueueMetrics> {
    return { ...this.metrics }
  }

  async getTaskStatus(taskId: string): Promise<'queued' | 'processing' | 'completed' | 'failed' | 'not_found'> {
    if (this.results.has(taskId)) {
      const result = this.results.get(taskId)!
      return result.error ? 'failed' : 'completed'
    }
    if (this.processingTasks.has(taskId)) return 'processing'
    if (this.taskQueue.has(taskId)) return 'queued'
    return 'not_found'
  }

  async clearCache(): Promise<void> {
    this.cache.clear()
    console.log('AI Agent cache cleared')
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down AI Agent Orchestrator...')
    
    // Wait for current tasks to complete (max 30 seconds)
    const maxWait = 30000
    const startTime = Date.now()
    
    while (this.processingTasks.size > 0 && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('AI Agent Orchestrator shutdown complete')
  }
}

// Export singleton instance
export const aiOrchestrator = AIAgentOrchestrator.getInstance() 