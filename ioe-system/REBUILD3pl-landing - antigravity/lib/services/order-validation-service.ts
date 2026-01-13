import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Types for order validation
export interface OrderValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  score: number // 0-100 validation confidence score
}

export interface OrderValidationInput {
  customerId: string
  items: Array<{
    sku: string
    description: string
    quantity: number
    unitPrice: number
  }>
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  priority?: string
  requestedDelivery?: string
}

export class OrderValidationService {
  /**
   * Comprehensive AI-powered order validation
   * Validates customer, inventory, addresses, pricing, and business rules
   */
  async validateOrder(orderData: OrderValidationInput): Promise<OrderValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    let score = 100

    try {
      // 1. Customer Validation
      const customerValidation = await this.validateCustomer(orderData.customerId)
      if (!customerValidation.isValid) {
        errors.push(...customerValidation.errors)
        warnings.push(...customerValidation.warnings)
        score -= 30
      }

      // 2. Item Validation
      const itemValidation = await this.validateItems(orderData.items)
      if (!itemValidation.isValid) {
        errors.push(...itemValidation.errors)
        warnings.push(...itemValidation.warnings)
        score -= 25
      }
      suggestions.push(...itemValidation.suggestions)

      // 3. Address Validation
      const addressValidation = await this.validateAddress(orderData.shippingAddress)
      if (!addressValidation.isValid) {
        errors.push(...addressValidation.errors)
        warnings.push(...addressValidation.warnings)
        score -= 15
      }

      // 4. Business Rules Validation
      const businessValidation = await this.validateBusinessRules(orderData)
      if (!businessValidation.isValid) {
        errors.push(...businessValidation.errors)
        warnings.push(...businessValidation.warnings)
        score -= 20
      }
      suggestions.push(...businessValidation.suggestions)

      // 5. Supply Chain Validation
      const supplyChainValidation = await this.validateSupplyChainConstraints(orderData)
      if (!supplyChainValidation.isValid) {
        warnings.push(...supplyChainValidation.warnings)
        score -= 10
      }
      suggestions.push(...supplyChainValidation.suggestions)

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions: suggestions.filter(Boolean),
        score: Math.max(0, score)
      }

    } catch (error) {
      console.error('Order validation error:', error)
      return {
        isValid: false,
        errors: ['System error during validation'],
        warnings: [],
        suggestions: [],
        score: 0
      }
    }
  }

  /**
   * Validate customer exists, is active, and has proper credit
   */
  private async validateCustomer(customerId: string): Promise<OrderValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: {
            where: { status: { in: ['PENDING', 'PROCESSING'] } },
            select: { total: true }
          }
        }
      })

      if (!customer) {
        errors.push('Customer not found')
        return { isValid: false, errors, warnings, suggestions: [], score: 0 }
      }

      if (!customer.isActive) {
        errors.push('Customer account is inactive')
      }

      // Check credit limit if applicable
      if (customer.creditLimit) {
        const pendingOrdersTotal = customer.orders.reduce(
          (sum: number, order: any) => sum + Number(order.total), 
          0
        )
        
        if (pendingOrdersTotal > Number(customer.creditLimit) * 0.8) {
          warnings.push('Customer approaching credit limit')
        }
        
        if (pendingOrdersTotal > Number(customer.creditLimit)) {
          errors.push('Customer exceeds credit limit')
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions: [],
        score: 100
      }

    } catch (error) {
      console.error('Customer validation error:', error)
      return {
        isValid: false,
        errors: ['Error validating customer'],
        warnings: [],
        suggestions: [],
        score: 0
      }
    }
  }

  /**
   * Validate order items exist, are active, and have reasonable pricing
   */
  private async validateItems(items: OrderValidationInput['items']): Promise<OrderValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    try {
      // Get all SKUs for batch validation
      const skus = items.map(item => item.sku)
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { sku: { in: skus } },
        select: {
          sku: true,
          name: true,
          isActive: true,
          currentStock: true,
          reservedStock: true,
          availableStock: true,
          unitCost: true
        }
      })

      const inventoryMap = new Map(inventoryItems.map((item: any) => [item.sku, item]))

      for (const item of items) {
        const inventoryItem = inventoryMap.get(item.sku)

        if (!inventoryItem) {
          errors.push(`SKU ${item.sku} not found in inventory`)
          continue
        }

        if (!(inventoryItem as any).isActive) {
          errors.push(`SKU ${item.sku} is inactive`)
          continue
        }

        // Check quantity limits
        if (item.quantity <= 0) {
          errors.push(`Invalid quantity for SKU ${item.sku}`)
        }

        if (item.quantity > 10000) {
          warnings.push(`Large quantity ordered for SKU ${item.sku}`)
        }

        // Price validation
        if (item.unitPrice <= 0) {
          errors.push(`Invalid unit price for SKU ${item.sku}`)
        }

        // Cost margin validation
        if ((inventoryItem as any).unitCost && item.unitPrice < Number((inventoryItem as any).unitCost) * 1.1) {
          warnings.push(`Low margin on SKU ${item.sku}`)
          suggestions.push(`Consider adjusting pricing for ${item.sku} to maintain healthy margins`)
        }

        // Stock level suggestions
        if (item.quantity > (inventoryItem as any).availableStock) {
          warnings.push(`Insufficient stock for SKU ${item.sku}`)
          suggestions.push(`Consider partial fulfillment or backorder for ${item.sku}`)
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        score: 100
      }

    } catch (error) {
      console.error('Item validation error:', error)
      return {
        isValid: false,
        errors: ['Error validating items'],
        warnings: [],
        suggestions: [],
        score: 0
      }
    }
  }

  /**
   * Validate shipping address format and deliverability
   */
  private async validateAddress(address: OrderValidationInput['shippingAddress']): Promise<OrderValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Basic format validation
    if (!address.street?.trim()) {
      errors.push('Street address is required')
    }

    if (!address.city?.trim()) {
      errors.push('City is required')
    }

    if (!address.state?.trim()) {
      errors.push('State is required')
    }

    if (!address.zipCode?.trim()) {
      errors.push('ZIP code is required')
    } else if (!/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
      errors.push('Invalid ZIP code format')
    }

    // Country validation
    const supportedCountries = ['US', 'CA', 'MX']
    if (!supportedCountries.includes(address.country)) {
      errors.push(`Shipping to ${address.country} is not currently supported`)
    }

    // TODO: Integrate with address validation service (SmartyStreets, etc.)
    // For now, basic validation only

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
      score: 100
    }
  }

  /**
   * Validate business rules and constraints
   */
  private async validateBusinessRules(orderData: OrderValidationInput): Promise<OrderValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Minimum order value
    const orderTotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const minimumOrderValue = 25.00

    if (orderTotal < minimumOrderValue) {
      errors.push(`Order total $${orderTotal.toFixed(2)} is below minimum of $${minimumOrderValue.toFixed(2)}`)
    }

    // Delivery date validation
    if (orderData.requestedDelivery) {
      const requestedDate = new Date(orderData.requestedDelivery)
      const now = new Date()
      const daysDiff = (requestedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      if (daysDiff < 1) {
        errors.push('Requested delivery date must be at least 1 day in the future')
      } else if (daysDiff < 2) {
        warnings.push('Rush delivery may incur additional charges')
        suggestions.push('Consider express shipping for same-day or next-day delivery')
      }

      // Weekend delivery check
      const dayOfWeek = requestedDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        warnings.push('Weekend delivery requested - additional charges may apply')
      }
    }

    // Holiday shipping restrictions
    const holidays = await this.getShippingHolidays()
    if (orderData.requestedDelivery) {
      const requestedDate = new Date(orderData.requestedDelivery)
      const isHoliday = holidays.some(holiday => 
        holiday.toDateString() === requestedDate.toDateString()
      )
      
      if (isHoliday) {
        warnings.push('Delivery requested on a shipping holiday')
        suggestions.push('Consider adjusting delivery date to avoid holiday delays')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score: 100
    }
  }

  /**
   * Validate supply chain constraints and capacity
   */
  private async validateSupplyChainConstraints(orderData: OrderValidationInput): Promise<OrderValidationResult> {
    const warnings: string[] = []
    const suggestions: string[] = []

    try {
      // Check for hazardous materials
      const hazmatItems = orderData.items.filter(item => 
        item.description.toLowerCase().includes('battery') ||
        item.description.toLowerCase().includes('chemical') ||
        item.description.toLowerCase().includes('liquid')
      )

      if (hazmatItems.length > 0) {
        warnings.push('Order contains potential hazardous materials')
        suggestions.push('Verify proper hazmat documentation and carrier capabilities')
      }

      // Check for oversized items
      const oversizedItems = orderData.items.filter(item => item.quantity > 100)
      if (oversizedItems.length > 0) {
        warnings.push('Order contains large quantities')
        suggestions.push('Consider LTL shipping for bulk orders')
      }

      // Peak season capacity warnings
      const now = new Date()
      const isPeakSeason = (now.getMonth() >= 10 && now.getMonth() <= 11) || now.getMonth() === 0
      
      if (isPeakSeason) {
        warnings.push('Peak season - expect potential delays')
        suggestions.push('Consider expedited processing for time-sensitive orders')
      }

      return {
        isValid: true,
        errors: [],
        warnings,
        suggestions,
        score: 100
      }

    } catch (error) {
      console.error('Supply chain validation error:', error)
      return {
        isValid: true,
        errors: [],
        warnings: ['Unable to validate supply chain constraints'],
        suggestions: [],
        score: 90
      }
    }
  }

  /**
   * Get shipping holidays for the current year
   */
  private async getShippingHolidays(): Promise<Date[]> {
    const currentYear = new Date().getFullYear()
    
    // Common US shipping holidays
    return [
      new Date(currentYear, 0, 1),   // New Year's Day
      new Date(currentYear, 6, 4),   // Independence Day
      new Date(currentYear, 11, 25), // Christmas Day
      // Add more holidays as needed
    ]
  }
} 