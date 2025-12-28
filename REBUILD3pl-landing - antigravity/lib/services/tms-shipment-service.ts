import { Shipment, ShipmentStatus, ShipmentLine, Milestone } from "@/types/shipment"
import { orderService } from "./order-service"
import { logger } from "@/lib/obs/logger"

type ShipmentStore = Map<string, Shipment>

// Seed carriers and lanes
const carriers = [
  { id: "CARRIER-001", name: "FedEx", code: "FDX", contact: "1-800-GO-FEDEX" },
  { id: "CARRIER-002", name: "UPS", code: "UPS", contact: "1-800-PICK-UPS" },
  { id: "CARRIER-003", name: "DHL", code: "DHL", contact: "1-800-CALL-DHL" },
  { id: "CARRIER-004", name: "USPS", code: "USPS", contact: "1-800-ASK-USPS" }
]

const serviceLevels = [
  { code: "GROUND", name: "Ground", days: 5, cost: 15.99 },
  { code: "2DAY", name: "2-Day", days: 2, cost: 25.99 },
  { code: "NEXTDAY", name: "Next Day", days: 1, cost: 45.99 },
  { code: "EXPRESS", name: "Express", days: 1, cost: 65.99 }
]

class TMSShipmentService {
  private shipments: ShipmentStore = new Map()
  private nextShipmentId = 1

