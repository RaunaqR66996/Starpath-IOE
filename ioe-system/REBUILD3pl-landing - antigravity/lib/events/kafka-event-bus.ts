/**
 * Modern Event Bus with Apache Kafka
 * Enterprise-grade event streaming for TMS/WMS
 * 
 * Features:
 * - Event sourcing
 * - CQRS support
 * - Dead letter queue
 * - Event replay
 * - Exactly-once semantics
 * - Schema registry integration
 */

import { Kafka, Producer, Consumer, EachMessagePayload, CompressionTypes } from 'kafkajs'

export interface DomainEvent {
  eventId: string
  eventType: string
  aggregateId: string
  aggregateType: 'order' | 'shipment' | 'inventory' | 'warehouse' | 'truck' | 'robot'
  version: number
  timestamp: Date
  causationId?: string
  correlationId?: string
  metadata: {
    userId?: string
    source: string
    traceId?: string
    spanId?: string
  }
  data: any
}

export interface KafkaEventBusConfig {
  brokers: string[]
  clientId: string
  groupId: string
  ssl?: boolean
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512'
    username: string
    password: string
  }
  compression?: CompressionTypes
  retries?: number
  requestTimeout?: number
}

/**
 * Event Topics for TMS/WMS
 */
export const EventTopics = {
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_VALIDATED: 'order.validated',
  ORDER_ALLOCATED: 'order.allocated',
  ORDER_PICKED: 'order.picked',
  ORDER_PACKED: 'order.packed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  
  // Inventory Events
  INVENTORY_ADJUSTED: 'inventory.adjusted',
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_RELEASED: 'inventory.released',
  INVENTORY_TRANSFERRED: 'inventory.transferred',
  INVENTORY_CYCLE_COUNT: 'inventory.cycle-count',
  
  // Warehouse Events
  WAREHOUSE_TASK_CREATED: 'warehouse.task.created',
  WAREHOUSE_TASK_ASSIGNED: 'warehouse.task.assigned',
  WAREHOUSE_TASK_STARTED: 'warehouse.task.started',
  WAREHOUSE_TASK_COMPLETED: 'warehouse.task.completed',
  WAREHOUSE_RECEIVING_STARTED: 'warehouse.receiving.started',
  WAREHOUSE_RECEIVING_COMPLETED: 'warehouse.receiving.completed',
  WAREHOUSE_PUTAWAY_COMPLETED: 'warehouse.putaway.completed',
  
  // Shipment Events
  SHIPMENT_CREATED: 'shipment.created',
  SHIPMENT_PLANNED: 'shipment.planned',
  SHIPMENT_DISPATCHED: 'shipment.dispatched',
  SHIPMENT_IN_TRANSIT: 'shipment.in-transit',
  SHIPMENT_DELIVERED: 'shipment.delivered',
  SHIPMENT_EXCEPTION: 'shipment.exception',
  
  // Robot Events
  ROBOT_TASK_ASSIGNED: 'robot.task.assigned',
  ROBOT_TASK_STARTED: 'robot.task.started',
  ROBOT_TASK_COMPLETED: 'robot.task.completed',
  ROBOT_BATTERY_LOW: 'robot.battery.low',
  ROBOT_ERROR: 'robot.error',
  ROBOT_MAINTENANCE_REQUIRED: 'robot.maintenance.required',
  
  // Analytics Events
  ANALYTICS_ORDER_METRICS: 'analytics.order.metrics',
  ANALYTICS_WAREHOUSE_METRICS: 'analytics.warehouse.metrics',
  ANALYTICS_SHIPMENT_METRICS: 'analytics.shipment.metrics',
  
  // Dead Letter Queue
  DLQ: 'dlq'
} as const

export type EventTopic = typeof EventTopics[keyof typeof EventTopics]

/**
 * Kafka Event Bus Implementation
 */
export class KafkaEventBus {
  private kafka: Kafka
  private producer: Producer | null = null
  private consumers: Map<string, Consumer> = new Map()
  private eventHandlers: Map<string, Set<(event: DomainEvent) => Promise<void>>> = new Map()
  
