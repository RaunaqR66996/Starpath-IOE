/**
 * AI/ML Service Client for TMS/WMS
 * Enterprise AI/ML integration for predictive analytics and optimization
 * 
 * Features:
 * - Demand forecasting
 * - Route optimization
 * - Inventory optimization
 * - Warehouse slotting optimization
 * - Anomaly detection
 * - Computer vision integration
 * - Real-time ML inference
 */

export interface DemandForecastRequest {
  sku: string
  warehouse: string
  horizon: number // days
  historical_data: {
    date: string
    demand: number
    price?: number
    promotions?: boolean
    weather?: any
    holidays?: boolean
  }[]
  external_factors?: {
    seasonality?: boolean
    trend?: boolean
    events?: any[]
  }
}

export interface DemandForecastResponse {
  sku: string
  forecast: {
    date: string
    predicted_demand: number
    confidence_interval: {
      lower: number
      upper: number
    }
    confidence_score: number
  }[]
  model_metadata: {
    model_type: string
    accuracy: number
    mae: number
    rmse: number
    training_date: string
  }
}

export interface RouteOptimizationRequest {
  origin: {
    lat: number
    lng: number
    address: string
  }
  destinations: Array<{
    id: string
    lat: number
    lng: number
    address: string
    time_window?: {
      start: string
      end: string
    }
    service_time?: number // minutes
    priority?: number
  }>
  vehicle_constraints: {
    capacity: number
    max_distance?: number
    max_duration?: number
    start_time?: string
    end_time?: string
  }
  optimization_objective: 'minimize_distance' | 'minimize_time' | 'minimize_cost' | 'maximize_deliveries'
  traffic_data?: boolean
  weather_data?: boolean
}

export interface RouteOptimizationResponse {
  optimized_route: {
    total_distance: number
    total_duration: number
    total_cost: number
    stops: Array<{
      sequence: number
      destination_id: string
      arrival_time: string
      departure_time: string
      distance_from_previous: number
      duration_from_previous: number
    }>
  }
  alternative_routes?: any[]
  optimization_metrics: {
    distance_saved: number
    time_saved: number
    cost_saved: number
    efficiency_score: number
  }
  model_metadata: {
    algorithm: string
    computation_time: number
    iterations: number
  }
}

export interface InventoryOptimizationRequest {
  sku: string
  warehouse: string
  historical_demand: number[]
  lead_time_days: number
  holding_cost_per_unit: number
  stockout_cost_per_unit: number
  order_cost: number
  service_level: number // 0-1
  demand_variability: number
}

export interface InventoryOptimizationResponse {
  sku: string
  warehouse: string
  recommendations: {
    reorder_point: number
    order_quantity: number
    safety_stock: number
    max_stock_level: number
    min_stock_level: number
  }
  cost_analysis: {
    holding_cost: number
    ordering_cost: number
    stockout_cost: number
    total_cost: number
    potential_savings: number
  }
  service_level_achieved: number
}

export interface WarehouseSlottingRequest {
  warehouse_id: string
  items: Array<{
    sku: string
    dimensions: {
      length: number
      width: number
      height: number
      weight: number
    }
    pick_frequency: number
    storage_requirements?: string[]
  }>
  available_locations: Array<{
    location_id: string
    zone: string
    aisle: string
    bay: string
    level: string
    dimensions: {
      length: number
      width: number
      height: number
    }
    constraints?: string[]
  }>
  optimization_criteria: {
    minimize_travel_distance: boolean
    abc_classification: boolean
    product_affinity: boolean
    ergonomics: boolean
  }
}

export interface WarehouseSlottingResponse {
  warehouse_id: string
  optimized_assignments: Array<{
    sku: string
    assigned_location: string
    zone: string
    rationale: string
    pick_efficiency_score: number
  }>
  metrics: {
    average_pick_distance: number
    pick_density: number
    space_utilization: number
    improvement_vs_current: number
  }
}

export interface AnomalyDetectionRequest {
  data_type: 'inventory' | 'orders' | 'shipments' | 'warehouse_operations'
  time_series_data: Array<{
    timestamp: string
    value: number
    metadata?: any
  }>
  sensitivity: number // 0-1
  anomaly_types: ('spike' | 'drop' | 'trend_change' | 'seasonality_break')[]
}

export interface AnomalyDetectionResponse {
  anomalies: Array<{
    timestamp: string
    value: number
    anomaly_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    confidence_score: number
    explanation: string
    recommended_action?: string
  }>
  overall_health_score: number
  model_metadata: {
    algorithm: string
    detection_accuracy: number
  }
}

