import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { MultiProviderPlanningSystem, PlanningEvent, CoordinatedResponse, PlanningResult } from './planning-agent-system';

export interface WebSocketMessage {
  type: 'planning_event' | 'agent_response' | 'system_status' | 'performance_update' | 'erp_sync';
  data: any;
  timestamp: Date;
  agentId?: string;
}

export interface PlanningEventMessage extends WebSocketMessage {
  type: 'planning_event';
  data: PlanningEvent;
}

export interface AgentResponseMessage extends WebSocketMessage {
  type: 'agent_response';
  data: CoordinatedResponse;
  agentId: string;
}

export interface SystemStatusMessage extends WebSocketMessage {
  type: 'system_status';
  data: {
    isRunning: boolean;
    activeAgents: number;
    lastCycle: Date;
    nextCycle: Date;
    systemHealth: number;
  };
}

export interface PerformanceUpdateMessage extends WebSocketMessage {
  type: 'performance_update';
  data: {
    agentId: string;
    metrics: {
      successRate: number;
      responseTime: number;
      throughput: number;
      errorRate: number;
    };
  };
}

export class WebSocketCoordinationManager {
  private io: SocketIOServer;
  private planningSystem: MultiProviderPlanningSystem;
  private connectedClients: Map<string, any> = new Map();
  private agentRooms: Map<string, string[]> = new Map();

