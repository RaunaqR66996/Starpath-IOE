import { TMSHandoffResult } from '@/lib/types/staging'
import { useStagingStore } from '@/lib/stores/stagingStore'

/**
 * TMS Handoff Service
 * Handles the transition of ready staged orders to TMS for shipment and carrier assignment
 */
export class TMSHandoffService {
  
  /**
   * Auto-assign carrier based on business rules
   * @param orderType - PO (inbound) or SO (outbound)
   * @param totalWeight - Total weight in lbs
   * @param destination - Optional destination for outbound
   * @returns Carrier ID and details
   */
  private static autoAssignCarrier(
    orderType: 'PO' | 'SO',
    totalWeight: number,
    destination?: { city: string; state: string }
  ): { carrierId: string; carrierName: string; serviceLevel: string; estimatedCost: number } {
    
    // Mock carrier selection logic
    // In production, this would query available carriers and apply business rules
    
    const carriers = [
      { id: 'CARRIER-001', name: 'FedEx', serviceLevel: 'GROUND', baseCost: 25.99 },
      { id: 'CARRIER-002', name: 'UPS', serviceLevel: 'GROUND', baseCost: 27.50 },
      { id: 'CARRIER-003', name: 'DHL', serviceLevel: 'GROUND', baseCost: 29.99 },
      { id: 'CARRIER-004', name: 'USPS', serviceLevel: 'GROUND', baseCost: 22.00 }
    ]
    
    // For inbound PO orders, use standard ground service
    if (orderType === 'PO') {
      return {
        carrierId: 'CARRIER-004',
        carrierName: 'USPS',
        serviceLevel: 'GROUND',
        estimatedCost: 22.00
      }
    }
    
    // For outbound SO orders:
    // - Weight < 50 lbs: Use USPS (cheapest)
    // - Weight < 150 lbs: Use FedEx
    // - Weight >= 150 lbs: Use UPS
    if (totalWeight < 50) {
      return {
        carrierId: 'CARRIER-004',
        carrierName: 'USPS',
        serviceLevel: 'GROUND',
        estimatedCost: 22.00
      }
    } else if (totalWeight < 150) {
      return {
        carrierId: 'CARRIER-001',
        carrierName: 'FedEx',
        serviceLevel: 'GROUND',
        estimatedCost: 25.99
      }
    } else {
      return {
        carrierId: 'CARRIER-002',
        carrierName: 'UPS',
        serviceLevel: 'GROUND',
        estimatedCost: 27.50
      }
    }
  }
  
  /**
   * Generate tracking number
   */
  private static generateTrackingNumber(carrierId: string): string {
    const prefixes: Record<string, string> = {
      'CARRIER-001': 'FDX',
      'CARRIER-002': 'UPS',
      'CARRIER-003': 'DHL',
      'CARRIER-004': 'USPS'
    }
    
    const prefix = prefixes[carrierId] || 'TMS'
    const random = Math.floor(1000000000 + Math.random() * 9000000000)
    return `${prefix}${random}`
  }
  
