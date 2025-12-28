import { create } from 'zustand'
import { 
  StagingArea, 
  StagingAllocation, 
  StagingStatus, 
  OrderType,
  AllocationResult,
  TMSHandoffResult 
} from '@/lib/types/staging'

interface StagingStore {
  // State
  stagingAreas: Map<string, StagingArea>  // warehouseId -> staging areas
  selectedStagingAreaId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions - Allocation & Management
  initializeStagingAreas: (warehouseId: string, areas: StagingArea[]) => void
  allocateOrderToStaging: (
    warehouseId: string,
    orderId: string,
    orderNumber: string,
    orderType: OrderType,
    requiredPallets: number,
    lineItems: any[],
    customerCode?: string,
    supplierCode?: string
  ) => AllocationResult | null
  
  // Actions - Updates
  updateStagingProgress: (stagingAreaId: string, orderId: string, palletsFilled: number) => void
  markStagingComplete: (stagingAreaId: string, orderId: string) => void
  handoffToTMS: (stagingAreaId: string, orderId: string) => Promise<TMSHandoffResult>
  
  // Actions - Selection
  selectStagingArea: (areaId: string | null) => void
  
  // Computed getters
  getStagingAreasByWarehouse: (warehouseId: string) => StagingArea[]
  getStagingAreaById: (areaId: string) => StagingArea | null
  getOrderById: (orderId: string) => StagingAllocation | null
  
  // Internal helpers
  _calculateSpaceAllocation: (
    existingAllocations: StagingAllocation[],
    requiredPallets: number,
    laneCapacity: number
  ) => AllocationResult
  _determineStagingStatus: (area: StagingArea) => StagingStatus
  _recalculateStagingMetrics: (area: StagingArea) => StagingArea
}

