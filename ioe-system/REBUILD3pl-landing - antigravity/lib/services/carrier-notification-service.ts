import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/monitoring/logger'

const prisma = new PrismaClient()

export interface CarrierNotificationPreferences {
  carrierId: string
  carrierName: string
  notificationMethods: ('email' | 'webhook' | 'api' | 'sms')[]
  email?: string
  webhookUrl?: string
  apiEndpoint?: string
  apiKey?: string
  phoneNumber?: string
  notifyOnShipmentCreated: boolean
  notifyOnShipmentReady: boolean
  notifyOnShipmentPickedUp: boolean
  notifyOnShipmentDelivered: boolean
}

export interface CarrierNotification {
  id: string
  carrierId: string
  carrierName: string
  shipmentId: string
  trackingNumber: string
  notificationType: 'shipment_created' | 'shipment_ready' | 'pickup_required' | 'shipment_delivered'
  method: 'email' | 'webhook' | 'api' | 'sms'
  status: 'pending' | 'sent' | 'failed' | 'acknowledged'
  sentAt?: Date
  acknowledgedAt?: Date
  error?: string
  payload: any
}

export class CarrierNotificationService {
  /**
   * Send notification to carrier about a shipment
   */
  async notifyCarrier(params: {
    carrierId: string
    carrierName: string
    shipmentId: string
    trackingNumber: string
    notificationType: 'shipment_created' | 'shipment_ready' | 'pickup_required' | 'shipment_delivered'
    shipmentDetails: {
      orderNumber: string
      orderType: string
      pickupAddress?: string
      deliveryAddress?: string
      weight?: number
      pallets?: number
      specialInstructions?: string
      stagingArea?: string
      bolNumber?: string
      estimatedPickupDate?: Date
    }
  }): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      // Get carrier preferences
      const preferences = await this.getCarrierPreferences(params.carrierId)

      if (!preferences) {
        logger.warn('No notification preferences found for carrier', {
          carrierId: params.carrierId,
          carrierName: params.carrierName
        })
        return {
          success: false,
          error: 'No notification preferences configured for carrier'
        }
      }

      // Check if carrier wants this type of notification
      const shouldNotify = this.shouldSendNotification(preferences, params.notificationType)

      if (!shouldNotify) {
        logger.info('Carrier does not want this notification type', {
          carrierId: params.carrierId,
          notificationType: params.notificationType
        })
        return {
          success: true // Not an error, just skipped
        }
      }

      // Create notification record
      const notification = await this.createNotificationRecord(params, preferences)

      // Send via configured methods
      const results = await Promise.all(
        preferences.notificationMethods.map(method =>
          this.sendViaMethod(method, params, preferences, notification.id)
        )
      )

      // Check if any method succeeded
      const anySuccess = results.some(r => r.success)

