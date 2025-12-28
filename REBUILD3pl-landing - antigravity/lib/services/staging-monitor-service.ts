import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/monitoring/logger'
import { TMSHandoffService } from './tms-handoff-service'

const prisma = new PrismaClient()

export interface StagingAlert {
  id: string
  orderId: string
  orderNumber: string
  stagingAreaId: string
  stagingAreaName: string
  timeInStaging: number // minutes
  status: 'ASSIGNED' | 'LOADED'
  alertLevel: 'warning' | 'critical'
  assignedAt: Date
  orderPriority?: string
  customerName?: string
}

export interface StagingMetrics {
  totalOrders: number
  averageTimeInStaging: number
  warningCount: number
  criticalCount: number
  stagingAreas: Array<{
    id: string
    name: string
    currentLoad: number
    capacity: number
    utilizationPercentage: number
    ordersCount: number
  }>
}

export class StagingMonitorService {
  private readonly STAGING_TIMEOUT_WARNING = 60 // 1 hour
  private readonly STAGING_TIMEOUT_CRITICAL = 120 // 2 hours
  private monitoringInterval: NodeJS.Timeout | null = null

  /**
   * Get all staging alerts for orders that have been in staging too long
   */
  async getStagingAlerts(): Promise<StagingAlert[]> {
    const now = new Date()
    const alerts: StagingAlert[] = []

    try {
      // Find all staging assignments that are not completed
      const stagingAssignments = await prisma.stagingAssignment.findMany({
        where: {
          status: { in: ['ASSIGNED', 'LOADED'] },
          completedAt: null
        },
        include: {
          stagingArea: true,
          order: {
            include: {
              customer: true
            }
          }
        },
        orderBy: {
          assignedAt: 'asc' // Oldest first
        }
      })

      for (const assignment of stagingAssignments) {
        if (!assignment.order) continue

        const timeInStaging = Math.floor(
          (now.getTime() - assignment.assignedAt.getTime()) / (1000 * 60)
        )

        // Only create alerts for orders that have been in staging too long
        if (timeInStaging >= this.STAGING_TIMEOUT_WARNING) {
          const alertLevel = timeInStaging >= this.STAGING_TIMEOUT_CRITICAL ? 'critical' : 'warning'

          alerts.push({
            id: assignment.id,
            orderId: assignment.orderId || '',
            orderNumber: assignment.order.orderNumber,
            stagingAreaId: assignment.stagingAreaId,
            stagingAreaName: assignment.stagingArea.name,
            timeInStaging,
            status: assignment.status as 'ASSIGNED' | 'LOADED',
            alertLevel,
            assignedAt: assignment.assignedAt,
            orderPriority: assignment.order.priority || 'MEDIUM',
            customerName: assignment.order.customer?.customerName || 'Unknown'
          })
        }
      }

      logger.info('Staging alerts retrieved', {
        totalAlerts: alerts.length,
        warningCount: alerts.filter(a => a.alertLevel === 'warning').length,
        criticalCount: alerts.filter(a => a.alertLevel === 'critical').length
      })

      return alerts
    } catch (error) {
      logger.error('Error retrieving staging alerts', error as Error)
      throw error
    }
  }

  /**
   * Get staging metrics and statistics
   */
  async getStagingMetrics(): Promise<StagingMetrics> {
    try {
      // Get all staging areas with their assignments
      const stagingAreas = await prisma.stagingArea.findMany({
        include: {
          assignments: {
            where: {
              status: { in: ['ASSIGNED', 'LOADED'] },
              completedAt: null
            }
          }
        }
      })

      const now = new Date()
      let totalOrders = 0
      let totalTimeInStaging = 0
      let warningCount = 0
      let criticalCount = 0

      const areaMetrics = stagingAreas.map(area => {
        const ordersCount = area.assignments.length
        totalOrders += ordersCount

        // Calculate time in staging for orders in this area
        area.assignments.forEach(assignment => {
          const timeInStaging = Math.floor(
            (now.getTime() - assignment.assignedAt.getTime()) / (1000 * 60)
          )
          totalTimeInStaging += timeInStaging

          if (timeInStaging >= this.STAGING_TIMEOUT_CRITICAL) {
            criticalCount++
          } else if (timeInStaging >= this.STAGING_TIMEOUT_WARNING) {
            warningCount++
          }
        })

        return {
          id: area.id,
          name: area.name,
          currentLoad: area.currentLoad,
          capacity: area.capacity,
          utilizationPercentage: (area.currentLoad / area.capacity) * 100,
          ordersCount
        }
      })

      return {
        totalOrders,
        averageTimeInStaging: totalOrders > 0 ? Math.floor(totalTimeInStaging / totalOrders) : 0,
        warningCount,
        criticalCount,
        stagingAreas: areaMetrics
      }
    } catch (error) {
      logger.error('Error retrieving staging metrics', error as Error)
      throw error
    }
  }

