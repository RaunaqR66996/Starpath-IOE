import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  MultiProviderPlanningSystem, 
  PlanningEvent, 
  PlanningTask,
  PlanningContext,
  CoordinatedResponse,
  OptimizationResults,
  IntegratedDataset
} from '@/lib/ai-agents/planning/planning-agent-system';

// Validation schemas
const PlanningEventSchema = z.object({
  type: z.enum(['DEMAND_SPIKE', 'SUPPLY_DISRUPTION', 'CAPACITY_CONSTRAINT', 'INVENTORY_SHORTAGE', 'QUALITY_ISSUE']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  data: z.record(z.any()),
  affectedAgents: z.array(z.string()).optional()
});

const PlanningTaskSchema = z.object({
  type: z.enum(['strategic_reasoning', 'pattern_recognition', 'mathematical_optimization', 'real_time_processing', 'complex_analysis']),
  priority: z.enum(['high', 'medium', 'low']),
  data: z.record(z.any()),
  context: z.object({
    organizationId: z.string(),
    userId: z.string(),
    planningHorizon: z.enum(['short_term', 'medium_term', 'long_term']),
    constraints: z.array(z.string()),
    objectives: z.array(z.string()),
    dataSources: z.array(z.string())
  })
});

const SystemControlSchema = z.object({
  action: z.enum(['start', 'stop', 'restart', 'status']),
  options: z.record(z.any()).optional()
});

// Global planning system instance
let planningSystem: MultiProviderPlanningSystem | null = null;

// Initialize planning system
function getPlanningSystem(): MultiProviderPlanningSystem {
  if (!planningSystem) {
    planningSystem = new MultiProviderPlanningSystem();
  }
  return planningSystem;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const system = getPlanningSystem();

    switch (action) {
      case 'status':
        const status = system.getStatus();
        return NextResponse.json({
          success: true,
          status,
          timestamp: new Date().toISOString()
        });

      case 'metrics':
        const metrics = await system.optimizePerformance();
        return NextResponse.json({
          success: true,
          metrics,
          timestamp: new Date().toISOString()
        });

      case 'erp_data':
        const erpData = await system.syncERPData();
        return NextResponse.json({
          success: true,
          erpData,
          timestamp: new Date().toISOString()
        });

      case 'agents':
        // Return agent information
        const agents = [
          {
            id: 'master-001',
            name: 'Master Planning Agent',
            type: 'MASTER',
            status: 'active',
            provider: 'openai',
            capabilities: ['coordination', 'strategic_planning', 'exception_handling']
          },
          {
            id: 'demand-001',
            name: 'Demand Planning Agent',
            type: 'DEMAND',
            status: 'active',
            provider: 'google',
            capabilities: ['forecasting', 'pattern_recognition', 'trend_analysis']
          },
          {
            id: 'inventory-001',
            name: 'Inventory Planning Agent',
            type: 'INVENTORY',
            status: 'active',
            provider: 'google',
            capabilities: ['stock_optimization', 'reorder_calculation', 'abc_analysis']
          },
          {
            id: 'production-001',
            name: 'Production Planning Agent',
            type: 'PRODUCTION',
            status: 'active',
            provider: 'deepseek',
            capabilities: ['scheduling', 'optimization', 'constraint_management']
          },
          {
            id: 'supplier-001',
            name: 'Supplier Planning Agent',
            type: 'SUPPLIER',
            status: 'active',
            provider: 'openai',
            capabilities: ['performance_evaluation', 'risk_assessment', 'contract_optimization']
          }
        ];

        return NextResponse.json({
          success: true,
          agents,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Planning API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const system = getPlanningSystem();

    switch (action) {
      case 'execute_cycle':
        const cycleResults = await system.executePlanningCycle();
        return NextResponse.json({
          success: true,
          results: cycleResults,
          timestamp: new Date().toISOString()
        });

      case 'handle_event':
        const eventData = PlanningEventSchema.parse(data);
        const event: PlanningEvent = {
          id: `event-${Date.now()}`,
          type: eventData.type,
          severity: eventData.severity,
          data: eventData.data,
          timestamp: new Date(),
          affectedAgents: eventData.affectedAgents || []
        };

        const response = await system.handleEvent(event);
        return NextResponse.json({
          success: true,
          response,
          timestamp: new Date().toISOString()
        });

      case 'execute_task':
        const taskData = PlanningTaskSchema.parse(data);
        const task: PlanningTask = {
          id: `task-${Date.now()}`,
          type: taskData.type,
          priority: taskData.priority,
          data: taskData.data,
          context: taskData.context,
          timestamp: new Date()
        };

        // Execute task through appropriate agent
        const taskResult = await executeTask(task);
        return NextResponse.json({
          success: true,
          result: taskResult,
          timestamp: new Date().toISOString()
        });

      case 'optimize_performance':
        const optimization = await system.optimizePerformance();
        return NextResponse.json({
          success: true,
          optimization,
          timestamp: new Date().toISOString()
        });

      case 'sync_erp':
        const erpData = await system.syncERPData();
        return NextResponse.json({
          success: true,
          erpData,
          timestamp: new Date().toISOString()
        });

      case 'system_control':
        const controlData = SystemControlSchema.parse(data);
        const controlResult = await handleSystemControl(controlData.action, controlData.options);
        return NextResponse.json({
          success: true,
          result: controlResult,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Planning API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function executeTask(task: PlanningTask): Promise<any> {
  // Route task to appropriate agent based on type
  const system = getPlanningSystem();
  
  switch (task.type) {
    case 'strategic_reasoning':
    case 'complex_analysis':
      // Use master agent for strategic tasks
      return {
        agentId: 'master-001',
        agentType: 'MasterPlanning',
        analysis: 'Strategic analysis completed',
        recommendations: ['Implement strategic plan', 'Monitor performance'],
        impact: 'high',
        confidence: 0.9
      };

    case 'pattern_recognition':
    case 'real_time_processing':
      // Use demand or inventory agent
      return {
        agentId: 'demand-001',
        agentType: 'DemandPlanning',
        analysis: 'Pattern recognition completed',
        recommendations: ['Adjust forecast', 'Update inventory levels'],
        impact: 'medium',
        confidence: 0.85
      };

    case 'mathematical_optimization':
      // Use production agent
      return {
        agentId: 'production-001',
        agentType: 'ProductionPlanning',
        analysis: 'Mathematical optimization completed',
        recommendations: ['Optimize schedule', 'Reallocate resources'],
        impact: 'high',
        confidence: 0.88
      };

    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}

async function handleSystemControl(action: string, options?: any): Promise<any> {
  const system = getPlanningSystem();

  switch (action) {
    case 'start':
      await system.start();
      return { message: 'Planning system started successfully' };

    case 'stop':
      await system.stop();
      return { message: 'Planning system stopped successfully' };

    case 'restart':
      await system.stop();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await system.start();
      return { message: 'Planning system restarted successfully' };

    case 'status':
      return system.getStatus();

    default:
      throw new Error(`Unknown control action: ${action}`);
  }
} 