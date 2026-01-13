// WMS WebSocket Integration
// Handles real-time updates for warehouse operations

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { WmsEventStore, WmsEvent } from '@/lib/events/wms-event-store'
import { WmsProjections } from '@/lib/projections/wms-projections'

export class WmsWebSocketServer {
  private io: SocketIOServer
  private eventStore: WmsEventStore
  private projections: WmsProjections

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.FRONTEND_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    this.eventStore = WmsEventStore.getInstance()
    this.projections = new WmsProjections()

    this.setupEventHandlers()
    this.setupEventListeners()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`)

      // Handle warehouse site subscription
      socket.on('subscribe-warehouse', (data: { siteId: string, tenantId: string }) => {
        const { siteId, tenantId } = data
        socket.join(`warehouse-${siteId}`)
        socket.join(`tenant-${tenantId}`)
        console.log(`Client ${socket.id} subscribed to warehouse ${siteId}`)
      })

      // Handle inventory subscription
      socket.on('subscribe-inventory', (data: { siteId: string, binId?: string, itemId?: string }) => {
        const { siteId, binId, itemId } = data
        if (binId) {
          socket.join(`inventory-bin-${siteId}-${binId}`)
        }
        if (itemId) {
          socket.join(`inventory-item-${siteId}-${itemId}`)
        }
        socket.join(`inventory-${siteId}`)
        console.log(`Client ${socket.id} subscribed to inventory for site ${siteId}`)
      })

      // Handle task subscription
      socket.on('subscribe-tasks', (data: { siteId: string, userId?: string }) => {
        const { siteId, userId } = data
        socket.join(`tasks-${siteId}`)
        if (userId) {
          socket.join(`tasks-user-${userId}`)
        }
        console.log(`Client ${socket.id} subscribed to tasks for site ${siteId}`)
      })

      // Handle 3D warehouse subscription
      socket.on('subscribe-3d', (data: { siteId: string, tiles: string[] }) => {
        const { siteId, tiles } = data
        socket.join(`3d-${siteId}`)
        tiles.forEach(tile => {
          socket.join(`3d-tile-${siteId}-${tile}`)
        })
        console.log(`Client ${socket.id} subscribed to 3D warehouse ${siteId}`)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`)
      })
    })
  }

  private setupEventListeners() {
    // Listen for inventory events
    this.eventStore.on('inventory-updated', (event: WmsEvent) => {
      this.broadcastInventoryUpdate(event)
    })

    // Listen for task events
    this.eventStore.on('task-updated', (event: WmsEvent) => {
      this.broadcastTaskUpdate(event)
    })

    // Listen for order events
    this.eventStore.on('order-updated', (event: WmsEvent) => {
      this.broadcastOrderUpdate(event)
    })

    // Listen for warehouse events
    this.eventStore.on('warehouse-updated', (event: WmsEvent) => {
      this.broadcastWarehouseUpdate(event)
    })
  }

  private broadcastInventoryUpdate(event: WmsEvent) {
    const { siteId, binId, itemId } = event.eventData

    // Broadcast to warehouse subscribers
    this.io.to(`warehouse-${siteId}`).emit('inventory-updated', {
      eventId: event.id,
      eventType: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp
    })

    // Broadcast to specific bin subscribers
    if (binId) {
      this.io.to(`inventory-bin-${siteId}-${binId}`).emit('inventory-updated', {
        eventId: event.id,
        eventType: event.eventType,
        data: event.eventData,
        timestamp: event.timestamp
      })
    }

    // Broadcast to specific item subscribers
    if (itemId) {
      this.io.to(`inventory-item-${siteId}-${itemId}`).emit('inventory-updated', {
        eventId: event.id,
        eventType: event.eventType,
        data: event.eventData,
        timestamp: event.timestamp
      })
    }

    // Broadcast to 3D warehouse subscribers
    this.io.to(`3d-${siteId}`).emit('3d-inventory-updated', {
      eventId: event.id,
      eventType: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp
    })
  }

  private broadcastTaskUpdate(event: WmsEvent) {
    const { siteId, assignedUserId } = event.eventData

    // Broadcast to warehouse subscribers
    this.io.to(`warehouse-${siteId}`).emit('task-updated', {
      eventId: event.id,
      eventType: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp
    })

    // Broadcast to task subscribers
    this.io.to(`tasks-${siteId}`).emit('task-updated', {
      eventId: event.id,
      eventType: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp
    })

    // Broadcast to specific user subscribers
    if (assignedUserId) {
      this.io.to(`tasks-user-${assignedUserId}`).emit('task-updated', {
        eventId: event.id,
        eventType: event.eventType,
        data: event.eventData,
        timestamp: event.timestamp
      })
    }
  }

  private broadcastOrderUpdate(event: WmsEvent) {
    const { siteId } = event.eventData

    // Broadcast to warehouse subscribers
    this.io.to(`warehouse-${siteId}`).emit('order-updated', {
      eventId: event.id,
      eventType: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp
    })
  }

  private broadcastWarehouseUpdate(event: WmsEvent) {
    const { siteId } = event.eventData

    // Broadcast to warehouse subscribers
    this.io.to(`warehouse-${siteId}`).emit('warehouse-updated', {
      eventId: event.id,
      eventType: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp
    })

    // Broadcast to 3D warehouse subscribers
    this.io.to(`3d-${siteId}`).emit('3d-warehouse-updated', {
      eventId: event.id,
      eventType: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp
    })
  }

  /**
   * Broadcast system-wide alerts
   */
  public broadcastAlert(alert: {
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    siteId?: string
    tenantId?: string
  }) {
    if (alert.siteId) {
      this.io.to(`warehouse-${alert.siteId}`).emit('alert', alert)
    } else if (alert.tenantId) {
      this.io.to(`tenant-${alert.tenantId}`).emit('alert', alert)
    } else {
      this.io.emit('alert', alert)
    }
  }

  /**
   * Broadcast maintenance notifications
   */
  public broadcastMaintenance(notification: {
    type: 'start' | 'end'
    message: string
    siteId: string
    estimatedDuration?: number
  }) {
    this.io.to(`warehouse-${notification.siteId}`).emit('maintenance', notification)
  }

  /**
   * Get connected clients count
   */
  public getConnectedClients(): number {
    return this.io.engine.clientsCount
  }

  /**
   * Get warehouse subscribers count
   */
  public getWarehouseSubscribers(siteId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`warehouse-${siteId}`)
    return room ? room.size : 0
  }
}

