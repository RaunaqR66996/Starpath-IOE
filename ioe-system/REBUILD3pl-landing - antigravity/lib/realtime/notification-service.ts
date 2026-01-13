import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface NotificationService {
  io: SocketIOServer | null;
  userConnections: Map<string, string>; // userId -> socketId
  userSubscriptions: Map<string, Set<string>>; // userId -> Set<eventTypes>
}

class NotificationServiceClass implements NotificationService {
  io: SocketIOServer | null = null;
  userConnections: Map<string, string> = new Map();
  userSubscriptions: Map<string, Set<string>> = new Map();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('🔔 Notification service initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', async (data: { userId: string; token: string }) => {
        try {
          // Validate JWT token
          const { verifyToken } = await import('@/lib/auth');
          const payload = verifyToken(data.token);
          
          if (!payload) {
            socket.emit('authenticated', { 
              success: false, 
              error: 'Invalid or expired token' 
            });
            return;
          }

          // Verify userId matches token payload (prevent token reuse with wrong userId)
          if (payload.id !== data.userId) {
            socket.emit('authenticated', { 
              success: false, 
              error: 'User ID mismatch' 
            });
            return;
          }

          // Store authenticated connection
          this.userConnections.set(data.userId, socket.id);
          this.userSubscriptions.set(data.userId, new Set());
          console.log(`👤 User authenticated: ${data.userId} (${payload.email})`);
          
          socket.emit('authenticated', { success: true, userId: data.userId });
        } catch (error) {
          console.error('Authentication failed:', error);
          socket.emit('authenticated', { 
            success: false, 
            error: error instanceof Error ? error.message : 'Invalid token' 
          });
        }
      });

      // Handle event subscriptions
      socket.on('subscribe', (data: { userId: string; eventTypes: string[] }) => {
        const userSubs = this.userSubscriptions.get(data.userId) || new Set();
        data.eventTypes.forEach(eventType => userSubs.add(eventType));
        this.userSubscriptions.set(data.userId, userSubs);
        console.log(`📋 User ${data.userId} subscribed to: ${data.eventTypes.join(', ')}`);
      });

      // Handle event unsubscriptions
      socket.on('unsubscribe', (data: { userId: string; eventTypes: string[] }) => {
        const userSubs = this.userSubscriptions.get(data.userId);
        if (userSubs) {
          data.eventTypes.forEach(eventType => userSubs.delete(eventType));
        }
        console.log(`📋 User ${data.userId} unsubscribed from: ${data.eventTypes.join(', ')}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.findUserIdBySocketId(socket.id);
        if (userId) {
          this.userConnections.delete(userId);
          this.userSubscriptions.delete(userId);
          console.log(`👤 User disconnected: ${userId}`);
        }
        console.log(`🔗 Client disconnected: ${socket.id}`);
      });
    });
  }

  private findUserIdBySocketId(socketId: string): string | undefined {
    for (const [userId, sid] of this.userConnections.entries()) {
      if (sid === socketId) {
        return userId;
      }
    }
    return undefined;
  }

  // Send notification to specific user
  sendToUser(userId: string, eventType: string, data: any) {
    const socketId = this.userConnections.get(userId);
    const userSubs = this.userSubscriptions.get(userId);
    
    if (socketId && userSubs?.has(eventType)) {
      this.io?.to(socketId).emit('notification', {
        eventType,
        data,
        timestamp: new Date().toISOString()
      });
      console.log(`📧 Notification sent to user ${userId}: ${eventType}`);
    }
  }

  // Broadcast notification to all users subscribed to event type
  broadcastToSubscribers(eventType: string, data: any) {
    const notification = {
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    this.io?.emit('notification', notification);
    console.log(`📢 Broadcast notification: ${eventType}`);
  }

  // Send notification to specific room/group
  sendToRoom(room: string, eventType: string, data: any) {
    this.io?.to(room).emit('notification', {
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`📧 Room notification sent to ${room}: ${eventType}`);
  }

  // Join user to a room
  joinRoom(userId: string, room: string) {
    const socketId = this.userConnections.get(userId);
    if (socketId) {
      this.io?.sockets.sockets.get(socketId)?.join(room);
      console.log(`👥 User ${userId} joined room: ${room}`);
    }
  }

  // Leave user from a room
  leaveRoom(userId: string, room: string) {
    const socketId = this.userConnections.get(userId);
    if (socketId) {
      this.io?.sockets.sockets.get(socketId)?.leave(room);
      console.log(`👥 User ${userId} left room: ${room}`);
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.userConnections.size,
      totalSubscriptions: Array.from(this.userSubscriptions.values()).reduce((acc, subs) => acc + subs.size, 0),
      activeRooms: this.io?.sockets.adapter.rooms.size || 0
    };
  }
}

// Singleton instance
const notificationService = new NotificationServiceClass();

// Export functions for server.js
export function initializeNotificationService(server: HTTPServer) {
  notificationService.initialize(server);
}

export function sendNotification(userId: string, eventType: string, data: any) {
  notificationService.sendToUser(userId, eventType, data);
}

export function broadcastNotification(eventType: string, data: any) {
  notificationService.broadcastToSubscribers(eventType, data);
}

export function sendRoomNotification(room: string, eventType: string, data: any) {
  notificationService.sendToRoom(room, eventType, data);
}

export function joinUserToRoom(userId: string, room: string) {
  notificationService.joinRoom(userId, room);
}

export function leaveUserFromRoom(userId: string, room: string) {
  notificationService.leaveRoom(userId, room);
}

export function getNotificationStats() {
  return notificationService.getStats();
}

export default notificationService; 