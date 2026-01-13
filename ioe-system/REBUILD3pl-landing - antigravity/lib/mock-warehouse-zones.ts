import { StagingZone, ZoneState, ZoneOrder } from '@/types/warehouse-zones'

// Mock staging zones positioned in southeast area of warehouse
export const mockStagingZones: StagingZone[] = [
  {
    id: 'zone-1',
    name: 'Staging Zone A',
    x: 80,
    y: 0,
    z: 50,
    length: 8,
    width: 6,
    height: 0.2,
    maxCapacity: 20,
    currentCapacity: 0,
    state: 'idle',
    orders: [],
    dockDoorId: 'dock-1',
    utilizationPercentage: 0
  },
  {
    id: 'zone-2',
    name: 'Staging Zone B',
    x: 90,
    y: 0,
    z: 50,
    length: 8,
    width: 6,
    height: 0.2,
    maxCapacity: 20,
    currentCapacity: 0,
    state: 'idle',
    orders: [],
    dockDoorId: 'dock-2',
    utilizationPercentage: 0
  },
  {
    id: 'zone-3',
    name: 'Staging Zone C',
    x: 100,
    y: 0,
    z: 50,
    length: 8,
    width: 6,
    height: 0.2,
    maxCapacity: 20,
    currentCapacity: 0,
    state: 'idle',
    orders: [],
    dockDoorId: 'dock-3',
    utilizationPercentage: 0
  },
  {
    id: 'zone-4',
    name: 'Staging Zone D',
    x: 80,
    y: 0,
    z: 60,
    length: 8,
    width: 6,
    height: 0.2,
    maxCapacity: 20,
    currentCapacity: 0,
    state: 'idle',
    orders: [],
    dockDoorId: 'dock-1',
    utilizationPercentage: 0
  },
  {
    id: 'zone-5',
    name: 'Staging Zone E',
    x: 90,
    y: 0,
    z: 60,
    length: 8,
    width: 6,
    height: 0.2,
    maxCapacity: 20,
    currentCapacity: 0,
    state: 'idle',
    orders: [],
    dockDoorId: 'dock-2',
    utilizationPercentage: 0
  },
  {
    id: 'zone-6',
    name: 'Staging Zone F',
    x: 100,
    y: 0,
    z: 60,
    length: 8,
    width: 6,
    height: 0.2,
    maxCapacity: 20,
    currentCapacity: 0,
    state: 'idle',
    orders: [],
    dockDoorId: 'dock-3',
    utilizationPercentage: 0
  }
]

// Mock orders for demonstration
export const mockOrders: ZoneOrder[] = [
  {
    id: 'order-1',
    orderRef: 'ORD-2024-001',
    palletCount: 8,
    maxPallets: 20,
    status: 'loading',
    eta: '2:30 PM',
    priority: 'high'
  },
  {
    id: 'order-2',
    orderRef: 'ORD-2024-002',
    palletCount: 12,
    maxPallets: 20,
    status: 'pending',
    eta: '4:15 PM',
    priority: 'medium'
  },
  {
    id: 'order-3',
    orderRef: 'ORD-2024-003',
    palletCount: 15,
    maxPallets: 20,
    status: 'loaded',
    eta: '1:45 PM',
    priority: 'low'
  },
  {
    id: 'order-4',
    orderRef: 'ORD-2024-004',
    palletCount: 6,
    maxPallets: 20,
    status: 'pending',
    eta: '5:00 PM',
    priority: 'high'
  }
]

// Function to assign orders to zones (for demonstration)
export function assignOrderToZone(zoneId: string, orderId: string): StagingZone[] {
  return mockStagingZones.map(zone => {
    if (zone.id === zoneId) {
      const order = mockOrders.find(o => o.id === orderId)
      if (order) {
        const updatedOrders = [...zone.orders, order]
        const totalPallets = updatedOrders.reduce((sum, o) => sum + o.palletCount, 0)
        const utilizationPercentage = (totalPallets / zone.maxCapacity) * 100
        
        // Determine zone state based on utilization and orders
        let state: ZoneState = 'idle'
        if (updatedOrders.length > 0) {
          if (utilizationPercentage > 100) {
            state = 'over-capacity'
          } else if (updatedOrders.some(o => o.status === 'loading')) {
            state = 'active'
          } else if (updatedOrders.some(o => o.status === 'loaded')) {
            state = 'released'
          } else {
            state = 'reserved'
          }
        }

        return {
          ...zone,
          orders: updatedOrders,
          currentCapacity: totalPallets,
          utilizationPercentage,
          state
        }
      }
    }
    return zone
  })
}

// Function to unassign order from zone
export function unassignOrderFromZone(zoneId: string, orderId: string): StagingZone[] {
  return mockStagingZones.map(zone => {
    if (zone.id === zoneId) {
      const updatedOrders = zone.orders.filter(o => o.id !== orderId)
      const totalPallets = updatedOrders.reduce((sum, o) => sum + o.palletCount, 0)
      const utilizationPercentage = (totalPallets / zone.maxCapacity) * 100
      
      // Determine zone state
      let state: ZoneState = 'idle'
      if (updatedOrders.length > 0) {
        if (utilizationPercentage > 100) {
          state = 'over-capacity'
        } else if (updatedOrders.some(o => o.status === 'loading')) {
          state = 'active'
        } else if (updatedOrders.some(o => o.status === 'loaded')) {
          state = 'released'
        } else {
          state = 'reserved'
        }
      }

      return {
        ...zone,
        orders: updatedOrders,
        currentCapacity: totalPallets,
        utilizationPercentage,
        state
      }
    }
    return zone
  })
}

// Function to update order status
export function updateOrderStatus(zoneId: string, orderId: string, status: ZoneOrder['status']): StagingZone[] {
  return mockStagingZones.map(zone => {
    if (zone.id === zoneId) {
      const updatedOrders = zone.orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
      
      // Recalculate zone state based on updated orders
      const totalPallets = updatedOrders.reduce((sum, o) => sum + o.palletCount, 0)
      const utilizationPercentage = (totalPallets / zone.maxCapacity) * 100
      
      let state: ZoneState = 'idle'
      if (updatedOrders.length > 0) {
        if (utilizationPercentage > 100) {
          state = 'over-capacity'
        } else if (updatedOrders.some(o => o.status === 'loading')) {
          state = 'active'
        } else if (updatedOrders.some(o => o.status === 'loaded')) {
          state = 'released'
        } else {
          state = 'reserved'
        }
      }

      return {
        ...zone,
        orders: updatedOrders,
        currentCapacity: totalPallets,
        utilizationPercentage,
        state
      }
    }
    return zone
  })
}
