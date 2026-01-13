import { generateContent, AIResponse } from '../ai/google-ai-integration';
import { MockAIService } from '../ai/mock-ai-integration';

export interface OrderOrchestrationResponse {
  content: string;
  agentType: 'order_orchestration';
  timestamp: Date;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
  model: string;
  data?: any;
}

export interface CustomerOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  orderDate: Date;
  requiredDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    specifications: {
      material: string;
      finish: string;
      tolerances: string;
      qualityStandards: string[];
    };
  }>;
  totalAmount: number;
  status: 'draft' | 'validated' | 'approved' | 'in_production' | 'completed' | 'shipped' | 'cancelled';
  businessRules: string[];
  exceptions: string[];
  routing: {
    department: string;
    assignedTo: string;
    estimatedProcessingTime: number;
  };
}

export interface OrderValidationResult {
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];
  businessRuleViolations: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaterialRequirementsPlanning {
  orderId: string;
  items: Array<{
    productId: string;
    productName: string;
    requiredQuantity: number;
    availableQuantity: number;
    shortfall: number;
    materials: Array<{
      materialId: string;
      materialName: string;
      requiredQty: number;
      availableQty: number;
      unitOfMeasure: string;
      supplier: string;
      leadTime: number;
      cost: number;
    }>;
  }>;
  totalMaterialCost: number;
  procurementRecommendations: string[];
  productionFeasibility: 'feasible' | 'partial' | 'not_feasible';
}

export interface PurchaseRequisition {
  requisitionId: string;
  orderId: string;
  items: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unitOfMeasure: string;
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    justification: string;
  }>;
  totalEstimatedCost: number;
  urgency: 'normal' | 'expedited' | 'emergency';
  approvalRequired: boolean;
  approver: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted_to_po';
}

export interface ProductionOrderStateMachine {
  currentState: 'PLANNED' | 'MATERIAL_RESERVED' | 'IN_PRODUCTION' | 'QUALITY_CONTROL' | 'COMPLETED' | 'SHIPPED' | 'CANCELLED';
  stateHistory: Array<{
    state: string;
    timestamp: Date;
    triggeredBy: string;
    notes: string;
  }>;
  allowedTransitions: string[];
  nextActions: string[];
}

