type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  failureThreshold?: number
  successThreshold?: number
  resetTimeoutMs?: number
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private successCount = 0
  private nextAttempt = Date.now()

  constructor(
    private readonly options: CircuitBreakerOptions = {
      failureThreshold: 5,
      successThreshold: 2,
      resetTimeoutMs: 30_000
    }
  ) {}

  private get failureThreshold() {
    return this.options.failureThreshold ?? 5
  }

  private get successThreshold() {
    return this.options.successThreshold ?? 2
  }

  private get resetTimeoutMs() {
    return this.options.resetTimeoutMs ?? 30_000
  }

  private recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount += 1
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED'
        this.failureCount = 0
        this.successCount = 0
      }
    } else {
      this.failureCount = 0
    }
  }

  private recordFailure() {
    this.failureCount += 1
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.resetTimeoutMs
    }
  }

  private canAttempt() {
    if (this.state === 'OPEN' && Date.now() > this.nextAttempt) {
      this.state = 'HALF_OPEN'
      this.successCount = 0
    }
    return this.state !== 'OPEN'
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    if (!this.canAttempt()) {
      throw new Error('Circuit breaker is open')
    }

    try {
      const result = await action()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }
}

