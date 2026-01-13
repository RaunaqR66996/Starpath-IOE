import { eventStore, OrderEventFactory } from '../events/event-store';
import { notificationService } from '../realtime/notification-service';
import { MRPEngine } from '../mrp/mrp-engine';
import { PurchaseOrderAutomation } from '../automation/purchase-order-automation';

export interface OrderLifecycleManager {
  phases: {
    'Order Creation': 'Customer requirement capture';
    'Order Processing': 'Validation and approval';
    'Material Planning': 'Procurement requirements';
    'Production Planning': 'Manufacturing schedule';
    'Quality Assurance': 'Inspection and testing';
    'Fulfillment': 'Packaging and shipping';
    'Post-Delivery': 'Returns and warranty';
  };
}

export interface OrderLifecycleOrderDetails {
  orderNumber: string;
  customerName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalValue?: number;
  totalItems?: number;
  warehouse?: string;
  externalId?: string;
}

export interface PhaseHistoryEntry {
  phase: keyof OrderLifecycleManager['phases'];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
  notes?: string;
}

export interface OrderLifecycleState {
  orderId: string;
  currentPhase: keyof OrderLifecycleManager['phases'];
  phaseStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  phaseData: Record<string, any>;
  startTime: Date;
  estimatedCompletion: Date;
  actualCompletion?: Date;
  blockers: string[];
  dependencies: string[];
  assignedTeam: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  organizationId: string;
  orderDetails: OrderLifecycleOrderDetails;
  phaseHistory: PhaseHistoryEntry[];
}

export interface PhaseTransition {
  fromPhase: keyof OrderLifecycleManager['phases'];
  toPhase: keyof OrderLifecycleManager['phases'];
  trigger: string;
  conditions: string[];
  actions: string[];
  estimatedDuration: number;
}

export interface OrderLifecycleEvent {
  orderId: string;
  phase: keyof OrderLifecycleManager['phases'];
  eventType: 'phase_started' | 'phase_completed' | 'phase_failed' | 'phase_blocked';
  timestamp: Date;
  data: any;
  userId?: string;
  organizationId: string;
}

export class OrderLifecycleManagerClass implements OrderLifecycleManager {
  phases: OrderLifecycleManager['phases'] = {
    'Order Creation': 'Customer requirement capture',
    'Order Processing': 'Validation and approval',
    'Material Planning': 'Procurement requirements',
    'Production Planning': 'Manufacturing schedule',
    'Quality Assurance': 'Inspection and testing',
    'Fulfillment': 'Packaging and shipping',
    'Post-Delivery': 'Returns and warranty'
  };

  private mrpEngine: MRPEngine;
  private purchaseOrderAutomation: PurchaseOrderAutomation;
  private lifecycleStates: Map<string, OrderLifecycleState> = new Map();
  private phaseTransitions: PhaseTransition[] = [];

  constructor() {
    this.mrpEngine = new MRPEngine();
    this.purchaseOrderAutomation = new PurchaseOrderAutomation();
    this.initializePhaseTransitions();
    this.setupEventHandlers();
  }

  private initializePhaseTransitions(): void {
    this.phaseTransitions = [
      {
        fromPhase: 'Order Creation',
        toPhase: 'Order Processing',
        trigger: 'order_submitted',
        conditions: ['customer_requirements_complete', 'credit_check_passed'],
        actions: ['validate_order', 'assign_approver'],
        estimatedDuration: 2 // hours
      },
      {
        fromPhase: 'Order Processing',
        toPhase: 'Material Planning',
        trigger: 'order_approved',
        conditions: ['order_validated', 'approval_complete'],
        actions: ['calculate_material_requirements', 'check_inventory'],
        estimatedDuration: 4 // hours
      },
      {
        fromPhase: 'Material Planning',
        toPhase: 'Production Planning',
        trigger: 'materials_available',
        conditions: ['mrp_calculation_complete', 'procurement_initiated'],
        actions: ['schedule_production', 'allocate_resources'],
        estimatedDuration: 8 // hours
      },
      {
        fromPhase: 'Production Planning',
        toPhase: 'Quality Assurance',
        trigger: 'production_complete',
        conditions: ['manufacturing_complete', 'initial_inspection_done'],
        actions: ['schedule_quality_tests', 'prepare_test_equipment'],
        estimatedDuration: 24 // hours
      },
      {
        fromPhase: 'Quality Assurance',
        toPhase: 'Fulfillment',
        trigger: 'quality_passed',
        conditions: ['quality_tests_passed', 'documentation_complete'],
        actions: ['prepare_packaging', 'schedule_shipping'],
        estimatedDuration: 4 // hours
      },
      {
        fromPhase: 'Fulfillment',
        toPhase: 'Post-Delivery',
        trigger: 'order_shipped',
        conditions: ['packaging_complete', 'shipping_confirmed'],
        actions: ['track_delivery', 'prepare_warranty_docs'],
        estimatedDuration: 168 // hours (1 week)
      }
    ];
  }

