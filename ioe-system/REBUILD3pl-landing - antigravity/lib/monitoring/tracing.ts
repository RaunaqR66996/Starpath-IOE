/**
 * Distributed Tracing Support
 * For tracking requests across services
 */

export interface Span {
  traceId: string
  spanId: string
  parentSpanId?: string
  name: string
  startTime: Date
  endTime?: Date
  duration?: number
  attributes: Record<string, any>
  events: Array<{
    name: string
    timestamp: Date
    attributes: Record<string, any>
  }>
  status: 'ok' | 'error'
  errorMessage?: string
}

class TracingService {
  private spans: Map<string, Span> = new Map()

  /**
   * Start a new span
   */
  startSpan(name: string, parentSpanId?: string): Span {
    const span: Span = {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      parentSpanId,
      name,
      startTime: new Date(),
      attributes: {},
      events: [],
      status: 'ok'
    }

    this.spans.set(span.spanId, span)
    return span
  }

  /**
   * End a span
   */
  endSpan(spanId: string, status: 'ok' | 'error' = 'ok', errorMessage?: string): void {
    const span = this.spans.get(spanId)
    if (!span) return

    span.endTime = new Date()
    span.duration = span.endTime.getTime() - span.startTime.getTime()
    span.status = status
    span.errorMessage = errorMessage

    this.spans.set(spanId, span)
  }

  /**
   * Add attribute to span
   */
  addAttribute(spanId: string, key: string, value: any): void {
    const span = this.spans.get(spanId)
    if (span) {
      span.attributes[key] = value
      this.spans.set(spanId, span)
    }
  }

  /**
   * Add event to span
   */
  addEvent(spanId: string, name: string, attributes: Record<string, any> = {}): void {
    const span = this.spans.get(spanId)
    if (span) {
      span.events.push({
        name,
        timestamp: new Date(),
        attributes
      })
      this.spans.set(spanId, span)
    }
  }

  /**
   * Get span
   */
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId)
  }

  /**
   * Export spans
   */
  exportSpans(): Span[] {
    return Array.from(this.spans.values())
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export const tracing = new TracingService()