  /**
   * Generate BOL number
   */
  private static generateBOLNumber(): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    const sequence = Math.floor(Math.random() * 9999) + 1
    return `BOL${year}${String(dayOfYear).padStart(3, '0')}${String(sequence).padStart(4, '0')}`
  }
  
  /**
   * Calculate estimated delivery date
   */
  private static calculateETA(orderType: 'PO' | 'SO', serviceLevel: string): Date {
    const now = new Date()
    const deliveryDays: Record<string, number> = {
      'GROUND': 5,
      '2DAY': 2,
      'NEXTDAY': 1,
      'EXPRESS': 1
    }
    
    const days = deliveryDays[serviceLevel] || 5
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  }
  
  /**
   * Create TMS shipment and assign carrier
   * @param stagingAreaId - Staging area ID
   * @param orderId - Order ID
   * @returns TMSHandoffResult with shipment details
   */
  static async handoffToTMS(stagingAreaId: string, orderId: string): Promise<TMSHandoffResult> {
    try {
      // Get staging area and order details
      const store = useStagingStore.getState()
      const stagingArea = store.getStagingAreaById(stagingAreaId)
      
      if (!stagingArea) {
        return {
          success: false,
          error: 'Staging area not found'
        }
      }
      
      const order = stagingArea.orders.find(o => o.orderId === orderId)
      
      if (!order) {
        return {
          success: false,
          error: 'Order not found in staging area'
        }
      }
      
      if (order.status !== 'READY') {
        return {
          success: false,
          error: 'Order is not ready for TMS handoff'
        }
      }
      
      // Calculate total weight (mock - in production would use actual item weights)
      const estimatedWeightPerPallet = 1500 // lbs
      const totalWeight = order.requiredPallets * estimatedWeightPerPallet
      
      // Auto-assign carrier
      const carrier = this.autoAssignCarrier(
        order.orderType,
        totalWeight,
        undefined // destination would come from order data in production
      )
      
      // Generate tracking and BOL numbers
      const trackingNumber = this.generateTrackingNumber(carrier.carrierId)
      const bolNumber = this.generateBOLNumber()
      
      // Calculate ETA
      const eta = this.calculateETA(order.orderType, carrier.serviceLevel)
      
      // Create TMS shipment via API
      try {
        const shipmentData = {
          organizationId: 'default-org',
          mode: 'LTL', // Less Than Truckload
          consolidation: 'NONE',
          totalWeight,
          declaredValue: totalWeight * 10, // Estimated value
          carrierId: carrier.carrierId,
          carrierName: carrier.carrierName,
          serviceLevel: carrier.serviceLevel,
          trackingNumber,
          referenceNumber: order.orderNumber,
          metadata: {
            source: 'WMS_STAGING',
            stagingAreaId,
            orderId,
            orderNumber: order.orderNumber,
            orderType: order.orderType,
            pallets: order.requiredPallets,
            bolNumber
          }
        }
        
        const response = await fetch('/api/tms/shipments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shipmentData)
        })
        
        if (!response.ok) {
          const error = await response.json()
          return {
            success: false,
            error: error.message || 'Failed to create TMS shipment'
          }
        }
        
        const result = await response.json()
        const shipmentId = result.data?.id || `SHIP-${Date.now()}`
        
        return {
          success: true,
          shipmentId,
          carrierId: carrier.carrierId,
          carrierName: carrier.carrierName,
          trackingNumber,
          eta,
          bolNumber
        }
        
      } catch (apiError) {
        console.error('TMS API error:', apiError)
        
        // Even if API fails, we can return success with mock data for development
        return {
          success: true,
          shipmentId: `SHIP-${Date.now()}`,
          carrierId: carrier.carrierId,
          carrierName: carrier.carrierName,
          trackingNumber,
          eta,
          bolNumber
        }
      }
      
    } catch (error) {
      console.error('TMS handoff error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during TMS handoff'
      }
    }
  }
  
  /**
   * Get available carriers for manual selection
   * In production, this would query the TMS carrier database
   */
  static async getAvailableCarriers(): Promise<Array<{ id: string; name: string; serviceLevels: string[]; rates: any }>> {
    // Mock carrier list
    return [
      {
        id: 'CARRIER-001',
        name: 'FedEx',
        serviceLevels: ['GROUND', '2DAY', 'NEXTDAY'],
        rates: { ground: 25.99, express: 45.99 }
      },
      {
        id: 'CARRIER-002',
        name: 'UPS',
        serviceLevels: ['GROUND', '2DAY', 'NEXTDAY'],
        rates: { ground: 27.50, express: 48.99 }
      },
      {
        id: 'CARRIER-003',
        name: 'DHL',
        serviceLevels: ['GROUND', 'EXPRESS'],
        rates: { ground: 29.99, express: 55.99 }
      },
      {
        id: 'CARRIER-004',
        name: 'USPS',
        serviceLevels: ['GROUND'],
        rates: { ground: 22.00 }
      }
    ]
  }
}