  private setupEventHandlers(): void {
    // Subscribe to order events
    eventStore.subscribe('ORDER_PLACED', (event) => {
      this.handleOrderPlaced(event);
    });

    eventStore.subscribe('INVENTORY_CHECKED', (event) => {
      this.handleInventoryChecked(event);
    });

    eventStore.subscribe('PO_GENERATED', (event) => {
      this.handlePOGenerated(event);
    });

    eventStore.subscribe('MATERIAL_RECEIVED', (event) => {
      this.handleMaterialReceived(event);
    });

    eventStore.subscribe('PRODUCTION_STARTED', (event) => {
      this.handleProductionStarted(event);
    });

    eventStore.subscribe('QUALITY_PASSED', (event) => {
      this.handleQualityPassed(event);
    });

    eventStore.subscribe('ORDER_SHIPPED', (event) => {
      this.handleOrderShipped(event);
    });
  }

  // Phase 1: Order Creation - Customer requirement capture
  async handleOrderPlaced(event: any): Promise<void> {
    const orderId = event.data.orderId;
    const lifecycleState: OrderLifecycleState = {
      orderId,
      currentPhase: 'Order Creation',
      phaseStatus: 'in_progress',
      phaseData: {
        customerRequirements: event.data,
        captureTime: new Date(),
        requirementsComplete: true
      },
      startTime: new Date(),
      estimatedCompletion: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      blockers: [],
      dependencies: [],
      assignedTeam: ['sales_team', 'customer_service'],
      priority: event.data.priority || 'medium',
      organizationId: event.organizationId,
      orderDetails: {
        orderNumber: event.data.orderNumber || orderId,
        customerName: event.data.customerName,
        priority: event.data.priority || 'medium',
        totalValue: event.data.totalAmount,
        totalItems: event.data.totalItems,
        warehouse: event.data.preferredWarehouse,
        externalId: event.data.externalId
      },
      phaseHistory: []
    };

    this.lifecycleStates.set(orderId, lifecycleState);
    await this.createLifecycleEvent(orderId, 'Order Creation', 'phase_started', event.data);
    this.recordPhaseHistory(orderId, 'Order Creation', 'in_progress', 'Order received and created.');
    
    // Auto-transition to next phase if conditions are met
    await this.checkPhaseTransition(orderId, 'Order Creation');
  }

  // Phase 2: Order Processing - Validation and approval
  async handleInventoryChecked(event: any): Promise<void> {
    const orderId = event.data.orderId;
    const state = this.lifecycleStates.get(orderId);
    
    if (state && state.currentPhase === 'Order Creation') {
      state.currentPhase = 'Order Processing';
      state.phaseStatus = 'in_progress';
      state.phaseData = {
        ...state.phaseData,
        inventoryCheck: event.data,
        validationComplete: true,
        approvalRequired: event.data.hasSufficientStock === false
      };
      state.estimatedCompletion = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours
      state.assignedTeam = ['order_processing', 'inventory_team'];

      await this.createLifecycleEvent(orderId, 'Order Processing', 'phase_started', event.data);
      this.recordPhaseHistory(orderId, 'Order Processing', 'in_progress', 'Order validation in progress.');
      await this.checkPhaseTransition(orderId, 'Order Processing');
    }
  }

