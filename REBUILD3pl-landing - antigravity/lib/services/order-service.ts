import { Order, OrderStatus } from "@/types/order"
import { logger } from "@/lib/obs/logger"

type OrderStore = Map<string, Order>

class InMemoryOrderService {
  private store: OrderStore = new Map()

  constructor(seed?: Order[]) {
    seed?.forEach((o) => this.store.set(o.id, o))
  }

  list(): Order[] {
    return Array.from(this.store.values()).sort((a, b) => (
      (b.createdAt as any) - (a.createdAt as any)
    ))
  }

  get(id: string): Order | undefined {
    return this.store.get(id)
  }

  upsert(order: Order): Order {
    const now = new Date()
    const isNew = !this.store.has(order.id)
    
    if (!order.createdAt) order.createdAt = now
    order.updatedAt = now
    this.store.set(order.id, order)
    
    if (isNew) {
      logger.orderCreated(order.id, order.customerId, {
        orderNumber: order.orderNumber,
        status: order.status,
        priority: order.priority
      })
    }
    
    return order
  }

  updateStatus(id: string, status: OrderStatus): Order | undefined {
    const existing = this.store.get(id)
    if (!existing) return undefined
    
    const previousStatus = existing.status
    existing.status = status
    existing.updatedAt = new Date()
    this.store.set(id, existing)
    
    logger.orderStatusChanged(id, previousStatus, status, {
      orderNumber: existing.orderNumber
    })
    
    return existing
  }

  // naive rollup: considers line inventory status to infer fulfillment %
  rollup(id: string): { fulfilledPct: number; shipped: boolean } | undefined {
    const order = this.store.get(id)
    if (!order || order.orderLines.length === 0) return undefined
    const total = order.orderLines.reduce((acc, l) => acc + l.quantity, 0)
    const fulfilled = order.orderLines.reduce((acc, l) => {
      const alloc = l.inventory.allocatedQuantity || 0
      return acc + Math.min(alloc, l.quantity)
    }, 0)
    const fulfilledPct = Math.round((fulfilled / total) * 100)
    const shipped = order.status === 'shipped' || order.status === 'delivered'
    return { fulfilledPct, shipped }
  }
}

// Singleton instance with lazy seed (caller can import and seed once)
export const orderService = new InMemoryOrderService()

// helper to seed demo orders
export function seedOrders(orders: Order[]) {
  orders.forEach((o) => orderService.upsert(o))
}


