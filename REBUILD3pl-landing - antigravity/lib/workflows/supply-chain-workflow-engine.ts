import { PrismaClient } from '@prisma/client'
import { EventEmitter } from 'events'

const prisma = new PrismaClient()

export interface SupplyChainWorkflowData {
  purchaseOrderId: string
  customerId: string
  organizationId: string
  currentStep: SupplyChainStep
  status: 'pending' | 'processing' | 'completed' | 'failed'
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export enum SupplyChainStep {
  PO_RECEIVED = 'PO_RECEIVED',
  PO_TO_SO_CONVERSION = 'PO_TO_SO_CONVERSION',
  WMS_INTEGRATION = 'WMS_INTEGRATION',
  TMS_SCHEDULING = 'TMS_SCHEDULING',
  TRUCK_DISPATCH = 'TRUCK_DISPATCH',
  NFC_DATA_SHARING = 'NFC_DATA_SHARING',
  DELIVERY_CONFIRMATION = 'DELIVERY_CONFIRMATION',
  POD_CAPTURE = 'POD_CAPTURE',
  COMPLETED = 'COMPLETED'
}

export interface InventoryCheckResult {
  itemId: string
  sku: string
  requiredQuantity: number
  availableQuantity: number
  shortage: number
  canFulfill: boolean
  warehouseLocation?: string
}

export interface WMSOperation {
  operationId: string
  type: 'PICK' | 'PACK' | 'SHIP'
  items: Array<{
    itemId: string
    quantity: number
    location: string
  }>
  status: 'pending' | 'in_progress' | 'completed'
  assignedWorker?: string
  estimatedDuration: number
}

export interface TMSAssignment {
  shipmentId: string
  truckId: string
  driverId: string
  route: {
    origin: string
    destination: string
    waypoints: string[]
    estimatedDistance: number
    estimatedDuration: number
  }
  schedule: {
    pickupTime: Date
    deliveryTime: Date
    driverContact: string
  }
}

export interface NFCShipmentData {
  shipmentId: string
  driverId: string
  data: {
    orderNumber: string
    customerInfo: {
      name: string
      address: string
      phone: string
      email: string
    }
    items: Array<{
      sku: string
      description: string
      quantity: number
      weight: number
      dimensions: string
    }>
    specialInstructions: string[]
    documents: {
      packingSlip: string
      billOfLading: string
      deliveryReceipt: string
    }
    trackingInfo: {
      trackingNumber: string
      carrier: string
      service: string
    }
  }
  timestamp: Date
  nfcTagId: string
}

export class SupplyChainWorkflowEngine extends EventEmitter {
  private workflows: Map<string, SupplyChainWorkflowData> = new Map()

  constructor() {
    super()
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.on('workflow:step:completed', this.handleStepCompletion.bind(this))
    this.on('workflow:error', this.handleWorkflowError.bind(this))
  }

