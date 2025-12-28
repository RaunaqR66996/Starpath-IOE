import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Types for order optimization
export interface OrderOptimizationResult {
  routingSuggestions: RoutingSuggestion[]
  pricingOptimization: PricingOptimization
  shippingRecommendations: ShippingRecommendation[]
  consolidationOpportunities: ConsolidationOpportunity[]
  estimatedSavings: number
}

export interface RoutingSuggestion {
  carrierId: string
  carrierName: string
  service: string
  estimatedCost: number
  estimatedDays: number
  confidence: number
}

export interface PricingOptimization {
  suggestedDiscounts: DiscountSuggestion[]
  bundlingOpportunities: BundlingOpportunity[]
  loyaltyAdjustments: LoyaltyAdjustment[]
}

export interface DiscountSuggestion {
  type: 'volume' | 'loyalty' | 'seasonal' | 'first_time'
  percentage: number
  applicableItems: string[]
  conditions: string
}

export interface BundlingOpportunity {
  items: string[]
  bundleDiscount: number
  reasoning: string
}

export interface LoyaltyAdjustment {
  customerId: string
  tier: string
  discount: number
  benefits: string[]
}

export interface ShippingRecommendation {
  method: string
  cost: number
  deliveryDays: number
  reliability: number
  notes: string[]
}

export interface ConsolidationOpportunity {
  orders: string[]
  potentialSavings: number
  consolidatedShipping: number
  reasoning: string
}

export interface ShippingAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface OrderItem {
  sku: string
  quantity: number
  unitPrice: number
  weight?: number
  dimensions?: any
}

export class OrderOptimizationService {
  /**
   * Optimize order for cost, delivery time, and customer satisfaction
   */
  async optimizeOrder(orderData: any): Promise<OrderOptimizationResult> {
    try {
      const [
        routingSuggestions,
        pricingOptimization,
        shippingRecommendations,
        consolidationOpportunities
      ] = await Promise.all([
        this.optimizeRouting(orderData.shippingAddress, orderData.items),
        this.optimizePricing(orderData.customerId, orderData.items),
        this.getShippingRecommendations(orderData.shippingAddress, orderData.items),
        this.findConsolidationOpportunities(orderData.customerId, orderData.items)
      ])

      const estimatedSavings = this.calculateEstimatedSavings(
        pricingOptimization,
        consolidationOpportunities,
        routingSuggestions
      )

      return {
        routingSuggestions,
        pricingOptimization,
        shippingRecommendations,
        consolidationOpportunities,
        estimatedSavings
      }

    } catch (error) {
      console.error('Order optimization error:', error)
      return {
        routingSuggestions: [],
        pricingOptimization: {
          suggestedDiscounts: [],
          bundlingOpportunities: [],
          loyaltyAdjustments: []
        },
        shippingRecommendations: [],
        consolidationOpportunities: [],
        estimatedSavings: 0
      }
    }
  }

