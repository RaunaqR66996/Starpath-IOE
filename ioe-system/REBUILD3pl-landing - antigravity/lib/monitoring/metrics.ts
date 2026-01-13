/**
 * Prometheus Metrics Collection
 * Exposes application metrics for monitoring
 */

interface MetricValue {
  value: number
  labels?: Record<string, string>
  timestamp: Date
}

class MetricsCollector {
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()
  private histograms: Map<string, number[]> = new Map()

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels)
    this.counters.set(key, (this.counters.get(key) || 0) + value)
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels)
    this.gauges.set(key, value)
  }

  /**
   * Record histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels)
    const values = this.histograms.get(key) || []
    values.push(value)
    this.histograms.set(key, values)
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels)
    return this.counters.get(key) || 0
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels)
    return this.gauges.get(key) || 0
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels?: Record<string, string>): {
    count: number
    sum: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } {
    const key = this.buildKey(name, labels)
    const values = this.histograms.get(key) || []
    
    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 }
    }

    const sorted = [...values].sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    let output = ''

    // Export counters
    this.counters.forEach((value, key) => {
      const { name, labels } = this.parseKey(key)
      const labelsStr = this.formatLabels(labels)
      output += `${name}${labelsStr} ${value}\n`
    })

    // Export gauges
    this.gauges.forEach((value, key) => {
      const { name, labels } = this.parseKey(key)
      const labelsStr = this.formatLabels(labels)
      output += `${name}${labelsStr} ${value}\n`
    })

    // Export histogram summaries
    this.histograms.forEach((values, key) => {
      const { name, labels } = this.parseKey(key)
      const stats = this.getHistogramStats(name, labels)
      const labelsStr = this.formatLabels(labels)
      
      output += `${name}_count${labelsStr} ${stats.count}\n`
      output += `${name}_sum${labelsStr} ${stats.sum}\n`
      output += `${name}_avg${labelsStr} ${stats.avg}\n`
    })

    return output
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name
    const labelsStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',')
    return `${name}{${labelsStr}}`
  }

  private parseKey(key: string): { name: string; labels?: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/)
    if (!match) return { name: key }

    const name = match[1]
    const labelsStr = match[2]

    if (!labelsStr) return { name }

    const labels: Record<string, string> = {}
    labelsStr.split(',').forEach(pair => {
      const [k, v] = pair.split(':')
      labels[k] = v
    })

    return { name, labels }
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return ''
    
    const pairs = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',')
    
    return `{${pairs}}`
  }
}

// Application-specific metrics
export class ApplicationMetrics {
  private collector = new MetricsCollector()

  // Order metrics
  recordOrderCreated(orderId: string): void {
    this.collector.incrementCounter('orders_created_total')
  }

  recordOrderProcessed(orderId: string, status: string, duration: number): void {
    this.collector.incrementCounter('orders_processed_total', 1, { status })
    this.collector.recordHistogram('order_processing_duration_ms', duration)
  }

  recordOrderFailed(orderId: string, reason: string): void {
    this.collector.incrementCounter('orders_failed_total', 1, { reason })
  }

  // Inventory metrics
  recordInventoryCheck(sku: string, available: number): void {
    this.collector.setGauge('inventory_available', available, { sku })
  }

  recordAllocation(itemId: string, quantity: number): void {
    this.collector.incrementCounter('allocations_total')
    this.collector.recordHistogram('allocation_quantity', quantity)
  }

  // Staging metrics
  recordStagingAlert(alertLevel: 'warning' | 'critical'): void {
    this.collector.incrementCounter('staging_alerts_total', 1, { level: alertLevel })
  }

  recordStagingTime(orderId: string, minutes: number): void {
    this.collector.recordHistogram('staging_time_minutes', minutes)
  }

  setStagingCapacity(stagingAreaId: string, current: number, max: number): void {
    this.collector.setGauge('staging_current_load', current, { area: stagingAreaId })
    this.collector.setGauge('staging_max_capacity', max, { area: stagingAreaId })
  }

  // Shipment metrics
  recordShipmentCreated(carrier: string): void {
    this.collector.incrementCounter('shipments_created_total', 1, { carrier })
  }

  recordCarrierNotification(carrier: string, method: string, success: boolean): void {
    this.collector.incrementCounter('carrier_notifications_total', 1, {
      carrier,
      method,
      status: success ? 'success' : 'failed'
    })
  }

  // ML metrics
  recordMLPrediction(model: string, duration: number, cached: boolean): void {
    this.collector.incrementCounter('ml_predictions_total', 1, { model, cached: cached.toString() })
    this.collector.recordHistogram('ml_prediction_duration_ms', duration, { model })
  }

  // API metrics
  recordApiRequest(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.collector.incrementCounter('api_requests_total', 1, {
      endpoint,
      method,
      status: statusCode.toString()
    })
    this.collector.recordHistogram('api_request_duration_ms', duration, { endpoint })
  }

  /**
   * Export all metrics
   */
  export(): string {
    return this.collector.exportPrometheusMetrics()
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.collector.reset()
  }
}

// Singleton instance
export const metrics = new ApplicationMetrics()
