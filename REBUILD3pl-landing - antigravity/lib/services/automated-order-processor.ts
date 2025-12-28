import { PrismaClient } from '@prisma/client'
import { AllocationService } from './allocation-service'
import { TMSHandoffService } from './tms-handoff-service'
import { OrderValidationService } from './order-validation-service'
import { logger } from '@/lib/monitoring/logger'

const prisma = new PrismaClient()

interface OrderProcessingResult {
  success: boolean
  orderId: string
  status: string
  message: string
  warnings?: string[]
  errors?: string[]
  shipmentId?: string
  trackingNumber?: string
}

interface StagingAlert {
  orderId: string
  orderNumber: string
  stagingAreaId: string
  stagingAreaName: string
  timeInStaging: number // minutes
  status: 'READY' | 'FILLING' | 'ASSIGNED' | 'LOADED'
  alertLevel: 'warning' | 'critical'
}

export class AutomatedOrderProcessor {
  private readonly STAGING_TIMEOUT_WARNING = 60 // minutes - warn after 1 hour
  private readonly STAGING_TIMEOUT_CRITICAL = 120 // minutes - critical after 2 hours
  private processingInterval: NodeJS.Timeout | null = null

  /**
   * Main entry point: Process order from creation to shipping
   */
  async processOrderToShipping(orderId: string): Promise<OrderProcessingResult> {
    try {
      logger.info('Starting automated order processing', { orderId })

      // Step 1: Validate Order
      const validationResult = await this.validateOrder(orderId)
      if (!validationResult.isValid) {
        return {
          success: false,
          orderId,
          status: 'VALIDATION_FAILED',
          message: 'Order validation failed',
          errors: validationResult.errors
        }
      }

      // Step 2: Check Inventory
      const inventoryResult = await this.checkInventory(orderId)
      if (!inventoryResult.canFulfill) {
        return {
          success: false,
          orderId,
          status: 'INSUFFICIENT_INVENTORY',
          message: 'Insufficient inventory to fulfill order',
          errors: inventoryResult.shortages,
          warnings: inventoryResult.warnings
        }
      }

      // Step 3: Allocate Inventory
      const allocationResult = await AllocationService.allocateOrder(orderId)
      if (allocationResult.status !== 'ALLOCATED') {
        return {
          success: false,
          orderId,
          status: allocationResult.status,
          message: 'Failed to allocate inventory',
          errors: ['Partial or failed allocation']
        }
      }

      // Step 4: Create Pick Tasks (WMS)
      const pickResult = await this.createPickTasks(orderId)
      if (!pickResult.success) {
        return {
          success: false,
          orderId,
          status: 'PICK_FAILED',
          message: 'Failed to create pick tasks',
          errors: pickResult.errors
        }
      }

      // Step 5: Auto-advance to Packing (simulate picking completion)
      await this.advanceToPacking(orderId)

      // Step 6: Auto-advance to Staging
      const stagingResult = await this.advanceToStaging(orderId)
      if (!stagingResult.success) {
        return {
          success: false,
          orderId,
          status: 'STAGING_FAILED',
          message: 'Failed to move order to staging',
          errors: stagingResult.errors
        }
      }

      // Step 7: Monitor Staging and Auto-handoff to TMS
      const handoffResult = await this.monitorAndHandoffToTMS(stagingResult.stagingAreaId!, orderId)

      logger.info('Order processing completed successfully', { 
        orderId,
        shipmentId: handoffResult.shipmentId,
        trackingNumber: handoffResult.trackingNumber
      })

      return {
        success: true,
        orderId,
        status: 'SHIPPED',
        message: 'Order processed successfully from creation to shipping',
        warnings: validationResult.warnings,
        shipmentId: handoffResult.shipmentId,
        trackingNumber: handoffResult.trackingNumber
      }

    } catch (error) {
      logger.error('Order processing error', error as Error, { orderId })
      return {
        success: false,
        orderId,
        status: 'PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  /**
   * Validate order using OrderValidationService
   */
  private async validateOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: {
          include: { item: true }
        }
      }
    })

    if (!order) {
      return {
        isValid: false,
        errors: ['Order not found'],
        warnings: []
      }
    }

    const validationService = new OrderValidationService()
    
    // Handle null/undefined shippingAddress
    const shippingAddress = order.shippingAddress as any || {}
    