export const useStagingStore = create<StagingStore>((set, get) => ({
  // Initial state
  stagingAreas: new Map(),
  selectedStagingAreaId: null,
  isLoading: false,
  error: null,
  
  // Initialize staging areas for a warehouse
  initializeStagingAreas: (warehouseId, areas) => {
    set((state) => {
      const newMap = new Map(state.stagingAreas)
      areas.forEach(area => {
        area.warehouseId = warehouseId
        newMap.set(area.id, area)
      })
      return { stagingAreas: newMap }
    })
  },
  
  // Allocate order to staging area (space allocation algorithm)
  allocateOrderToStaging: (warehouseId, orderId, orderNumber, orderType, requiredPallets, lineItems, customerCode, supplierCode) => {
    const state = get()
    const areas = state.getStagingAreasByWarehouse(warehouseId)
    
    // Try to find a suitable staging area
    for (const area of areas) {
      // Calculate available space
      const usedCapacity = area.currentCapacity
      const availableCapacity = area.maxCapacity - usedCapacity
      
      // Check if there's enough space
      if (availableCapacity >= requiredPallets) {
        // Calculate allocation within this lane
        const allocation = state._calculateSpaceAllocation(
          area.orders,
          requiredPallets,
          area.maxCapacity
        )
        
        if (allocation.success) {
          // Create new allocation
          const newAllocation: StagingAllocation = {
            orderId,
            orderNumber,
            orderType,
            customerCode,
            supplierCode,
            requiredPallets,
            allocatedPallets: requiredPallets,
            filledPallets: 0,
            status: 'FILLING',
            allocatedAt: new Date(),
            assignedLane: area.id,
            spaceStart: allocation.spaceStart,
            spaceEnd: allocation.spaceEnd,
            lineItems: lineItems.map((item, idx) => ({
              lineId: `line-${idx + 1}`,
              sku: item.sku || item.itemSku || '',
              itemName: item.name || item.description || '',
              qty: item.qty || item.quantity || 0,
              qtyFilled: 0,
              uom: item.uom || 'EA',
              palletCount: Math.ceil((item.qty || item.quantity || 0) / (item.palletQuantity || 100))
            }))
          }
          
          // Update staging area
          set((state) => {
            const newMap = new Map(state.stagingAreas)
            const area = newMap.get(newAllocation.assignedLane)
            if (area) {
              const updatedArea = {
                ...area,
                orders: [...area.orders, newAllocation],
                currentCapacity: area.currentCapacity + requiredPallets
              }
              const recalculated = state._recalculateStagingMetrics(updatedArea)
              newMap.set(area.id, recalculated)
            }
            return { stagingAreas: newMap }
          })
          
          return {
            ...allocation,
            stagingAreaId: area.id
          }
        }
      }
    }
    
    // No suitable staging area found
    return null
  },
  
  // Update staging fill progress
  updateStagingProgress: (stagingAreaId, orderId, palletsFilled) => {
    set((state) => {
      const newMap = new Map(state.stagingAreas)
      const area = newMap.get(stagingAreaId)
      
      if (area) {
        const updatedOrders = area.orders.map(order => {
          if (order.orderId === orderId) {
            const updatedFilled = Math.min(palletsFilled, order.allocatedPallets)
            return {
              ...order,
              filledPallets: updatedFilled,
              status: updatedFilled >= order.allocatedPallets ? 'READY' : 'FILLING' as StagingStatus
            }
          }
          return order
        })
        
        const updatedArea = {
          ...area,
          orders: updatedOrders,
          currentCapacity: updatedOrders.reduce((sum, o) => sum + Math.max(o.filledPallets, o.allocatedPallets), 0)
        }
        
        const recalculated = state._recalculateStagingMetrics(updatedArea)
        newMap.set(stagingAreaId, recalculated)
      }
      
      return { stagingAreas: newMap }
    })
  },
  
  // Mark staging complete
  markStagingComplete: (stagingAreaId, orderId) => {
    set((state) => {
      const newMap = new Map(state.stagingAreas)
      const area = newMap.get(stagingAreaId)
      
      if (area) {
        const updatedOrders = area.orders.map(order => {
          if (order.orderId === orderId) {
            return {
              ...order,
              status: 'READY' as StagingStatus,
              completedAt: new Date()
            }
          }
          return order
        })
        
        const updatedArea = {
          ...area,
          orders: updatedOrders
        }
        
        const recalculated = state._recalculateStagingMetrics(updatedArea)
        newMap.set(stagingAreaId, recalculated)
      }
      
      return { stagingAreas: newMap }
    })
  },
  
  // Handoff to TMS
  handoffToTMS: async (stagingAreaId, orderId) => {
    const state = get()
    const area = state.getStagingAreaById(stagingAreaId)
    const allocation = area?.orders.find(o => o.orderId === orderId)
    
    if (!allocation || allocation.status !== 'READY') {
      return {
        success: false,
        error: 'Order is not ready for TMS handoff'
      }
    }
    
    try {
      // Call TMS handoff API
      const response = await fetch(`/api/wms/staging/${stagingAreaId}/handoff-tms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      
      const result = await response.json() as TMSHandoffResult
      
      if (result.success) {
        // Update staging area status to DISPATCHED
        set((state) => {
          const newMap = new Map(state.stagingAreas)
          const area = newMap.get(stagingAreaId)
          
          if (area) {
            const updatedOrders = area.orders.map(order => 
              order.orderId === orderId
                ? { ...order, status: 'DISPATCHED' as StagingStatus }
                : order
            )
            
            // Remove dispatched orders after a delay (in real scenario)
            // For now, keep them but mark as dispatched
            
            const updatedArea = {
              ...area,
              orders: updatedOrders
            }
            
            const recalculated = state._recalculateStagingMetrics(updatedArea)
            newMap.set(stagingAreaId, recalculated)
          }
          
          return { stagingAreas: newMap }
        })
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'TMS handoff failed'
      }
    }
  },
  
  // Selection
  selectStagingArea: (areaId) => {
    set({ selectedStagingAreaId: areaId })
  },
  
  // Getters
  getStagingAreasByWarehouse: (warehouseId) => {
    const state = get()
    return Array.from(state.stagingAreas.values())
      .filter(area => area.warehouseId === warehouseId)
  },
  
  getStagingAreaById: (areaId) => {
    const state = get()
    return state.stagingAreas.get(areaId) || null
  },
  
  getOrderById: (orderId) => {
    const state = get()
    for (const area of state.stagingAreas.values()) {
      const order = area.orders.find(o => o.orderId === orderId)
      if (order) return order
    }
    return null
  },
  
  // Internal helper: Calculate space allocation within a lane
  _calculateSpaceAllocation: (existingAllocations, requiredPallets, laneCapacity) => {
    // If no existing allocations, use from start
    if (existingAllocations.length === 0) {
      const percentage = (requiredPallets / laneCapacity) * 100
      return {
        success: true,
        stagingAreaId: '',
        allocatedSpace: percentage,
        spaceStart: 0,
        spaceEnd: percentage
      }
    }
    
    // Find gaps between existing allocations
    // For simplicity, we'll just add after the last allocation
    const sortedAllocs = [...existingAllocations].sort((a, b) => a.spaceStart - b.spaceStart)
    const lastAlloc = sortedAllocs[sortedAllocs.length - 1]
    
    const spaceStart = lastAlloc.spaceEnd
    const allocatedSpace = (requiredPallets / laneCapacity) * 100
    const spaceEnd = spaceStart + allocatedSpace
    
    // Check if we exceed 100%
    if (spaceEnd > 100) {
      return {
        success: false,
        stagingAreaId: '',
        allocatedSpace: 0,
        spaceStart: 0,
        spaceEnd: 0,
        warning: 'Insufficient space in staging lane'
      }
    }
    
    return {
      success: true,
      stagingAreaId: '',
      allocatedSpace,
      spaceStart,
      spaceEnd
    }
  },
  
  // Internal helper: Determine overall staging area status
  _determineStagingStatus: (area) => {
    if (area.orders.length === 0) return 'EMPTY'
    
    const hasReady = area.orders.some(o => o.status === 'READY')
    const hasFilling = area.orders.some(o => o.status === 'FILLING')
    const hasDispatched = area.orders.some(o => o.status === 'DISPATCHED')
    
    if (hasReady) return 'READY'
    if (hasFilling) return 'FILLING'
    if (hasDispatched) return 'DISPATCHED'
    
    return 'EMPTY'
  },
  
  // Internal helper: Recalculate staging metrics
  _recalculateStagingMetrics: (area) => {
    const utilization = (area.currentCapacity / area.maxCapacity) * 100
    const status = get()._determineStagingStatus(area)
    
    return {
      ...area,
      utilizationPercentage: utilization,
      status,
      updatedAt: new Date()
    }
  }
}))