  /**
   * Calculate shipping cost based on address and items
   */
  async calculateShipping(address: ShippingAddress, items: OrderItem[]): Promise<number> {
    try {
      // Get available carriers and their rates
      const carriers = await prisma.carrier.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          baseRate: true,
          perPoundRate: true,
          zones: true
        }
      })

      if (carriers.length === 0) {
        return 15.99 // Default shipping rate
      }

      // Calculate total weight
      const totalWeight = items.reduce((sum, item) => {
        return sum + (item.weight || 1.0) * item.quantity
      }, 0)

      // Determine shipping zone based on destination
      const zone = this.determineShippingZone(address)

      // Find best rate among carriers
      let bestRate = Infinity
      
      for (const carrier of carriers) {
        const zoneMultiplier = this.getZoneMultiplier(zone, carrier.zones || {})
        const rate = Number(carrier.baseRate || 10) + 
                    (Number(carrier.perPoundRate || 2) * totalWeight * zoneMultiplier)
        
        if (rate < bestRate) {
          bestRate = rate
        }
      }

      return Math.max(5.99, Math.min(bestRate, 199.99)) // Cap between $5.99 and $199.99

    } catch (error) {
      console.error('Shipping calculation error:', error)
      return 15.99 // Fallback rate
    }
  }

  /**
   * Optimize routing and carrier selection
   */
  private async optimizeRouting(address: ShippingAddress, items: OrderItem[]): Promise<RoutingSuggestion[]> {
    try {
      const carriers = await prisma.carrier.findMany({
        where: { isActive: true },
        include: {
          shipments: {
            where: {
              destination: {
                path: ['state'],
                equals: address.state
              },
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            select: {
              shippingCost: true,
              estimatedDelivery: true,
              actualDelivery: true
            }
          }
        }
      })

      const suggestions: RoutingSuggestion[] = []

      for (const carrier of carriers) {
        // Calculate performance metrics
        const recentShipments = carrier.shipments
        const avgCost = recentShipments.length > 0 
          ? recentShipments.reduce((sum: number, s: any) => sum + Number(s.shippingCost || 0), 0) / recentShipments.length
          : 25.00

        const onTimeDeliveries = recentShipments.filter((s: any) => 
          s.actualDelivery && s.estimatedDelivery &&
          s.actualDelivery <= s.estimatedDelivery
        ).length

        const reliability = recentShipments.length > 0 
          ? (onTimeDeliveries / recentShipments.length) * 100 
          : 85

        // Estimate delivery time based on service
        const services = ['Ground', 'Express', 'Overnight']
        
        for (const service of services) {
          let estimatedDays = 5
          let costMultiplier = 1

          switch (service) {
            case 'Express':
              estimatedDays = 2
              costMultiplier = 1.8
              break
            case 'Overnight':
              estimatedDays = 1
              costMultiplier = 3.5
              break
            default:
              estimatedDays = 5
              costMultiplier = 1
          }

          suggestions.push({
            carrierId: carrier.id,
            carrierName: carrier.name,
            service,
            estimatedCost: avgCost * costMultiplier,
            estimatedDays,
            confidence: Math.min(95, reliability + 10)
          })
        }
      }

      // Sort by best value (cost vs delivery time)
      return suggestions.sort((a, b) => {
        const aValue = a.estimatedCost / Math.max(1, 6 - a.estimatedDays)
        const bValue = b.estimatedCost / Math.max(1, 6 - b.estimatedDays)
        return aValue - bValue
      }).slice(0, 5)

    } catch (error) {
      console.error('Routing optimization error:', error)
      return []
    }
  }

  /**
   * Optimize pricing and discounts
   */
  private async optimizePricing(customerId: string, items: OrderItem[]): Promise<PricingOptimization> {
    try {
      const [customer, customerOrders] = await Promise.all([
        prisma.customer.findUnique({
          where: { id: customerId },
          select: {
            id: true,
            name: true,
            createdAt: true,
            orders: {
              select: { total: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }),
        prisma.order.findMany({
          where: { customerId },
          select: { total: true, items: { select: { sku: true, quantity: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        })
      ])

      const suggestedDiscounts: DiscountSuggestion[] = []
      const bundlingOpportunities: BundlingOpportunity[] = []
      const loyaltyAdjustments: LoyaltyAdjustment[] = []

      if (customer) {
        // Calculate customer loyalty metrics
        const totalOrderValue = customer.orders.reduce((sum: number, order: any) => sum + Number(order.total), 0)
        const orderCount = customer.orders.length
        const customerAge = Math.floor((Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24))

        // Volume discount
        const orderTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        if (orderTotal > 500) {
          suggestedDiscounts.push({
            type: 'volume',
            percentage: 5,
            applicableItems: items.map(item => item.sku),
            conditions: 'Order total exceeds $500'
          })
        }

        // Loyalty discount
        if (orderCount >= 5 && totalOrderValue > 1000) {
          loyaltyAdjustments.push({
            customerId,
            tier: 'Gold',
            discount: 10,
            benefits: ['Free shipping', 'Priority support', '10% discount']
          })
        } else if (orderCount >= 2) {
          loyaltyAdjustments.push({
            customerId,
            tier: 'Silver',
            discount: 5,
            benefits: ['5% discount on orders']
          })
        }

        // First-time customer
        if (orderCount === 0) {
          suggestedDiscounts.push({
            type: 'first_time',
            percentage: 15,
            applicableItems: items.map(item => item.sku),
            conditions: 'First-time customer welcome discount'
          })
        }

        // Bundling opportunities based on purchase history
        const frequentSkus = this.findFrequentlyOrderedItems(customerOrders)
        const currentSkus = items.map(item => item.sku)
        const missingFrequentItems = frequentSkus.filter(sku => !currentSkus.includes(sku))

        if (missingFrequentItems.length > 0) {
          bundlingOpportunities.push({
            items: [...currentSkus, ...missingFrequentItems.slice(0, 2)],
            bundleDiscount: 8,
            reasoning: 'Based on previous purchase patterns'
          })
        }
      }

      return {
        suggestedDiscounts,
        bundlingOpportunities,
        loyaltyAdjustments
      }

    } catch (error) {
      console.error('Pricing optimization error:', error)
      return {
        suggestedDiscounts: [],
        bundlingOpportunities: [],
        loyaltyAdjustments: []
      }
    }
  }

  /**
   * Get shipping recommendations
   */
  private async getShippingRecommendations(address: ShippingAddress, items: OrderItem[]): Promise<ShippingRecommendation[]> {
    const recommendations: ShippingRecommendation[] = []

    // Standard ground shipping
    recommendations.push({
      method: 'Ground',
      cost: await this.calculateShipping(address, items),
      deliveryDays: 5,
      reliability: 95,
      notes: ['Most economical option', 'Standard delivery timeframe']
    })

    // Express shipping
    recommendations.push({
      method: 'Express',
      cost: await this.calculateShipping(address, items) * 1.8,
      deliveryDays: 2,
      reliability: 98,
      notes: ['Faster delivery', 'Higher cost']
    })

    // Overnight shipping
    recommendations.push({
      method: 'Overnight',
      cost: await this.calculateShipping(address, items) * 3.5,
      deliveryDays: 1,
      reliability: 99,
      notes: ['Next business day delivery', 'Premium pricing']
    })

    return recommendations
  }

  /**
   * Find consolidation opportunities
   */
  private async findConsolidationOpportunities(customerId: string, items: OrderItem[]): Promise<ConsolidationOpportunity[]> {
    try {
      // Look for other pending orders from the same customer
      const pendingOrders = await prisma.order.findMany({
        where: {
          customerId,
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        include: {
          items: true
        }
      })

      const opportunities: ConsolidationOpportunity[] = []

      if (pendingOrders.length > 1) {
        const orderIds = pendingOrders.map((order: any) => order.id)
        const totalShippingCost = pendingOrders.reduce(
          (sum: number, order: any) => sum + Number(order.shipping || 0), 
          0
        )

        // Estimate consolidated shipping (usually 20-30% savings)
        const consolidatedShipping = totalShippingCost * 0.75

        opportunities.push({
          orders: orderIds,
          potentialSavings: totalShippingCost - consolidatedShipping,
          consolidatedShipping,
          reasoning: 'Multiple pending orders can be shipped together'
        })
      }

      return opportunities

    } catch (error) {
      console.error('Consolidation optimization error:', error)
      return []
    }
  }

  /**
   * Calculate estimated total savings
   */
  private calculateEstimatedSavings(
    pricing: PricingOptimization,
    consolidation: ConsolidationOpportunity[],
    routing: RoutingSuggestion[]
  ): number {
    let totalSavings = 0

    // Savings from discounts
    pricing.suggestedDiscounts.forEach(discount => {
      totalSavings += discount.percentage * 0.01 * 100 // Simplified calculation
    })

    // Savings from consolidation
    consolidation.forEach(opp => {
      totalSavings += opp.potentialSavings
    })

    // Savings from optimal routing (compare to average)
    if (routing.length > 0) {
      const avgCost = routing.reduce((sum, r) => sum + r.estimatedCost, 0) / routing.length
      const bestCost = Math.min(...routing.map(r => r.estimatedCost))
      totalSavings += Math.max(0, avgCost - bestCost)
    }

    return Math.round(totalSavings * 100) / 100
  }

  /**
   * Helper methods
   */
  private determineShippingZone(address: ShippingAddress): string {
    // Simplified zone determination
    const westCoast = ['CA', 'OR', 'WA', 'NV', 'AZ']
    const eastCoast = ['NY', 'NJ', 'CT', 'MA', 'ME', 'NH', 'VT', 'RI', 'DE', 'MD', 'VA', 'NC', 'SC', 'GA', 'FL']
    
    if (westCoast.includes(address.state)) return 'west'
    if (eastCoast.includes(address.state)) return 'east'
    return 'central'
  }

  private getZoneMultiplier(zone: string, carrierZones: any): number {
    return carrierZones[zone] || 1.0
  }

  private findFrequentlyOrderedItems(orders: any[]): string[] {
    const skuCount: Record<string, number> = {}
    
    orders.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        skuCount[item.sku] = (skuCount[item.sku] || 0) + item.quantity
      })
    })

    return Object.entries(skuCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([sku]) => sku)
  }
} 