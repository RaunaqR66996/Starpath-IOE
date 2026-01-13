// WebSocket Server for Real-time AI Agent Communication
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { 
  WebSocketMessage, 
  WebSocketMessageType, 
  Agent, 
  AgentStatus, 
  AgentTask, 
  TaskStatus,
  AgentCommunication 
} from './types';

interface ClientConnection {
  id: string;
  ws: WebSocket;
  type: 'dashboard' | 'agent' | 'client';
  agentId?: string;
  subscriptions: string[];
  lastPing: Date;
}

export class AgentWebSocketServer {
  private wss: WebSocketServer;
  private connections: Map<string, ClientConnection>;
  private agents: Map<string, Agent>;
  private taskQueue: Map<string, AgentTask[]>;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.connections = new Map();
    this.agents = new Map();
    this.taskQueue = new Map();
    
    this.setupWebSocketServer();
    this.startHeartbeat();
    
    console.log(`AI Agent WebSocket Server running on port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const connectionId = this.generateConnectionId();
      const clientIP = request.socket.remoteAddress;
      
      console.log(`New WebSocket connection: ${connectionId} from ${clientIP}`);
      
      const connection: ClientConnection = {
        id: connectionId,
        ws,
        type: 'client',
        subscriptions: [],
        lastPing: new Date()
      };
      
      this.connections.set(connectionId, connection);
      
      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error(`Error parsing WebSocket message from ${connectionId}:`, error);
          this.sendError(connectionId, 'Invalid message format');
        }
      });
      
      // Handle connection close
      ws.on('close', () => {
        console.log(`WebSocket connection closed: ${connectionId}`);
        this.connections.delete(connectionId);
      });
      
      // Handle connection errors
      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
        this.connections.delete(connectionId);
      });
      
      // Send welcome message
      this.sendMessage(connectionId, {
        type: WebSocketMessageType.SYSTEM_ALERT,
        payload: {
          message: 'Connected to AI Agent WebSocket Server',
          connectionId,
          serverTime: new Date()
        },
        timestamp: new Date()
      });
    });
  }

  private handleMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      switch (message.type) {
        case WebSocketMessageType.AGENT_STATUS_UPDATE:
          this.handleAgentStatusUpdate(connectionId, message.payload);
          break;
          
        case WebSocketMessageType.TASK_UPDATE:
          this.handleTaskUpdate(connectionId, message.payload);
          break;
          
        case WebSocketMessageType.CHAT_MESSAGE:
          this.handleChatMessage(connectionId, message.payload);
          break;
          
        default:
          // Handle subscription requests and other messages
          this.handleGenericMessage(connectionId, message);
      }
    } catch (error) {
      console.error(`Error handling message from ${connectionId}:`, error);
      this.sendError(connectionId, 'Error processing message');
    }
  }

  private handleAgentStatusUpdate(connectionId: string, payload: any): void {
    const { agentId, status, metrics } = payload;
    
    // Update agent status
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActive = new Date();
      if (metrics) {
        agent.metrics = { ...agent.metrics, ...metrics };
      }
      
      // Broadcast status update to all dashboard connections
      this.broadcastToDashboards({
        type: WebSocketMessageType.AGENT_STATUS_UPDATE,
        payload: { agentId, status, metrics },
        timestamp: new Date()
      });
    }
  }

  private handleTaskUpdate(connectionId: string, payload: any): void {
    const { taskId, agentId, status, output, error } = payload;
    
    // Update task status
    const agentTasks = this.taskQueue.get(agentId) || [];
    const taskIndex = agentTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      const task = agentTasks[taskIndex];
      task.status = status;
      
      if (status === TaskStatus.COMPLETED) {
        task.completedAt = new Date();
        task.output = output;
        task.actualDuration = task.startedAt ? 
          Date.now() - task.startedAt.getTime() : undefined;
      } else if (status === TaskStatus.FAILED) {
        task.error = error;
      }
      
      // Broadcast task update
      this.broadcastToDashboards({
        type: WebSocketMessageType.TASK_UPDATE,
        payload: { taskId, agentId, status, output, error },
        timestamp: new Date()
      });
    }
  }

  private handleChatMessage(connectionId: string, payload: any): void {
    const { agentId, message, userId, sessionId } = payload;
    
    // Route chat message to appropriate agent
    const agentConnections = Array.from(this.connections.values())
      .filter(conn => conn.type === 'agent' && conn.agentId === agentId);
    
    if (agentConnections.length > 0) {
      agentConnections.forEach(conn => {
        this.sendMessage(conn.id, {
          type: WebSocketMessageType.CHAT_MESSAGE,
          payload: { message, userId, sessionId },
          timestamp: new Date(),
          correlationId: this.generateCorrelationId()
        });
      });
    } else {
      // Agent not available, queue message or send error
      this.sendError(connectionId, `Agent ${agentId} is not available`);
    }
  }

  private handleGenericMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Handle subscription requests
    if (message.payload?.action === 'subscribe') {
      const { channels, agentId, type } = message.payload;
      
      if (agentId) {
        connection.agentId = agentId;
        connection.type = 'agent';
      }
      
      if (type) {
        connection.type = type;
      }
      
      if (channels) {
        connection.subscriptions = [...connection.subscriptions, ...channels];
      }
      
      this.sendMessage(connectionId, {
        type: WebSocketMessageType.SYSTEM_ALERT,
        payload: { message: 'Subscription updated', subscriptions: connection.subscriptions },
        timestamp: new Date()
      });
    }
    
    // Handle ping/pong for heartbeat
    if (message.payload?.action === 'ping') {
      connection.lastPing = new Date();
      this.sendMessage(connectionId, {
        type: WebSocketMessageType.SYSTEM_ALERT,
        payload: { action: 'pong', serverTime: new Date() },
        timestamp: new Date()
      });
    }
  }

  // Public methods for agent system integration
  public registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.taskQueue.set(agent.id, []);
    
    // Broadcast agent registration to dashboards
    this.broadcastToDashboards({
      type: WebSocketMessageType.AGENT_STATUS_UPDATE,
      payload: { 
        action: 'agent_registered',
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status
        }
      },
      timestamp: new Date()
    });
  }

  public updateAgentStatus(agentId: string, status: AgentStatus, metrics?: any): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastActive = new Date();
      if (metrics) {
        agent.metrics = { ...agent.metrics, ...metrics };
      }
      
      this.broadcastToDashboards({
        type: WebSocketMessageType.AGENT_STATUS_UPDATE,
        payload: { agentId, status, metrics },
        timestamp: new Date()
      });
    }
  }

  public addTask(task: AgentTask): void {
    const agentTasks = this.taskQueue.get(task.agentId) || [];
    agentTasks.push(task);
    this.taskQueue.set(task.agentId, agentTasks);
    
    // Notify agent of new task
    const agentConnections = Array.from(this.connections.values())
      .filter(conn => conn.type === 'agent' && conn.agentId === task.agentId);
    
    agentConnections.forEach(conn => {
      this.sendMessage(conn.id, {
        type: WebSocketMessageType.TASK_UPDATE,
        payload: { action: 'new_task', task },
        timestamp: new Date(),
        correlationId: task.metadata.correlationId
      });
    });
    
    // Broadcast to dashboards
    this.broadcastToDashboards({
      type: WebSocketMessageType.TASK_UPDATE,
      payload: { action: 'task_queued', task },
      timestamp: new Date()
    });
  }

  public broadcastCommunication(communication: AgentCommunication): void {
    // Send to specific agent if targeted
    if (communication.toAgentId) {
      const targetConnections = Array.from(this.connections.values())
        .filter(conn => conn.type === 'agent' && conn.agentId === communication.toAgentId);
      
      targetConnections.forEach(conn => {
        this.sendMessage(conn.id, {
          type: WebSocketMessageType.CHAT_MESSAGE,
          payload: communication,
          timestamp: new Date()
        });
      });
    } else {
      // Broadcast to all agents
      const agentConnections = Array.from(this.connections.values())
        .filter(conn => conn.type === 'agent');
      
      agentConnections.forEach(conn => {
        this.sendMessage(conn.id, {
          type: WebSocketMessageType.CHAT_MESSAGE,
          payload: communication,
          timestamp: new Date()
        });
      });
    }
    
    // Also broadcast to dashboards for monitoring
    this.broadcastToDashboards({
      type: WebSocketMessageType.CHAT_MESSAGE,
      payload: communication,
      timestamp: new Date()
    });
  }

  public sendNotification(type: WebSocketMessageType, payload: any, targetAgentId?: string): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date(),
      correlationId: this.generateCorrelationId()
    };
    
    if (targetAgentId) {
      // Send to specific agent
      const connections = Array.from(this.connections.values())
        .filter(conn => conn.agentId === targetAgentId);
      
      connections.forEach(conn => {
        this.sendMessage(conn.id, message);
      });
    } else {
      // Broadcast to all connections
      this.broadcast(message);
    }
  }

  public getSystemStatus(): any {
    const activeConnections = this.connections.size;
    const agentConnections = Array.from(this.connections.values())
      .filter(conn => conn.type === 'agent').length;
    const dashboardConnections = Array.from(this.connections.values())
      .filter(conn => conn.type === 'dashboard').length;
    
    return {
      activeConnections,
      agentConnections,
      dashboardConnections,
      registeredAgents: this.agents.size,
      totalTasksQueued: Array.from(this.taskQueue.values())
        .reduce((sum, tasks) => sum + tasks.length, 0),
      uptime: process.uptime(),
      timestamp: new Date()
    };
  }

  // Private utility methods
  private sendMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to ${connectionId}:`, error);
        this.connections.delete(connectionId);
      }
    }
  }

  private sendError(connectionId: string, errorMessage: string): void {
    this.sendMessage(connectionId, {
      type: WebSocketMessageType.ERROR_NOTIFICATION,
      payload: { error: errorMessage },
      timestamp: new Date()
    });
  }

  private broadcast(message: WebSocketMessage): void {
    this.connections.forEach((connection, connectionId) => {
      this.sendMessage(connectionId, message);
    });
  }

  private broadcastToDashboards(message: WebSocketMessage): void {
    const dashboardConnections = Array.from(this.connections.values())
      .filter(conn => conn.type === 'dashboard' || conn.type === 'client');
    
    dashboardConnections.forEach(conn => {
      this.sendMessage(conn.id, message);
    });
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeoutThreshold = 60000; // 1 minute
      
      this.connections.forEach((connection, connectionId) => {
        const timeSinceLastPing = now.getTime() - connection.lastPing.getTime();
        
        if (timeSinceLastPing > timeoutThreshold) {
          console.log(`Connection ${connectionId} timed out, removing...`);
          connection.ws.terminate();
          this.connections.delete(connectionId);
        } else {
          // Send ping
          this.sendMessage(connectionId, {
            type: WebSocketMessageType.SYSTEM_ALERT,
            payload: { action: 'ping', serverTime: now },
            timestamp: now
          });
        }
      });
    }, 30000); // Check every 30 seconds
  }

  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
    console.log('AI Agent WebSocket Server stopped');
  }
}

// Singleton instance for the application
let wsServer: AgentWebSocketServer | null = null;

export function getWebSocketServer(): AgentWebSocketServer {
  if (!wsServer) {
    const port = parseInt(process.env.WS_PORT || '8080');
    wsServer = new AgentWebSocketServer(port);
  }
  return wsServer;
}

export function initializeWebSocketServer(port?: number): AgentWebSocketServer {
  if (wsServer) {
    wsServer.stop();
  }
  wsServer = new AgentWebSocketServer(port);
  return wsServer;
}

export default AgentWebSocketServer; 