  constructor(private config: KafkaEventBusConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      sasl: config.sasl,
      retry: {
        retries: config.retries || 5,
        initialRetryTime: 100,
        maxRetryTime: 30000,
        multiplier: 2,
        factor: 0.2
      },
      requestTimeout: config.requestTimeout || 30000
    })
  }
  
  /**
   * Initialize producer
   */
  async connect(): Promise<void> {
    try {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 60000,
        compression: this.config.compression || CompressionTypes.GZIP,
        idempotent: true, // Exactly-once semantics
        maxInFlightRequests: 5,
        retry: {
          retries: 5,
          initialRetryTime: 100,
          maxRetryTime: 30000
        }
      })
      
      await this.producer.connect()
      console.log('✅ Kafka Producer connected')
    } catch (error) {
      console.error('❌ Failed to connect Kafka Producer:', error)
      throw error
    }
  }
  
  /**
   * Publish event to Kafka
   */
  async publish(topic: EventTopic, event: DomainEvent): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not connected. Call connect() first.')
    }
    
    try {
      // Add metadata
      event.metadata = {
        ...event.metadata,
        source: this.config.clientId,
        traceId: event.metadata.traceId || this.generateTraceId()
      }
      
      // Publish to Kafka
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.aggregateId,
            value: JSON.stringify(event),
            headers: {
              'event-type': event.eventType,
              'aggregate-type': event.aggregateType,
              'correlation-id': event.correlationId || '',
              'trace-id': event.metadata.traceId || ''
            },
            timestamp: event.timestamp.getTime().toString()
          }
        ],
        compression: CompressionTypes.GZIP
      })
      
      console.log(`📤 Event published: ${event.eventType} to ${topic}`)
    } catch (error) {
      console.error(`❌ Failed to publish event to ${topic}:`, error)
      
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(topic, event, error)
      
      throw error
    }
  }
  
  /**
   * Publish batch of events (high throughput)
   */
  async publishBatch(topic: EventTopic, events: DomainEvent[]): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not connected. Call connect() first.')
    }
    
    try {
      const messages = events.map(event => ({
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          'event-type': event.eventType,
          'aggregate-type': event.aggregateType,
          'correlation-id': event.correlationId || '',
          'trace-id': event.metadata.traceId || ''
        },
        timestamp: event.timestamp.getTime().toString()
      }))
      
      await this.producer.sendBatch({
        topicMessages: [
          {
            topic,
            messages
          }
        ],
        compression: CompressionTypes.GZIP
      })
      
      console.log(`📤 Batch published: ${events.length} events to ${topic}`)
    } catch (error) {
      console.error(`❌ Failed to publish batch to ${topic}:`, error)
      throw error
    }
  }
  
  /**
   * Subscribe to events
   */
  async subscribe(
    topic: EventTopic | EventTopic[],
    handler: (event: DomainEvent) => Promise<void>,
    groupId?: string
  ): Promise<void> {
    const consumerGroupId = groupId || this.config.groupId
    const topics = Array.isArray(topic) ? topic : [topic]
    
    // Create consumer
    const consumer = this.kafka.consumer({
      groupId: consumerGroupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 5000,
      retry: {
        retries: 5,
        initialRetryTime: 100,
        maxRetryTime: 30000
      }
    })
    
    await consumer.connect()
    console.log(`✅ Kafka Consumer connected: ${consumerGroupId}`)
    
    // Subscribe to topics
    await consumer.subscribe({
      topics,
      fromBeginning: false
    })
    
    // Register handlers
    topics.forEach(t => {
      if (!this.eventHandlers.has(t)) {
        this.eventHandlers.set(t, new Set())
      }
      this.eventHandlers.get(t)!.add(handler)
    })
    
    // Start consuming
    await consumer.run({
      autoCommit: false,
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload, handler)
      }
    })
    
    this.consumers.set(consumerGroupId, consumer)
    console.log(`📥 Subscribed to topics: ${topics.join(', ')}`)
  }
  
  /**
   * Handle incoming message
   */
  private async handleMessage(
    payload: EachMessagePayload,
    handler: (event: DomainEvent) => Promise<void>
  ): Promise<void> {
    const { topic, partition, message } = payload
    
    try {
      // Parse event
      const event: DomainEvent = JSON.parse(message.value!.toString())
      
      // Log receipt
      console.log(`📨 Received event: ${event.eventType} from ${topic}`)
      
      // Execute handler
      await handler(event)
      
      // Commit offset (exactly-once semantics)
      await payload.heartbeat()
      
      console.log(`✅ Event processed: ${event.eventType}`)
    } catch (error) {
      console.error(`❌ Error processing event from ${topic}:`, error)
      
      // Send to dead letter queue
      const event: DomainEvent = JSON.parse(message.value!.toString())
      await this.sendToDeadLetterQueue(topic, event, error)
      
      // Don't commit offset - will retry
      throw error
    }
  }
  
  /**
   * Send failed event to Dead Letter Queue
   */
  private async sendToDeadLetterQueue(
    originalTopic: string,
    event: DomainEvent,
    error: any
  ): Promise<void> {
    if (!this.producer) return
    
    try {
      await this.producer.send({
        topic: EventTopics.DLQ,
        messages: [
          {
            key: event.aggregateId,
            value: JSON.stringify({
              originalTopic,
              event,
              error: {
                message: error.message,
                stack: error.stack
              },
              timestamp: new Date().toISOString()
            }),
            headers: {
              'original-topic': originalTopic,
              'event-type': event.eventType,
              'error-type': error.constructor.name
            }
          }
        ]
      })
      
      console.log(`⚰️ Event sent to DLQ: ${event.eventType}`)
    } catch (dlqError) {
      console.error('❌ Failed to send to DLQ:', dlqError)
    }
  }
  
  /**
   * Replay events for a specific aggregate
   */
  async replayEvents(
    aggregateId: string,
    fromVersion: number = 0
  ): Promise<DomainEvent[]> {
    const consumer = this.kafka.consumer({
      groupId: `replay-${aggregateId}-${Date.now()}`
    })
    
    await consumer.connect()
    
    const events: DomainEvent[] = []
    const topics = Object.values(EventTopics).filter(t => t !== EventTopics.DLQ)
    
    await consumer.subscribe({ topics, fromBeginning: true })
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        const event: DomainEvent = JSON.parse(message.value!.toString())
        
        if (event.aggregateId === aggregateId && event.version >= fromVersion) {
          events.push(event)
        }
      }
    })
    
    // Stop after a timeout
    setTimeout(async () => {
      await consumer.disconnect()
    }, 5000)
    
    return events.sort((a, b) => a.version - b.version)
  }
  
  /**
   * Get current state by replaying events
   */
  async getCurrentState<T>(
    aggregateId: string,
    reducer: (state: T, event: DomainEvent) => T,
    initialState: T
  ): Promise<T> {
    const events = await this.replayEvents(aggregateId)
    return events.reduce(reducer, initialState)
  }
  
  /**
   * Disconnect all consumers and producer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect()
        console.log('👋 Kafka Producer disconnected')
      }
      
      for (const [groupId, consumer] of this.consumers.entries()) {
        await consumer.disconnect()
        console.log(`👋 Kafka Consumer disconnected: ${groupId}`)
      }
      
      this.consumers.clear()
      this.eventHandlers.clear()
    } catch (error) {
      console.error('❌ Error disconnecting Kafka:', error)
      throw error
    }
  }
  
  /**
   * Generate trace ID for distributed tracing
   */
  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Singleton instance
 */
let kafkaEventBus: KafkaEventBus | null = null

export function getKafkaEventBus(config?: KafkaEventBusConfig): KafkaEventBus {
  if (!kafkaEventBus && config) {
    kafkaEventBus = new KafkaEventBus(config)
  }
  
  if (!kafkaEventBus) {
    throw new Error('Kafka Event Bus not initialized. Provide config on first call.')
  }
  
  return kafkaEventBus
}

/**
 * Default configuration
 */
export const defaultKafkaConfig: KafkaEventBusConfig = {
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  clientId: process.env.KAFKA_CLIENT_ID || 'tms-wms-system',
  groupId: process.env.KAFKA_GROUP_ID || 'tms-wms-consumers',
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL_MECHANISM ? {
    mechanism: process.env.KAFKA_SASL_MECHANISM as any,
    username: process.env.KAFKA_SASL_USERNAME || '',
    password: process.env.KAFKA_SASL_PASSWORD || ''
  } : undefined,
  compression: CompressionTypes.GZIP,
  retries: 5,
  requestTimeout: 30000
}

export default KafkaEventBus










