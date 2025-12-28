import { notificationService } from '../realtime/notification-service';

export interface OrderEvent {
  eventId: string;
  orderId: string;
  eventType: string;
  timestamp: Date;
  data: any;
  metadata: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    organizationId?: string;
    version: number;
  };
}

export interface OrderState {
  orderId: string;
  currentState: string;
  lastUpdated: Date;
  events: OrderEvent[];
  metadata: {
    totalEvents: number;
    lastEventType: string;
    processingTime: number;
    version: number;
  };
}

export interface EventStream {
  orderId: string;
  events: OrderEvent[];
  totalEvents: number;
  lastEventId: string;
  lastEventTimestamp: Date;
}

export interface EventStoreStats {
  totalOrders: number;
  totalEvents: number;
  averageEventsPerOrder: number;
  mostActiveOrder: string;
  eventsByType: Record<string, number>;
  storageSize: number;
}

export class OrderEventStore {
  private events: Map<string, OrderEvent[]> = new Map();
  private orderStates: Map<string, OrderState> = new Map();
  private eventSubscribers: Map<string, ((event: OrderEvent) => void)[]> = new Map();
  private eventCounters: Map<string, number> = new Map();

  constructor() {
    console.log('📦 Order Event Store initialized');
  }

  /**
   * Append an event to the event store
   */
  appendEvent(orderId: string, event: OrderEvent): void {
    try {
      // Validate event
      if (!event.eventId || !event.orderId || !event.eventType) {
        throw new Error('Invalid event: missing required fields');
      }

      // Get or create event stream for this order
      let eventStream = this.events.get(orderId);
      if (!eventStream) {
        eventStream = [];
        this.events.set(orderId, eventStream);
      }

      // Set event metadata
      event.timestamp = new Date();
      event.metadata = {
        ...event.metadata,
        version: this.getNextEventVersion(orderId)
      };

      // Append event to stream
      eventStream.push(event);

      // Update event counter
      const currentCount = this.eventCounters.get(orderId) || 0;
      this.eventCounters.set(orderId, currentCount + 1);

      // Replay events to update order state
      const orderState = this.replayEvents(orderId);
      this.orderStates.set(orderId, orderState);

      // Notify subscribers
      this.notifySubscribers(event);

      // Broadcast event to real-time subscribers
      this.broadcastEvent(event);

      console.log(`📦 Event appended: ${event.eventType} for order ${orderId} (v${event.metadata.version})`);
    } catch (error) {
      console.error('Error appending event:', error);
      throw error;
    }
  }

  /**
   * Get the complete event stream for an order
   */
  getEventStream(orderId: string): OrderEvent[] {
    const eventStream = this.events.get(orderId);
    if (!eventStream) {
      return [];
    }
    return [...eventStream]; // Return a copy to prevent external modification
  }

  /**
   * Replay all events for an order to reconstruct its current state
   */
  replayEvents(orderId: string): OrderState {
    const eventStream = this.getEventStream(orderId);
    
    if (eventStream.length === 0) {
      return {
        orderId,
        currentState: 'UNKNOWN',
        lastUpdated: new Date(),
        events: [],
        metadata: {
          totalEvents: 0,
          lastEventType: 'NONE',
          processingTime: 0,
          version: 0
        }
      };
    }

    const startTime = Date.now();
    let currentState = 'UNKNOWN';
    let lastEventType = 'NONE';

    // Process events in chronological order
    for (const event of eventStream) {
      currentState = this.processEventForState(currentState, event);
      lastEventType = event.eventType;
    }

    const processingTime = Date.now() - startTime;
    const lastEvent = eventStream[eventStream.length - 1];

    const orderState: OrderState = {
      orderId,
      currentState,
      lastUpdated: lastEvent.timestamp,
      events: eventStream,
      metadata: {
        totalEvents: eventStream.length,
        lastEventType,
        processingTime,
        version: lastEvent.metadata.version
      }
    };

    return orderState;
  }

  /**
   * Process an event to determine state transition
   */
  private processEventForState(currentState: string, event: OrderEvent): string {
    switch (event.eventType) {
      case 'ORDER_PLACED':
        return 'PLANNED';
      case 'INVENTORY_CHECKED':
        return 'INVENTORY_VALIDATED';
      case 'PO_GENERATED':
        return 'PROCUREMENT_INITIATED';
      case 'MATERIAL_RECEIVED':
        return 'MATERIALS_AVAILABLE';
      case 'PRODUCTION_STARTED':
        return 'IN_PRODUCTION';
      case 'QUALITY_PASSED':
        return 'QUALITY_APPROVED';
      case 'ORDER_SHIPPED':
        return 'SHIPPED';
      case 'ORDER_DELIVERED':
        return 'DELIVERED';
      case 'ORDER_CANCELLED':
        return 'CANCELLED';
      case 'ORDER_RETURNED':
        return 'RETURNED';
      default:
        return currentState;
    }
  }

  /**
   * Get the current state of an order
   */
  getOrderState(orderId: string): OrderState | undefined {
    return this.orderStates.get(orderId);
  }

  /**
   * Get events by type for an order
   */
  getEventsByType(orderId: string, eventType: string): OrderEvent[] {
    const eventStream = this.getEventStream(orderId);
    return eventStream.filter(event => event.eventType === eventType);
  }

