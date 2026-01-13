import { 
  Shipment, 
  CreateShipmentRequest, 
  CreateShipmentResponse,
  RateRequest,
  RateResponse,
  ChooseQuoteRequest,
  ChooseQuoteResponse,
  LabelsRequest,
  LabelsResponse,
  HandshakeConfirmRequest,
  HandshakeConfirmResponse,
  PlanRequest,
  PlanResult,
  TmsError
} from '@/types/tms'

const API_BASE = '/api'

// Shipments API
export async function createShipmentFromOrders(data: CreateShipmentRequest): Promise<CreateShipmentResponse> {
  const response = await fetch(`${API_BASE}/shipments/from-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to create shipment'
    try {
      const errorText = await response.text()
      if (errorText) {
        const error: TmsError = JSON.parse(errorText)
        errorMessage = error.message
      }
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError)
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage)
  }

  const responseText = await response.text()
  if (!responseText) {
    throw new Error('Empty response from server')
  }

  try {
    return JSON.parse(responseText)
  } catch (parseError) {
    console.error('Failed to parse response:', parseError)
    console.error('Response text:', responseText)
    throw new Error('Invalid JSON response from server')
  }
}

export async function listShipments(params?: {
  status?: string
  mode?: string
  order_id?: string
}): Promise<Shipment[]> {
  const url = new URL(`${API_BASE}/shipments`, window.location.origin)
  
  if (params?.status) url.searchParams.set('status', params.status)
  if (params?.mode) url.searchParams.set('mode', params.mode)
  if (params?.order_id) url.searchParams.set('order_id', params.order_id)

  const response = await fetch(url.toString())
  
  if (!response.ok) {
    const error: TmsError = await response.json()
    throw new Error(error.message)
  }

  const data = await response.json()
  // API returns { shipments: [...] }, extract the array
  return data.shipments || []
}

export async function getShipment(shipmentId: string): Promise<Shipment> {
  const response = await fetch(`${API_BASE}/shipments/${shipmentId}`)
  
  if (!response.ok) {
    const error: TmsError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

// Rating API
export async function rateShipment(data: RateRequest): Promise<RateResponse> {
  const response = await fetch(`${API_BASE}/tms/rate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: TmsError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

export async function chooseQuote(data: ChooseQuoteRequest): Promise<ChooseQuoteResponse> {
  const response = await fetch(`${API_BASE}/tms/choose-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: TmsError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

// Labels API
export async function generateLabels(data: LabelsRequest): Promise<LabelsResponse> {
  const response = await fetch(`${API_BASE}/tms/labels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: TmsError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

// Handshake API
export async function confirmHandshake(data: HandshakeConfirmRequest): Promise<HandshakeConfirmResponse> {
  const response = await fetch(`${API_BASE}/handshake/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: TmsError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}

// Load Planning API
export async function createLoadPlan(data: PlanRequest): Promise<PlanResult> {
  const response = await fetch(`${API_BASE}/tms/load-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error: TmsError = await response.json()
    throw new Error(error.message)
  }

  return response.json()
}









































