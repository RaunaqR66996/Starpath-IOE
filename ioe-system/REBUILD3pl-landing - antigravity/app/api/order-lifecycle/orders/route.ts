import { NextRequest, NextResponse } from 'next/server'
import { orderLifecycleService } from '@/lib/services/order-lifecycle-service'
import { OrderLifecycleState } from '@/lib/order-lifecycle/order-lifecycle-manager'

const PHASE_SEQUENCE: Array<OrderLifecycleState['currentPhase']> = [
  'Order Creation',
  'Order Processing',
  'Material Planning',
  'Production Planning',
  'Quality Assurance',
  'Fulfillment',
  'Post-Delivery'
]

const PIPELINE_STAGES = [
  { id: 'erp-received', name: 'ERP Received', phase: 'Order Creation' },
  { id: 'validation', name: 'Order Validation', phase: 'Order Creation' },
  { id: 'inventory-check', name: 'Inventory Check', phase: 'Order Processing' },
  { id: 'warehouse-selection', name: 'Warehouse Selection', phase: 'Material Planning' },
  { id: 'allocation', name: 'Inventory Allocation', phase: 'Material Planning' },
  { id: 'picking', name: 'Picking', phase: 'Production Planning' },
  { id: 'packing', name: 'Packing', phase: 'Production Planning' },
  { id: 'staging', name: 'Staging', phase: 'Quality Assurance' },
  { id: 'shipping', name: 'Shipping', phase: 'Fulfillment' },
  { id: 'tracking', name: 'Tracking', phase: 'Post-Delivery' },
  { id: 'delivery', name: 'Delivery', phase: 'Post-Delivery' }
]

const FALLBACK_ORDERS = [
  {
    orderId: 'ord-001',
    orderNumber: 'ORD-2024-001',
    customerName: 'Acme Corporation',
    currentStage: 'inventory-check',
    progress: 25,
    estimatedCompletion: '2024-01-16T14:30:00Z',
    priority: 'high',
    value: 15420.5,
    items: 12,
    warehouse: 'warehouse-001',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:15:00Z',
    stageDetails: {
      startedAt: '2024-01-15T14:10:00Z',
      estimatedDuration: '2 hours',
      assignedTo: 'System',
      notes: 'Checking inventory across all zones'
    }
  }
]

const phaseIndex = (phase: OrderLifecycleState['currentPhase']) =>
  Math.max(PHASE_SEQUENCE.indexOf(phase), 0)

const computeStageStatus = (
  stagePhase: OrderLifecycleState['currentPhase'],
  state: OrderLifecycleState
) => {
  const stagePhaseIdx = phaseIndex(stagePhase)
  const currentIdx = phaseIndex(state.currentPhase)

  if (stagePhaseIdx < currentIdx) return 'completed'
  if (stagePhaseIdx === currentIdx) {
    if (state.blockers.length > 0) return 'blocked'
    if (state.phaseStatus === 'completed') return 'completed'
    if (state.phaseStatus === 'failed') return 'error'
    return 'in-progress'
  }

  return 'pending'
}

const minutesBetween = (start?: Date, end?: Date) => {
  if (!start || !end) return null
  return Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 1)
}

const serializeLifecycle = (state: OrderLifecycleState) => {
  const stage = PIPELINE_STAGES.find(s => s.phase === state.currentPhase) || PIPELINE_STAGES[0]
  const phaseIdx = phaseIndex(state.currentPhase)
  const progress = Math.round(((phaseIdx + (state.phaseStatus === 'completed' ? 1 : 0.5)) / PHASE_SEQUENCE.length) * 100)
  const durationMinutes = minutesBetween(state.startTime, state.estimatedCompletion)

  const erpData = {
    source: (state.phaseData?.erpSource as string) || 'ERP Connector',
    orderId: state.orderDetails.externalId || state.orderDetails.orderNumber,
    receivedAt: state.startTime,
    customerId: state.phaseData?.customerId || state.orderDetails.orderNumber,
    totalAmount: state.orderDetails.totalValue || 0,
    currency: state.phaseData?.currency || 'USD',
    paymentTerms: state.phaseData?.paymentTerms || 'Net 30',
    shippingAddress: state.phaseData?.shippingAddress || {
      street: '123 Logistics Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA'
    }
  }

  const inventoryImpact = {
    affectedZones: state.phaseData?.affectedZones || ['Zone A'],
    affectedBins: state.phaseData?.affectedBins || 3,
    totalItems: state.orderDetails.totalItems || 0,
    stockReserved: state.phaseData?.stockReserved ?? true,
    allocationStatus: state.phaseStatus,
    pickLocations: state.phaseData?.pickLocations || [
      { zone: 'Zone A', aisle: 'A1', bay: '01', shelf: '01', bin: '01', item: state.orderDetails.orderNumber, qty: 1 }
    ]
  }

  return {
    orderId: state.orderId,
    orderNumber: state.orderDetails.orderNumber,
    customerName: state.orderDetails.customerName || 'Customer',
    currentStage: stage.id,
    progress: Math.min(progress, 100),
    estimatedCompletion: state.estimatedCompletion,
    priority: state.orderDetails.priority,
    value: state.orderDetails.totalValue || 0,
    items: state.orderDetails.totalItems || 0,
    warehouse: state.orderDetails.warehouse || 'unassigned',
    createdAt: state.startTime,
    updatedAt: state.actualCompletion || state.startTime,
    stageDetails: {
      startedAt: state.startTime,
      estimatedDuration: durationMinutes ? `${durationMinutes} minutes` : 'N/A',
      assignedTo: state.assignedTeam[0] || 'System',
      notes: state.phaseHistory.at(-1)?.notes || ''
    },
    processingStages: PIPELINE_STAGES.map(stageDefinition => {
      const status = computeStageStatus(stageDefinition.phase as OrderLifecycleState['currentPhase'], state)
      return {
        id: stageDefinition.id,
        name: stageDefinition.name,
        status,
        progress: status === 'completed' ? 100 : status === 'in-progress' ? 60 : 0,
        estimatedDuration: state.phaseData?.estimatedDuration,
        notes: stageDefinition.phase === state.currentPhase ? state.phaseHistory.at(-1)?.notes : undefined
      }
    }),
    realTimeUpdates: state.phaseHistory.slice(-5).map(entry => ({
      timestamp: entry.timestamp,
      type: entry.status,
      message: `${entry.phase} ${entry.status.replace('_', ' ')}`,
      stage: stage.id,
      severity: entry.status === 'failed' ? 'error' : entry.status === 'in_progress' ? 'info' : 'success'
    })),
    erpData,
    inventoryImpact
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stageFilter = searchParams.get('stage')
    const priorityFilter = searchParams.get('priority')
    const warehouseFilter = searchParams.get('warehouse')
    const organizationId = searchParams.get('organizationId') || 'default-org'

    const lifecycles = await orderLifecycleService.listLifecycles(organizationId)
    let orders = lifecycles.map(serializeLifecycle)

    if (stageFilter) {
      orders = orders.filter(order => order.currentStage === stageFilter)
    }
    if (priorityFilter) {
      orders = orders.filter(order => order.priority === priorityFilter)
    }
    if (warehouseFilter) {
      orders = orders.filter(order => order.warehouse === warehouseFilter)
    }

    if (!orders.length) {
      return NextResponse.json(FALLBACK_ORDERS)
    }

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch order lifecycle orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order lifecycle orders' },
      { status: 500 }
    )
  }
}