  // Phase 3: Material Planning - Procurement requirements
  async handlePOGenerated(event: any): Promise<void> {
    const orderId = event.data.orderId;
    const state = this.lifecycleStates.get(orderId);
    
    if (state && state.currentPhase === 'Order Processing') {
      state.currentPhase = 'Material Planning';
      state.phaseStatus = 'in_progress';
      state.phaseData = {
        ...state.phaseData,
        purchaseOrder: event.data,
        procurementInitiated: true
      };
      state.estimatedCompletion = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
      state.assignedTeam = ['procurement_team', 'mrp_team'];

      await this.createLifecycleEvent(orderId, 'Material Planning', 'phase_started', event.data);
      this.recordPhaseHistory(orderId, 'Material Planning', 'in_progress', 'Procurement initiated.');
      await this.checkPhaseTransition(orderId, 'Material Planning');
    }
  }

  // Phase 4: Production Planning - Manufacturing schedule
  async handleMaterialReceived(event: any): Promise<void> {
    const orderId = event.data.orderId;
    const state = this.lifecycleStates.get(orderId);
    
    if (state && state.currentPhase === 'Material Planning') {
      state.currentPhase = 'Production Planning';
      state.phaseStatus = 'in_progress';
      state.phaseData = {
        ...state.phaseData,
        materialReceipt: event.data,
        materialsAvailable: true
      };
      state.estimatedCompletion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      state.assignedTeam = ['production_planning', 'manufacturing_team'];

      await this.createLifecycleEvent(orderId, 'Production Planning', 'phase_started', event.data);
      this.recordPhaseHistory(orderId, 'Production Planning', 'in_progress', 'Materials received, planning production.');
      await this.checkPhaseTransition(orderId, 'Production Planning');
    }
  }

  // Phase 5: Quality Assurance - Inspection and testing
  async handleProductionStarted(event: any): Promise<void> {
    const orderId = event.data.orderId;
    const state = this.lifecycleStates.get(orderId);
    
    if (state && state.currentPhase === 'Production Planning') {
      // Production is ongoing, but we can prepare for quality assurance
      state.phaseData = {
        ...state.phaseData,
        productionStarted: event.data,
        productionScheduled: true
      };
    }
  }

  async handleQualityPassed(event: any): Promise<void> {
    const orderId = event.data.orderId;
    const state = this.lifecycleStates.get(orderId);
    
    if (state && state.currentPhase === 'Production Planning') {
      state.currentPhase = 'Quality Assurance';
      state.phaseStatus = 'completed';
      state.phaseData = {
        ...state.phaseData,
        qualityResults: event.data,
        qualityPassed: true
      };
      state.actualCompletion = new Date();
      state.assignedTeam = ['quality_team', 'inspection_team'];

      await this.createLifecycleEvent(orderId, 'Quality Assurance', 'phase_completed', event.data);
      this.recordPhaseHistory(orderId, 'Quality Assurance', 'completed', 'Quality checks passed.');
      await this.checkPhaseTransition(orderId, 'Quality Assurance');
    }
  }

  // Phase 6: Fulfillment - Packaging and shipping
  async handleOrderShipped(event: any): Promise<void> {
    const orderId = event.data.orderId;
    const state = this.lifecycleStates.get(orderId);
    
    if (state && state.currentPhase === 'Quality Assurance') {
      state.currentPhase = 'Fulfillment';
      state.phaseStatus = 'completed';
      state.phaseData = {
        ...state.phaseData,
        shippingInfo: event.data,
        orderShipped: true
      };
      state.actualCompletion = new Date();
      state.assignedTeam = ['fulfillment_team', 'shipping_team'];

      await this.createLifecycleEvent(orderId, 'Fulfillment', 'phase_completed', event.data);
      this.recordPhaseHistory(orderId, 'Fulfillment', 'completed', 'Order shipped.');
      await this.checkPhaseTransition(orderId, 'Fulfillment');
    }
  }

