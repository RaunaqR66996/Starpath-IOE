// WMS Staging Area Types for Order Tracking & TMS Handoff

/**
 * Staging area status tracking order lifecycle
 */
export type StagingStatus = 'EMPTY' | 'FILLING' | 'READY' | 'DISPATCHED'

/**
 * Order types that can be staged
 */
export type OrderType = 'PO' | 'SO'  // Purchase Order (inbound) or Sales Order (outbound)

/**
 * Staging allocation for a single order within a staging lane
 */
export interface StagingAllocation {
  orderId: string
  orderNumber: string
  orderType: OrderType
  customerCode?: string  // For SO
  supplierCode?: string  // For PO
  requiredPallets: number
  allocatedPallets: number  // Space reserved in the lane
  filledPallets: number     // Actual pallets placed
  status: StagingStatus
  allocatedAt: Date
  completedAt?: Date
  assignedLane: string  // Reference to staging lane ID
  spaceStart: number    // Starting position in lane (0-100%)
  spaceEnd: number      // Ending position in lane (0-100%)
  lineItems: StagingLineItem[]
}

/**
 * Line item details for a staged order
 */
export interface StagingLineItem {
  lineId: string
  sku: string
  itemName: string
  qty: number
  qtyFilled: number
  uom: string
  palletCount: number
}

/**
 * Staging area/lane with multi-order support
 */
export interface StagingArea {
  id: string
  warehouseId: string
  name: string
  // 3D position in warehouse
  x: number
  y: number
  z: number
  length: number
  width: number
  height: number
  // Capacity and utilization
  maxCapacity: number  // Total pallets the lane can hold
  currentCapacity: number  // Currently filled pallets
  utilizationPercentage: number
  // Dock door association
  dockDoorId?: string
  // Order allocations
  orders: StagingAllocation[]
  status: StagingStatus
  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * TMS handoff response
 */
export interface TMSHandoffResult {
  success: boolean
  shipmentId?: string
  carrierId?: string
  carrierName?: string
  trackingNumber?: string
  eta?: Date
  bolNumber?: string
  error?: string
}

/**
 * Space allocation calculation result
 */
export interface AllocationResult {
  success: boolean
  stagingAreaId: string
  allocatedSpace: number  // Percentage of lane (0-100)
  spaceStart: number
  spaceEnd: number
  warning?: string  // If space is tight or over capacity
}

/**
 * Staging update event for real-time notifications
 */
export interface StagingEvent {
  type: 'ORDER_ALLOCATED' | 'PALLET_ADDED' | 'STAGING_COMPLETE' | 'TMS_HANDOFF' | 'ERROR'
  stagingAreaId: string
  orderId?: string
  orderNumber?: string
  timestamp: Date
  details?: Record<string, unknown>
}

/**
 * Extended staging data for visualization
 */
export interface StagingVisualData extends StagingArea {
  color: string  // Visual color based on status
  opacity: number
  isHighlighted: boolean
  displayLabel: string
}

