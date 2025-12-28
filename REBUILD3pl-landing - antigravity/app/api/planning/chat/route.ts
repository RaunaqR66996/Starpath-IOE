import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MultiProviderPlanningSystem, PlanningTask, PlanningContext } from '@/lib/ai-agents/planning/planning-agent-system';

// Validation schema for chat messages
const ChatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  agentId: z.string().optional(),
  context: z.object({
    organizationId: z.string().default('default'),
    userId: z.string().default('user'),
    planningHorizon: z.enum(['short_term', 'medium_term', 'long_term']).default('medium_term'),
    constraints: z.array(z.string()).default([]),
    objectives: z.array(z.string()).default([]),
    dataSources: z.array(z.string()).default([])
  }).optional()
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, agentId, context } = ChatMessageSchema.parse(body);

    const system = getPlanningSystem();

    // Determine which agent(s) to query
    const agents = agentId ? [agentId] : ['master-001', 'demand-001', 'inventory-001', 'production-001', 'supplier-001'];

    // Create planning task
    const task: PlanningTask = {
      id: `chat-${Date.now()}`,
      type: 'strategic_reasoning', // Default type, will be adjusted based on agent
      priority: 'medium',
      data: { message, context },
      context: context || {
        organizationId: 'default',
        userId: 'user',
        planningHorizon: 'medium_term',
        constraints: [],
        objectives: ['user_query'],
        dataSources: ['chat']
      },
      timestamp: new Date()
    };

    // Get responses from all specified agents
    const responses = await Promise.all(
      agents.map(async (agentId) => {
        try {
          const agentResponse = await queryAgent(agentId, message, task);
          return {
            agentId,
            agentName: getAgentName(agentId),
            agentType: getAgentType(agentId),
            content: agentResponse.content,
            metadata: agentResponse.metadata,
            success: true
          };
        } catch (error) {
          return {
            agentId,
            agentName: getAgentName(agentId),
            agentType: getAgentType(agentId),
            content: `Sorry, I encountered an error while processing your request: ${error}`,
            metadata: null,
            success: false
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      responses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function queryAgent(agentId: string, message: string, task: PlanningTask): Promise<{ content: string; metadata: any }> {
  // Simulate API call to the planning system with specialized prompts
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const agentType = getAgentType(agentId);
  const provider = getAgentProvider(agentId);
  const model = getAgentModel(provider);

  // Generate contextual response based on agent type and message
  const content = generateAgentResponse(agentType, message);
  
  return {
    content,
    metadata: {
      provider,
      model,
      confidence: 0.85 + Math.random() * 0.15,
      executionTime: 1000 + Math.random() * 2000,
      agentId,
      agentType
    }
  };
}

function generateAgentResponse(agentType: string, message: string): string {
  const lowerMessage = message.toLowerCase();
  
  switch (agentType) {
    case 'MASTER':
      if (lowerMessage.includes('strategy') || lowerMessage.includes('coordination')) {
        return `As your Master Planning Coordinator, I can help you with strategic planning and coordination. Based on your query about "${message}", here are my recommendations:

1. **Strategic Alignment**: Ensure all planning functions are aligned with business objectives
2. **Cross-functional Coordination**: Coordinate between demand, supply, production, and inventory
3. **Resource Optimization**: Optimize resource allocation across all planning functions
4. **Performance Monitoring**: Track KPIs and provide strategic insights

Would you like me to analyze specific planning data or coordinate a particular planning cycle?`;
      }
      return `I'm your Master Planning Coordinator, specializing in strategic supply chain planning and cross-functional coordination. I can help you with:

• Strategic planning and long-term optimization
• Cross-agent coordination and alignment
• Exception handling and escalation
• Performance monitoring and optimization
• S&OP integration and planning cycles

What specific planning challenge would you like me to address?`;

    case 'DEMAND':
      if (lowerMessage.includes('forecast') || lowerMessage.includes('demand')) {
        return `As your Demand Planning Specialist, I can help you with demand forecasting and analysis. For your query about "${message}", here's what I can provide:

1. **Time Series Analysis**: Analyze historical demand patterns and trends
2. **Seasonal Pattern Recognition**: Identify seasonal variations and cyclical patterns
3. **Market Trend Analysis**: Assess market conditions and competitive factors
4. **Customer Behavior Prediction**: Segment customers and predict behavior changes
5. **Real-time Demand Sensing**: Adjust forecasts based on current market signals

I can also help with promotional impact modeling and statistical forecasting using ARIMA, Prophet, and Neural Networks. What specific demand planning aspect would you like to explore?`;
      }
      return `I'm your Demand Planning Agent, specializing in advanced forecasting and pattern recognition. I can help you with:

• Historical demand analysis and trend identification
• Seasonal pattern recognition and forecasting
• Customer behavior prediction and segmentation
• Promotional impact modeling
• Real-time demand sensing and adjustment
• Statistical forecasting models (ARIMA, Prophet, Neural Networks)

What demand planning question do you have?`;

    case 'INVENTORY':
      if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
        return `As your Inventory Planning Specialist, I can help optimize your inventory levels. For your query about "${message}", here are my capabilities:

1. **Safety Stock Optimization**: Calculate optimal safety stock across multiple locations
2. **Reorder Point Calculation**: Determine reorder points considering demand variability
3. **ABC Analysis**: Automatically classify inventory items by importance
4. **Multi-echelon Optimization**: Optimize inventory across your supply network
5. **Lead Time Management**: Assess and optimize supplier lead times
6. **Service Level Optimization**: Balance service levels with inventory costs

I can also help with inventory turnover optimization and real-time stock monitoring. What inventory challenge are you facing?`;
      }
      return `I'm your Inventory Planning Agent, specializing in multi-echelon inventory optimization. I can help you with:

• Safety stock optimization across multiple locations
• Reorder point calculations with demand variability
• ABC analysis automation and classification
• Multi-echelon inventory optimization
• Supplier lead time management and risk assessment
• Inventory turnover optimization
• Service level target achievement

What inventory planning question can I help you with?`;

    case 'PRODUCTION':
      if (lowerMessage.includes('production') || lowerMessage.includes('schedule')) {
        return `As your Production Planning Specialist, I can help optimize your production scheduling. For your query about "${message}", here's what I can provide:

1. **Finite Capacity Scheduling**: Optimize production schedules considering capacity constraints
2. **Resource Allocation**: Allocate resources efficiently across production lines
3. **Work Order Sequencing**: Optimize the sequence of work orders for maximum efficiency
4. **Bottleneck Identification**: Identify and resolve production bottlenecks
5. **Quality Control Integration**: Integrate quality control into production planning
6. **Mathematical Optimization**: Use advanced algorithms for optimal scheduling

I can also help with changeover optimization and maintenance planning integration. What production planning challenge do you need help with?`;
      }
      return `I'm your Production Planning Agent, specializing in mathematical optimization and scheduling. I can help you with:

• Finite capacity scheduling optimization
• Resource allocation and constraint management
• Work order generation and sequencing
• Bottleneck identification and resolution
• Quality control planning integration
• Mathematical optimization using genetic algorithms
• Constraint programming and linear programming

What production planning question do you have?`;

    case 'SUPPLIER':
      if (lowerMessage.includes('supplier') || lowerMessage.includes('vendor')) {
        return `As your Supplier Planning Specialist, I can help evaluate and optimize your supplier relationships. For your query about "${message}", here are my capabilities:

1. **Supplier Performance Evaluation**: Score and evaluate supplier performance
2. **Risk Assessment**: Assess supplier risks and develop mitigation strategies
3. **Cost Optimization**: Analyze total cost of ownership and optimize costs
4. **Quality Metrics**: Evaluate quality performance and compliance
5. **Delivery Performance**: Optimize delivery performance and lead times
6. **Contract Optimization**: Support contract negotiations and optimization
7. **Alternative Sourcing**: Develop alternative sourcing strategies

I can also help with supplier relationship management and performance tracking. What supplier-related question do you have?`;
      }
      return `I'm your Supplier Planning Agent, specializing in supplier relationship management and strategic sourcing. I can help you with:

• Supplier performance evaluation and scoring
• Risk assessment and mitigation strategy development
• Contract optimization and negotiation support
• Alternative sourcing strategy development
• Supplier relationship management automation
• Total cost of ownership analysis
• Quality and compliance assessment

What supplier planning question can I help you with?`;

    default:
      return `I'm an AI planning agent and I'm here to help you with your planning questions. How can I assist you today?`;
  }
}

function getAgentName(agentId: string): string {
  const agentNames: Record<string, string> = {
    'master-001': 'Master Planning Agent',
    'demand-001': 'Demand Planning Agent',
    'inventory-001': 'Inventory Planning Agent',
    'production-001': 'Production Planning Agent',
    'supplier-001': 'Supplier Planning Agent'
  };
  return agentNames[agentId] || 'Unknown Agent';
}

function getAgentType(agentId: string): string {
  const agentTypes: Record<string, string> = {
    'master-001': 'MASTER',
    'demand-001': 'DEMAND',
    'inventory-001': 'INVENTORY',
    'production-001': 'PRODUCTION',
    'supplier-001': 'SUPPLIER'
  };
  return agentTypes[agentId] || 'UNKNOWN';
}

function getAgentProvider(agentId: string): string {
  const agentProviders: Record<string, string> = {
    'master-001': 'openai',
    'demand-001': 'google',
    'inventory-001': 'google',
    'production-001': 'deepseek',
    'supplier-001': 'openai'
  };
  return agentProviders[agentId] || 'openai';
}

function getAgentModel(provider: string): string {
  const models: Record<string, string> = {
    'openai': 'gpt-4-turbo',
    'google': 'gemini-1.5-pro',
    'deepseek': 'deepseek-chat'
  };
  return models[provider] || 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'agents':
        // Return available agents for chat
        const agents = [
          {
            id: 'master-001',
            name: 'Master Planning Agent',
            type: 'MASTER',
            provider: 'openai',
            capabilities: ['Strategic Planning', 'Coordination', 'Exception Handling'],
            status: 'active',
            description: 'Strategic planning coordinator with expertise in supply chain strategy'
          },
          {
            id: 'demand-001',
            name: 'Demand Planning Agent',
            type: 'DEMAND',
            provider: 'google',
            capabilities: ['Forecasting', 'Pattern Recognition', 'Trend Analysis'],
            status: 'active',
            description: 'Demand forecasting specialist using advanced pattern recognition'
          },
          {
            id: 'inventory-001',
            name: 'Inventory Planning Agent',
            type: 'INVENTORY',
            provider: 'google',
            capabilities: ['Stock Optimization', 'ABC Analysis', 'Lead Time Management'],
            status: 'active',
            description: 'Inventory optimization expert for multi-echelon management'
          },
          {
            id: 'production-001',
            name: 'Production Planning Agent',
            type: 'PRODUCTION',
            provider: 'deepseek',
            capabilities: ['Scheduling', 'Optimization', 'Constraint Management'],
            status: 'active',
            description: 'Production scheduling specialist using mathematical optimization'
          },
          {
            id: 'supplier-001',
            name: 'Supplier Planning Agent',
            type: 'SUPPLIER',
            provider: 'openai',
            capabilities: ['Performance Evaluation', 'Risk Assessment', 'Contract Optimization'],
            status: 'active',
            description: 'Supplier relationship manager and strategic sourcing expert'
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
    console.error('Chat API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 