  // Phase 7: Post-Delivery - Returns and warranty
  private async transitionToPostDelivery(orderId: string): Promise<void> {
    const state = this.lifecycleStates.get(orderId);
    
    if (state && state.currentPhase === 'Fulfillment') {
      state.currentPhase = 'Post-Delivery';
      state.phaseStatus = 'in_progress';
      state.phaseData = {
        ...state.phaseData,
        deliveryConfirmed: true,
        warrantyPeriod: '1_year'
      };
      state.estimatedCompletion = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      state.assignedTeam = ['customer_service', 'warranty_team'];

      await this.createLifecycleEvent(orderId, 'Post-Delivery', 'phase_started', {});
      this.recordPhaseHistory(orderId, 'Post-Delivery', 'in_progress', 'Delivery confirmation workflow started.');
    }
  }

  private async checkPhaseTransition(orderId: string, currentPhase: keyof OrderLifecycleManager['phases']): Promise<void> {
    const transition = this.phaseTransitions.find(t => t.fromPhase === currentPhase);
    if (!transition) return;

    const state = this.lifecycleStates.get(orderId);
    if (!state) return;

    // Check if all conditions are met
    const conditionsMet = transition.conditions.every(condition => {
      switch (condition) {
        case 'customer_requirements_complete':
          return state.phaseData.requirementsComplete === true;
        case 'order_validated':
          return state.phaseData.validationComplete === true;
        case 'mrp_calculation_complete':
          return state.phaseData.procurementInitiated === true;
        case 'materials_available':
          return state.phaseData.materialsAvailable === true;
        case 'manufacturing_complete':
          return state.phaseData.productionScheduled === true;
        case 'quality_tests_passed':
          return state.phaseData.qualityPassed === true;
        case 'packaging_complete':
          return state.phaseData.orderShipped === true;
        default:
          return true;
      }
    });

    if (conditionsMet) {
      // Execute transition actions
      for (const action of transition.actions) {
        await this.executeAction(orderId, action);
      }

      // Auto-transition to next phase
      await this.transitionToNextPhase(orderId, transition.toPhase);
    }
  }

  private async executeAction(orderId: string, action: string): Promise<void> {
    const state = this.lifecycleStates.get(orderId);
    if (!state) return;

    switch (action) {
      case 'validate_order':
        // Order validation logic
        break;
      case 'assign_approver':
        // Approver assignment logic
        break;
      case 'calculate_material_requirements':
        // MRP calculation
        break;
      case 'check_inventory':
        // Inventory check
        break;
      case 'schedule_production':
        // Production scheduling
        break;
      case 'allocate_resources':
        // Resource allocation
        break;
      case 'schedule_quality_tests':
        // Quality test scheduling
        break;
      case 'prepare_test_equipment':
        // Test equipment preparation
        break;
      case 'prepare_packaging':
        // Packaging preparation
        break;
      case 'schedule_shipping':
        // Shipping scheduling
        break;
      case 'track_delivery':
        // Delivery tracking
        break;
      case 'prepare_warranty_docs':
        // Warranty documentation
        break;
    }
  }

  private async transitionToNextPhase(orderId: string, nextPhase: keyof OrderLifecycleManager['phases']): Promise<void> {
    const state = this.lifecycleStates.get(orderId);
    if (!state) return;

    // Complete current phase
    state.phaseStatus = 'completed';
    state.actualCompletion = new Date();

    // Transition to next phase
    state.currentPhase = nextPhase;
    state.phaseStatus = 'in_progress';
    state.startTime = new Date();

    // Set estimated completion based on phase
    const transition = this.phaseTransitions.find(t => t.toPhase === nextPhase);
    if (transition) {
      state.estimatedCompletion = new Date(Date.now() + transition.estimatedDuration * 60 * 60 * 1000);
    }

    await this.createLifecycleEvent(orderId, nextPhase, 'phase_started', {});
    this.recordPhaseHistory(orderId, nextPhase, 'in_progress', 'Phase transition triggered.');
  }

