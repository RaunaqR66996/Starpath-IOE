import { WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { EventEmitter } from 'events'

// Types for WebSocket events
export interface HandshakeEvent {
  type: 'HANDSHAKE_STARTED' | 'HANDSHAKE_STEP' | 'HANDSHAKE_COMPLETED' | 'HANDSHAKE_FAILED' | 'BLOCKCHAIN_CONFIRMED'
  shipmentId: string
  proofOfDeliveryId?: string
  timestamp: Date
  data: any
}

export interface ClientConnection {
  id: string
  userId?: string
  subscriptions: Set<string>
  lastActivity: Date
  metadata: any
}

export interface VerificationUpdate {
  proofOfDeliveryId: string
  step: string
  status: 'processing' | 'success' | 'failed'
  score: number
  details: any
  timestamp: Date
}

export interface BlockchainConfirmation {
  transactionId: string
  blockHash: string
  confirmations: number
  finalConfirmation: boolean
  timestamp: Date
}

export class DigitalHandshakeWebSocketService extends EventEmitter {
  private wss: WebSocketServer | null = null
  private clients: Map<string, ClientConnection> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 30000 // 30 seconds
  private readonly CONNECTION_TIMEOUT = 60000 // 1 minute

  constructor() {
    super()
    this.setupEventHandlers()
  }

  /**
   * Initialize WebSocket server
   */
  initialize(port: number = 8080): void {
    try {
      this.wss = new WebSocketServer({ 
        port,
        path: '/digital-handshake-ws'
      })

      this.wss.on('connection', (ws, request: IncomingMessage) => {
        this.handleConnection(ws, request)
      })

      this.wss.on('error', (error: Error) => {
        console.error('WebSocket server error:', error)
        this.emit('server_error', error)
      })

      // Start heartbeat
      this.startHeartbeat()

      console.log(`Digital Handshake WebSocket server listening on port ${port}`)
      this.emit('server_started', { port })

    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error)
      throw error
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: any, request: IncomingMessage): void {
    const clientId = this.generateClientId()
    const client: ClientConnection = {
      id: clientId,
      subscriptions: new Set(),
      lastActivity: new Date(),
      metadata: {
        userAgent: request.headers['user-agent'],
        ip: request.socket.remoteAddress,
        connectedAt: new Date()
      }
    }

    this.clients.set(clientId, client)
    
    // Associate WebSocket with client
    ws.clientId = clientId
    ws.isAlive = true

    console.log(`New Digital Handshake WebSocket connection: ${clientId}`)

    // Handle incoming messages
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString())
        this.handleMessage(clientId, data, ws)
      } catch (error) {
        console.error(`Error parsing message from ${clientId}:`, error)
        this.sendError(ws, 'Invalid message format')
      }
    })

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(clientId)
    })

    // Handle WebSocket errors
    ws.on('error', (error: Error) => {
      console.error(`WebSocket error for client ${clientId}:`, error)
      this.handleDisconnection(clientId)
    })

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true
      this.updateClientActivity(clientId)
    })

    // Send welcome message
    this.sendMessage(ws, {
      type: 'connection_established',
      clientId,
      timestamp: new Date(),
      supportedEvents: [
        'HANDSHAKE_STARTED',
        'HANDSHAKE_STEP', 
        'HANDSHAKE_COMPLETED',
        'HANDSHAKE_FAILED',
        'BLOCKCHAIN_CONFIRMED',
        'VERIFICATION_UPDATE'
      ]
    })
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(clientId: string, data: any, ws: any): void {
    const client = this.clients.get(clientId)
    if (!client) return

    this.updateClientActivity(clientId)

    switch (data.type) {
      case 'authenticate':
        this.handleAuthentication(clientId, data, ws)
        break

      case 'subscribe':
        this.handleSubscription(clientId, data.channels || [], ws)
        break

      case 'unsubscribe':
        this.handleUnsubscription(clientId, data.channels || [], ws)
        break

      case 'ping':
        this.sendMessage(ws, { type: 'pong', timestamp: new Date() })
        break

      case 'request_status':
        this.handleStatusRequest(clientId, data, ws)
        break

      default:
        console.log(`Unknown message type from ${clientId}:`, data.type)
        this.sendError(ws, `Unknown message type: ${data.type}`)
    }
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(clientId: string, data: any, ws: any): void {
    const client = this.clients.get(clientId)
    if (!client) return

    // In a real implementation, validate the token/credentials
    if (data.token || data.userId) {
      client.userId = data.userId
      client.metadata.authenticated = true
      client.metadata.authenticatedAt = new Date()

      this.sendMessage(ws, {
        type: 'authentication_success',
        userId: data.userId,
        timestamp: new Date()
      })

      console.log(`Client ${clientId} authenticated as user ${data.userId}`)
    } else {
      this.sendError(ws, 'Authentication failed')
    }
  }

  /**
   * Handle channel subscriptions
   */
  private handleSubscription(clientId: string, channels: string[], ws: any): void {
    const client = this.clients.get(clientId)
    if (!client) return

    channels.forEach(channel => {
      client.subscriptions.add(channel)
    })

    this.sendMessage(ws, {
      type: 'subscription_confirmed',
      channels: Array.from(client.subscriptions),
      timestamp: new Date()
    })

    console.log(`Client ${clientId} subscribed to channels:`, channels)
  }

  /**
   * Handle channel unsubscriptions
   */
  private handleUnsubscription(clientId: string, channels: string[], ws: any): void {
    const client = this.clients.get(clientId)
    if (!client) return

    channels.forEach(channel => {
      client.subscriptions.delete(channel)
    })

    this.sendMessage(ws, {
      type: 'unsubscription_confirmed',
      channels,
      remainingSubscriptions: Array.from(client.subscriptions),
      timestamp: new Date()
    })
  }

  /**
   * Handle status requests
   */
  private handleStatusRequest(clientId: string, data: any, ws: any): void {
    const statusData = {
      type: 'status_response',
      server: {
        uptime: process.uptime(),
        connectedClients: this.clients.size,
        timestamp: new Date()
      },
      client: {
        id: clientId,
        subscriptions: Array.from(this.clients.get(clientId)?.subscriptions || []),
        connectedSince: this.clients.get(clientId)?.metadata.connectedAt
      }
    }

    this.sendMessage(ws, statusData)
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(clientId: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      console.log(`Client ${clientId} disconnected`)
      this.clients.delete(clientId)
      this.emit('client_disconnected', { clientId, client })
    }
  }

  /**
   * Broadcast handshake event to subscribed clients
   */
  broadcastHandshakeEvent(event: HandshakeEvent): void {
    const message = {
      type: 'handshake_event',
      event,
      timestamp: new Date()
    }

    this.broadcastToSubscribers(`shipment:${event.shipmentId}`, message)
    this.broadcastToSubscribers('handshake:all', message)

    console.log(`Broadcasted handshake event: ${event.type} for shipment ${event.shipmentId}`)
  }

  /**
   * Broadcast verification update
   */
  broadcastVerificationUpdate(update: VerificationUpdate): void {
    const message = {
      type: 'verification_update',
      update,
      timestamp: new Date()
    }

    this.broadcastToSubscribers(`proof:${update.proofOfDeliveryId}`, message)
    this.broadcastToSubscribers('verification:all', message)
  }

  /**
   * Broadcast blockchain confirmation
   */
  broadcastBlockchainConfirmation(confirmation: BlockchainConfirmation): void {
    const message = {
      type: 'blockchain_confirmation',
      confirmation,
      timestamp: new Date()
    }

    this.broadcastToSubscribers(`blockchain:${confirmation.transactionId}`, message)
    this.broadcastToSubscribers('blockchain:all', message)
  }

  /**
   * Broadcast to clients subscribed to a specific channel
   */
  private broadcastToSubscribers(channel: string, message: any): void {
    if (!this.wss) return

    let sentCount = 0

    this.wss.clients.forEach((ws: any) => {
      if (ws.readyState === ws.OPEN) {
        const client = this.clients.get(ws.clientId)
        if (client && client.subscriptions.has(channel)) {
          this.sendMessage(ws, message)
          sentCount++
        }
      }
    })

    if (sentCount > 0) {
      console.log(`Broadcasted to ${sentCount} clients on channel: ${channel}`)
    }
  }

  /**
   * Send message to specific WebSocket
   */
  private sendMessage(ws: any, message: any): void {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(message))
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
    }
  }

  /**
   * Send error message to WebSocket
   */
  private sendError(ws: any, errorMessage: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message: errorMessage,
      timestamp: new Date()
    })
  }

  /**
   * Update client last activity
   */
  private updateClientActivity(clientId: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      client.lastActivity = new Date()
    }
  }

  /**
   * Start heartbeat to check client connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return

      this.wss.clients.forEach((ws: any) => {
        if (!ws.isAlive) {
          console.log(`Terminating inactive client: ${ws.clientId}`)
          ws.terminate()
          return
        }

        ws.isAlive = false
        ws.ping()
      })

      // Clean up inactive clients
      this.cleanupInactiveClients()

    }, this.HEARTBEAT_INTERVAL)
  }

  /**
   * Clean up clients that haven't been active
   */
  private cleanupInactiveClients(): void {
    const now = new Date()
    const clientsToRemove: string[] = []

    this.clients.forEach((client, clientId) => {
      const inactiveTime = now.getTime() - client.lastActivity.getTime()
      if (inactiveTime > this.CONNECTION_TIMEOUT) {
        clientsToRemove.push(clientId)
      }
    })

    clientsToRemove.forEach(clientId => {
      this.clients.delete(clientId)
      console.log(`Cleaned up inactive client: ${clientId}`)
    })
  }

  /**
   * Setup event handlers for Digital Handshake events
   */
  private setupEventHandlers(): void {
    // Listen for handshake events from the service
    this.on('handshake_started', (data) => {
      this.broadcastHandshakeEvent({
        type: 'HANDSHAKE_STARTED',
        shipmentId: data.shipmentId,
        timestamp: new Date(),
        data
      })
    })

    this.on('handshake_step', (data) => {
      this.broadcastVerificationUpdate({
        proofOfDeliveryId: data.proofOfDeliveryId,
        step: data.step,
        status: data.status,
        score: data.score,
        details: data.details,
        timestamp: new Date()
      })
    })

    this.on('handshake_completed', (data) => {
      this.broadcastHandshakeEvent({
        type: 'HANDSHAKE_COMPLETED',
        shipmentId: data.shipmentId,
        proofOfDeliveryId: data.proofOfDeliveryId,
        timestamp: new Date(),
        data
      })
    })

    this.on('blockchain_confirmed', (data) => {
      this.broadcastBlockchainConfirmation({
        transactionId: data.transactionId,
        blockHash: data.blockHash,
        confirmations: data.confirmations,
        finalConfirmation: data.finalConfirmation,
        timestamp: new Date()
      })
    })
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): any {
    const authenticatedClients = Array.from(this.clients.values())
      .filter(client => client.metadata.authenticated).length

    const subscriptionCounts: Record<string, number> = {}
    this.clients.forEach(client => {
      client.subscriptions.forEach(channel => {
        subscriptionCounts[channel] = (subscriptionCounts[channel] || 0) + 1
      })
    })

    return {
      totalConnections: this.clients.size,
      authenticatedConnections: authenticatedClients,
      subscriptionBreakdown: subscriptionCounts,
      serverUptime: process.uptime(),
      timestamp: new Date()
    }
  }

  /**
   * Shutdown WebSocket server
   */
  shutdown(): void {
    console.log('Shutting down Digital Handshake WebSocket server...')

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.wss) {
      // Notify all clients of shutdown
      this.wss.clients.forEach((ws: any) => {
        this.sendMessage(ws, {
          type: 'server_shutdown',
          message: 'Server is shutting down',
          timestamp: new Date()
        })
        ws.close()
      })

      this.wss.close(() => {
        console.log('Digital Handshake WebSocket server closed')
      })
    }

    this.clients.clear()
    this.emit('server_shutdown')
  }
}

// Export singleton instance
export const digitalHandshakeWebSocket = new DigitalHandshakeWebSocketService()

export default digitalHandshakeWebSocket 