  // Plan a shipment for an order
  planShipment(orderId: string): { success: boolean; shipment?: Shipment; errors: string[] } {
    const order = orderService.get(orderId)
    if (!order) {
      return { success: false, errors: [`Order ${orderId} not found`] }
    }

    // Check if shipment already exists
    const existingShipment = Array.from(this.shipments.values())
      .find(shipment => shipment.orderId === orderId)
    
    if (existingShipment) {
      return { success: false, errors: [`Shipment already exists for order ${orderId}`] }
    }

    // Create shipment lines from order lines
    const shipmentLines: ShipmentLine[] = order.orderLines.map(line => ({
      id: `LINE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      orderLineId: line.id,
      sku: line.sku,
      description: line.productName,
      quantity: line.quantity,
      uom: line.unitOfMeasure
    }))

    // Create shipment
    const shipment: Shipment = {
      id: `SHIPMENT-${this.nextShipmentId++}`,
      orderId,
      status: 'planned',
      reference: order.orderNumber,
      plannedPickup: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      plannedDelivery: order.expectedDelivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      origin: {
        name: "KuehneNagel - East Warehouse",
        city: "New York",
        state: "NY",
        country: "USA"
      },
      destination: {
        name: order.customerDetails.customer.name,
        city: order.customerDetails.addresses.shipping.city,
        state: order.customerDetails.addresses.shipping.state,
        country: order.customerDetails.addresses.shipping.country
      },
      lines: shipmentLines,
      packages: [{
        id: `PKG-${Date.now()}`,
        type: "standard",
        weightKg: Math.random() * 10 + 1, // Random weight 1-11kg
        lengthCm: 30,
        widthCm: 20,
        heightCm: 15
      }],
      cost: {
        base: 15.99,
        fuelSurcharge: 2.50,
        accessorials: [],
        currency: "USD",
        total: 18.49
      },
      milestones: [{
        code: 'planned',
        timestamp: new Date(),
        description: 'Shipment planned and created'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.shipments.set(shipment.id, shipment)
    
    // Log shipment planning
    logger.shipmentPlanned(shipment.id, orderId, {
      lines: shipment.lines.length,
      packages: shipment.packages?.length || 0,
      plannedPickup: shipment.plannedPickup,
      plannedDelivery: shipment.plannedDelivery
    })
    
    return { success: true, shipment, errors: [] }
  }

  // Rate shop for carriers
  rateShop(shipmentId: string): { success: boolean; rates?: any[]; errors: string[] } {
    const shipment = this.shipments.get(shipmentId)
    if (!shipment) {
      return { success: false, errors: [`Shipment ${shipmentId} not found`] }
    }

    // Generate mock rates for different carriers
    const rates = carriers.map(carrier => {
      const serviceLevel = serviceLevels[Math.floor(Math.random() * serviceLevels.length)]
      return {
        carrierId: carrier.id,
        carrierName: carrier.name,
        serviceLevel: serviceLevel.code,
        serviceName: serviceLevel.name,
        estimatedDays: serviceLevel.days,
        cost: serviceLevel.cost + Math.random() * 10, // Add some variation
        currency: "USD"
      }
    })

    return { success: true, rates, errors: [] }
  }

  // Tender shipment to carrier
  tender(shipmentId: string, carrierId: string, serviceLevel: string): { success: boolean; errors: string[] } {
    const shipment = this.shipments.get(shipmentId)
    if (!shipment) {
      return { success: false, errors: [`Shipment ${shipmentId} not found`] }
    }

    if (shipment.status !== 'planned') {
      return { success: false, errors: [`Shipment must be in planned status to tender`] }
    }

    // Find carrier
    const carrier = carriers.find(c => c.id === carrierId)
    if (!carrier) {
      return { success: false, errors: [`Carrier ${carrierId} not found`] }
    }

    // Update shipment
    shipment.carrier = carrier.name
    shipment.serviceLevel = serviceLevel
    shipment.status = 'tendered'
    shipment.updatedAt = new Date()

    // Add milestone
    shipment.milestones.push({
      code: 'tendered',
      timestamp: new Date(),
      description: `Tendered to ${carrier.name} - ${serviceLevel}`
    })

    this.shipments.set(shipmentId, shipment)
    
    // Log shipment tendering
    logger.shipmentTendered(shipmentId, carrier.name, {
      serviceLevel,
      orderId: shipment.orderId
    })
    
    return { success: true, errors: [] }
  }

  // Track shipment milestones
  track(shipmentId: string): { success: boolean; milestones?: Milestone[]; errors: string[] } {
    const shipment = this.shipments.get(shipmentId)
    if (!shipment) {
      return { success: false, errors: [`Shipment ${shipmentId} not found`] }
    }

    // If shipment is just planned/tendered, add some mock milestones
    if (shipment.status === 'planned' || shipment.status === 'tendered') {
      const now = new Date()
      const mockMilestones: Milestone[] = [
        {
          code: 'accepted',
          timestamp: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
          description: 'Shipment accepted by carrier',
          location: shipment.origin
        },
        {
          code: 'pickup',
          timestamp: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
          description: 'Picked up from origin',
          location: shipment.origin
        },
        {
          code: 'departed',
          timestamp: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours later
          description: 'Departed origin facility',
          location: shipment.origin
        },
        {
          code: 'in_transit',
          timestamp: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours later
          description: 'In transit to destination',
          location: { city: "In Transit" }
        }
      ]

      // Add milestones that don't already exist
      mockMilestones.forEach(milestone => {
        const exists = shipment.milestones.some(m => m.code === milestone.code)
        if (!exists) {
          shipment.milestones.push(milestone)
        }
      })

      // Update status based on latest milestone
      const latestMilestone = shipment.milestones[shipment.milestones.length - 1]
      if (latestMilestone.code === 'in_transit') {
        shipment.status = 'in_transit'
      }

      shipment.updatedAt = new Date()
      this.shipments.set(shipmentId, shipment)
    }

    return { success: true, milestones: shipment.milestones, errors: [] }
  }

  // Get shipment by ID
  getShipment(shipmentId: string): Shipment | undefined {
    return this.shipments.get(shipmentId)
  }

  // Get shipments by order ID
  getShipmentsByOrderId(orderId: string): Shipment[] {
    return Array.from(this.shipments.values())
      .filter(shipment => shipment.orderId === orderId)
  }

  // Get all shipments
  getAllShipments(): Shipment[] {
    return Array.from(this.shipments.values())
      .sort((a, b) => (b.createdAt as any) - (a.createdAt as any))
  }

  // Update shipment status
  updateShipmentStatus(shipmentId: string, status: ShipmentStatus): { success: boolean; errors: string[] } {
    const shipment = this.shipments.get(shipmentId)
    if (!shipment) {
      return { success: false, errors: [`Shipment ${shipmentId} not found`] }
    }

    shipment.status = status
    shipment.updatedAt = new Date()

    // Add milestone for status change
    const statusDescriptions: Record<ShipmentStatus, string> = {
      planned: 'Shipment planned',
      tendered: 'Shipment tendered to carrier',
      accepted: 'Shipment accepted by carrier',
      in_transit: 'Shipment in transit',
      delivered: 'Shipment delivered',
      cancelled: 'Shipment cancelled'
    }

    shipment.milestones.push({
      code: status as any,
      timestamp: new Date(),
      description: statusDescriptions[status] || `Status changed to ${status}`
    })

    this.shipments.set(shipmentId, shipment)
    return { success: true, errors: [] }
  }

  // Get carriers
  getCarriers() {
    return carriers
  }

  // Get service levels
  getServiceLevels() {
    return serviceLevels
  }
}

// Singleton instance
export const tmsShipmentService = new TMSShipmentService()