      if (anySuccess) {
        // Update notification status
        await this.updateNotificationStatus(notification.id, 'sent')

        logger.info('Carrier notification sent successfully', {
          notificationId: notification.id,
          carrierId: params.carrierId,
          shipmentId: params.shipmentId,
          methods: results.filter(r => r.success).map(r => r.method)
        })

        return {
          success: true,
          notificationId: notification.id
        }
      } else {
        // All methods failed
        const errors = results.map(r => r.error).filter(Boolean).join(', ')
        await this.updateNotificationStatus(notification.id, 'failed', errors)

        logger.error('All carrier notification methods failed', new Error(errors), {
          notificationId: notification.id,
          carrierId: params.carrierId,
          shipmentId: params.shipmentId
        })

        return {
          success: false,
          error: errors
        }
      }
    } catch (error) {
      logger.error('Error sending carrier notification', error as Error, {
        carrierId: params.carrierId,
        shipmentId: params.shipmentId
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get carrier notification preferences
   */
  private async getCarrierPreferences(carrierId: string): Promise<CarrierNotificationPreferences | null> {
    try {
      const carrier = await prisma.carrier.findUnique({
        where: { id: carrierId }
      })

      if (!carrier) return null

      // Parse notification preferences from carrier metadata
      const preferences = carrier.metadata as any

      return {
        carrierId: carrier.id,
        carrierName: carrier.name,
        notificationMethods: preferences?.notificationMethods || ['email'],
        email: preferences?.email || carrier.contactEmail,
        webhookUrl: preferences?.webhookUrl,
        apiEndpoint: preferences?.apiEndpoint,
        apiKey: preferences?.apiKey,
        phoneNumber: preferences?.phoneNumber || carrier.contactPhone,
        notifyOnShipmentCreated: preferences?.notifyOnShipmentCreated !== false,
        notifyOnShipmentReady: preferences?.notifyOnShipmentReady !== false,
        notifyOnShipmentPickedUp: preferences?.notifyOnShipmentPickedUp !== false,
        notifyOnShipmentDelivered: preferences?.notifyOnShipmentDelivered !== false
      }
    } catch (error) {
      logger.error('Error retrieving carrier preferences', error as Error, { carrierId })
      return null
    }
  }

  /**
   * Check if notification should be sent based on preferences
   */
  private shouldSendNotification(
    preferences: CarrierNotificationPreferences,
    notificationType: string
  ): boolean {
    switch (notificationType) {
      case 'shipment_created':
        return preferences.notifyOnShipmentCreated
      case 'shipment_ready':
      case 'pickup_required':
        return preferences.notifyOnShipmentReady
      case 'shipment_delivered':
        return preferences.notifyOnShipmentDelivered
      default:
        return false
    }
  }

  /**
   * Create notification record in database
   */
  private async createNotificationRecord(
    params: any,
    preferences: CarrierNotificationPreferences
  ): Promise<{ id: string }> {
    // Since we don't have a CarrierNotification table yet, create a simple record
    // In production, you would create a proper table
    const notificationId = `NOTIFY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    logger.info('Created carrier notification record', {
      notificationId,
      carrierId: params.carrierId,
      shipmentId: params.shipmentId,
      notificationType: params.notificationType
    })

    return { id: notificationId }
  }

  /**
   * Send notification via specific method
   */
  private async sendViaMethod(
    method: 'email' | 'webhook' | 'api' | 'sms',
    params: any,
    preferences: CarrierNotificationPreferences,
    notificationId: string
  ): Promise<{ success: boolean; method: string; error?: string }> {
    try {
      switch (method) {
        case 'email':
          return await this.sendEmailNotification(params, preferences, notificationId)
        case 'webhook':
          return await this.sendWebhookNotification(params, preferences, notificationId)
        case 'api':
          return await this.sendApiNotification(params, preferences, notificationId)
        case 'sms':
          return await this.sendSmsNotification(params, preferences, notificationId)
        default:
          return {
            success: false,
            method,
            error: `Unsupported notification method: ${method}`
          }
      }
    } catch (error) {
      return {
        success: false,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    params: any,
    preferences: CarrierNotificationPreferences,
    notificationId: string
  ): Promise<{ success: boolean; method: string; error?: string }> {
    if (!preferences.email) {
      return {
        success: false,
        method: 'email',
        error: 'No email address configured'
      }
    }

    // In production, integrate with email service (SendGrid, SES, etc.)
    logger.info('Sending email notification to carrier', {
      notificationId,
      carrierId: preferences.carrierId,
      email: preferences.email,
      shipmentId: params.shipmentId
    })

    // Simulate email sending
    // TODO: Integrate with actual email service
    const emailPayload = {
      to: preferences.email,
      subject: `Shipment ${params.notificationType.replace('_', ' ')}: ${params.trackingNumber}`,
      body: this.generateEmailBody(params)
    }

    // Mock success
    return {
      success: true,
      method: 'email'
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    params: any,
    preferences: CarrierNotificationPreferences,
    notificationId: string
  ): Promise<{ success: boolean; method: string; error?: string }> {
    if (!preferences.webhookUrl) {
      return {
        success: false,
        method: 'webhook',
        error: 'No webhook URL configured'
      }
    }

    try {
      const payload = {
        notificationId,
        carrierId: preferences.carrierId,
        carrierName: preferences.carrierName,
        shipmentId: params.shipmentId,
        trackingNumber: params.trackingNumber,
        notificationType: params.notificationType,
        timestamp: new Date().toISOString(),
        shipmentDetails: params.shipmentDetails
      }

      // Send webhook
      const response = await fetch(preferences.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(preferences.apiKey && { 'Authorization': `Bearer ${preferences.apiKey}` })
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
      }

      logger.info('Webhook notification sent successfully', {
        notificationId,
        carrierId: preferences.carrierId,
        webhookUrl: preferences.webhookUrl
      })

      return {
        success: true,
        method: 'webhook'
      }
    } catch (error) {
      logger.error('Webhook notification failed', error as Error, {
        notificationId,
        carrierId: preferences.carrierId
      })

      return {
        success: false,
        method: 'webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send API notification
   */
  private async sendApiNotification(
    params: any,
    preferences: CarrierNotificationPreferences,
    notificationId: string
  ): Promise<{ success: boolean; method: string; error?: string }> {
    if (!preferences.apiEndpoint) {
      return {
        success: false,
        method: 'api',
        error: 'No API endpoint configured'
      }
    }

    try {
      const payload = {
        shipmentId: params.shipmentId,
        trackingNumber: params.trackingNumber,
        eventType: params.notificationType,
        ...params.shipmentDetails
      }

      const response = await fetch(preferences.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(preferences.apiKey && { 'X-API-Key': preferences.apiKey })
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      logger.info('API notification sent successfully', {
        notificationId,
        carrierId: preferences.carrierId,
        apiEndpoint: preferences.apiEndpoint
      })

      return {
        success: true,
        method: 'api'
      }
    } catch (error) {
      return {
        success: false,
        method: 'api',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(
    params: any,
    preferences: CarrierNotificationPreferences,
    notificationId: string
  ): Promise<{ success: boolean; method: string; error?: string }> {
    if (!preferences.phoneNumber) {
      return {
        success: false,
        method: 'sms',
        error: 'No phone number configured'
      }
    }

    // In production, integrate with SMS service (Twilio, SNS, etc.)
    logger.info('Sending SMS notification to carrier', {
      notificationId,
      carrierId: preferences.carrierId,
      phoneNumber: preferences.phoneNumber,
      shipmentId: params.shipmentId
    })

    // Mock success
    return {
      success: true,
      method: 'sms'
    }
  }

  /**
   * Generate email body
   */
  private generateEmailBody(params: any): string {
    return `
      Shipment Notification
      
      Type: ${params.notificationType.replace('_', ' ').toUpperCase()}
      Tracking Number: ${params.trackingNumber}
      Order Number: ${params.shipmentDetails.orderNumber}
      
      Shipment Details:
      - Weight: ${params.shipmentDetails.weight || 'N/A'} lbs
      - Pallets: ${params.shipmentDetails.pallets || 'N/A'}
      - BOL Number: ${params.shipmentDetails.bolNumber || 'N/A'}
      - Staging Area: ${params.shipmentDetails.stagingArea || 'N/A'}
      
      ${params.shipmentDetails.specialInstructions ? 'Special Instructions:\n' + params.shipmentDetails.specialInstructions : ''}
      
      ${params.shipmentDetails.pickupAddress ? 'Pickup Address:\n' + params.shipmentDetails.pickupAddress : ''}
      
      Please confirm receipt of this notification.
    `
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: 'sent' | 'failed',
    error?: string
  ): Promise<void> {
    logger.info('Updated notification status', {
      notificationId,
      status,
      error
    })
    // In production, update database record
  }

  /**
   * Acknowledge notification (called by carrier API)
   */
  async acknowledgeNotification(notificationId: string): Promise<{ success: boolean }> {
    logger.info('Carrier acknowledged notification', { notificationId })
    // In production, update database record
    return { success: true }
  }

  /**
   * Get notification history for a carrier
   */
  async getCarrierNotificationHistory(carrierId: string, limit: number = 50): Promise<any[]> {
    // In production, query from database
    logger.info('Retrieving carrier notification history', { carrierId, limit })
    return []
  }
}

// Export singleton instance
export const carrierNotificationService = new CarrierNotificationService()
