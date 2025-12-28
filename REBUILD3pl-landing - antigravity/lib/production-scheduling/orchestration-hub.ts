import { 
  ProductionOrder, 
  Resource, 
  WorkOrder, 
  Schedule, 
  DisruptionEvent, 
  Alert, 
  ScheduleUpdate, 
  ResourceUpdate,
  PerformanceMetrics,
  ProductionLine
} from './types';
import { IntelligentProductionScheduler } from './scheduling-engine';
import { MultiProviderAI } from './ai-integration';

export class ProductionOrchestrator {
  private scheduler: IntelligentProductionScheduler;
  private ai: MultiProviderAI;
  private productionLines: Map<string, ProductionLine>;
  private workOrders: Map<string, WorkOrder>;
  private activeDisruptions: Map<string, DisruptionEvent>;
  private alerts: Alert[];
  private performanceMetrics: PerformanceMetrics[];
  private updateCallbacks: Map<string, (update: any) => void>;

  constructor() {
    this.scheduler = new IntelligentProductionScheduler();
    this.ai = new MultiProviderAI();
    this.productionLines = new Map();
    this.workOrders = new Map();
    this.activeDisruptions = new Map();
    this.alerts = [];
    this.performanceMetrics = [];
    this.updateCallbacks = new Map();

    this.initializeProductionLines();
  }

  /**
   * Initialize production lines with mock data
   */
  private initializeProductionLines() {
    const lines = [
      {
        id: 'line-1',
        name: 'Assembly Line 1',
        description: 'High-volume assembly line for Product A',
        capacity: 100,
        efficiency: 0.85,
        location: 'Building A',
        status: 'active' as const
      },
      {
        id: 'line-2',
        name: 'Assembly Line 2',
        description: 'Flexible assembly line for multiple products',
        capacity: 80,
        efficiency: 0.78,
        location: 'Building B',
        status: 'active' as const
      },
      {
        id: 'line-3',
        name: 'Packaging Line 1',
        description: 'Automated packaging and labeling',
        capacity: 120,
        efficiency: 0.92,
        location: 'Building C',
        status: 'active' as const
      }
    ];

    lines.forEach(line => {
      this.productionLines.set(line.id, {
        ...line,
        machines: this.generateMachinesForLine(line.id),
        labor: this.generateLaborForLine(line.id),
        materials: this.generateMaterialsForLine(line.id)
      });
    });
  }

  /**
   * Generate mock machines for production line
   */
  private generateMachinesForLine(lineId: string): any[] {
    const machines = [
      {
        id: `${lineId}-machine-1`,
        name: 'Assembly Machine 1',
        type: 'machine' as const,
        capacity: 50,
        availability: 0.95,
        costPerHour: 25,
        location: 'Line 1',
        status: 'available' as const,
        currentUtilization: 0.75,
        maxUtilization: 0.95,
        machineType: 'Assembly',
        efficiency: 0.88,
        quality: 0.92
      },
      {
        id: `${lineId}-machine-2`,
        name: 'Testing Machine 1',
        type: 'machine' as const,
        capacity: 40,
        availability: 0.90,
        costPerHour: 30,
        location: 'Line 1',
        status: 'available' as const,
        currentUtilization: 0.65,
        maxUtilization: 0.90,
        machineType: 'Testing',
        efficiency: 0.85,
        quality: 0.95
      }
    ];

    return machines;
  }

  /**
   * Generate mock labor for production line
   */
  private generateLaborForLine(lineId: string): any[] {
    return [
      {
        id: `${lineId}-labor-1`,
        name: 'Operator 1',
        type: 'labor' as const,
        capacity: 1,
        availability: 0.95,
        costPerHour: 18,
        location: 'Line 1',
        status: 'available' as const,
        currentUtilization: 0.80,
        maxUtilization: 1.0,
        skillLevel: 4,
        experience: 5,
        shift: 'Day',
        overtimeEligible: true
      },
      {
        id: `${lineId}-labor-2`,
        name: 'Supervisor 1',
        type: 'labor' as const,
        capacity: 1,
        availability: 0.90,
        costPerHour: 25,
        location: 'Line 1',
        status: 'available' as const,
        currentUtilization: 0.60,
        maxUtilization: 1.0,
        skillLevel: 5,
        experience: 8,
        shift: 'Day',
        overtimeEligible: true
      }
    ];
  }

  /**
   * Generate mock materials for production line
   */
  private generateMaterialsForLine(lineId: string): any[] {
    return [
      {
        id: `${lineId}-material-1`,
        name: 'Component A',
        type: 'material' as const,
        capacity: 1000,
        availability: 0.85,
        costPerHour: 0,
        location: 'Warehouse A',
        status: 'available' as const,
        currentUtilization: 0.70,
        maxUtilization: 1.0,
        supplier: 'Supplier A',
        leadTime: 7,
        reorderPoint: 200,
        currentStock: 750,
        unitCost: 5.50
      }
    ];
  }

