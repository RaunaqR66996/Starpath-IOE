import { Order, OrderStatus } from "@/types/order"
import { Allocation, PickTask, PackRecord, ShipConfirm } from "@/types/wms"
import { orderService } from "./order-service"
import { logger } from "@/lib/obs/logger"

type AllocationStore = Map<string, Allocation>
type PickTaskStore = Map<string, PickTask>
type PackStore = Map<string, PackRecord>
type ShipConfirmStore = Map<string, ShipConfirm>

// Simple inventory/bins seed
const inventorySeed = [
  { sku: "WA-LX001-CS", bin: "A-01-15", quantity: 8 },
  { sku: "WA-LX001-ST", bin: "B-02-08", quantity: 12 },
  { sku: "WA-LX001-MV", bin: "C-03-12", quantity: 3 },
  { sku: "WA-SM001-CS", bin: "D-04-20", quantity: 25 },
  { sku: "WA-SM001-BT", bin: "E-05-15", quantity: 30 },
  { sku: "WA-SM001-MV", bin: "F-06-10", quantity: 22 },
]

class WMSFulfillmentService {
  private allocations: AllocationStore = new Map()
  private pickTasks: PickTaskStore = new Map()
  private packRecords: PackStore = new Map()
  private shipConfirms: ShipConfirmStore = new Map()
  private inventory: Map<string, { bin: string; quantity: number }> = new Map()

  constructor() {
    // Seed inventory
    inventorySeed.forEach(item => {
      this.inventory.set(item.sku, { bin: item.bin, quantity: item.quantity })
    })
  }

  // Allocate inventory for order lines
  allocate(orderId: string): { success: boolean; allocatedLines: string[]; errors: string[] } {
    const order = orderService.get(orderId)
    if (!order) {
      return { success: false, allocatedLines: [], errors: [`Order ${orderId} not found`] }
    }

    const allocatedLines: string[] = []
    const errors: string[] = []

    for (const line of order.orderLines) {
      const inventory = this.inventory.get(line.sku)
      if (!inventory) {
        errors.push(`No inventory found for SKU ${line.sku}`)
        continue
      }

      if (inventory.quantity < line.quantity) {
        errors.push(`Insufficient inventory for SKU ${line.sku}: need ${line.quantity}, have ${inventory.quantity}`)
        continue
      }

      // Create allocation
      const allocation: Allocation = {
        id: `ALLOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        orderLineId: line.id,
        sku: line.sku,
        bin: inventory.bin,
        quantity: line.quantity,
        createdAt: new Date()
      }

      this.allocations.set(allocation.id, allocation)

      // Update inventory
      inventory.quantity -= line.quantity
      this.inventory.set(line.sku, inventory)

      // Update order line inventory status
      line.inventory.status = 'allocated'
      line.inventory.allocatedQuantity = line.quantity
      line.inventory.lastStockCheck = new Date()

      allocatedLines.push(line.id)

      // Log allocation
      logger.allocationCreated(orderId, line.sku, line.quantity, {
        allocationId: allocation.id,
        bin: inventory.bin,
        orderLineId: line.id
      })
    }

    // Update order status if all lines allocated
    if (allocatedLines.length === order.orderLines.length && errors.length === 0) {
      orderService.updateStatus(orderId, 'allocated')
    }

    return { 
      success: errors.length === 0, 
      allocatedLines, 
      errors 
    }
  }

  // Create pick tasks for allocated lines
  pick(orderId: string): { success: boolean; pickTasks: string[]; errors: string[] } {
    const order = orderService.get(orderId)
    if (!order) {
      return { success: false, pickTasks: [], errors: [`Order ${orderId} not found`] }
    }

    const pickTasks: string[] = []
    const errors: string[] = []

    // Find allocations for this order
    const orderAllocations = Array.from(this.allocations.values())
      .filter(alloc => alloc.orderId === orderId)

    for (const allocation of orderAllocations) {
      const pickTask: PickTask = {
        id: `PICK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        orderLineId: allocation.orderLineId,
        sku: allocation.sku,
        fromBin: allocation.bin,
        quantity: allocation.quantity,
        status: 'pending',
        createdAt: new Date()
      }

      this.pickTasks.set(pickTask.id, pickTask)
      pickTasks.push(pickTask.id)

      // Log pick task creation
      logger.info('Pick task created', {
        orderId,
        pickTaskId: pickTask.id,
        sku: pickTask.sku,
        quantity: pickTask.quantity,
        bin: pickTask.fromBin,
        action: 'pick_task_created'
      })
    }

    if (pickTasks.length > 0) {
      orderService.updateStatus(orderId, 'picking')
    }

    return { success: true, pickTasks, errors }
  }