  constructor(server: HTTPServer, planningSystem: MultiProviderPlanningSystem) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    });
    this.planningSystem = planningSystem;
    this.initializeWebSocketHandlers();
  }

  private initializeWebSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Handle client joining agent rooms
      socket.on('join_agent_room', (agentId: string) => {
        socket.join(`agent_${agentId}`);
        if (!this.agentRooms.has(agentId)) {
          this.agentRooms.set(agentId, []);
        }
        this.agentRooms.get(agentId)!.push(socket.id);
        console.log(`Client ${socket.id} joined agent room: ${agentId}`);
      });

      // Handle client leaving agent rooms
      socket.on('leave_agent_room', (agentId: string) => {
        socket.leave(`agent_${agentId}`);
        const room = this.agentRooms.get(agentId);
        if (room) {
          const index = room.indexOf(socket.id);
          if (index > -1) {
            room.splice(index, 1);
          }
        }
        console.log(`Client ${socket.id} left agent room: ${agentId}`);
      });

      // Handle planning event requests
      socket.on('trigger_planning_event', async (eventData: PlanningEvent) => {
        try {
          const response = await this.planningSystem.handleEvent(eventData);
          this.broadcastAgentResponse(response);
        } catch (error) {
          console.error('Error handling planning event:', error);
          socket.emit('error', { message: 'Failed to handle planning event' });
        }
      });

      // Handle planning cycle requests
      socket.on('execute_planning_cycle', async () => {
        try {
          const results = await this.planningSystem.executePlanningCycle();
          this.broadcastPlanningResults(results);
        } catch (error) {
          console.error('Error executing planning cycle:', error);
          socket.emit('error', { message: 'Failed to execute planning cycle' });
        }
      });

      // Handle performance optimization requests
      socket.on('optimize_performance', async () => {
        try {
          const optimization = await this.planningSystem.optimizePerformance();
          this.broadcastPerformanceOptimization(optimization);
        } catch (error) {
          console.error('Error optimizing performance:', error);
          socket.emit('error', { message: 'Failed to optimize performance' });
        }
      });

      // Handle ERP sync requests
      socket.on('sync_erp_data', async () => {
        try {
          const erpData = await this.planningSystem.syncERPData();
          this.broadcastERPSync(erpData);
        } catch (error) {
          console.error('Error syncing ERP data:', error);
          socket.emit('error', { message: 'Failed to sync ERP data' });
        }
      });

      // Handle system status requests
      socket.on('get_system_status', () => {
        const status = this.planningSystem.getStatus();
        socket.emit('system_status', this.createSystemStatusMessage(status));
      });

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        
        // Remove from agent rooms
        for (const [agentId, clients] of this.agentRooms.entries()) {
          const index = clients.indexOf(socket.id);
          if (index > -1) {
            clients.splice(index, 1);
          }
        }
      });
    });

    // Set up periodic status broadcasts
    setInterval(() => {
      this.broadcastSystemStatus();
    }, 30000); // Every 30 seconds
  }

  // Broadcast methods
  public broadcastPlanningEvent(event: PlanningEvent): void {
    const message: PlanningEventMessage = {
      type: 'planning_event',
      data: event,
      timestamp: new Date()
    };

    this.io.emit('planning_event', message);
    console.log(`Broadcasted planning event: ${event.type}`);
  }

  public broadcastAgentResponse(response: CoordinatedResponse): void {
    const message: AgentResponseMessage = {
      type: 'agent_response',
      data: response,
      timestamp: new Date(),
      agentId: 'master-agent'
    };

    this.io.emit('agent_response', message);
    
    // Also broadcast to specific agent rooms
    response.responses.forEach(agentResponse => {
      this.io.to(`agent_${agentResponse.agentId}`).emit('agent_response', {
        ...message,
        agentId: agentResponse.agentId,
        data: agentResponse
      });
    });

    console.log(`Broadcasted agent response for event: ${response.eventId}`);
  }

  public broadcastPlanningResults(results: PlanningResult[]): void {
    results.forEach((result, index) => {
      const message: WebSocketMessage = {
        type: 'agent_response',
        data: result,
        timestamp: new Date(),
        agentId: `agent-${index + 1}`
      };

      this.io.emit('planning_result', message);
    });

    console.log(`Broadcasted ${results.length} planning results`);
  }

  public broadcastPerformanceOptimization(optimization: any): void {
    const message: WebSocketMessage = {
      type: 'performance_update',
      data: optimization,
      timestamp: new Date()
    };

    this.io.emit('performance_optimization', message);
    console.log('Broadcasted performance optimization');
  }

  public broadcastERPSync(erpData: any): void {
    const message: WebSocketMessage = {
      type: 'erp_sync',
      data: erpData,
      timestamp: new Date()
    };

    this.io.emit('erp_sync', message);
    console.log('Broadcasted ERP sync data');
  }

  public broadcastSystemStatus(): void {
    const status = this.planningSystem.getStatus();
    const message = this.createSystemStatusMessage(status);
    this.io.emit('system_status', message);
  }

  public broadcastToAgentRoom(agentId: string, message: WebSocketMessage): void {
    this.io.to(`agent_${agentId}`).emit('agent_message', message);
  }

  public broadcastToAll(message: WebSocketMessage): void {
    this.io.emit('broadcast', message);
  }

  // Helper methods
  private createSystemStatusMessage(status: any): SystemStatusMessage {
    return {
      type: 'system_status',
      data: {
        isRunning: status.isRunning,
        activeAgents: 5, // Fixed for now
        lastCycle: status.lastCycle,
        nextCycle: status.nextCycle,
        systemHealth: 94.2 // Simulated health score
      },
      timestamp: new Date()
    };
  }

  // Get connected clients info
  public getConnectedClients(): number {
    return this.connectedClients.size;
  }

  public getAgentRooms(): Map<string, string[]> {
    return new Map(this.agentRooms);
  }

  // Send message to specific client
  public sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit('message', message);
      return true;
    }
    return false;
  }

  // Send message to specific agent
  public sendToAgent(agentId: string, message: WebSocketMessage): void {
    this.io.to(`agent_${agentId}`).emit('agent_message', message);
  }

  // Broadcast performance update for specific agent
  public broadcastAgentPerformance(agentId: string, metrics: any): void {
    const message: PerformanceUpdateMessage = {
      type: 'performance_update',
      data: {
        agentId,
        metrics
      },
      timestamp: new Date()
    };

    this.io.emit('performance_update', message);
    this.io.to(`agent_${agentId}`).emit('performance_update', message);
  }

  // Emergency broadcast
  public broadcastEmergency(message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    const emergencyMessage: WebSocketMessage = {
      type: 'planning_event',
      data: {
        id: `emergency-${Date.now()}`,
        type: 'SYSTEM_EMERGENCY',
        severity,
        data: { message },
        timestamp: new Date(),
        affectedAgents: ['all']
      },
      timestamp: new Date()
    };

    this.io.emit('emergency', emergencyMessage);
    console.log(`Emergency broadcast: ${message} (${severity})`);
  }

  // Get server instance
  public getServer(): SocketIOServer {
    return this.io;
  }
}