  /**
   * Generate work orders from production orders
   */
  async generateWorkOrders(orders: ProductionOrder[]): Promise<WorkOrder[]> {
    const workOrders: WorkOrder[] = [];

    for (const order of orders) {
      // Determine optimal production line
      const optimalLine = await this.selectOptimalProductionLine(order);
      
      // Create work order
      const workOrder: WorkOrder = {
        id: `wo-${order.id}`,
        orderId: order.id,
        productionLineId: optimalLine.id,
        status: 'created',
        assignedResources: [],
        qualityMetrics: {
          defectRate: 0,
          reworkRate: 0,
          scrapRate: 0,
          customerComplaints: 0,
          qualityScore: 100
        },
        costMetrics: {
          materialCost: 0,
          laborCost: 0,
          overheadCost: 0,
          totalCost: 0,
          costPerUnit: 0,
          variance: 0
        }
      };

      // Assign resources
      workOrder.assignedResources = await this.assignResources(order, optimalLine);
      
      workOrders.push(workOrder);
      this.workOrders.set(workOrder.id, workOrder);
    }

    return workOrders;
  }

  /**
   * Select optimal production line using AI
   */
  private async selectOptimalProductionLine(order: ProductionOrder): Promise<ProductionLine> {
    const selectionPrompt = `
      Select the optimal production line for the following order:
      
      Order: ${JSON.stringify(order)}
      Available Lines: ${JSON.stringify(Array.from(this.productionLines.values()))}
      
      Consider:
      1. Line capacity and availability
      2. Product compatibility
      3. Resource requirements
      4. Efficiency and quality metrics
      5. Current workload
    `;

    const aiResponse = await this.ai.query('openai', 'strategic_planning', selectionPrompt);
    
    // Parse AI response and select line
    const recommendedLineId = this.parseLineRecommendation(aiResponse);
    return this.productionLines.get(recommendedLineId) || Array.from(this.productionLines.values())[0];
  }

  /**
   * Assign resources to work order
   */
  private async assignResources(order: ProductionOrder, line: ProductionLine): Promise<string[]> {
    const assignmentPrompt = `
      Assign optimal resources for the following work order:
      
      Order: ${JSON.stringify(order)}
      Production Line: ${JSON.stringify(line)}
      
      Assign:
      1. Required machines
      2. Skilled labor
      3. Materials
      
      Ensure:
      1. Resource availability
      2. Skill compatibility
      3. Cost optimization
      4. Quality requirements
    `;

    const aiResponse = await this.ai.query('deepseek', 'mathematical_optimization', assignmentPrompt);
    
    return this.parseResourceAssignment(aiResponse, line);
  }

  /**
   * Update schedule and notify all subscribers
   */
  async updateSchedule(schedule: Schedule): Promise<void> {
    // Update scheduler
    this.scheduler = new IntelligentProductionScheduler();
    
    // Generate work orders for new schedule
    const workOrders = await this.generateWorkOrders(schedule.orders);
    
    // Create schedule update
    const update: ScheduleUpdate = {
      type: 'order_scheduled',
      timestamp: new Date(),
      data: { schedule, workOrders },
      scheduleId: schedule.id
    };

    // Notify all subscribers
    this.notifySubscribers('schedule', update);
    
    // Update performance metrics
    await this.updatePerformanceMetrics(schedule);
  }

  /**
   * Handle real-time disruptions
   */
  async handleDisruption(disruption: DisruptionEvent): Promise<void> {
    // Add to active disruptions
    this.activeDisruptions.set(disruption.id, disruption);
    
    // Create alert
    const alert: Alert = {
      id: `alert-${disruption.id}`,
      type: 'error',
      severity: disruption.severity,
      title: `Disruption: ${disruption.type}`,
      message: disruption.description,
      timestamp: new Date(),
      source: disruption.affectedResourceId,
      affectedResources: [disruption.affectedResourceId],
      affectedOrders: disruption.impact.affectedOrders,
      actionRequired: true,
      resolved: false
    };

    this.alerts.push(alert);

    // Trigger replanning
    const replanningResult = await this.scheduler.handleDisruption(disruption);
    
    // Update schedule with new plan
    await this.updateSchedule(replanningResult.newSchedule);
    
    // Create disruption update
    const update: ScheduleUpdate = {
      type: 'replanning_executed',
      timestamp: new Date(),
      data: { disruption, replanningResult },
      scheduleId: replanningResult.newSchedule.id
    };

    this.notifySubscribers('disruption', update);
  }

  /**
   * Monitor resource status and trigger alerts
   */
  async monitorResources(): Promise<void> {
    for (const line of this.productionLines.values()) {
      for (const resource of [...line.machines, ...line.labor, ...line.materials]) {
        const status = await this.checkResourceStatus(resource);
        
        if (status.needsAttention) {
          const alert: Alert = {
            id: `alert-${resource.id}`,
            type: 'warning',
            severity: status.severity,
            title: `Resource Alert: ${resource.name}`,
            message: status.message,
            timestamp: new Date(),
            source: resource.id,
            affectedResources: [resource.id],
            actionRequired: status.actionRequired,
            resolved: false
          };

          this.alerts.push(alert);
        }

        // Create resource update
        const update: ResourceUpdate = {
          type: 'utilization_update',
          timestamp: new Date(),
          resourceId: resource.id,
          data: { status: resource.status, utilization: resource.currentUtilization }
        };

        this.notifySubscribers('resource', update);
      }
    }
  }