  /**
   * Main entry point: Start the complete supply chain workflow
   */
  async startWorkflow(purchaseOrderId: string, customerId: string, organizationId: string): Promise<string> {
    try {
      const workflowId = `WF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      
      const workflow: SupplyChainWorkflowData = {
        purchaseOrderId,
        customerId,
        organizationId,
        currentStep: SupplyChainStep.PO_RECEIVED,
        status: 'processing',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.workflows.set(workflowId, workflow)
      
      console.log(`🚀 Starting supply chain workflow ${workflowId} for PO ${purchaseOrderId}`)
      
      // Start the workflow
      await this.executeStep(workflowId, SupplyChainStep.PO_TO_SO_CONVERSION)
      
      return workflowId
    } catch (error) {
      console.error('Failed to start workflow:', error)
      throw error
    }
  }

  /**
   * Step 1: Convert Purchase Order to Sales Order
   */
  private async executePOToSOConversion(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`📋 Converting PO to SO for workflow ${workflowId}`)

    try {
      // Get the purchase order
      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: workflow.purchaseOrderId },
        include: { items: true, supplier: true }
      })

      if (!purchaseOrder) {
        throw new Error('Purchase order not found')
      }

      // Calculate totals
      const subtotal = purchaseOrder.items.reduce((sum, item) => sum + item.totalPrice, 0)
      const tax = subtotal * 0.08 // 8% tax
      const shipping = 0
      const total = subtotal + tax + shipping

      // Create sales order
      const salesOrder = await prisma.$transaction(async (tx) => {
        const orderNumber = `SO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000+1000)}`

        const created = await tx.order.create({
          data: {
            orderNumber,
            organizationId: workflow.organizationId,
            customerId: workflow.customerId,
            status: 'pending',
            totalAmount: total,
            priority: purchaseOrder.priority || 'medium',
            expectedDelivery: purchaseOrder.expectedDelivery,
            sourceDocument: {
              type: 'purchase_order',
              poNumber: purchaseOrder.poNumber,
              supplier: purchaseOrder.supplier.name
            }
          },
        })

        // Create order items
        for (const poItem of purchaseOrder.items) {
          const item = await tx.item.findFirst({ 
            where: { sku: poItem.sku, organizationId: workflow.organizationId } 
          })
          
          if (item) {
            await tx.orderItem.create({
              data: {
                orderId: created.id,
                itemId: item.id,
                quantity: poItem.quantity,
                unitPrice: poItem.unitPrice,
                totalPrice: poItem.totalPrice,
              },
            })
          }
        }

        return created
      })

      // Update workflow metadata
      workflow.metadata.salesOrderId = salesOrder.id
      workflow.metadata.salesOrderNumber = salesOrder.orderNumber
      workflow.updatedAt = new Date()

      console.log(`✅ Created sales order ${salesOrder.orderNumber}`)

      // Move to next step
      await this.executeStep(workflowId, SupplyChainStep.WMS_INTEGRATION)

    } catch (error) {
      console.error('PO to SO conversion failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }


  /**
   * Step 2: WMS Integration - Create warehouse operations
   */
  private async executeWMSIntegration(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`🏭 Creating WMS operations for workflow ${workflowId}`)

    try {
      const salesOrder = await prisma.order.findUnique({
        where: { id: workflow.metadata.salesOrderId },
        include: { items: { include: { item: true } } }
      })

      if (!salesOrder) {
        throw new Error('Sales order not found')
      }

      // Create pick operations
      const pickOperation: WMSOperation = {
        operationId: `PICK-${Date.now()}`,
        type: 'PICK',
        items: salesOrder.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          location: workflow.metadata.inventoryCheck.results.find(r => r.itemId === item.itemId)?.warehouseLocation || 'A-01-01'
        })),
        status: 'pending',
        estimatedDuration: salesOrder.items.length * 2 // 2 minutes per item
      }

      // Create pack operation
      const packOperation: WMSOperation = {
        operationId: `PACK-${Date.now()}`,
        type: 'PACK',
        items: salesOrder.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          location: 'PACKING-STATION-01'
        })),
        status: 'pending',
        estimatedDuration: 15 // 15 minutes
      }

      // Create ship operation
      const shipOperation: WMSOperation = {
        operationId: `SHIP-${Date.now()}`,
        type: 'SHIP',
        items: salesOrder.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          location: 'SHIPPING-DOCK-01'
        })),
        status: 'pending',
        estimatedDuration: 10 // 10 minutes
      }

      // Update workflow metadata
      workflow.metadata.wmsOperations = {
        pick: pickOperation,
        pack: packOperation,
        ship: shipOperation,
        status: 'created',
        timestamp: new Date()
      }

      console.log(`✅ WMS operations created for workflow ${workflowId}`)

      // Move to next step
      await this.executeStep(workflowId, SupplyChainStep.TMS_SCHEDULING)

    } catch (error) {
      console.error('WMS integration failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }

  /**
   * Step 3: TMS Scheduling - Assign truck and driver
   */
  private async executeTMSScheduling(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`🚛 Scheduling truck for workflow ${workflowId}`)

    try {
      const salesOrder = await prisma.order.findUnique({
        where: { id: workflow.metadata.salesOrderId },
        include: { customer: true }
      })

      if (!salesOrder) {
        throw new Error('Sales order not found')
      }

      // Find available truck and driver
      const availableTrucks = await prisma.carrier.findMany({
        where: {
          organizationId: workflow.organizationId,
          isActive: true
        },
        take: 1
      })

      if (availableTrucks.length === 0) {
        throw new Error('No available trucks found')
      }

      const truck = availableTrucks[0]

      // Create TMS assignment
      const tmsAssignment: TMSAssignment = {
        shipmentId: `SHIP-${Date.now()}`,
        truckId: truck.id,
        driverId: `DRIVER-${Math.floor(Math.random() * 1000)}`,
        route: {
          origin: 'WAREHOUSE-01',
          destination: `${salesOrder.customer.city}, ${salesOrder.customer.state}`,
          waypoints: [],
          estimatedDistance: Math.floor(Math.random() * 200) + 50, // 50-250 miles
          estimatedDuration: Math.floor(Math.random() * 4) + 2 // 2-6 hours
        },
        schedule: {
          pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          deliveryTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          driverContact: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`
        }
      }

      // Update workflow metadata
      workflow.metadata.tmsAssignment = tmsAssignment
      workflow.metadata.shipmentId = tmsAssignment.shipmentId

      console.log(`✅ Truck scheduled for workflow ${workflowId}: ${tmsAssignment.truckId}`)

      // Move to next step
      await this.executeStep(workflowId, SupplyChainStep.TRUCK_DISPATCH)

    } catch (error) {
      console.error('TMS scheduling failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }

  /**
   * Step 4: Truck Dispatch
   */
  private async executeTruckDispatch(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`🚚 Dispatching truck for workflow ${workflowId}`)

    try {
      const tmsAssignment = workflow.metadata.tmsAssignment as TMSAssignment

      // Create shipment record
      const shipment = await prisma.shipment.create({
        data: {
          organizationId: workflow.organizationId,
          orderId: workflow.metadata.salesOrderId,
          carrierId: tmsAssignment.truckId,
          trackingNumber: `TRK-${Date.now()}`,
          status: 'dispatched',
          origin: tmsAssignment.route.origin,
          destination: tmsAssignment.route.destination,
          weight: 100, // Default weight
          dimensions: '12x12x12'
        }
      })

      // Update workflow metadata
      workflow.metadata.shipment = shipment
      workflow.metadata.dispatchStatus = 'completed'
      workflow.metadata.dispatchTime = new Date()

      console.log(`✅ Truck dispatched for workflow ${workflowId}: ${shipment.trackingNumber}`)

      // Move to next step
      await this.executeStep(workflowId, SupplyChainStep.NFC_DATA_SHARING)

    } catch (error) {
      console.error('Truck dispatch failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }

  /**
   * Step 5: NFC Data Sharing - Share shipment data with truck driver
   */
  private async executeNFCDataSharing(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`📱 Sharing shipment data via NFC for workflow ${workflowId}`)

    try {
      const salesOrder = await prisma.order.findUnique({
        where: { id: workflow.metadata.salesOrderId },
        include: { 
          items: { include: { item: true } },
          customer: true
        }
      })

      const tmsAssignment = workflow.metadata.tmsAssignment as TMSAssignment
      const shipment = workflow.metadata.shipment

      if (!salesOrder || !tmsAssignment || !shipment) {
        throw new Error('Required data not found for NFC sharing')
      }

      // Create NFC shipment data
      const nfcData: NFCShipmentData = {
        shipmentId: shipment.id,
        driverId: tmsAssignment.driverId,
        data: {
          orderNumber: salesOrder.orderNumber,
          customerInfo: {
            name: salesOrder.customer.name,
            address: `${salesOrder.customer.address}, ${salesOrder.customer.city}, ${salesOrder.customer.state} ${salesOrder.customer.zipCode}`,
            phone: salesOrder.customer.phone || '',
            email: salesOrder.customer.email || ''
          },
          items: salesOrder.items.map(item => ({
            sku: item.item.sku,
            description: item.item.name,
            quantity: item.quantity,
            weight: 10, // Default weight per item
            dimensions: '12x8x6'
          })),
          specialInstructions: [
            'Handle with care',
            'Deliver during business hours',
            'Require signature confirmation'
          ],
          documents: {
            packingSlip: `/docs/packing-slip/${shipment.id}.pdf`,
            billOfLading: `/docs/bol/${shipment.id}.pdf`,
            deliveryReceipt: `/docs/delivery-receipt/${shipment.id}.pdf`
          },
          trackingInfo: {
            trackingNumber: shipment.trackingNumber,
            carrier: 'Blue Ship Sync',
            service: 'Standard Ground'
          }
        },
        timestamp: new Date(),
        nfcTagId: `NFC-${Date.now()}`
      }

      // Create NFC tag record
      await prisma.nFCTag.create({
        data: {
          organizationId: workflow.organizationId,
          tagId: nfcData.nfcTagId,
          type: 'SHIPMENT',
          referenceId: shipment.id,
          data: JSON.stringify(nfcData.data),
          isActive: true
        }
      })

      // Update workflow metadata
      workflow.metadata.nfcData = nfcData
      workflow.metadata.nfcShared = true
      workflow.metadata.nfcShareTime = new Date()

      console.log(`✅ NFC data shared for workflow ${workflowId}: ${nfcData.nfcTagId}`)

      // Move to next step
      await this.executeStep(workflowId, SupplyChainStep.DELIVERY_CONFIRMATION)

    } catch (error) {
      console.error('NFC data sharing failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }

  /**
   * Step 6: Delivery Confirmation
   */
  private async executeDeliveryConfirmation(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`📦 Processing delivery confirmation for workflow ${workflowId}`)

    try {
      const shipment = workflow.metadata.shipment

      if (!shipment) {
        throw new Error('Shipment not found')
      }

      // Update shipment status
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          status: 'delivered',
          updatedAt: new Date()
        }
      })

      // Update order status
      await prisma.order.update({
        where: { id: workflow.metadata.salesOrderId },
        data: {
          status: 'delivered',
          updatedAt: new Date()
        }
      })

      // Update workflow metadata
      workflow.metadata.deliveryConfirmed = true
      workflow.metadata.deliveryTime = new Date()

      console.log(`✅ Delivery confirmed for workflow ${workflowId}`)

      // Move to next step
      await this.executeStep(workflowId, SupplyChainStep.POD_CAPTURE)

    } catch (error) {
      console.error('Delivery confirmation failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }

  /**
   * Step 7: POD (Proof of Delivery) Capture
   */
  private async executePODCapture(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`📄 Capturing POD for workflow ${workflowId}`)

    try {
      const shipment = workflow.metadata.shipment
      const nfcData = workflow.metadata.nfcData as NFCShipmentData

      if (!shipment || !nfcData) {
        throw new Error('Required data not found for POD capture')
      }

      // Create POD record
      const podData = {
        shipmentId: shipment.id,
        orderNumber: nfcData.data.orderNumber,
        customerName: nfcData.data.customerInfo.name,
        deliveryAddress: nfcData.data.customerInfo.address,
        deliveryTime: new Date(),
        driverId: nfcData.driverId,
        signature: 'DIGITAL_SIGNATURE_CAPTURED',
        photos: [
          `/pod/photos/${shipment.id}/delivery-1.jpg`,
          `/pod/photos/${shipment.id}/delivery-2.jpg`
        ],
        notes: 'Package delivered successfully. Customer satisfied.',
        status: 'completed'
      }

      // Update workflow metadata
      workflow.metadata.podData = podData
      workflow.metadata.podCaptured = true
      workflow.metadata.podCaptureTime = new Date()

      console.log(`✅ POD captured for workflow ${workflowId}`)

      // Move to final step
      await this.executeStep(workflowId, SupplyChainStep.COMPLETED)

    } catch (error) {
      console.error('POD capture failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }

  /**
   * Step 8: Complete Workflow
   */
  private async executeCompleted(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    console.log(`🎉 Completing workflow ${workflowId}`)

    try {
      // Update workflow status
      workflow.status = 'completed'
      workflow.currentStep = SupplyChainStep.COMPLETED
      workflow.updatedAt = new Date()

      // Emit completion event
      this.emit('workflow:completed', {
        workflowId,
        workflow,
        completedAt: new Date()
      })

      console.log(`✅ Workflow ${workflowId} completed successfully`)

    } catch (error) {
      console.error('Workflow completion failed:', error)
      await this.handleWorkflowError(workflowId, error)
    }
  }

  /**
   * Execute a specific step in the workflow
   */
  private async executeStep(workflowId: string, step: SupplyChainStep): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) throw new Error('Workflow not found')

    workflow.currentStep = step
    workflow.updatedAt = new Date()

    console.log(`🔄 Executing step ${step} for workflow ${workflowId}`)

    switch (step) {
      case SupplyChainStep.PO_TO_SO_CONVERSION:
        await this.executePOToSOConversion(workflowId)
        break
      case SupplyChainStep.WMS_INTEGRATION:
        await this.executeWMSIntegration(workflowId)
        break
      case SupplyChainStep.TMS_SCHEDULING:
        await this.executeTMSScheduling(workflowId)
        break
      case SupplyChainStep.TRUCK_DISPATCH:
        await this.executeTruckDispatch(workflowId)
        break
      case SupplyChainStep.NFC_DATA_SHARING:
        await this.executeNFCDataSharing(workflowId)
        break
      case SupplyChainStep.DELIVERY_CONFIRMATION:
        await this.executeDeliveryConfirmation(workflowId)
        break
      case SupplyChainStep.POD_CAPTURE:
        await this.executePODCapture(workflowId)
        break
      case SupplyChainStep.COMPLETED:
        await this.executeCompleted(workflowId)
        break
      default:
        throw new Error(`Unknown step: ${step}`)
    }
  }

  /**
   * Handle step completion
   */
  private async handleStepCompletion(data: any): Promise<void> {
    console.log(`✅ Step completed:`, data)
  }

  /**
   * Handle workflow errors
   */
  private async handleWorkflowError(workflowId: string, error: any): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (workflow) {
      workflow.status = 'failed'
      workflow.metadata.error = error.message
      workflow.updatedAt = new Date()
    }

    this.emit('workflow:error', {
      workflowId,
      error: error.message,
      step: workflow?.currentStep
    })

    console.error(`❌ Workflow ${workflowId} failed:`, error.message)
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId: string): SupplyChainWorkflowData | null {
    return this.workflows.get(workflowId) || null
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): SupplyChainWorkflowData[] {
    return Array.from(this.workflows.values())
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string, reason: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (workflow) {
      workflow.status = 'failed'
      workflow.metadata.cancellationReason = reason
      workflow.updatedAt = new Date()

      this.emit('workflow:cancelled', {
        workflowId,
        reason,
        cancelledAt: new Date()
      })

      console.log(`🚫 Workflow ${workflowId} cancelled: ${reason}`)
    }
  }
}

// Export singleton instance
export const supplyChainWorkflowEngine = new SupplyChainWorkflowEngine()