  private async createLifecycleEvent(
    orderId: string, 
    phase: keyof OrderLifecycleManager['phases'], 
    eventType: 'phase_started' | 'phase_completed' | 'phase_failed' | 'phase_blocked',
    data: any
  ): Promise<void> {
    const state = this.lifecycleStates.get(orderId);
    if (!state) return;

    const lifecycleEvent: OrderLifecycleEvent = {
      orderId,
      phase,
      eventType,
      timestamp: new Date(),
      data,
      organizationId: state.organizationId
    };

    // Store event and notify relevant teams
    await this.notifyPhaseEvent(lifecycleEvent);
  }

  private async notifyPhaseEvent(event: OrderLifecycleEvent): Promise<void> {
    // Notify assigned team members
    const state = this.lifecycleStates.get(event.orderId);
    if (state) {
      for (const team of state.assignedTeam) {
        notificationService.sendToRoom(team, 'lifecycle_event', {
          orderId: event.orderId,
          phase: event.phase,
          eventType: event.eventType,
          data: event.data
        });
      }
    }

    // Broadcast to organization
    notificationService.sendToRoom(state?.organizationId || 'default', 'lifecycle_update', {
      orderId: event.orderId,
      currentPhase: state?.currentPhase,
      phaseStatus: state?.phaseStatus,
      priority: state?.priority
    });
  }

  // Public API methods
  async getOrderLifecycle(orderId: string): Promise<OrderLifecycleState | undefined> {
    return this.lifecycleStates.get(orderId);
  }

  async getAllLifecycles(organizationId: string): Promise<OrderLifecycleState[]> {
    return Array.from(this.lifecycleStates.values())
      .filter(state => state.organizationId === organizationId);
  }

  async updatePhaseStatus(orderId: string, phase: keyof OrderLifecycleManager['phases'], status: 'pending' | 'in_progress' | 'completed' | 'failed'): Promise<void> {
    const state = this.lifecycleStates.get(orderId);
    if (state && state.currentPhase === phase) {
      state.phaseStatus = status;
      if (status === 'completed') {
        state.actualCompletion = new Date();
      }
      await this.createLifecycleEvent(orderId, phase, status === 'completed' ? 'phase_completed' : 'phase_started', {});
      this.recordPhaseHistory(orderId, phase, status, status === 'completed' ? 'Phase completed manually.' : 'Phase restarted manually.');
    }
  }

  async addBlocker(orderId: string, blocker: string): Promise<void> {
    const state = this.lifecycleStates.get(orderId);
    if (state) {
      state.blockers.push(blocker);
      state.phaseStatus = 'failed';
      await this.createLifecycleEvent(orderId, state.currentPhase, 'phase_blocked', { blocker });
      this.recordPhaseHistory(orderId, state.currentPhase, 'failed', `Blocker added: ${blocker}`);
    }
  }

  async resolveBlocker(orderId: string, blocker: string): Promise<void> {
    const state = this.lifecycleStates.get(orderId);
    if (state) {
      state.blockers = state.blockers.filter(b => b !== blocker);
      if (state.blockers.length === 0) {
        state.phaseStatus = 'in_progress';
      }
    }
  }

  private recordPhaseHistory(
    orderId: string,
    phase: keyof OrderLifecycleManager['phases'],
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    notes?: string
  ): void {
    const state = this.lifecycleStates.get(orderId);
    if (!state) return;
    state.phaseHistory.push({
      phase,
      status,
      timestamp: new Date(),
      notes
    });
  }

  getPhaseTransitions(): PhaseTransition[] {
    return this.phaseTransitions;
  }

  getLifecycleStats(organizationId: string): any {
    const lifecycles = this.getAllLifecycles(organizationId);
    const stats = {
      total: lifecycles.length,
      byPhase: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      averageCycleTime: 0
    };

    for (const lifecycle of lifecycles) {
      stats.byPhase[lifecycle.currentPhase] = (stats.byPhase[lifecycle.currentPhase] || 0) + 1;
      stats.byStatus[lifecycle.phaseStatus] = (stats.byStatus[lifecycle.phaseStatus] || 0) + 1;
    }

    return stats;
  }
}

// Singleton instance
const orderLifecycleManager = new OrderLifecycleManagerClass();

export default orderLifecycleManager; 