  /**
   * Check resource status and health
   */
  private async checkResourceStatus(resource: any): Promise<any> {
    const statusPrompt = `
      Analyze the health and status of the following resource:
      
      Resource: ${JSON.stringify(resource)}
      
      Determine:
      1. Current health status
      2. Potential issues
      3. Maintenance needs
      4. Performance degradation
      5. Risk factors
    `;

    const aiResponse = await this.ai.query('google', 'pattern_recognition', statusPrompt);
    
    return this.parseResourceStatus(aiResponse, resource);
  }

  /**
   * Update performance metrics
   */
  private async updatePerformanceMetrics(schedule: Schedule): Promise<void> {
    const metrics: PerformanceMetrics = {
      id: `metrics-${Date.now()}`,
      timestamp: new Date(),
      scheduleId: schedule.id,
      makespan: schedule.totalMakespan,
      resourceUtilization: schedule.resourceUtilization,
      setupTimeEfficiency: schedule.setupTimeReduction,
      constraintViolations: 0, // Calculate from validation
      costPerUnit: this.calculateCostPerUnit(schedule),
      qualityScore: this.calculateQualityScore(schedule),
      onTimeDelivery: this.calculateOnTimeDelivery(schedule),
      aiOptimizationImpact: this.calculateAIImpact(schedule)
    };

    this.performanceMetrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(type: string, callback: (update: any) => void): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random()}`;
    this.updateCallbacks.set(subscriptionId, callback);
    return subscriptionId;
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    this.updateCallbacks.delete(subscriptionId);
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(type: string, update: any): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback({ type, ...update });
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  /**
   * Parse AI responses
   */
  private parseLineRecommendation(aiResponse: any): string {
    // Parse AI response to extract recommended line ID
    if (aiResponse.recommendedLine) {
      return aiResponse.recommendedLine;
    }
    
    // Fallback to first available line
    return Array.from(this.productionLines.keys())[0];
  }

  private parseResourceAssignment(aiResponse: any, line: ProductionLine): string[] {
    // Parse AI response to extract resource assignments
    if (aiResponse.assignedResources) {
      return aiResponse.assignedResources;
    }
    
    // Fallback to basic resource assignment
    const resources: string[] = [];
    
    // Add first available machine
    if (line.machines.length > 0) {
      resources.push(line.machines[0].id);
    }
    
    // Add first available labor
    if (line.labor.length > 0) {
      resources.push(line.labor[0].id);
    }
    
    return resources;
  }

  private parseResourceStatus(aiResponse: any, resource: any): any {
    // Parse AI response to determine resource status
    return {
      needsAttention: aiResponse.needsAttention || false,
      severity: aiResponse.severity || 'low',
      message: aiResponse.message || 'Resource operating normally',
      actionRequired: aiResponse.actionRequired || false
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculateCostPerUnit(schedule: Schedule): number {
    // Calculate average cost per unit across all orders
    const totalCost = schedule.orders.reduce((sum, order) => sum + (order.revenue * 0.6), 0);
    const totalUnits = schedule.orders.reduce((sum, order) => sum + order.quantity, 0);
    return totalUnits > 0 ? totalCost / totalUnits : 0;
  }

  private calculateQualityScore(schedule: Schedule): number {
    // Calculate quality score based on work order quality metrics
    const workOrders = Array.from(this.workOrders.values());
    if (workOrders.length === 0) return 100;

    const totalQuality = workOrders.reduce((sum, wo) => sum + wo.qualityMetrics.qualityScore, 0);
    return totalQuality / workOrders.length;
  }

  private calculateOnTimeDelivery(schedule: Schedule): number {
    // Calculate on-time delivery percentage
    const completedOrders = schedule.orders.filter(order => 
      order.status === 'completed' && order.actualEndTime && order.actualEndTime <= order.deadline
    );
    
    return schedule.orders.length > 0 ? (completedOrders.length / schedule.orders.length) * 100 : 100;
  }

  private calculateAIImpact(schedule: Schedule): number {
    // Calculate AI optimization impact
    return schedule.setupTimeReduction + schedule.resourceUtilization * 0.1;
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return {
      productionLines: Array.from(this.productionLines.values()),
      workOrders: Array.from(this.workOrders.values()),
      activeDisruptions: Array.from(this.activeDisruptions.values()),
      alerts: this.alerts,
      performanceMetrics: this.performanceMetrics.slice(-10) // Last 10 metrics
    };
  }

  /**
   * Get production line by ID
   */
  getProductionLine(lineId: string): ProductionLine | undefined {
    return this.productionLines.get(lineId);
  }

  /**
   * Get work order by ID
   */
  getWorkOrder(workOrderId: string): WorkOrder | undefined {
    return this.workOrders.get(workOrderId);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, actionTaken: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.actionTaken = actionTaken;
    }
  }
} 