  // Complete pick tasks and create pack records
  pack(orderId: string): { success: boolean; packRecords: string[]; errors: string[] } {
    const order = orderService.get(orderId)
    if (!order) {
      return { success: false, packRecords: [], errors: [`Order ${orderId} not found`] }
    }

    const packRecords: string[] = []
    const errors: string[] = []

    // Find pending pick tasks for this order
    const orderPickTasks = Array.from(this.pickTasks.values())
      .filter(task => task.orderId === orderId && task.status === 'pending')

    for (const pickTask of orderPickTasks) {
      // Mark pick task as completed
      pickTask.status = 'completed'
      pickTask.completedAt = new Date()
      this.pickTasks.set(pickTask.id, pickTask)

      // Log pick task completion
      logger.pickTaskCompleted(orderId, pickTask.id, {
        sku: pickTask.sku,
        quantity: pickTask.quantity
      })

      // Create pack record
      const packRecord: PackRecord = {
        id: `PACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderId,
        handlingUnitId: `HU-${orderId}-${packRecords.length + 1}`,
        packageType: 'standard',
        weightKg: Math.random() * 5 + 0.5, // Random weight between 0.5-5.5kg
        lengthCm: 30,
        widthCm: 20,
        heightCm: 15,
        createdAt: new Date()
      }

      this.packRecords.set(packRecord.id, packRecord)
      packRecords.push(packRecord.id)

      // Log pack completion
      logger.packCompleted(orderId, packRecord.id, {
        handlingUnitId: packRecord.handlingUnitId,
        weightKg: packRecord.weightKg
      })
    }

    if (packRecords.length > 0) {
      orderService.updateStatus(orderId, 'packing')
    }

    return { success: true, packRecords, errors }
  }

  // Ship confirm - finalize order and trigger TMS
  shipConfirm(orderId: string): { success: boolean; shipmentId?: string; errors: string[] } {
    const order = orderService.get(orderId)
    if (!order) {
      return { success: false, errors: [`Order ${orderId} not found`] }
    }

    // Find pack records for this order
    const orderPackRecords = Array.from(this.packRecords.values())
      .filter(pack => pack.orderId === orderId)

    if (orderPackRecords.length === 0) {
      return { success: false, errors: ['No pack records found for order'] }
    }

    // Create ship confirm
    const shipConfirm: ShipConfirm = {
      id: `SHIP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      shipmentId: `SHIPMENT-${orderId}`,
      packages: orderPackRecords.map(pack => ({
        handlingUnitId: pack.handlingUnitId,
        weightKg: pack.weightKg,
        trackingNumber: `TRK-${pack.handlingUnitId}`
      })),
      confirmedAt: new Date()
    }

    this.shipConfirms.set(shipConfirm.id, shipConfirm)

    // Update order status
    orderService.updateStatus(orderId, 'shipped')

    // Log ship confirm
    logger.shipConfirmed(orderId, shipConfirm.shipmentId!, {
      packages: shipConfirm.packages.length,
      shipConfirmId: shipConfirm.id
    })

    return { 
      success: true, 
      shipmentId: shipConfirm.shipmentId, 
      errors: [] 
    }
  }

  // Get fulfillment status for an order
  getOrderFulfillmentStatus(orderId: string) {
    const allocations = Array.from(this.allocations.values())
      .filter(alloc => alloc.orderId === orderId)
    const pickTasks = Array.from(this.pickTasks.values())
      .filter(task => task.orderId === orderId)
    const packRecords = Array.from(this.packRecords.values())
      .filter(pack => pack.orderId === orderId)
    const shipConfirms = Array.from(this.shipConfirms.values())
      .filter(ship => ship.orderId === orderId)

    return {
      allocated: allocations.length,
      picked: pickTasks.filter(task => task.status === 'completed').length,
      packed: packRecords.length,
      shipped: shipConfirms.length,
      totalLines: allocations.length
    }
  }

  // Get all allocations for an order
  getOrderAllocations(orderId: string): Allocation[] {
    return Array.from(this.allocations.values())
      .filter(alloc => alloc.orderId === orderId)
  }

  // Get all pick tasks for an order
  getOrderPickTasks(orderId: string): PickTask[] {
    return Array.from(this.pickTasks.values())
      .filter(task => task.orderId === orderId)
  }

  // Get all pack records for an order
  getOrderPackRecords(orderId: string): PackRecord[] {
    return Array.from(this.packRecords.values())
      .filter(pack => pack.orderId === orderId)
  }

  // Get inventory levels
  getInventoryLevels() {
    return Array.from(this.inventory.entries()).map(([sku, data]) => ({
      sku,
      bin: data.bin,
      quantity: data.quantity
    }))
  }
}

// Singleton instance
export const wmsFulfillmentService = new WMSFulfillmentService()
