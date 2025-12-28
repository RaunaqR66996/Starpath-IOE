import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { MultiProviderPlanningSystem } from './planning-agent-system';
import { WebSocketCoordinationManager } from './websocket-coordination';

export class PlanningWebSocketServer {
  private io: SocketIOServer;
  private planningSystem: MultiProviderPlanningSystem;
  private coordinationManager: WebSocketCoordinationManager;
  private isRunning: boolean = false;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.planningSystem = new MultiProviderPlanningSystem();
    this.coordinationManager = new WebSocketCoordinationManager(server, this.planningSystem);
    
    this.initializeServer();
  }

  private initializeServer(): void {
    // Handle client connections
    this.io.on('connection', (socket) => {
      console.log(`Planning client connected: ${socket.id}`);
      
      // Join planning room
      socket.join('planning-system');
      
      // Send initial system status
      const status = this.planningSystem.getStatus();
      socket.emit('system_status', {
        type: 'system_status',
        data: status,
        timestamp: new Date()
      });

      // Handle planning cycle requests
      socket.on('execute_planning_cycle', async () => {
        try {
          console.log('Executing planning cycle...');
          const results = await this.planningSystem.executePlanningCycle();
          
          // Broadcast results to all clients
          this.io.to('planning-system').emit('planning_cycle_completed', {
            type: 'planning_cycle_completed',
            data: results,
            timestamp: new Date()
          });
          
          socket.emit('planning_cycle_success', {
            message: 'Planning cycle executed successfully',
            resultsCount: results.length
          });
        } catch (error) {
          console.error('Planning cycle error:', error);
          socket.emit('planning_cycle_error', {
            error: 'Failed to execute planning cycle'
          });
        }
      });

      // Handle event triggers
      socket.on('trigger_event', async (eventData) => {
        try {
          console.log('Handling planning event:', eventData.type);
          const response = await this.planningSystem.handleEvent(eventData);
          
          // Broadcast event response
          this.io.to('planning-system').emit('event_handled', {
            type: 'event_handled',
            data: response,
            timestamp: new Date()
          });
          
          socket.emit('event_success', {
            message: 'Event handled successfully',
            eventId: eventData.id
          });
        } catch (error) {
          console.error('Event handling error:', error);
          socket.emit('event_error', {
            error: 'Failed to handle event'
          });
        }
      });

      // Handle performance optimization requests
      socket.on('optimize_performance', async () => {
        try {
          console.log('Optimizing performance...');
          const optimization = await this.planningSystem.optimizePerformance();
          
          this.io.to('planning-system').emit('performance_optimized', {
            type: 'performance_optimized',
            data: optimization,
            timestamp: new Date()
          });
          
          socket.emit('optimization_success', {
            message: 'Performance optimized successfully'
          });
        } catch (error) {
          console.error('Performance optimization error:', error);
          socket.emit('optimization_error', {
            error: 'Failed to optimize performance'
          });
        }
      });

      // Handle ERP sync requests
      socket.on('sync_erp', async () => {
        try {
          console.log('Syncing ERP data...');
          const erpData = await this.planningSystem.syncERPData();
          
          this.io.to('planning-system').emit('erp_synced', {
            type: 'erp_synced',
            data: erpData,
            timestamp: new Date()
          });
          
          socket.emit('erp_sync_success', {
            message: 'ERP data synced successfully'
          });
        } catch (error) {
          console.error('ERP sync error:', error);
          socket.emit('erp_sync_error', {
            error: 'Failed to sync ERP data'
          });
        }
      });

      // Handle system control requests
      socket.on('system_control', async (controlData) => {
        try {
          console.log('System control request:', controlData.action);
          
          switch (controlData.action) {
            case 'start':
              await this.planningSystem.start();
              break;
            case 'stop':
              await this.planningSystem.stop();
              break;
            case 'restart':
              await this.planningSystem.stop();
              await new Promise(resolve => setTimeout(resolve, 1000));
              await this.planningSystem.start();
              break;
            default:
              throw new Error(`Unknown control action: ${controlData.action}`);
          }
          
          const status = this.planningSystem.getStatus();
          this.io.to('planning-system').emit('system_status', {
            type: 'system_status',
            data: status,
            timestamp: new Date()
          });
          
          socket.emit('control_success', {
            message: `System ${controlData.action} successful`
          });
        } catch (error) {
          console.error('System control error:', error);
          socket.emit('control_error', {
            error: `Failed to ${controlData.action} system`
          });
        }
      });

      // Handle agent-specific requests
      socket.on('join_agent_room', (agentId: string) => {
        socket.join(`agent_${agentId}`);
        console.log(`Client ${socket.id} joined agent room: ${agentId}`);
      });

      socket.on('leave_agent_room', (agentId: string) => {
        socket.leave(`agent_${agentId}`);
        console.log(`Client ${socket.id} left agent room: ${agentId}`);
      });

      // Handle client disconnection
      socket.on('disconnect', () => {
        console.log(`Planning client disconnected: ${socket.id}`);
      });
    });

    // Set up periodic status broadcasts
    setInterval(() => {
      if (this.isRunning) {
        const status = this.planningSystem.getStatus();
        this.io.to('planning-system').emit('system_status', {
          type: 'system_status',
          data: status,
          timestamp: new Date()
        });
      }
    }, 30000); // Every 30 seconds

    // Set up periodic performance updates
    setInterval(async () => {
      if (this.isRunning) {
        try {
          const optimization = await this.planningSystem.optimizePerformance();
          this.io.to('planning-system').emit('performance_update', {
            type: 'performance_update',
            data: optimization,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Performance update error:', error);
        }
      }
    }, 60000); // Every minute
  }

  public start(): void {
    this.isRunning = true;
    console.log('Planning WebSocket server started');
  }

  public stop(): void {
    this.isRunning = false;
    console.log('Planning WebSocket server stopped');
  }

  public getServer(): SocketIOServer {
    return this.io;
  }

  public getCoordinationManager(): WebSocketCoordinationManager {
    return this.coordinationManager;
  }

  public getPlanningSystem(): MultiProviderPlanningSystem {
    return this.planningSystem;
  }

  // Broadcast methods for external use
  public broadcastPlanningEvent(event: any): void {
    this.io.to('planning-system').emit('planning_event', {
      type: 'planning_event',
      data: event,
      timestamp: new Date()
    });
  }

  public broadcastAgentResponse(response: any): void {
    this.io.to('planning-system').emit('agent_response', {
      type: 'agent_response',
      data: response,
      timestamp: new Date()
    });
  }

  public broadcastSystemAlert(message: string, severity: string): void {
    this.io.to('planning-system').emit('system_alert', {
      type: 'system_alert',
      data: { message, severity },
      timestamp: new Date()
    });
  }

  public broadcastToAgent(agentId: string, message: any): void {
    this.io.to(`agent_${agentId}`).emit('agent_message', {
      type: 'agent_message',
      data: message,
      timestamp: new Date()
    });
  }

  public getConnectedClients(): number {
    return this.io.engine.clientsCount;
  }

  public getAgentRooms(): string[] {
    const rooms = Array.from(this.io.sockets.adapter.rooms.keys());
    return rooms.filter(room => room.startsWith('agent_'));
  }
}

// Client-side WebSocket manager
export class PlanningWebSocketClient {
  private socket: any;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(serverUrl: string) {
    this.connect(serverUrl);
  }

  private connect(serverUrl: string): void {
    try {
      this.socket = require('socket.io-client')(serverUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to connect to planning WebSocket server:', error);
      this.handleReconnect(serverUrl);
    }
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to planning WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join planning system room
      this.socket.emit('join_agent_room', 'planning-system');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from planning WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('system_status', (message: any) => {
      this.triggerEvent('system_status', message.data);
    });

    this.socket.on('planning_cycle_completed', (message: any) => {
      this.triggerEvent('planning_cycle_completed', message.data);
    });

    this.socket.on('event_handled', (message: any) => {
      this.triggerEvent('event_handled', message.data);
    });

    this.socket.on('performance_optimized', (message: any) => {
      this.triggerEvent('performance_optimized', message.data);
    });

    this.socket.on('erp_synced', (message: any) => {
      this.triggerEvent('erp_synced', message.data);
    });

    this.socket.on('system_alert', (message: any) => {
      this.triggerEvent('system_alert', message.data);
    });

    this.socket.on('error', (error: any) => {
      console.error('Planning WebSocket error:', error);
      this.triggerEvent('error', error);
    });
  }

  private handleReconnect(serverUrl: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to planning server ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(serverUrl);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error(`Failed to reconnect to planning server after ${this.maxReconnectAttempts} attempts`);
    }
  }

  private triggerEvent(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Public methods
  public on(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public off(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public executePlanningCycle(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to planning server'));
        return;
      }

      this.socket.emit('execute_planning_cycle');
      
      const successHandler = (data: any) => {
        this.socket.off('planning_cycle_success', successHandler);
        this.socket.off('planning_cycle_error', errorHandler);
        resolve(data);
      };

      const errorHandler = (error: any) => {
        this.socket.off('planning_cycle_success', successHandler);
        this.socket.off('planning_cycle_error', errorHandler);
        reject(error);
      };

      this.socket.on('planning_cycle_success', successHandler);
      this.socket.on('planning_cycle_error', errorHandler);
    });
  }

  public triggerEvent(eventData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to planning server'));
        return;
      }

      this.socket.emit('trigger_event', eventData);
      
      const successHandler = (data: any) => {
        this.socket.off('event_success', successHandler);
        this.socket.off('event_error', errorHandler);
        resolve(data);
      };

      const errorHandler = (error: any) => {
        this.socket.off('event_success', successHandler);
        this.socket.off('event_error', errorHandler);
        reject(error);
      };

      this.socket.on('event_success', successHandler);
      this.socket.on('event_error', errorHandler);
    });
  }

  public optimizePerformance(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to planning server'));
        return;
      }

      this.socket.emit('optimize_performance');
      
      const successHandler = (data: any) => {
        this.socket.off('optimization_success', successHandler);
        this.socket.off('optimization_error', errorHandler);
        resolve(data);
      };

      const errorHandler = (error: any) => {
        this.socket.off('optimization_success', successHandler);
        this.socket.off('optimization_error', errorHandler);
        reject(error);
      };

      this.socket.on('optimization_success', successHandler);
      this.socket.on('optimization_error', errorHandler);
    });
  }

  public syncERP(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to planning server'));
        return;
      }

      this.socket.emit('sync_erp');
      
      const successHandler = (data: any) => {
        this.socket.off('erp_sync_success', successHandler);
        this.socket.off('erp_sync_error', errorHandler);
        resolve(data);
      };

      const errorHandler = (error: any) => {
        this.socket.off('erp_sync_success', successHandler);
        this.socket.off('erp_sync_error', errorHandler);
        reject(error);
      };

      this.socket.on('erp_sync_success', successHandler);
      this.socket.on('erp_sync_error', errorHandler);
    });
  }

  public systemControl(action: string, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to planning server'));
        return;
      }

      this.socket.emit('system_control', { action, options });
      
      const successHandler = (data: any) => {
        this.socket.off('control_success', successHandler);
        this.socket.off('control_error', errorHandler);
        resolve(data);
      };

      const errorHandler = (error: any) => {
        this.socket.off('control_success', successHandler);
        this.socket.off('control_error', errorHandler);
        reject(error);
      };

      this.socket.on('control_success', successHandler);
      this.socket.on('control_error', errorHandler);
    });
  }

  public joinAgentRoom(agentId: string): void {
    if (this.isConnected) {
      this.socket.emit('join_agent_room', agentId);
    }
  }

  public leaveAgentRoom(agentId: string): void {
    if (this.isConnected) {
      this.socket.emit('leave_agent_room', agentId);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }
} 