// Client-side WebSocket integration
export class WmsWebSocketClient {
  private socket: any
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(url: string) {
    this.socket = new (require('socket.io-client'))(url)
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to WMS WebSocket server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WMS WebSocket server')
    })

    this.socket.on('inventory-updated', (data) => {
      this.emit('inventory-updated', data)
    })

    this.socket.on('task-updated', (data) => {
      this.emit('task-updated', data)
    })

    this.socket.on('order-updated', (data) => {
      this.emit('order-updated', data)
    })

    this.socket.on('warehouse-updated', (data) => {
      this.emit('warehouse-updated', data)
    })

    this.socket.on('3d-inventory-updated', (data) => {
      this.emit('3d-inventory-updated', data)
    })

    this.socket.on('3d-warehouse-updated', (data) => {
      this.emit('3d-warehouse-updated', data)
    })

    this.socket.on('alert', (data) => {
      this.emit('alert', data)
    })

    this.socket.on('maintenance', (data) => {
      this.emit('maintenance', data)
    })
  }

  public subscribeWarehouse(siteId: string, tenantId: string) {
    this.socket.emit('subscribe-warehouse', { siteId, tenantId })
  }

  public subscribeInventory(siteId: string, binId?: string, itemId?: string) {
    this.socket.emit('subscribe-inventory', { siteId, binId, itemId })
  }

  public subscribeTasks(siteId: string, userId?: string) {
    this.socket.emit('subscribe-tasks', { siteId, userId })
  }

  public subscribe3D(siteId: string, tiles: string[]) {
    this.socket.emit('subscribe-3d', { siteId, tiles })
  }

  public on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  public off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  public disconnect() {
    this.socket.disconnect()
  }
}


