export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  orderId?: string
  shipmentId?: string
  warehouseId?: string
  module?: string
  action?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }
  }

  private writeLog(entry: LogEntry): void {
    if (this.isDevelopment) {
      // In development, use console with colors
      const { timestamp, level, message, context, error } = entry
      const contextStr = context ? ` ${JSON.stringify(context)}` : ''
      const errorStr = error ? `\nError: ${error.name}: ${error.message}` : ''
      
      switch (level) {
        case 'debug':
          console.debug(`[${timestamp}] DEBUG: ${message}${contextStr}${errorStr}`)
          break
        case 'info':
          console.info(`[${timestamp}] INFO: ${message}${contextStr}${errorStr}`)
          break
        case 'warn':
          console.warn(`[${timestamp}] WARN: ${message}${contextStr}${errorStr}`)
          break
        case 'error':
          console.error(`[${timestamp}] ERROR: ${message}${contextStr}${errorStr}`)
          break
      }
    } else if (this.isProduction) {
      // In production, you might want to send to a logging service
      // For now, we'll just use console with structured JSON
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: LogContext): void {
    this.writeLog(this.formatLogEntry('debug', message, context))
  }

  info(message: string, context?: LogContext): void {
    this.writeLog(this.formatLogEntry('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog(this.formatLogEntry('warn', message, context))
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.writeLog(this.formatLogEntry('error', message, context, error))
  }

  // Convenience methods for common operations
  orderCreated(orderId: string, customerId: string, context?: LogContext): void {
    this.info('Order created', {
      orderId,
      customerId,
      action: 'order_created',
      ...context
    })
  }

  orderStatusChanged(orderId: string, fromStatus: string, toStatus: string, context?: LogContext): void {
    this.info('Order status changed', {
      orderId,
      action: 'order_status_changed',
      fromStatus,
      toStatus,
      ...context
    })
  }

  shipmentPlanned(shipmentId: string, orderId: string, context?: LogContext): void {
    this.info('Shipment planned', {
      shipmentId,
      orderId,
      action: 'shipment_planned',
      ...context
    })
  }

  shipmentTendered(shipmentId: string, carrier: string, context?: LogContext): void {
    this.info('Shipment tendered', {
      shipmentId,
      action: 'shipment_tendered',
      carrier,
      ...context
    })
  }

  allocationCreated(orderId: string, sku: string, quantity: number, context?: LogContext): void {
    this.info('Inventory allocated', {
      orderId,
      action: 'allocation_created',
      sku,
      quantity,
      ...context
    })
  }

  pickTaskCompleted(orderId: string, taskId: string, context?: LogContext): void {
    this.info('Pick task completed', {
      orderId,
      action: 'pick_task_completed',
      taskId,
      ...context
    })
  }

  packCompleted(orderId: string, packId: string, context?: LogContext): void {
    this.info('Pack completed', {
      orderId,
      action: 'pack_completed',
      packId,
      ...context
    })
  }

  shipConfirmed(orderId: string, shipmentId: string, context?: LogContext): void {
    this.info('Ship confirmed', {
      orderId,
      shipmentId,
      action: 'ship_confirmed',
      ...context
    })
  }

  serviceError(service: string, operation: string, error: Error, context?: LogContext): void {
    this.error(`Service error in ${service}.${operation}`, error, {
      service,
      operation,
      action: 'service_error',
      ...context
    })
  }

  apiCall(method: string, url: string, statusCode: number, duration?: number, context?: LogContext): void {
    this.info('API call completed', {
      method,
      url,
      statusCode,
      duration,
      action: 'api_call',
      ...context
    })
  }

  userAction(userId: string, action: string, module: string, context?: LogContext): void {
    this.info('User action', {
      userId,
      action,
      module,
      ...context
    })
  }
}

// Singleton instance
export const logger = new Logger()

// Convenience exports
export const log = logger
export default logger