    const result = await validationService.validateOrder({
      customerId: order.customerId,
      items: order.orderItems.map(item => ({
        sku: item.item?.sku || item.sku || '',
        description: item.item?.name || '',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice || 0)
      })),
      shippingAddress: {
        street: shippingAddress.street || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        zipCode: shippingAddress.zipCode || '',
        country: shippingAddress.country || 'US'
      },
      priority: order.priority || 'MEDIUM',
      requestedDelivery: order.requiredDeliveryDate?.toISOString()
    })

    return result
  }

  /**
   * Check inventory availability for all order items
   */
  private async checkInventory(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    })

    if (!order) {
      return {
        canFulfill: false,
        shortages: ['Order not found'],
        warnings: []
      }
    }

    const shortages: string[] = []
    const warnings: string[] = []

    for (const orderItem of order.orderItems) {
      const inventory = await prisma.inventoryItem.findFirst({
        where: {
          organizationId: order.organizationId,
          itemId: orderItem.itemId,
          quantityAvailable: { gt: 0 }
        }
      })

      const availableQty = inventory?.quantityAvailable || 0
      const requiredQty = orderItem.quantity

      if (availableQty < requiredQty) {
        shortages.push(
          `Item ${orderItem.itemId}: Required ${requiredQty}, Available ${availableQty}`
        )
      } else if (availableQty < requiredQty * 1.2) {
        warnings.push(
          `Low stock for item ${orderItem.itemId}: ${availableQty} remaining after allocation`
        )
      }
    }

    return {
      canFulfill: shortages.length === 0,
      shortages,
      warnings
    }
  }

  /**
   * Create pick tasks for allocated order
   */
  private async createPickTasks(orderId: string) {
    try {
      // Update order status to PICKING
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PICKING' }
      })

      // In production, create actual pick tasks in WMS
      // For now, simulate successful pick task creation
      logger.info('Pick tasks created', { orderId })
      
      return {
        success: true,
        pickTaskIds: [`PICK-${orderId}-${Date.now()}`]
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to create pick tasks']
      }
    }
  }

  /**
   * Advance order to packing stage
   */
  private async advanceToPacking(orderId: string) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PACKING' }
    })
    logger.info('Order advanced to packing', { orderId })
  }

  /**
   * Advance order to staging zone
   */
  private async advanceToStaging(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      })

      if (!order) {
        return {
          success: false,
          errors: ['Order not found']
        }
      }

      // Find available staging area
      const stagingAreas = await prisma.stagingArea.findMany({
        where: {
          organizationId: order.organizationId,
          status: { in: ['IDLE', 'FILLING'] },
          currentLoad: { lt: prisma.stagingArea.fields.capacity }
        },
        orderBy: { currentLoad: 'asc' },
        take: 1
      })

      if (stagingAreas.length === 0) {
        return {
          success: false,
          errors: ['No available staging areas']
        }
      }

      const stagingArea = stagingAreas[0]

      // Create staging assignment
      await prisma.stagingAssignment.create({
        data: {
          organizationId: order.organizationId,
          stagingAreaId: stagingArea.id,
          orderId: orderId,
          status: 'ASSIGNED'
        }
      })

      // Update staging area load
      await prisma.stagingArea.update({
        where: { id: stagingArea.id },
        data: {
          currentLoad: { increment: 1 },
          status: 'FILLING'
        }
      })

      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'STAGING' }
      })

      logger.info('Order moved to staging', { orderId, stagingAreaId: stagingArea.id })

      return {
        success: true,
        stagingAreaId: stagingArea.id,
        stagingAreaName: stagingArea.name
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to move to staging']
      }
    }
  }

  /**
   * Monitor staging zone and auto-handoff to TMS when ready
   */
  private async monitorAndHandoffToTMS(stagingAreaId: string, orderId: string) {
    // Mark order as ready in staging (simulate packing completion)
    await prisma.stagingAssignment.updateMany({
      where: {
        stagingAreaId,
        orderId
      },
      data: {
        status: 'LOADED'
      }
    })

    await prisma.stagingArea.update({
      where: { id: stagingAreaId },
      data: {
        status: 'READY'
      }
    })

    // Auto-handoff to TMS
    const handoffResult = await TMSHandoffService.handoffToTMS(stagingAreaId, orderId)

    if (handoffResult.success) {
      // Update order status to SHIPPED
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'SHIPPED',
          shippedAt: new Date()
        }
      })

      // Update staging assignment
      await prisma.stagingAssignment.updateMany({
        where: {
          stagingAreaId,
          orderId
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      // Update staging area
      await prisma.stagingArea.update({
        where: { id: stagingAreaId },
        data: {
          currentLoad: { decrement: 1 },
          status: 'IDLE'
        }
      })

      logger.info('Order handed off to TMS and shipped', {
        orderId,
        shipmentId: handoffResult.shipmentId,
        carrier: handoffResult.carrierName,
        trackingNumber: handoffResult.trackingNumber
      })
    } else {
      logger.error('TMS handoff failed', new Error(handoffResult.error || 'Unknown error'), {
        orderId,
        stagingAreaId
      })
    }

    return handoffResult
  }

  /**
   * Check for orders stuck in staging zone
   */
  async checkStagingAlerts(): Promise<StagingAlert[]> {
    const alerts: StagingAlert[] = []
    const now = new Date()

    // Find all staging assignments that are still in staging
    const stagingAssignments = await prisma.stagingAssignment.findMany({
      where: {
        status: { in: ['ASSIGNED', 'LOADED'] },
        completedAt: null
      },
      include: {
        stagingArea: true,
        order: true
      }
    })

    for (const assignment of stagingAssignments) {
      const timeInStaging = Math.floor(
        (now.getTime() - assignment.assignedAt.getTime()) / (1000 * 60)
      )

      if (timeInStaging >= this.STAGING_TIMEOUT_WARNING) {
        const alertLevel = timeInStaging >= this.STAGING_TIMEOUT_CRITICAL ? 'critical' : 'warning'

        alerts.push({
          orderId: assignment.orderId || '',
          orderNumber: assignment.order?.orderNumber || 'UNKNOWN',
          stagingAreaId: assignment.stagingAreaId,
          stagingAreaName: assignment.stagingArea.name,
          timeInStaging,
          status: assignment.status as any,
          alertLevel
        })
      }
    }

    return alerts
  }

  /**
   * Process staging alerts and reach out to carriers for stuck orders
   */
  async processStagingAlerts(): Promise<void> {
    const alerts = await this.checkStagingAlerts()

    for (const alert of alerts) {
      logger.warn('Staging alert detected', {
        orderId: alert.orderId,
        orderNumber: alert.orderNumber,
        timeInStaging: alert.timeInStaging,
        alertLevel: alert.alertLevel
      })

      // For LOADED orders stuck in staging, auto-handoff to TMS
      if (alert.status === 'LOADED') {
        logger.info('Auto-handoffing LOADED order stuck in staging', {
          orderId: alert.orderId,
          stagingAreaId: alert.stagingAreaId
        })

        const handoffResult = await TMSHandoffService.handoffToTMS(
          alert.stagingAreaId,
          alert.orderId
        )

        if (handoffResult.success) {
          logger.info('Successfully auto-handoffed stuck order', {
            orderId: alert.orderId,
            shipmentId: handoffResult.shipmentId,
            carrier: handoffResult.carrierName
          })

          // Update order and staging records
          await prisma.order.update({
            where: { id: alert.orderId },
            data: { 
              status: 'SHIPPED',
              shippedAt: new Date()
            }
          })

          await prisma.stagingAssignment.updateMany({
            where: {
              stagingAreaId: alert.stagingAreaId,
              orderId: alert.orderId
            },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          })
        }
      } else {
        // For ASSIGNED orders, send alert but don't auto-handoff
        logger.warn('Order still filling in staging', {
          orderId: alert.orderId,
          timeInStaging: alert.timeInStaging
        })
      }
    }
  }

  /**
   * Start background monitoring for staging alerts
   */
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.processingInterval) {
      this.stopMonitoring()
    }

    this.processingInterval = setInterval(async () => {
      try {
        await this.processStagingAlerts()
      } catch (error) {
        logger.error('Error in staging alert monitoring', error as Error)
      }
    }, intervalMinutes * 60 * 1000)

    logger.info('Started staging alert monitoring', { intervalMinutes })
  }

  /**
   * Stop background monitoring
   */
  stopMonitoring(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      logger.info('Stopped staging alert monitoring')
    }
  }
}

// Export singleton instance
export const automatedOrderProcessor = new AutomatedOrderProcessor()
