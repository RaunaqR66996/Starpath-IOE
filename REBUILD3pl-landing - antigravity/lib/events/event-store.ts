import { EventEmitter } from 'events';

export interface OrderEvent {
  eventId: string;
  eventType: OrderEventType;
  orderId: string;
  timestamp: Date;
  userId?: string;
  organizationId: string;
  data: any;
  metadata: {
    version: number;
    source: string;
    correlationId?: string;
    causationId?: string;
  };
}

export type OrderEventType = 
  | 'ORDER_PLACED'
  | 'INVENTORY_CHECKED'
  | 'PO_GENERATED'
  | 'MATERIAL_RECEIVED'
  | 'PRODUCTION_STARTED'
  | 'QUALITY_PASSED'
  | 'ORDER_SHIPPED'
  | 'ORDER_CANCELLED'
  | 'EXCEPTION_RAISED'
  | 'STATE_CHANGED';

export interface EventStore {
  append(event: OrderEvent): Promise<void>;
  getEvents(orderId: string): Promise<OrderEvent[]>;
  getEventsByType(eventType: OrderEventType): Promise<OrderEvent[]>;
  getEventsByTimeRange(startTime: Date, endTime: Date): Promise<OrderEvent[]>;
  subscribe(eventType: OrderEventType, handler: (event: OrderEvent) => void): void;
  unsubscribe(eventType: OrderEventType, handler: (event: OrderEvent) => void): void;
}

export interface StreamProcessor {
  processEvent(event: OrderEvent): Promise<void>;
  getOrderState(orderId: string): Promise<OrderState>;
  getOrderHistory(orderId: string): Promise<OrderEvent[]>;
}

export interface OrderState {
  orderId: string;
  currentState: string;
  lastUpdated: Date;
  events: OrderEvent[];
  metadata: {
    totalEvents: number;
    lastEventType: OrderEventType;
    processingTime: number;
  };
}

export class InMemoryEventStore implements EventStore {
  private events: OrderEvent[] = [];
  private eventEmitter = new EventEmitter();
  private subscribers: Map<OrderEventType, Set<(event: OrderEvent) => void>> = new Map();

