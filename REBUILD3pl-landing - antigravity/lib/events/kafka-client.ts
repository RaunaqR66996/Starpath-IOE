/**
 * Kafka Event Client for Blue Ship Sync
 * Event-driven architecture for TMS/WMS integration
 */

import { Kafka, Producer, Consumer, logLevel } from 'kafkajs'

const kafka = new Kafka({
  clientId: 'blueship-sync',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  logLevel: logLevel.INFO,
})

// Producer for publishing events
export const producer: Producer = kafka.producer()

// Consumers for each service
export const wmsConsumer = kafka.consumer({ groupId: 'wms-service' })
export const tmsConsumer = kafka.consumer({ groupId: 'tms-service' })
export const inventoryConsumer = kafka.consumer({ groupId: 'inventory-service' })

/**
 * Event Types
 */
export enum EventType {
  // Order Events
  ORDER_CREATED = 'order.created',
  ORDER_RELEASED = 'order.released',
  ORDER_ALLOCATED = 'order.allocated',
  
  // Inventory Events
  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_MOVED = 'inventory.moved',
  STOCK_LOW = 'stock.low',
  
  // Shipment Events
  SHIPMENT_CREATED = 'shipment.created',
  SHIPMENT_STAGED = 'shipment.staged',
  SHIPMENT_DISPATCHED = 'shipment.dispatched',
  SHIPMENT_DELIVERED = 'shipment.delivered',
  
  // WMS Events
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  PICK_COMPLETED = 'pick.completed',
  PUTAWAY_COMPLETED = 'putaway.completed',
  
  // TMS Events
  ROUTE_OPTIMIZED = 'route.optimized',
  CARRIER_ASSIGNED = 'carrier.assigned',
  CARRIER_TENDERED = 'carrier.tendered',
  
  // Dock Events
  DOCK_ARRIVAL = 'dock.arrival',
  DOCK_DEPARTURE = 'dock.departure',
}

/**
 * Publish an event to Kafka
 */
export async function publishEvent(
  topic: string,
  eventType: EventType,
  payload: any
): Promise<void> {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: eventType,
          value: JSON.stringify({
            type: eventType,
            timestamp: new Date().toISOString(),
            ...payload,
          }),
        },
      ],
    })
  } catch (error) {
    console.error('Failed to publish event:', error)
    throw error
  }
}

/**
 * Consume events from Kafka
 */
export async function consumeEvents(
  consumer: Consumer,
  topics: string[],
  handler: (message: any) => Promise<void>
): Promise<void> {
  await consumer.subscribe({ topics })
  
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString()
        if (value) {
          const event = JSON.parse(value)
          await handler(event)
        }
      } catch (error) {
        console.error('Failed to process message:', error)
      }
    },
  })
}

/**
 * Initialize Kafka connections
 */
export async function initializeKafka(): Promise<void> {
  await producer.connect()
  await wmsConsumer.connect()
  await tmsConsumer.connect()
  await inventoryConsumer.connect()
  
  console.log('✅ Kafka connections established')
}

/**
 * Shutdown Kafka connections
 */
export async function shutdownKafka(): Promise<void> {
  await producer.disconnect()
  await wmsConsumer.disconnect()
  await tmsConsumer.disconnect()
  await inventoryConsumer.disconnect()
  
  console.log('✅ Kafka connections closed')
}













