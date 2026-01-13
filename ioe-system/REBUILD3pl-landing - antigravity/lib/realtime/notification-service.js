const { Server: SocketIOServer } = require('socket.io');

class NotificationServiceClass {
  constructor() {
    this.io = null;
    this.userConnections = new Map(); // userId -> socketId
    this.userSubscriptions = new Map(); // userId -> Set<eventTypes>
  }

  initialize(server) {
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

  setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        try {
          // TODO: Validate JWT token
          this.userConnections.set(data.userId, socket.id);
          this.userSubscriptions.set(data.userId, new Set());
          console.log(`👤 User authenticated: ${data.userId}`);
          
          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('Authentication failed:', error);
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      });

      // Handle event subscriptions
      socket.on('subscribe', (data) => {
        const userSubs = this.userSubscriptions.get(data.userId) || new Set();
        data.eventTypes.forEach(eventType => userSubs.add(eventType));
        this.userSubscriptions.set(data.userId, userSubs);
        console.log(`📋 User ${data.userId} subscribed to: ${data.eventTypes.join(', ')}`);
      });

      // Handle event unsubscriptions
      socket.on('unsubscribe', (data) => {
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

  findUserIdBySocketId(socketId) {
    for (const [userId, sid] of this.userConnections.entries()) {
      if (sid === socketId) {
        return userId;
      }
    }
    return undefined;
  }

  // Send notification to specific user
  sendToUser(userId, eventType, data) {
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
  broadcastToSubscribers(eventType, data) {
    const notification = {
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    this.io?.emit('notification', notification);
    console.log(`📢 Broadcast notification: ${eventType}`);
  }

  // Send notification to specific room/group
  sendToRoom(room, eventType, data) {
    this.io?.to(room).emit('notification', {
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`📧 Room notification sent to ${room}: ${eventType}`);
  }

  // Join user to a room
  joinRoom(userId, room) {
    const socketId = this.userConnections.get(userId);
    if (socketId) {
      this.io?.sockets.sockets.get(socketId)?.join(room);
      console.log(`👥 User ${userId} joined room: ${room}`);
    }
  }

  // Leave user from a room
  leaveRoom(userId, room) {
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
function initializeNotificationService(server) {
  notificationService.initialize(server);
}

function sendNotification(userId, eventType, data) {
  notificationService.sendToUser(userId, eventType, data);
}

function broadcastNotification(eventType, data) {
  notificationService.broadcastToSubscribers(eventType, data);
}

function sendRoomNotification(room, eventType, data) {
  notificationService.sendToRoom(room, eventType, data);
}

function joinUserToRoom(userId, room) {
  notificationService.joinRoom(userId, room);
}

function leaveUserFromRoom(userId, room) {
  notificationService.leaveRoom(userId, room);
}

function getNotificationStats() {
  return notificationService.getStats();
}

module.exports = {
  initializeNotificationService,
  sendNotification,
  broadcastNotification,
  sendRoomNotification,
  joinUserToRoom,
  leaveUserFromRoom,
  getNotificationStats,
  notificationService
}; 