  /**
   * Process a single staging alert - auto-handoff to TMS if ready
   */
  async processAlert(alertId: string): Promise<{ success: boolean; message: string; shipmentId?: string }> {
    try {
      const assignment = await prisma.stagingAssignment.findUnique({
        where: { id: alertId },
        include: {
          order: true,
          stagingArea: true
        }
      })

      if (!assignment || !assignment.order) {
        return {
          success: false,
          message: 'Staging assignment not found'
        }
      }

      // Only auto-handoff if status is LOADED
      if (assignment.status !== 'LOADED') {
        return {
          success: false,
          message: `Order not ready for handoff. Current status: ${assignment.status}`
        }
      }

      logger.info('Processing staging alert - attempting TMS handoff', {
        alertId,
        orderId: assignment.orderId,
        orderNumber: assignment.order.orderNumber
      })

      // Handoff to TMS
      const handoffResult = await TMSHandoffService.handoffToTMS(
        assignment.stagingAreaId,
        assignment.orderId!
      )

      if (handoffResult.success) {
        // Update order status
        await prisma.order.update({
          where: { id: assignment.orderId! },
          data: {
            status: 'SHIPPED',
            shippedAt: new Date()
          }
        })

        // Complete staging assignment
        await prisma.stagingAssignment.update({
          where: { id: alertId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })

        // Update staging area
        await prisma.stagingArea.update({
          where: { id: assignment.stagingAreaId },
          data: {
            currentLoad: { decrement: 1 }
          }
        })

        logger.info('Successfully processed staging alert', {
          alertId,
          orderId: assignment.orderId,
          shipmentId: handoffResult.shipmentId,
          carrier: handoffResult.carrierName
        })

        return {
          success: true,
          message: `Order shipped successfully via ${handoffResult.carrierName}`,
          shipmentId: handoffResult.shipmentId
        }
      } else {
        logger.error('TMS handoff failed for staging alert', new Error(handoffResult.error || 'Unknown'), {
          alertId,
          orderId: assignment.orderId
        })

        return {
          success: false,
          message: handoffResult.error || 'TMS handoff failed'
        }
      }
    } catch (error) {
      logger.error('Error processing staging alert', error as Error, { alertId })
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Process all staging alerts automatically
   */
  async processAllAlerts(): Promise<{
    processed: number
    successful: number
    failed: number
    results: Array<{
      alertId: string
      orderId: string
      success: boolean
      message: string
    }>
  }> {
    const alerts = await this.getStagingAlerts()
    const results: Array<{
      alertId: string
      orderId: string
      success: boolean
      message: string
    }> = []

    let successful = 0
    let failed = 0

    for (const alert of alerts) {
      // Only process LOADED orders automatically
      if (alert.status === 'LOADED') {
        const result = await this.processAlert(alert.id)
        
        results.push({
          alertId: alert.id,
          orderId: alert.orderId,
          success: result.success,
          message: result.message
        })

        if (result.success) {
          successful++
        } else {
          failed++
        }
      } else {
        // Log warning but don't process
        logger.warn('Skipping alert - order not ready', {
          alertId: alert.id,
          orderId: alert.orderId,
          status: alert.status,
          timeInStaging: alert.timeInStaging
        })
      }
    }

    logger.info('Processed staging alerts batch', {
      totalAlerts: alerts.length,
      processed: results.length,
      successful,
      failed
    })

    return {
      processed: results.length,
      successful,
      failed,
      results
    }
  }

  /**
   * Start automatic background monitoring
   */
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.monitoringInterval) {
      logger.warn('Staging monitoring already running')
      return
    }

    logger.info('Starting staging monitor service', { intervalMinutes })

    // Run immediately on start
    this.processAllAlerts().catch(error => {
      logger.error('Error in initial staging alert processing', error as Error)
    })

    // Then run on interval
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.processAllAlerts()
      } catch (error) {
        logger.error('Error in staging alert monitoring cycle', error as Error)
      }
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Stop automatic monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('Stopped staging monitor service')
    }
  }

  /**
   * Check if a specific order is stuck in staging
   */
  async isOrderStuck(orderId: string): Promise<boolean> {
    const assignment = await prisma.stagingAssignment.findFirst({
      where: {
        orderId,
        status: { in: ['ASSIGNED', 'LOADED'] },
        completedAt: null
      }
    })

    if (!assignment) return false

    const timeInStaging = Math.floor(
      (new Date().getTime() - assignment.assignedAt.getTime()) / (1000 * 60)
    )

    return timeInStaging >= this.STAGING_TIMEOUT_WARNING
  }

  /**
   * Manually trigger alert for a specific order
   */
  async createManualAlert(orderId: string): Promise<StagingAlert | null> {
    const assignment = await prisma.stagingAssignment.findFirst({
      where: {
        orderId,
        status: { in: ['ASSIGNED', 'LOADED'] },
        completedAt: null
      },
      include: {
        stagingArea: true,
        order: {
          include: {
            customer: true
          }
        }
      }
    })

    if (!assignment || !assignment.order) {
      return null
    }

    const timeInStaging = Math.floor(
      (new Date().getTime() - assignment.assignedAt.getTime()) / (1000 * 60)
    )

    const alertLevel = timeInStaging >= this.STAGING_TIMEOUT_CRITICAL ? 'critical' : 'warning'

    return {
      id: assignment.id,
      orderId: assignment.orderId || '',
      orderNumber: assignment.order.orderNumber,
      stagingAreaId: assignment.stagingAreaId,
      stagingAreaName: assignment.stagingArea.name,
      timeInStaging,
      status: assignment.status as 'ASSIGNED' | 'LOADED',
      alertLevel,
      assignedAt: assignment.assignedAt,
      orderPriority: assignment.order.priority || 'MEDIUM',
      customerName: assignment.order.customer?.customerName || 'Unknown'
    }
  }
}

// Export singleton instance
export const stagingMonitorService = new StagingMonitorService()