export interface ComputerVisionRequest {
  image_url: string
  task: 'damage_detection' | 'barcode_reading' | 'pallet_counting' | 'quality_inspection' | 'dimensional_measurement'
  confidence_threshold?: number
}

export interface ComputerVisionResponse {
  task: string
  results: {
    detected_objects?: Array<{
      class: string
      confidence: number
      bounding_box: {
        x: number
        y: number
        width: number
        height: number
      }
    }>
    damage_detected?: boolean
    damage_type?: string
    damage_severity?: string
    barcode_value?: string
    pallet_count?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    quality_score?: number
    pass_fail?: 'pass' | 'fail'
  }
  confidence_score: number
  processing_time_ms: number
}

/**
 * AI/ML Service Client
 */
export class MLServiceClient {
  private baseUrl: string
  private apiKey: string
  private timeout: number
  
  constructor(config: {
    baseUrl?: string
    apiKey?: string
    timeout?: number
  } = {}) {
    this.baseUrl = config.baseUrl || process.env.ML_SERVICE_URL || 'http://localhost:8000'
    this.apiKey = config.apiKey || process.env.ML_SERVICE_API_KEY || ''
    this.timeout = config.timeout || 30000
  }
  
  /**
   * Demand Forecasting
   */
  async forecastDemand(request: DemandForecastRequest): Promise<DemandForecastResponse> {
    return this.makeRequest<DemandForecastResponse>('/ml/forecast/demand', request)
  }
  
  /**
   * Route Optimization
   */
  async optimizeRoute(request: RouteOptimizationRequest): Promise<RouteOptimizationResponse> {
    return this.makeRequest<RouteOptimizationResponse>('/ml/optimize/route', request)
  }
  
  /**
   * Inventory Optimization
   */
  async optimizeInventory(request: InventoryOptimizationRequest): Promise<InventoryOptimizationResponse> {
    return this.makeRequest<InventoryOptimizationResponse>('/ml/optimize/inventory', request)
  }
  
  /**
   * Warehouse Slotting Optimization
   */
  async optimizeWarehouseSlotting(request: WarehouseSlottingRequest): Promise<WarehouseSlottingResponse> {
    return this.makeRequest<WarehouseSlottingResponse>('/ml/optimize/warehouse-slotting', request)
  }
  
  /**
   * Anomaly Detection
   */
  async detectAnomalies(request: AnomalyDetectionRequest): Promise<AnomalyDetectionResponse> {
    return this.makeRequest<AnomalyDetectionResponse>('/ml/detect/anomaly', request)
  }
  
  /**
   * Computer Vision
   */
  async processImage(request: ComputerVisionRequest): Promise<ComputerVisionResponse> {
    return this.makeRequest<ComputerVisionResponse>('/ml/vision/analyze', request)
  }
  
  /**
   * Batch prediction for high throughput
   */
  async batchPredict<T, R>(
    endpoint: string,
    requests: T[]
  ): Promise<R[]> {
    return this.makeRequest<R[]>(`${endpoint}/batch`, { requests })
  }
  
  /**
   * Get model metadata
   */
  async getModelMetadata(modelName: string): Promise<any> {
    return this.makeRequest<any>(`/ml/models/${modelName}/metadata`, {}, 'GET')
  }
  
  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; models: string[] }> {
    return this.makeRequest<any>('/health', {}, 'GET')
  }
  
  /**
   * Make HTTP request to ML service
   */
  private async makeRequest<T>(
    endpoint: string,
    data: any = {},
    method: 'GET' | 'POST' = 'POST'
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-Request-ID': this.generateRequestId()
        },
        signal: controller.signal
      }
      
      if (method === 'POST') {
        options.body = JSON.stringify(data)
      }
      
      const response = await fetch(url, options)
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`ML Service error: ${error.message || response.statusText}`)
      }
      
      return response.json()
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error(`ML Service request timeout after ${this.timeout}ms`)
      }
      
      console.error('ML Service error:', error)
      throw error
    }
  }
  
  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `ml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Singleton instance
 */
let mlServiceClient: MLServiceClient | null = null

export function getMLServiceClient(config?: {
  baseUrl?: string
  apiKey?: string
  timeout?: number
}): MLServiceClient {
  if (!mlServiceClient) {
    mlServiceClient = new MLServiceClient(config)
  }
  return mlServiceClient
}

export default MLServiceClient