  async append(event: OrderEvent): Promise<void> {
    // Validate event
    if (!event.eventId || !event.eventType || !event.orderId) {
      throw new Error('Invalid event: missing required fields');
    }

    // Add event to store
    this.events.push(event);

    // Emit event for real-time subscribers
    this.eventEmitter.emit(event.eventType, event);
    this.eventEmitter.emit('*', event);

    // Notify specific subscribers
    const subscribers = this.subscribers.get(event.eventType);
    if (subscribers) {
      subscribers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.eventType}:`, error);
        }
      });
    }

    console.log(`Event stored: ${event.eventType} for order ${event.orderId}`);
  }

  async getEvents(orderId: string): Promise<OrderEvent[]> {
    return this.events.filter(event => event.orderId === orderId);
  }

  async getEventsByType(eventType: OrderEventType): Promise<OrderEvent[]> {
    return this.events.filter(event => event.eventType === eventType);
  }

  async getEventsByTimeRange(startTime: Date, endTime: Date): Promise<OrderEvent[]> {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  subscribe(eventType: OrderEventType, handler: (event: OrderEvent) => void): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);
  }

  unsubscribe(eventType: OrderEventType, handler: (event: OrderEvent) => void): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.delete(handler);
    }
  }

  // Get all events (for debugging/testing)
  getAllEvents(): OrderEvent[] {
    return [...this.events];
  }

  // Clear events (for testing)
  clear(): void {
    this.events = [];
  }
}

export class StreamProcessor implements StreamProcessor {
  private eventStore: EventStore;
  private orderStates: Map<string, OrderState> = new Map();

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Subscribe to all order events
    const eventTypes: OrderEventType[] = [
      'ORDER_PLACED',
      'INVENTORY_CHECKED',
      'PO_GENERATED',
      'MATERIAL_RECEIVED',
      'PRODUCTION_STARTED',
      'QUALITY_PASSED',
      'ORDER_SHIPPED',
      'ORDER_CANCELLED',
      'EXCEPTION_RAISED',
      'STATE_CHANGED'
    ];

    eventTypes.forEach(eventType => {
      this.eventStore.subscribe(eventType, (event) => {
        this.processEvent(event).catch(error => {
          console.error(`Error processing event ${event.eventType}:`, error);
        });
      });
    });
  }

  async processEvent(event: OrderEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Update order state based on event type
      await this.updateOrderState(event);

      // Apply business logic based on event type
      await this.applyBusinessLogic(event);

      // Generate follow-up events if needed
      await this.generateFollowUpEvents(event);

      const processingTime = Date.now() - startTime;
      console.log(`Event processed: ${event.eventType} for order ${event.orderId} in ${processingTime}ms`);

    } catch (error) {
      console.error(`Error processing event ${event.eventType}:`, error);
      
      // Create exception event
      const exceptionEvent: OrderEvent = {
        eventId: `exc-${Date.now()}`,
        eventType: 'EXCEPTION_RAISED',
        orderId: event.orderId,
        timestamp: new Date(),
        organizationId: event.organizationId,
        data: {
          originalEvent: event.eventType,
          error: error.message,
          stack: error.stack
        },
        metadata: {
          version: 1,
          source: 'stream-processor',
          correlationId: event.metadata.correlationId
        }
      };

      await this.eventStore.append(exceptionEvent);
    }
  }

  private async updateOrderState(event: OrderEvent): Promise<void> {
    let orderState = this.orderStates.get(event.orderId);
    
    if (!orderState) {
      orderState = {
        orderId: event.orderId,
        currentState: 'UNKNOWN',
        lastUpdated: event.timestamp,
        events: [],
        metadata: {
          totalEvents: 0,
          lastEventType: event.eventType,
          processingTime: 0
        }
      };
    }

    // Update state based on event type
    switch (event.eventType) {
      case 'ORDER_PLACED':
        orderState.currentState = 'PLANNED';
        break;
      case 'INVENTORY_CHECKED':
        orderState.currentState = 'INVENTORY_VALIDATED';
        break;
      case 'PO_GENERATED':
        orderState.currentState = 'PROCUREMENT_INITIATED';
        break;
      case 'MATERIAL_RECEIVED':
        orderState.currentState = 'MATERIALS_AVAILABLE';
        break;
      case 'PRODUCTION_STARTED':
        orderState.currentState = 'IN_PRODUCTION';
        break;
      case 'QUALITY_PASSED':
        orderState.currentState = 'QUALITY_APPROVED';
        break;
      case 'ORDER_SHIPPED':
        orderState.currentState = 'SHIPPED';
        break;
      case 'ORDER_CANCELLED':
        orderState.currentState = 'CANCELLED';
        break;
      case 'STATE_CHANGED':
        orderState.currentState = event.data.newState;
        break;
    }

    // Add event to history
    orderState.events.push(event);
    orderState.lastUpdated = event.timestamp;
    orderState.metadata.totalEvents = orderState.events.length;
    orderState.metadata.lastEventType = event.eventType;

    this.orderStates.set(event.orderId, orderState);
  }

  private async applyBusinessLogic(event: OrderEvent): Promise<void> {
    switch (event.eventType) {
      case 'ORDER_PLACED':
        await this.handleOrderPlaced(event);
        break;
      case 'INVENTORY_CHECKED':
        await this.handleInventoryChecked(event);
        break;
      case 'PO_GENERATED':
        await this.handlePOGenerated(event);
        break;
      case 'MATERIAL_RECEIVED':
        await this.handleMaterialReceived(event);
        break;
      case 'PRODUCTION_STARTED':
        await this.handleProductionStarted(event);
        break;
      case 'QUALITY_PASSED':
        await this.handleQualityPassed(event);
        break;
      case 'ORDER_SHIPPED':
        await this.handleOrderShipped(event);
        break;
    }
  }

  private async handleOrderPlaced(event: OrderEvent): Promise<void> {
    // Trigger inventory check
    const inventoryEvent: OrderEvent = {
      eventId: `inv-${Date.now()}`,
      eventType: 'INVENTORY_CHECKED',
      orderId: event.orderId,
      timestamp: new Date(),
      organizationId: event.organizationId,
      data: {
        trigger: 'ORDER_PLACED',
        orderData: event.data
      },
      metadata: {
        version: 1,
        source: 'stream-processor',
        correlationId: event.metadata.correlationId,
        causationId: event.eventId
      }
    };

    await this.eventStore.append(inventoryEvent);
  }

  private async handleInventoryChecked(event: OrderEvent): Promise<void> {
    const inventoryResult = event.data;
    
    if (inventoryResult.hasSufficientStock) {
      // Trigger PO generation if needed
      const poEvent: OrderEvent = {
        eventId: `po-${Date.now()}`,
        eventType: 'PO_GENERATED',
        orderId: event.orderId,
        timestamp: new Date(),
        organizationId: event.organizationId,
        data: {
          trigger: 'INVENTORY_CHECKED',
          requiredMaterials: inventoryResult.requiredMaterials
        },
        metadata: {
          version: 1,
          source: 'stream-processor',
          correlationId: event.metadata.correlationId,
          causationId: event.eventId
        }
      };

      await this.eventStore.append(poEvent);
    }
  }

  private async handlePOGenerated(event: OrderEvent): Promise<void> {
    // Simulate PO processing
    console.log(`Processing PO for order ${event.orderId}`);
    
    // In a real system, this would trigger supplier notifications
    // and wait for material delivery confirmation
  }

  private async handleMaterialReceived(event: OrderEvent): Promise<void> {
    // Trigger production start
    const productionEvent: OrderEvent = {
      eventId: `prod-${Date.now()}`,
      eventType: 'PRODUCTION_STARTED',
      orderId: event.orderId,
      timestamp: new Date(),
      organizationId: event.organizationId,
      data: {
        trigger: 'MATERIAL_RECEIVED',
        materialsReceived: event.data.materials
      },
      metadata: {
        version: 1,
        source: 'stream-processor',
        correlationId: event.metadata.correlationId,
        causationId: event.eventId
      }
    };

    await this.eventStore.append(productionEvent);
  }

  private async handleProductionStarted(event: OrderEvent): Promise<void> {
    // Simulate production process
    console.log(`Production started for order ${event.orderId}`);
    
    // In a real system, this would trigger production scheduling
    // and quality control planning
  }

  private async handleQualityPassed(event: OrderEvent): Promise<void> {
    // Trigger shipping
    const shippingEvent: OrderEvent = {
      eventId: `ship-${Date.now()}`,
      eventType: 'ORDER_SHIPPED',
      orderId: event.orderId,
      timestamp: new Date(),
      organizationId: event.organizationId,
      data: {
        trigger: 'QUALITY_PASSED',
        qualityResults: event.data.qualityResults
      },
      metadata: {
        version: 1,
        source: 'stream-processor',
        correlationId: event.metadata.correlationId,
        causationId: event.eventId
      }
    };

    await this.eventStore.append(shippingEvent);
  }

  private async handleOrderShipped(event: OrderEvent): Promise<void> {
    // Order completion logic
    console.log(`Order ${event.orderId} shipped successfully`);
    
    // In a real system, this would trigger customer notifications
    // and delivery tracking
  }

  private async generateFollowUpEvents(event: OrderEvent): Promise<void> {
    // Generate state change event
    const stateEvent: OrderEvent = {
      eventId: `state-${Date.now()}`,
      eventType: 'STATE_CHANGED',
      orderId: event.orderId,
      timestamp: new Date(),
      organizationId: event.organizationId,
      data: {
        trigger: event.eventType,
        newState: this.getNewState(event.eventType),
        previousState: this.orderStates.get(event.orderId)?.currentState
      },
      metadata: {
        version: 1,
        source: 'stream-processor',
        correlationId: event.metadata.correlationId,
        causationId: event.eventId
      }
    };

    await this.eventStore.append(stateEvent);
  }

  private getNewState(eventType: OrderEventType): string {
    switch (eventType) {
      case 'ORDER_PLACED': return 'PLANNED';
      case 'INVENTORY_CHECKED': return 'INVENTORY_VALIDATED';
      case 'PO_GENERATED': return 'PROCUREMENT_INITIATED';
      case 'MATERIAL_RECEIVED': return 'MATERIALS_AVAILABLE';
      case 'PRODUCTION_STARTED': return 'IN_PRODUCTION';
      case 'QUALITY_PASSED': return 'QUALITY_APPROVED';
      case 'ORDER_SHIPPED': return 'SHIPPED';
      case 'ORDER_CANCELLED': return 'CANCELLED';
      default: return 'UNKNOWN';
    }
  }

  async getOrderState(orderId: string): Promise<OrderState | null> {
    return this.orderStates.get(orderId) || null;
  }

  async getOrderHistory(orderId: string): Promise<OrderEvent[]> {
    return this.eventStore.getEvents(orderId);
  }

  // Get all order states (for debugging/testing)
  getAllOrderStates(): Map<string, OrderState> {
    return new Map(this.orderStates);
  }
}

// Event factory for creating standardized events
export class OrderEventFactory {
  static createOrderPlaced(orderId: string, orderData: any, organizationId: string): OrderEvent {
    return {
      eventId: `order-${Date.now()}`,
      eventType: 'ORDER_PLACED',
      orderId,
      timestamp: new Date(),
      organizationId,
      data: orderData,
      metadata: {
        version: 1,
        source: 'order-system',
        correlationId: `corr-${Date.now()}`
      }
    };
  }

  static createInventoryChecked(orderId: string, inventoryResult: any, organizationId: string, correlationId?: string): OrderEvent {
    return {
      eventId: `inv-${Date.now()}`,
      eventType: 'INVENTORY_CHECKED',
      orderId,
      timestamp: new Date(),
      organizationId,
      data: inventoryResult,
      metadata: {
        version: 1,
        source: 'inventory-system',
        correlationId: correlationId || `corr-${Date.now()}`
      }
    };
  }

  static createPOGenerated(orderId: string, poData: any, organizationId: string, correlationId?: string): OrderEvent {
    return {
      eventId: `po-${Date.now()}`,
      eventType: 'PO_GENERATED',
      orderId,
      timestamp: new Date(),
      organizationId,
      data: poData,
      metadata: {
        version: 1,
        source: 'procurement-system',
        correlationId: correlationId || `corr-${Date.now()}`
      }
    };
  }

  static createMaterialReceived(orderId: string, materialData: any, organizationId: string, correlationId?: string): OrderEvent {
    return {
      eventId: `mat-${Date.now()}`,
      eventType: 'MATERIAL_RECEIVED',
      orderId,
      timestamp: new Date(),
      organizationId,
      data: materialData,
      metadata: {
        version: 1,
        source: 'receiving-system',
        correlationId: correlationId || `corr-${Date.now()}`
      }
    };
  }

  static createProductionStarted(orderId: string, productionData: any, organizationId: string, correlationId?: string): OrderEvent {
    return {
      eventId: `prod-${Date.now()}`,
      eventType: 'PRODUCTION_STARTED',
      orderId,
      timestamp: new Date(),
      organizationId,
      data: productionData,
      metadata: {
        version: 1,
        source: 'production-system',
        correlationId: correlationId || `corr-${Date.now()}`
      }
    };
  }

  static createQualityPassed(orderId: string, qualityData: any, organizationId: string, correlationId?: string): OrderEvent {
    return {
      eventId: `qc-${Date.now()}`,
      eventType: 'QUALITY_PASSED',
      orderId,
      timestamp: new Date(),
      organizationId,
      data: qualityData,
      metadata: {
        version: 1,
        source: 'quality-system',
        correlationId: correlationId || `corr-${Date.now()}`
      }
    };
  }

  static createOrderShipped(orderId: string, shippingData: any, organizationId: string, correlationId?: string): OrderEvent {
    return {
      eventId: `ship-${Date.now()}`,
      eventType: 'ORDER_SHIPPED',
      orderId,
      timestamp: new Date(),
      organizationId,
      data: shippingData,
      metadata: {
        version: 1,
        source: 'shipping-system',
        correlationId: correlationId || `corr-${Date.now()}`
      }
    };
  }
}

// Global event store instance
export const eventStore = new InMemoryEventStore();
export const streamProcessor = new StreamProcessor(eventStore); 