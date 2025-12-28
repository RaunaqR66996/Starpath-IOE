import { OrderDTO, CreateOrderRequest, AllocateOrderResponse, ApiError, OrderStatus } from '@/types/api'

const API_BASE = '/api'

// GET /api/orders?status=
export async function listOrders(status?: OrderStatus): Promise<OrderDTO[]> {
  const url = new URL(`${API_BASE}/orders`, window.location.origin)
  if (status) {
    url.searchParams.set('status', status)
  }

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

// POST /api/orders
export async function createOrder(data: CreateOrderRequest): Promise<OrderDTO> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

// POST /api/orders/[id]/allocate
export async function allocateOrder(orderId: string): Promise<AllocateOrderResponse> {
  const response = await fetch(`${API_BASE}/orders/${orderId}/allocate`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}








































































