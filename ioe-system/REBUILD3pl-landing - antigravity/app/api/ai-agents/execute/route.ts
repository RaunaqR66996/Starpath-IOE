import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AIAgentOrchestrator } from '@/lib/ai/agent-orchestrator'

// Define types locally to match orchestrator
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

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'

// Get singleton instance
const aiOrchestrator = AIAgentOrchestrator.getInstance()

// Request validation schemas
const TaskRequestSchema = z.object({
  type: z.enum([
    'DEMAND_FORECAST',
    'INVENTORY_OPTIMIZATION', 
    'SUPPLY_PLANNING',
    'RISK_ASSESSMENT',
    'CAPACITY_PLANNING',
    'SCENARIO_MODELING',
    'COLLABORATIVE_PLANNING',
    'PERFORMANCE_ANALYSIS',
    'PO_GENERATION',
    'SUPPLIER_COMPARISON',
    'COST_ANALYSIS',
    'APPROVAL_WORKFLOW',
    'ROUTE_OPTIMIZATION',
    'CARRIER_SELECTION',
    'SHIPMENT_TRACKING',
    'EXCEPTION_HANDLING',
    'CHAT_RESPONSE',
    'ESCALATION_HANDLING',
    'KNOWLEDGE_BASE_QUERY',
    'TICKET_CLASSIFICATION'
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  payload: z.record(z.any()),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  timeout: z.number().min(1000).max(300000).default(60000),
  maxRetries: z.number().min(0).max(5).default(3)
})

const BatchRequestSchema = z.object({
  tasks: z.array(TaskRequestSchema).min(1).max(10),
  maxConcurrency: z.number().min(1).max(5).default(3)
})

// POST /api/ai-agents/execute - Submit single task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = TaskRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: validation.error.errors
      }, { status: 400 })
    }

    const taskData = validation.data

    // Submit task to orchestrator
    const taskId = await aiOrchestrator.submitTask({
      type: taskData.type as AITaskType,
      priority: taskData.priority as Priority,
      payload: taskData.payload,
      userId: taskData.userId,
      organizationId: taskData.organizationId,
      timeout: taskData.timeout,
      maxRetries: taskData.maxRetries,
      tags: [`api-request`, `type-${taskData.type.toLowerCase()}`]
    })

    // For quick tasks, wait for immediate result
    if (taskData.timeout <= 10000) {
      try {
        const result = await aiOrchestrator.getResult(taskId, taskData.timeout)
        return NextResponse.json({
          success: true,
          taskId,
          result: result.result,
          agentId: result.agentId,
          processingTime: result.processingTime,
          cost: result.cost,
          tokensUsed: result.tokensUsed,
          cached: result.cached
        })
      } catch (timeoutError) {
        // Return task ID for polling
        return NextResponse.json({
          success: true,
          taskId,
          status: 'processing',
          message: 'Task is processing. Use GET /api/ai-agents/execute/{taskId} to check status.'
        }, { status: 202 })
      }
    }

    // Return task ID for polling
    return NextResponse.json({
      success: true,
      taskId,
      status: 'queued',
      message: 'Task submitted successfully. Use GET endpoint to check status.',
      estimatedWaitTime: await estimateWaitTime(taskData.type)
    }, { status: 202 })

  } catch (error) {
    console.error('Task submission error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to submit task',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// GET /api/ai-agents/execute?taskId=xxx - Get task result
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    
    if (!taskId) {
      return NextResponse.json({
        success: false,
        error: 'taskId parameter is required'
      }, { status: 400 })
    }

    // Check task status
    const status = await aiOrchestrator.getTaskStatus(taskId)
    
    if (status === 'not_found') {
      return NextResponse.json({
        success: false,
        error: 'Task not found'
      }, { status: 404 })
    }

    if (status === 'queued' || status === 'processing') {
      const queueMetrics = await aiOrchestrator.getQueueMetrics()
      return NextResponse.json({
        success: true,
        taskId,
        status,
        queuePosition: status === 'queued' ? queueMetrics.pending : null,
        estimatedWaitTime: await estimateWaitTime('GENERAL')
      })
    }

    // Get completed result
    try {
      const result = await aiOrchestrator.getResult(taskId, 1000) // Quick fetch
      
      if (result.error) {
        return NextResponse.json({
          success: false,
          taskId,
          status: 'failed',
          error: result.error,
          processingTime: result.processingTime
        })
      }

      return NextResponse.json({
        success: true,
        taskId,
        status: 'completed',
        result: result.result,
        agentId: result.agentId,
        processingTime: result.processingTime,
        cost: result.cost,
        tokensUsed: result.tokensUsed,
        cached: result.cached,
        timestamp: result.timestamp
      })

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve result'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Task retrieval error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT /api/ai-agents/execute/batch - Submit batch of tasks
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = BatchRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid batch request parameters',
        details: validation.error.errors
      }, { status: 400 })
    }

    const { tasks, maxConcurrency } = validation.data

    // Submit all tasks
    const taskSubmissions = await Promise.allSettled(
      tasks.map(async (taskData) => {
        const taskId = await aiOrchestrator.submitTask({
          type: taskData.type as AITaskType,
          priority: taskData.priority as Priority,
          payload: taskData.payload,
          userId: taskData.userId,
          organizationId: taskData.organizationId,
          timeout: taskData.timeout,
          maxRetries: taskData.maxRetries,
          tags: [`batch-request`, `type-${taskData.type.toLowerCase()}`]
        })
        return { taskData, taskId }
      })
    )

    // Process results
    const submittedTasks: any[] = []
    const failedTasks: any[] = []

    taskSubmissions.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        submittedTasks.push({
          index,
          taskId: result.value.taskId,
          type: result.value.taskData.type,
          status: 'submitted'
        })
      } else {
        failedTasks.push({
          index,
          type: tasks[index].type,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        })
      }
    })

    return NextResponse.json({
      success: true,
      batchId: `batch_${Date.now()}`,
      submitted: submittedTasks.length,
      failed: failedTasks.length,
      tasks: submittedTasks,
      failures: failedTasks,
      message: `Submitted ${submittedTasks.length} tasks successfully. Use individual task IDs to check status.`
    })

  } catch (error) {
    console.error('Batch submission error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to submit batch tasks',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// PATCH /api/ai-agents/execute - Get system status
export async function PATCH(request: NextRequest) {
  try {
    const [agents, metrics] = await Promise.all([
      aiOrchestrator.getAgentStatus(),
      aiOrchestrator.getQueueMetrics()
    ])

    // Calculate system health
    const activeAgents = agents.filter((a: any) => a.status === 'IDLE' || a.status === 'BUSY').length
    const totalAgents = agents.length
    const healthScore = (activeAgents / totalAgents) * 100

    // Calculate average response time
    const avgResponseTime = agents.reduce((sum: number, agent: any) => sum + agent.averageProcessingTime, 0) / agents.length

    // Calculate cost efficiency
    const totalTasks = metrics.completed + metrics.failed
    const successRate = totalTasks > 0 ? (metrics.completed / totalTasks) * 100 : 100

    return NextResponse.json({
      success: true,
      system: {
        health: healthScore,
        status: healthScore > 80 ? 'healthy' : healthScore > 60 ? 'degraded' : 'critical',
        totalAgents,
        activeAgents,
        avgResponseTime: Math.round(avgResponseTime),
        successRate: Math.round(successRate * 10) / 10,
        throughput: metrics.throughput
      },
      queue: {
        pending: metrics.pending,
        processing: metrics.processing,
        completed: metrics.completed,
        failed: metrics.failed,
        averageWaitTime: metrics.averageWaitTime,
        averageProcessingTime: metrics.averageProcessingTime
      },
      agents: agents.map(agent => ({
        id: agent.id,
        type: agent.type,
        status: agent.status,
        currentLoad: agent.currentLoad,
        maxConcurrent: agent.maxConcurrent,
        successRate: Math.round(agent.successRate * 100),
        avgProcessingTime: Math.round(agent.averageProcessingTime),
        capabilities: agent.capabilities.length,
        lastActive: new Date(agent.lastActive).toISOString()
      }))
    })

  } catch (error) {
    console.error('Status retrieval error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve system status'
    }, { status: 500 })
  }
}

// Helper function to estimate wait time
async function estimateWaitTime(taskType: string): Promise<number> {
  try {
    const metrics = await aiOrchestrator.getQueueMetrics()
    const baseTime = 5000 // 5 seconds base
    const queueFactor = metrics.pending * 1000 // 1 second per pending task
    const complexityFactor = getTaskComplexityFactor(taskType)
    
    return Math.min(baseTime + queueFactor + complexityFactor, 300000) // Max 5 minutes
  } catch {
    return 10000 // Default 10 seconds
  }
}

function getTaskComplexityFactor(taskType: string): number {
  const complexityMap: Record<string, number> = {
    'CHAT_RESPONSE': 1000,
    'TICKET_CLASSIFICATION': 2000,
    'COST_ANALYSIS': 5000,
    'SUPPLIER_COMPARISON': 8000,
    'DEMAND_FORECAST': 10000,
    'ROUTE_OPTIMIZATION': 12000,
    'SCENARIO_MODELING': 15000,
    'COLLABORATIVE_PLANNING': 18000
  }
  
  return complexityMap[taskType] || 5000
} 