// WebSocket client manager for agent communication
export class WebSocketClientManager {
  private socket: any;
  private agentId: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(agentId: string, serverUrl: string) {
    this.agentId = agentId;
    this.connect(serverUrl);
  }

  private connect(serverUrl: string): void {
    try {
      this.socket = require('socket.io-client')(serverUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error(`Failed to connect agent ${this.agentId}:`, error);
      this.handleReconnect(serverUrl);
    }
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log(`Agent ${this.agentId} connected to WebSocket server`);
      this.reconnectAttempts = 0;
      
      // Join agent room
      this.socket.emit('join_agent_room', this.agentId);
    });

    this.socket.on('disconnect', () => {
      console.log(`Agent ${this.agentId} disconnected from WebSocket server`);
    });

    this.socket.on('agent_message', (message: WebSocketMessage) => {
      console.log(`Agent ${this.agentId} received message:`, message);
      this.handleAgentMessage(message);
    });

    this.socket.on('planning_event', (message: PlanningEventMessage) => {
      console.log(`Agent ${this.agentId} received planning event:`, message);
      this.handlePlanningEvent(message.data);
    });

    this.socket.on('error', (error: any) => {
      console.error(`Agent ${this.agentId} WebSocket error:`, error);
    });
  }

  private handleReconnect(serverUrl: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Agent ${this.agentId} attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(serverUrl);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error(`Agent ${this.agentId} failed to reconnect after ${this.maxReconnectAttempts} attempts`);
    }
  }

  private handleAgentMessage(message: WebSocketMessage): void {
    // Handle different message types
    switch (message.type) {
      case 'performance_update':
        this.handlePerformanceUpdate(message.data);
        break;
      case 'system_status':
        this.handleSystemStatus(message.data);
        break;
      default:
        console.log(`Agent ${this.agentId} received unknown message type:`, message.type);
    }
  }

  private handlePlanningEvent(event: PlanningEvent): void {
    // Handle planning events
    console.log(`Agent ${this.agentId} handling planning event:`, event.type);
    
    // Emit response back to server
    this.sendAgentResponse({
      agentId: this.agentId,
      agentType: this.getAgentType(),
      analysis: `Agent ${this.agentId} analyzed ${event.type}`,
      recommendations: [`Recommendation 1 for ${event.type}`, `Recommendation 2 for ${event.type}`],
      impact: 'medium',
      confidence: 0.85
    });
  }

  private handlePerformanceUpdate(data: any): void {
    console.log(`Agent ${this.agentId} performance update:`, data);
  }

  private handleSystemStatus(data: any): void {
    console.log(`Agent ${this.agentId} system status:`, data);
  }

  private getAgentType(): string {
    // Determine agent type based on agent ID
    if (this.agentId.includes('demand')) return 'DemandPlanning';
    if (this.agentId.includes('inventory')) return 'InventoryPlanning';
    if (this.agentId.includes('production')) return 'ProductionPlanning';
    if (this.agentId.includes('supplier')) return 'SupplierPlanning';
    if (this.agentId.includes('master')) return 'MasterPlanning';
    return 'Unknown';
  }

  public sendAgentResponse(response: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('agent_response', response);
    }
  }

  public sendPerformanceMetrics(metrics: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('performance_metrics', {
        agentId: this.agentId,
        metrics,
        timestamp: new Date()
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
} 