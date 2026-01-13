import { EventEmitter } from 'events'
import { WebSocket, WebSocketServer } from 'ws'

interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
  correlationId?: string
}

interface ClientConnection {
  id: string
  ws: WebSocket
  userId?: string
  organizationId?: string
  connectedAt: Date
  lastActivity: Date
}

export class WebSocketCluster extends EventEmitter {
  private static instance: WebSocketCluster
  private wss: WebSocketServer | null = null
  private clients: Map<string, ClientConnection> = new Map()
  private messageQueue: Map<string, WebSocketMessage[]> = new Map()
  private clusterNodes: Map<string, { host: string; port: number; status: string }> = new Map()

  constructor() {
    super()
    this.initializeCluster()
  }

  static getInstance(): WebSocketCluster {
    if (!WebSocketCluster.instance) {
      WebSocketCluster.instance = new WebSocketCluster()
    }
    return WebSocketCluster.instance
  }

  private initializeCluster(): void {
    // Initialize cluster nodes (in-memory for now)
    this.clusterNodes.set('node-1', {
      host: 'localhost',
      port: 3001,
      status: 'active'
    })
    
    console.log('WebSocket cluster initialized with in-memory storage')
  }

  start(port: number = 3001): void {
    if (this.wss) {
      console.log('WebSocket server already running')
      return
    }

    this.wss = new WebSocketServer({ port })

    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId()
      const connection: ClientConnection = {
        id: clientId,
        ws,
        connectedAt: new Date(),
        lastActivity: new Date()
      }

      this.clients.set(clientId, connection)

      console.log(`Client connected: ${clientId}`)

      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          this.handleMessage(clientId, message)
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      })

      ws.on('close', () => {
        this.clients.delete(clientId)
        console.log(`Client disconnected: ${clientId}`)
      })

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error)
        this.clients.delete(clientId)
      })

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection_established',
        payload: { clientId, timestamp: new Date() },
        timestamp: new Date()
      })
    })

    console.log(`WebSocket cluster started on port ${port}`)
  }

  private handleMessage(clientId: string, message: WebSocketMessage): void {
    const connection = this.clients.get(clientId)
    if (!connection) return

    connection.lastActivity = new Date()

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message.payload)
        break
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message.payload)
        break
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          payload: { timestamp: new Date() },
          timestamp: new Date()
        })
        break
      default:
        this.emit('message', { clientId, message })
    }
  }

  private handleSubscribe(clientId: string, payload: any): void {
    const { channels = [] } = payload
    const connection = this.clients.get(clientId)
    if (!connection) return

    // Store subscription in memory
    if (!this.messageQueue.has(clientId)) {
      this.messageQueue.set(clientId, [])
    }

    this.sendToClient(clientId, {
      type: 'subscribed',
      payload: { channels, timestamp: new Date() },
      timestamp: new Date()
    })
  }

  private handleUnsubscribe(clientId: string, payload: any): void {
    const { channels = [] } = payload
    
    this.sendToClient(clientId, {
      type: 'unsubscribed',
      payload: { channels, timestamp: new Date() },
      timestamp: new Date()
    })
  }

  broadcast(message: WebSocketMessage): void {
    this.clients.forEach((connection, clientId) => {
      this.sendToClient(clientId, message)
    })
  }

  broadcastToOrganization(organizationId: string, message: WebSocketMessage): void {
    this.clients.forEach((connection, clientId) => {
      if (connection.organizationId === organizationId) {
        this.sendToClient(clientId, message)
      }
    })
  }

  sendToClient(clientId: string, message: WebSocketMessage): void {
    const connection = this.clients.get(clientId)
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      connection.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error)
      this.clients.delete(clientId)
    }
  }

  sendToUser(userId: string, message: WebSocketMessage): void {
    this.clients.forEach((connection, clientId) => {
      if (connection.userId === userId) {
        this.sendToClient(clientId, message)
      }
    })
  }

  getConnectedClients(): ClientConnection[] {
    return Array.from(this.clients.values())
  }

  getClusterStatus(): any {
    return {
      nodes: Array.from(this.clusterNodes.values()),
      connectedClients: this.clients.size,
      messageQueueSize: Array.from(this.messageQueue.values()).reduce((sum, queue) => sum + queue.length, 0)
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  stop(): void {
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
    this.clients.clear()
    this.messageQueue.clear()
    console.log('WebSocket cluster stopped')
  }
}

export const wsCluster = WebSocketCluster.getInstance() 