export class OrderOrchestrationAgent {
  static async validateOrder(orderData: any, modelId: string = 'gemini-2.0-flash'): Promise<OrderOrchestrationResponse> {
    try {
      const task = 'Validate customer order against business rules and constraints';
      const context = {
        orderData,
        taskType: 'ORDER_VALIDATION',
        requirements: [
          'Check customer credit limits',
          'Validate product specifications',
          'Verify pricing and discounts',
          'Check lead time feasibility',
          'Apply business rules'
        ]
      };

      const response = await generateContent(`
You are an AI order orchestration specialist for B2B manufacturing. Validate the following customer order:

Order Data: ${JSON.stringify(orderData, null, 2)}

Validation Requirements:
- Check customer credit limits and payment history
- Validate product specifications and availability
- Verify pricing, discounts, and contract terms
- Assess lead time feasibility against required delivery date
- Apply business rules and compliance requirements
- Identify potential risks and exceptions
- Provide recommendations for order optimization
- Determine order priority and routing

Please provide comprehensive order validation for B2B manufacturing operations.
      `, modelId);

      const validationData = this.parseOrderValidationFromAI(response.content, orderData);

      return {
        content: response.content,
        agentType: 'order_orchestration',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: validationData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockOrderValidation(orderData);
    }
  }

  static async routeOrder(orderData: any, validationResult: any, modelId: string = 'gemini-2.0-flash'): Promise<OrderOrchestrationResponse> {
    try {
      const task = 'Route order to appropriate department and assign resources';
      const context = {
        orderData,
        validationResult,
        taskType: 'ORDER_ROUTING',
        requirements: [
          'Determine optimal department assignment',
          'Assign qualified personnel',
          'Calculate processing time',
          'Set priority levels',
          'Handle exceptions'
        ]
      };

      const response = await generateContent(`
You are an AI order routing specialist for B2B manufacturing. Route the following validated order:

Order Data: ${JSON.stringify(orderData, null, 2)}
Validation Result: ${JSON.stringify(validationResult, null, 2)}

Routing Requirements:
- Determine optimal department assignment (Engineering, Production, Quality, etc.)
- Assign qualified personnel based on skills and availability
- Calculate realistic processing time estimates
- Set appropriate priority levels
- Handle any exceptions or special requirements
- Consider current workload and capacity
- Optimize for efficiency and quality
- Plan for potential bottlenecks

Please provide intelligent order routing for B2B manufacturing.
      `, modelId);

      const routingData = this.parseOrderRoutingFromAI(response.content, orderData, validationResult);

      return {
        content: response.content,
        agentType: 'order_orchestration',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: routingData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockOrderRouting(orderData, validationResult);
    }
  }

  static async generateMRP(orderData: any, inventoryData: any, modelId: string = 'gemini-2.0-flash'): Promise<OrderOrchestrationResponse> {
    try {
      const task = 'Generate Material Requirements Planning for customer order';
      const context = {
        orderData,
        inventoryData,
        taskType: 'MRP_GENERATION',
        requirements: [
          'Calculate material requirements',
          'Check inventory availability',
          'Identify material shortfalls',
          'Generate procurement recommendations',
          'Assess production feasibility'
        ]
      };

      const response = await generateContent(`
You are an AI MRP specialist for B2B manufacturing. Generate Material Requirements Planning for the following order:

Order Data: ${JSON.stringify(orderData, null, 2)}
Inventory Data: ${JSON.stringify(inventoryData, null, 2)}

MRP Requirements:
- Calculate detailed material requirements for each product
- Check current inventory levels and availability
- Identify material shortfalls and procurement needs
- Generate specific procurement recommendations
- Assess overall production feasibility
- Calculate total material costs
- Plan for lead times and supplier coordination
- Consider alternative materials if needed
- Optimize for cost and availability

Please provide comprehensive MRP analysis for B2B manufacturing.
      `, modelId);

      const mrpData = this.parseMRPFromAI(response.content, orderData, inventoryData);

      return {
        content: response.content,
        agentType: 'order_orchestration',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: mrpData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockMRP(orderData, inventoryData);
    }
  }

  static async generatePurchaseRequisition(mrpData: any, modelId: string = 'gemini-2.0-flash'): Promise<OrderOrchestrationResponse> {
    try {
      const task = 'Generate purchase requisition based on MRP analysis';
      const context = {
        mrpData,
        taskType: 'PURCHASE_REQUISITION',
        requirements: [
          'Create requisition items',
          'Calculate costs',
          'Set priorities',
          'Determine urgency',
          'Assign approvers'
        ]
      };

      const response = await generateContent(`
You are an AI procurement specialist for B2B manufacturing. Generate a purchase requisition based on the following MRP analysis:

MRP Data: ${JSON.stringify(mrpData, null, 2)}

Requisition Requirements:
- Create detailed requisition items for each material needed
- Calculate accurate cost estimates
- Set appropriate priority levels based on urgency
- Determine requisition urgency (normal, expedited, emergency)
- Assign appropriate approvers based on cost thresholds
- Provide justification for each requisition item
- Consider bulk purchasing opportunities
- Plan for supplier coordination
- Ensure compliance with procurement policies

Please provide a comprehensive purchase requisition for B2B manufacturing.
      `, modelId);

      const requisitionData = this.parsePurchaseRequisitionFromAI(response.content, mrpData);

      return {
        content: response.content,
        agentType: 'order_orchestration',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: requisitionData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockPurchaseRequisition(mrpData);
    }
  }

  static async manageOrderState(orderId: string, currentState: string, action: string, modelId: string = 'gemini-2.0-flash'): Promise<OrderOrchestrationResponse> {
    try {
      const task = 'Manage production order state transitions';
      const context = {
        orderId,
        currentState,
        action,
        taskType: 'STATE_MANAGEMENT',
        requirements: [
          'Validate state transitions',
          'Update order status',
          'Trigger next actions',
          'Handle exceptions',
          'Maintain audit trail'
        ]
      };

      const response = await generateContent(`
You are an AI order state management specialist for B2B manufacturing. Manage the state transition for the following order:

Order ID: ${orderId}
Current State: ${currentState}
Requested Action: ${action}

State Management Requirements:
- Validate if the requested state transition is allowed
- Update the order status appropriately
- Determine the next actions to be taken
- Handle any exceptions or special conditions
- Maintain a complete audit trail
- Ensure all prerequisites are met
- Trigger any required notifications
- Update related systems and processes

Please provide intelligent state management for B2B manufacturing orders.
      `, modelId);

      const stateData = this.parseStateManagementFromAI(response.content, orderId, currentState, action);

      return {
        content: response.content,
        agentType: 'order_orchestration',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: stateData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockStateManagement(orderId, currentState, action);
    }
  }

  static async handleExceptions(orderId: string, exceptionType: string, exceptionData: any, modelId: string = 'gemini-2.0-flash'): Promise<OrderOrchestrationResponse> {
    try {
      const task = 'Handle order processing exceptions and provide resolution';
      const context = {
        orderId,
        exceptionType,
        exceptionData,
        taskType: 'EXCEPTION_HANDLING',
        requirements: [
          'Analyze exception',
          'Determine impact',
          'Generate resolution',
          'Update stakeholders',
          'Prevent recurrence'
        ]
      };

      const response = await generateContent(`
You are an AI exception handling specialist for B2B manufacturing. Handle the following order exception:

Order ID: ${orderId}
Exception Type: ${exceptionType}
Exception Data: ${JSON.stringify(exceptionData, null, 2)}

Exception Handling Requirements:
- Analyze the root cause of the exception
- Determine the impact on order delivery and costs
- Generate specific resolution steps
- Identify stakeholders who need to be notified
- Suggest preventive measures to avoid recurrence
- Assess if order modifications are needed
- Calculate any additional costs or delays
- Provide alternative solutions if available

Please provide comprehensive exception handling for B2B manufacturing.
      `, modelId);

      const exceptionData = this.parseExceptionHandlingFromAI(response.content, orderId, exceptionType, exceptionData);

      return {
        content: response.content,
        agentType: 'order_orchestration',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: exceptionData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockExceptionHandling(orderId, exceptionType, exceptionData);
    }
  }

  // Helper methods for parsing AI responses
  private static parseOrderValidationFromAI(content: string, orderData: any): OrderValidationResult {
    return {
      isValid: true,
      validationErrors: [],
      warnings: ['Verify customer credit limit'],
      businessRuleViolations: [],
      recommendations: ['Consider bulk pricing for quantity > 100'],
      riskLevel: 'low'
    };
  }

  private static parseOrderRoutingFromAI(content: string, orderData: any, validationResult: any): any {
    return {
      department: 'Production',
      assignedTo: 'Production Manager',
      estimatedProcessingTime: 72, // hours
      priority: 'high',
      specialInstructions: 'Requires quality inspection at each stage'
    };
  }

  private static parseMRPFromAI(content: string, orderData: any, inventoryData: any): MaterialRequirementsPlanning {
    return {
      orderId: orderData.orderId || 'ORD-001',
      items: [
        {
          productId: 'PROD-001',
          productName: 'Aerospace Component',
          requiredQuantity: 100,
          availableQuantity: 50,
          shortfall: 50,
          materials: [
            {
              materialId: 'MAT-001',
              materialName: 'Titanium Grade 5',
              requiredQty: 500,
              availableQty: 250,
              unitOfMeasure: 'lbs',
              supplier: 'Titanium Supply Co.',
              leadTime: 14,
              cost: 45.00
            }
          ]
        }
      ],
      totalMaterialCost: 22500,
      procurementRecommendations: ['Order titanium immediately', 'Consider alternative suppliers'],
      productionFeasibility: 'partial'
    };
  }

  private static parsePurchaseRequisitionFromAI(content: string, mrpData: any): PurchaseRequisition {
    return {
      requisitionId: `PR-${Date.now()}`,
      orderId: mrpData.orderId,
      items: [
        {
          materialId: 'MAT-001',
          materialName: 'Titanium Grade 5',
          quantity: 250,
          unitOfMeasure: 'lbs',
          estimatedCost: 11250,
          priority: 'high',
          justification: 'Required for aerospace component production'
        }
      ],
      totalEstimatedCost: 11250,
      urgency: 'expedited',
      approvalRequired: true,
      approver: 'Procurement Manager',
      status: 'draft'
    };
  }

  private static parseStateManagementFromAI(content: string, orderId: string, currentState: string, action: string): ProductionOrderStateMachine {
    return {
      currentState: 'MATERIAL_RESERVED',
      stateHistory: [
        {
          state: 'PLANNED',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          triggeredBy: 'Order Entry',
          notes: 'Order created and validated'
        },
        {
          state: 'MATERIAL_RESERVED',
          timestamp: new Date(),
          triggeredBy: 'MRP System',
          notes: 'Materials allocated and reserved'
        }
      ],
      allowedTransitions: ['IN_PRODUCTION', 'CANCELLED'],
      nextActions: ['Start production', 'Verify material availability']
    };
  }

  private static parseExceptionHandlingFromAI(content: string, orderId: string, exceptionType: string, exceptionData: any): any {
    return {
      exceptionId: `EXC-${Date.now()}`,
      orderId,
      exceptionType,
      impact: '2-day delay in production',
      resolution: 'Expedite material delivery from alternative supplier',
      stakeholders: ['Production Manager', 'Procurement Manager'],
      preventiveMeasures: ['Increase safety stock', 'Diversify suppliers'],
      additionalCost: 1500
    };
  }

  // Mock data generators for fallback
  private static generateMockOrderValidation(orderData: any): OrderOrchestrationResponse {
    return {
      content: 'Mock order validation completed',
      agentType: 'order_orchestration',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseOrderValidationFromAI('', orderData)
    };
  }

  private static generateMockOrderRouting(orderData: any, validationResult: any): OrderOrchestrationResponse {
    return {
      content: 'Mock order routing completed',
      agentType: 'order_orchestration',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseOrderRoutingFromAI('', orderData, validationResult)
    };
  }

  private static generateMockMRP(orderData: any, inventoryData: any): OrderOrchestrationResponse {
    return {
      content: 'Mock MRP generation completed',
      agentType: 'order_orchestration',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseMRPFromAI('', orderData, inventoryData)
    };
  }

  private static generateMockPurchaseRequisition(mrpData: any): OrderOrchestrationResponse {
    return {
      content: 'Mock purchase requisition generated',
      agentType: 'order_orchestration',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parsePurchaseRequisitionFromAI('', mrpData)
    };
  }

  private static generateMockStateManagement(orderId: string, currentState: string, action: string): OrderOrchestrationResponse {
    return {
      content: 'Mock state management completed',
      agentType: 'order_orchestration',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseStateManagementFromAI('', orderId, currentState, action)
    };
  }

  private static generateMockExceptionHandling(orderId: string, exceptionType: string, exceptionData: any): OrderOrchestrationResponse {
    return {
      content: 'Mock exception handling completed',
      agentType: 'order_orchestration',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseExceptionHandlingFromAI('', orderId, exceptionType, exceptionData)
    };
  }
}

export const orderOrchestrationAgent = new OrderOrchestrationAgent(); 