  /**
   * Get events within a time range
   */
  getEventsInTimeRange(orderId: string, startTime: Date, endTime: Date): OrderEvent[] {
    const eventStream = this.getEventStream(orderId);
    return eventStream.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Subscribe to events for an order
   */
  subscribe(orderId: string, callback: (event: OrderEvent) => void): () => void {
    const subscribers = this.eventSubscribers.get(orderId) || [];
    subscribers.push(callback);
    this.eventSubscribers.set(orderId, subscribers);

    // Return unsubscribe function
    return () => {
      const currentSubscribers = this.eventSubscribers.get(orderId) || [];
      const index = currentSubscribers.indexOf(callback);
      if (index > -1) {
        currentSubscribers.splice(index, 1);
        this.eventSubscribers.set(orderId, currentSubscribers);
      }
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeToAll(callback: (event: OrderEvent) => void): () => void {
    return this.subscribe('*', callback);
  }

  /**
   * Notify subscribers of a new event
   */
  private notifySubscribers(event: OrderEvent): void {
    // Notify order-specific subscribers
    const orderSubscribers = this.eventSubscribers.get(event.orderId) || [];
    orderSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event subscriber:', error);
      }
    });

    // Notify global subscribers
    const globalSubscribers = this.eventSubscribers.get('*') || [];
    globalSubscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in global event subscriber:', error);
      }
    });
  }

  /**
   * Broadcast event to real-time subscribers
   */
  private broadcastEvent(event: OrderEvent): void {
    try {
      // Broadcast to order-specific room
      notificationService.sendToRoom(event.orderId, 'order_event', {
        eventId: event.eventId,
        orderId: event.orderId,
        eventType: event.eventType,
        timestamp: event.timestamp.toISOString(),
        data: event.data,
        metadata: event.metadata
      });

      // Broadcast to organization room
      if (event.metadata.organizationId) {
        notificationService.sendToRoom(event.metadata.organizationId, 'order_event', {
          eventId: event.eventId,
          orderId: event.orderId,
          eventType: event.eventType,
          timestamp: event.timestamp.toISOString(),
          data: event.data,
          metadata: event.metadata
        });
      }
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  /**
   * Get next event version for an order
   */
  private getNextEventVersion(orderId: string): number {
    const currentCount = this.eventCounters.get(orderId) || 0;
    return currentCount + 1;
  }

  /**
   * Get event store statistics
   */
  getStats(): EventStoreStats {
    const totalOrders = this.events.size;
    const totalEvents = Array.from(this.eventCounters.values()).reduce((sum, count) => sum + count, 0);
    const averageEventsPerOrder = totalOrders > 0 ? totalEvents / totalOrders : 0;

    // Find most active order
    let mostActiveOrder = '';
    let maxEvents = 0;
    for (const [orderId, count] of this.eventCounters.entries()) {
      if (count > maxEvents) {
        maxEvents = count;
        mostActiveOrder = orderId;
      }
    }

    // Count events by type
    const eventsByType: Record<string, number> = {};
    for (const eventStream of this.events.values()) {
      for (const event of eventStream) {
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      }
    }

    // Estimate storage size (rough calculation)
    const storageSize = JSON.stringify(Array.from(this.events.values())).length;

    return {
      totalOrders,
      totalEvents,
      averageEventsPerOrder,
      mostActiveOrder,
      eventsByType,
      storageSize
    };
  }

  /**
   * Get all order IDs
   */
  getAllOrderIds(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get events for all orders
   */
  getAllEvents(): OrderEvent[] {
    const allEvents: OrderEvent[] = [];
    for (const eventStream of this.events.values()) {
      allEvents.push(...eventStream);
    }
    return allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear events for an order (for testing/cleanup)
   */
  clearOrderEvents(orderId: string): void {
    this.events.delete(orderId);
    this.orderStates.delete(orderId);
    this.eventCounters.delete(orderId);
    this.eventSubscribers.delete(orderId);
    console.log(`📦 Cleared events for order: ${orderId}`);
  }

  /**
   * Clear all events (for testing/cleanup)
   */
  clearAllEvents(): void {
    this.events.clear();
    this.orderStates.clear();
    this.eventCounters.clear();
    this.eventSubscribers.clear();
    console.log('📦 Cleared all events');
  }

  /**
   * Export events for backup/analysis
   */
  exportEvents(orderId?: string): any {
    if (orderId) {
      return {
        orderId,
        events: this.getEventStream(orderId),
        state: this.getOrderState(orderId)
      };
    } else {
      return {
        allEvents: this.getAllEvents(),
        stats: this.getStats(),
        orderStates: Array.from(this.orderStates.values())
      };
    }
  }

  /**
   * Import events from backup
   */
  importEvents(data: any): void {
    if (data.orderId && data.events) {
      // Import single order events
      this.events.set(data.orderId, data.events);
      if (data.state) {
        this.orderStates.set(data.orderId, data.state);
      }
      console.log(`📦 Imported ${data.events.length} events for order: ${data.orderId}`);
    } else if (data.allEvents) {
      // Import all events
      for (const event of data.allEvents) {
        const orderId = event.orderId;
        let eventStream = this.events.get(orderId);
        if (!eventStream) {
          eventStream = [];
          this.events.set(orderId, eventStream);
        }
        eventStream.push(event);
      }
      console.log(`📦 Imported ${data.allEvents.length} total events`);
    }
  }
}

// Singleton instance
const orderEventStore = new OrderEventStore();

export default orderEventStore; 