import { PrismaClient } from '@prisma/client';
import { BusinessRuleEngine, RuleContext } from '../business-rules/business-rule-engine';
import { EnhancedMRPEngine } from '../mrp/mrp-engine-enhanced';
import { EnhancedPlanningAgent } from '../ai-agents/planning/planning-agent-enhanced';

const prisma = new PrismaClient();

export interface OrderWorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  data?: any;
}

export interface OrderWorkflow {
  orderId: string;
  currentStep: number;
  steps: OrderWorkflowStep[];
  status: 'draft' | 'processing' | 'completed' | 'cancelled' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderWorkflowContext {
  order: any;
  customer: any;
  items: any[];
  inventory: any[];
  suppliers: any[];
  mrpResults: any[];
  aiRecommendations: any[];
  businessRules: any[];
}

export class OrderWorkflowEngine {
  private businessRuleEngine: BusinessRuleEngine;
  private mrpEngine: EnhancedMRPEngine;
  private planningAgent: EnhancedPlanningAgent;

  constructor() {
    this.businessRuleEngine = new BusinessRuleEngine();
    this.mrpEngine = new EnhancedMRPEngine();
    this.planningAgent = new EnhancedPlanningAgent('default');
  }

  async createOrderWorkflow(orderData: any, organizationId: string): Promise<OrderWorkflow> {
    // Initialize workflow steps
    const steps: OrderWorkflowStep[] = [
      {
        id: 'order-validation',
        name: 'Order Validation',
        description: 'Validate order data and business rules',
        status: 'pending'
      },
      {
        id: 'inventory-check',
        name: 'Inventory Check',
        description: 'Check inventory availability and allocate stock',
        status: 'pending'
      },
      {
        id: 'mrp-calculation',
        name: 'MRP Calculation',
        description: 'Calculate material requirements and generate planned orders',
        status: 'pending'
      },
      {
        id: 'supplier-selection',
        name: 'Supplier Selection',
        description: 'Select optimal suppliers based on AI recommendations',
        status: 'pending'
      },
      {
        id: 'purchase-order-generation',
        name: 'Purchase Order Generation',
        description: 'Generate purchase orders for required materials',
        status: 'pending'
      },
      {
        id: 'production-scheduling',
        name: 'Production Scheduling',
        description: 'Schedule production activities and resource allocation',
        status: 'pending'
      },
      {
        id: 'quality-control',
        name: 'Quality Control',
        description: 'Set up quality control checkpoints',
        status: 'pending'
      },
      {
        id: 'logistics-planning',
        name: 'Logistics Planning',
        description: 'Plan delivery and shipping logistics',
        status: 'pending'
      },
      {
        id: 'order-confirmation',
        name: 'Order Confirmation',
        description: 'Confirm order and notify customer',
        status: 'pending'
      }
    ];

    const workflow: OrderWorkflow = {
      orderId: orderData.id,
      currentStep: 0,
      steps,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save workflow to database
    await this.saveWorkflow(workflow);
    
    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<OrderWorkflow> {
    const workflow = await this.loadWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    workflow.status = 'processing';
    workflow.updatedAt = new Date();

    // Load business rules
    await this.businessRuleEngine.loadRules(workflow.organizationId || 'default');

    // Execute each step
    for (let i = workflow.currentStep; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      
      try {
        step.status = 'in_progress';
        step.startTime = new Date();
        workflow.updatedAt = new Date();

        // Execute step
        await this.executeStep(step, workflow);

        step.status = 'completed';
        step.endTime = new Date();
        workflow.currentStep = i + 1;

        // Check if workflow is complete
        if (i === workflow.steps.length - 1) {
          workflow.status = 'completed';
          workflow.completedAt = new Date();
        }

        await this.saveWorkflow(workflow);

      } catch (error) {
        step.status = 'failed';
        step.error = error.message;
        step.endTime = new Date();
        workflow.status = 'failed';
        workflow.updatedAt = new Date();
        
        await this.saveWorkflow(workflow);
        throw error;
      }
    }

    return workflow;
  }

  private async executeStep(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    switch (step.id) {
      case 'order-validation':
        await this.executeOrderValidation(step, workflow);
        break;
      case 'inventory-check':
        await this.executeInventoryCheck(step, workflow);
        break;
      case 'mrp-calculation':
        await this.executeMRPCalculation(step, workflow);
        break;
      case 'supplier-selection':
        await this.executeSupplierSelection(step, workflow);
        break;
      case 'purchase-order-generation':
        await this.executePurchaseOrderGeneration(step, workflow);
        break;
      case 'production-scheduling':
        await this.executeProductionScheduling(step, workflow);
        break;
      case 'quality-control':
        await this.executeQualityControl(step, workflow);
        break;
      case 'logistics-planning':
        await this.executeLogisticsPlanning(step, workflow);
        break;
      case 'order-confirmation':
        await this.executeOrderConfirmation(step, workflow);
        break;
      default:
        throw new Error(`Unknown workflow step: ${step.id}`);
    }
  }

  private async executeOrderValidation(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { items: true, customer: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate order data
    const validationResult = await this.businessRuleEngine.validateData('order', {
      customerId: order.customerId,
      items: order.items,
      deliveryDate: order.deliveryDate,
      priority: order.priority
    });

    if (!validationResult.isValid) {
      throw new Error(`Order validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Execute business rules
    const ruleContext: RuleContext = {
      order,
      customer: order.customer,
      totalAmount: order.totalAmount,
      customerCreditLimit: order.customer?.creditLimit || 0
    };

    const ruleResult = await this.businessRuleEngine.executeRules(ruleContext);

    if (ruleResult.violations.length > 0) {
      throw new Error(`Business rule violations: ${ruleResult.violations.map(v => v.message).join(', ')}`);
    }

    step.data = {
      validationResult,
      ruleResult,
      order
    };
  }

  private async executeInventoryCheck(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { items: true }
    });

    const inventoryResults = [];

    for (const orderItem of order.items) {
      const stockLevel = await prisma.stockLevel.findFirst({
        where: {
          itemId: orderItem.itemId,
          organizationId: order.organizationId
        }
      });

      const availableQuantity = stockLevel?.quantityOnHand || 0;
      const requiredQuantity = orderItem.quantity;
      const shortage = Math.max(0, requiredQuantity - availableQuantity);

      inventoryResults.push({
        itemId: orderItem.itemId,
        sku: orderItem.sku,
        requiredQuantity,
        availableQuantity,
        shortage,
        canFulfill: availableQuantity >= requiredQuantity
      });

      // Allocate inventory if available
      if (availableQuantity >= requiredQuantity) {
        await prisma.stockLevel.update({
          where: { id: stockLevel.id },
          data: {
            quantityOnHand: availableQuantity - requiredQuantity,
            quantityReserved: (stockLevel.quantityReserved || 0) + requiredQuantity
          }
        });
      }
    }

    step.data = {
      inventoryResults,
      canFulfill: inventoryResults.every(result => result.canFulfill)
    };
  }

  private async executeMRPCalculation(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { items: true }
    });

    // Calculate MRP for each item
    const mrpResults = [];
    
    for (const orderItem of order.items) {
      const mrpResult = await this.mrpEngine.calculateItemMRP(
        { id: orderItem.itemId, sku: orderItem.sku },
        order.organizationId,
        new Date()
      );
      
      mrpResults.push(mrpResult);
    }

    // Generate planned orders
    const plannedOrders = [];
    for (const mrpResult of mrpResults) {
      if (mrpResult.shortages.length > 0) {
        for (const shortage of mrpResult.shortages) {
          const plannedOrder = await this.createPlannedOrder(shortage, order.organizationId);
          plannedOrders.push(plannedOrder);
        }
      }
    }

    step.data = {
      mrpResults,
      plannedOrders
    };
  }

  private async executeSupplierSelection(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { items: true }
    });

    const supplierSelections = [];

    for (const orderItem of order.items) {
      // Get AI recommendations for supplier selection
      const recommendations = await this.planningAgent.generateSupplierRecommendations(
        orderItem.itemId,
        orderItem.quantity,
        order.organizationId
      );

      // Get available suppliers
      const suppliers = await prisma.supplier.findMany({
        where: {
          organizationId: order.organizationId,
          isActive: true,
          items: {
            some: {
              itemId: orderItem.itemId
            }
          }
        },
        include: {
          contracts: true,
          performanceMetrics: true
        }
      });

      // Select optimal supplier based on AI recommendations and performance
      const selectedSupplier = this.selectOptimalSupplier(suppliers, recommendations);

      supplierSelections.push({
        itemId: orderItem.itemId,
        sku: orderItem.sku,
        selectedSupplier,
        recommendations,
        alternatives: suppliers.filter(s => s.id !== selectedSupplier.id).slice(0, 3)
      });
    }

    step.data = {
      supplierSelections
    };
  }

  private async executePurchaseOrderGeneration(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { items: true }
    });

    const purchaseOrders = [];

    // Group items by supplier
    const itemsBySupplier = new Map();
    
    for (const selection of step.data.supplierSelections) {
      const supplierId = selection.selectedSupplier.id;
      if (!itemsBySupplier.has(supplierId)) {
        itemsBySupplier.set(supplierId, []);
      }
      itemsBySupplier.get(supplierId).push(selection);
    }

    // Generate purchase orders
    for (const [supplierId, items] of itemsBySupplier) {
      const poData = {
        supplierId,
        organizationId: order.organizationId,
        items: items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.selectedSupplier.contracts[0]?.unitPrice || 0,
          deliveryDate: order.deliveryDate
        })),
        totalAmount: items.reduce((sum, item) => sum + (item.quantity * (item.selectedSupplier.contracts[0]?.unitPrice || 0)), 0),
        status: 'DRAFT',
        notes: `Auto-generated for order ${order.orderNumber}`
      };

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: poData,
        include: { supplier: true, items: true }
      });

      purchaseOrders.push(purchaseOrder);
    }

    step.data = {
      ...step.data,
      purchaseOrders
    };
  }

  private async executeProductionScheduling(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { items: true }
    });

    // Get production requirements
    const productionRequirements = await this.calculateProductionRequirements(order);

    // Schedule production activities
    const productionSchedule = await this.scheduleProduction(productionRequirements, order);

    // Allocate resources
    const resourceAllocation = await this.allocateResources(productionSchedule);

    step.data = {
      productionRequirements,
      productionSchedule,
      resourceAllocation
    };
  }

  private async executeQualityControl(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { items: true }
    });

    // Set up quality control checkpoints
    const qualityCheckpoints = [];

    for (const orderItem of order.items) {
      const item = await prisma.item.findUnique({
        where: { id: orderItem.itemId }
      });

      if (item.requiresQualityControl) {
        const checkpoint = {
          itemId: orderItem.itemId,
          sku: orderItem.sku,
          checkpoints: [
            { stage: 'receiving', type: 'inspection', required: true },
            { stage: 'production', type: 'sampling', required: item.qualityLevel === 'high' },
            { stage: 'packaging', type: 'final_check', required: true }
          ]
        };
        qualityCheckpoints.push(checkpoint);
      }
    }

    step.data = {
      qualityCheckpoints
    };
  }

  private async executeLogisticsPlanning(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { customer: true, items: true }
    });

    // Plan delivery route
    const deliveryRoute = await this.planDeliveryRoute(order);

    // Select carrier
    const carrierSelection = await this.selectCarrier(order, deliveryRoute);

    // Calculate shipping costs
    const shippingCosts = await this.calculateShippingCosts(order, carrierSelection);

    step.data = {
      deliveryRoute,
      carrierSelection,
      shippingCosts
    };
  }

  private async executeOrderConfirmation(step: OrderWorkflowStep, workflow: OrderWorkflow): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: workflow.orderId },
      include: { customer: true, items: true }
    });

    // Update order status
    await prisma.order.update({
      where: { id: workflow.orderId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date()
      }
    });

    // Send confirmation to customer
    await this.sendOrderConfirmation(order);

    // Create shipment record
    const shipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        trackingNumber: this.generateTrackingNumber(),
        status: 'CREATED',
        estimatedDeliveryDate: order.deliveryDate,
        carrier: step.data.carrierSelection.carrier.name,
        shippingCost: step.data.shippingCosts.total
      }
    });

    step.data = {
      orderStatus: 'CONFIRMED',
      shipment
    };
  }

  // Helper methods
  private async createPlannedOrder(shortage: any, organizationId: string): Promise<any> {
    return await prisma.plannedOrder.create({
      data: {
        itemId: shortage.itemId,
        quantity: shortage.quantity,
        dueDate: shortage.dueDate,
        type: shortage.type,
        status: 'PLANNED',
        organizationId
      }
    });
  }

  private selectOptimalSupplier(suppliers: any[], recommendations: any[]): any {
    // Simple selection logic - can be enhanced with AI
    return suppliers.sort((a, b) => 
      (b.overallScore || 0) - (a.overallScore || 0)
    )[0];
  }

  private async calculateProductionRequirements(order: any): Promise<any[]> {
    // Calculate production requirements based on BOMs
    const requirements = [];
    
    for (const orderItem of order.items) {
      const bom = await prisma.billOfMaterials.findFirst({
        where: { itemId: orderItem.itemId },
        include: { components: true }
      });

      if (bom) {
        requirements.push({
          itemId: orderItem.itemId,
          quantity: orderItem.quantity,
          bom,
          estimatedDuration: this.calculateProductionDuration(bom, orderItem.quantity)
        });
      }
    }

    return requirements;
  }

  private async scheduleProduction(requirements: any[], order: any): Promise<any[]> {
    // Simple scheduling logic - can be enhanced with advanced algorithms
    const schedule = [];
    let currentDate = new Date();

    for (const requirement of requirements) {
      schedule.push({
        itemId: requirement.itemId,
        startDate: currentDate,
        endDate: new Date(currentDate.getTime() + requirement.estimatedDuration * 24 * 60 * 60 * 1000),
        duration: requirement.estimatedDuration
      });
      currentDate = new Date(currentDate.getTime() + requirement.estimatedDuration * 24 * 60 * 60 * 1000);
    }

    return schedule;
  }

  private async allocateResources(schedule: any[]): Promise<any[]> {
    // Simple resource allocation - can be enhanced
    return schedule.map(item => ({
      ...item,
      resources: ['Machine-1', 'Operator-1'],
      capacity: 100
    }));
  }

  private async planDeliveryRoute(order: any): Promise<any> {
    // Simple route planning - can be enhanced with real mapping APIs
    return {
      origin: 'Warehouse A',
      destination: order.customer.address,
      distance: 150, // km
      estimatedTime: 2.5 // hours
    };
  }

  private async selectCarrier(order: any, route: any): Promise<any> {
    // Simple carrier selection - can be enhanced with real carrier APIs
    return {
      carrier: { name: 'Express Shipping Co.', rating: 4.5 },
      service: 'Standard Delivery',
      cost: 25.00
    };
  }

  private async calculateShippingCosts(order: any, carrier: any): Promise<any> {
    // Simple cost calculation - can be enhanced with real pricing APIs
    return {
      baseCost: carrier.cost,
      fuelSurcharge: carrier.cost * 0.1,
      total: carrier.cost * 1.1
    };
  }

  private async sendOrderConfirmation(order: any): Promise<void> {
    // Send confirmation email/notification
    console.log(`Order confirmation sent for order ${order.orderNumber}`);
  }

  private generateTrackingNumber(): string {
    return `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private calculateProductionDuration(bom: any, quantity: number): number {
    // Simple duration calculation - can be enhanced with real production data
    return Math.ceil(quantity / 100) + 1; // days
  }

  // Database operations
  private async saveWorkflow(workflow: OrderWorkflow): Promise<void> {
    // Save to database - implement as needed
    console.log('Saving workflow:', workflow.orderId);
  }

  private async loadWorkflow(workflowId: string): Promise<OrderWorkflow | null> {
    // Load from database - implement as needed
    return null;
  }
} 