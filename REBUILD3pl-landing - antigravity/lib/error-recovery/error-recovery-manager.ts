import { notificationService } from '../realtime/notification-service';
import { eventStore } from '../events/event-store';

export interface ErrorRecoveryManager {
  retryPolicies: {
    'ERP Connection': 'Exponential backoff with circuit breaker';
    'AI Service': 'Fallback to rule-based processing';
    'Payment Processing': 'Queue for manual review';
  };
  
  compensationActions: {
    'Order Cancellation': 'Reverse all related transactions';
    'Inventory Adjustment': 'Correct stock levels';
    'Supplier Notification': 'Cancel or modify PO';
  };
}

export interface RetryPolicy {
  name: string;
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'constant';
  backoffMultiplier: number;
  maxBackoffTime: number;
  circuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  fallbackStrategy: string;
}

export interface CompensationAction {
  name: string;
  description: string;
  actions: string[];
  rollbackSteps: string[];
  dependencies: string[];
  estimatedTime: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorEvent {
  errorId: string;
  timestamp: Date;
  errorType: string;
  errorMessage: string;
  context: {
    orderId?: string;
    userId?: string;
    organizationId?: string;
    service?: string;
    operation?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryCount: number;
  status: 'pending' | 'retrying' | 'compensating' | 'resolved' | 'failed';
  retryPolicy?: string;
  compensationAction?: string;
}

export interface RecoveryResult {
  success: boolean;
  errorId: string;
  action: string;
  result: any;
  timestamp: Date;
  duration: number;
  retryCount: number;
}

export class ErrorRecoveryManagerClass implements ErrorRecoveryManager {
  retryPolicies: ErrorRecoveryManager['retryPolicies'] = {
    'ERP Connection': 'Exponential backoff with circuit breaker',
    'AI Service': 'Fallback to rule-based processing',
    'Payment Processing': 'Queue for manual review'
  };
  
  compensationActions: ErrorRecoveryManager['compensationActions'] = {
    'Order Cancellation': 'Reverse all related transactions',
    'Inventory Adjustment': 'Correct stock levels',
    'Supplier Notification': 'Cancel or modify PO'
  };

  private retryPoliciesConfig: Map<string, RetryPolicy> = new Map();
  private compensationActionsConfig: Map<string, CompensationAction> = new Map();
  private errorEvents: Map<string, ErrorEvent> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; state: 'closed' | 'open' | 'half-open' }> = new Map();
  private recoveryQueue: ErrorEvent[] = [];

  constructor() {
    this.initializeRetryPolicies();
    this.initializeCompensationActions();
    console.log('🛡️ Error Recovery Manager initialized');
  }

  private initializeRetryPolicies(): void {
    // ERP Connection - Exponential backoff with circuit breaker
    this.retryPoliciesConfig.set('ERP Connection', {
      name: 'ERP Connection',
      maxRetries: 5,
      backoffStrategy: 'exponential',
      backoffMultiplier: 2,
      maxBackoffTime: 300000, // 5 minutes
      circuitBreaker: true,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 60000, // 1 minute
      fallbackStrategy: 'Use cached data and queue for sync'
    });

    // AI Service - Fallback to rule-based processing
    this.retryPoliciesConfig.set('AI Service', {
      name: 'AI Service',
      maxRetries: 3,
      backoffStrategy: 'linear',
      backoffMultiplier: 1,
      maxBackoffTime: 60000, // 1 minute
      circuitBreaker: false,
      circuitBreakerThreshold: 0,
      circuitBreakerTimeout: 0,
      fallbackStrategy: 'Fallback to rule-based processing'
    });

    // Payment Processing - Queue for manual review
    this.retryPoliciesConfig.set('Payment Processing', {
      name: 'Payment Processing',
      maxRetries: 2,
      backoffStrategy: 'constant',
      backoffMultiplier: 1,
      maxBackoffTime: 30000, // 30 seconds
      circuitBreaker: false,
      circuitBreakerThreshold: 0,
      circuitBreakerTimeout: 0,
      fallbackStrategy: 'Queue for manual review'
    });
  }

  private initializeCompensationActions(): void {
    // Order Cancellation - Reverse all related transactions
    this.compensationActionsConfig.set('Order Cancellation', {
      name: 'Order Cancellation',
      description: 'Reverse all related transactions',
      actions: [
        'Cancel purchase orders',
        'Release allocated inventory',
        'Reverse payment transactions',
        'Notify suppliers of cancellation',
        'Update order status to cancelled'
      ],
      rollbackSteps: [
        'Restore original order state',
        'Re-allocate inventory',
        'Re-process payments',
        'Re-notify suppliers'
      ],
      dependencies: ['inventory_system', 'payment_system', 'supplier_system'],
      estimatedTime: 300000, // 5 minutes
      priority: 'high'
    });

    // Inventory Adjustment - Correct stock levels
    this.compensationActionsConfig.set('Inventory Adjustment', {
      name: 'Inventory Adjustment',
      description: 'Correct stock levels',
      actions: [
        'Audit current inventory levels',
        'Identify discrepancies',
        'Adjust stock quantities',
        'Update inventory records',
        'Notify relevant teams'
      ],
      rollbackSteps: [
        'Restore original inventory levels',
        'Revert inventory records',
        'Notify teams of rollback'
      ],
      dependencies: ['inventory_system', 'audit_system'],
      estimatedTime: 180000, // 3 minutes
      priority: 'medium'
    });

    // Supplier Notification - Cancel or modify PO
    this.compensationActionsConfig.set('Supplier Notification', {
      name: 'Supplier Notification',
      description: 'Cancel or modify PO',
      actions: [
        'Identify affected purchase orders',
        'Calculate modification requirements',
        'Send cancellation/modification requests',
        'Update PO status',
        'Track supplier responses'
      ],
      rollbackSteps: [
        'Restore original PO state',
        'Send correction notifications',
        'Update PO records'
      ],
      dependencies: ['purchase_order_system', 'supplier_system'],
      estimatedTime: 240000, // 4 minutes
      priority: 'high'
    });
  }

  /**
   * Handle an error with appropriate retry policy
   */
  async handleError(error: Error, context: any, service: string): Promise<RecoveryResult> {
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errorEvent: ErrorEvent = {
      errorId,
      timestamp: new Date(),
      errorType: error.constructor.name,
      errorMessage: error.message,
      context,
      severity: this.determineSeverity(error, context),
      retryCount: 0,
      status: 'pending'
    };

    this.errorEvents.set(errorId, errorEvent);

    // Get retry policy for the service
    const retryPolicy = this.retryPoliciesConfig.get(service);
    if (!retryPolicy) {
      return this.handleErrorWithoutPolicy(errorEvent);
    }

    errorEvent.retryPolicy = retryPolicy.name;
    return this.executeRetryPolicy(errorEvent, retryPolicy);
  }

  /**
   * Execute retry policy with exponential backoff
   */
  private async executeRetryPolicy(errorEvent: ErrorEvent, policy: RetryPolicy): Promise<RecoveryResult> {
    const startTime = Date.now();

    // Check circuit breaker if enabled
    if (policy.circuitBreaker) {
      const circuitBreaker = this.getCircuitBreaker(policy.name);
      if (circuitBreaker.state === 'open') {
        if (Date.now() - circuitBreaker.lastFailure.getTime() > policy.circuitBreakerTimeout) {
          circuitBreaker.state = 'half-open';
        } else {
          return this.executeFallbackStrategy(errorEvent, policy);
        }
      }
    }

    // Execute retry logic
    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        errorEvent.retryCount = attempt;
        errorEvent.status = 'retrying';

        // Attempt the operation
        const result = await this.retryOperation(errorEvent, attempt);
        
        // Success - reset circuit breaker
        if (policy.circuitBreaker) {
          const circuitBreaker = this.getCircuitBreaker(policy.name);
          circuitBreaker.state = 'closed';
          circuitBreaker.failures = 0;
        }

        errorEvent.status = 'resolved';
        return {
          success: true,
          errorId: errorEvent.errorId,
          action: 'retry_success',
          result,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          retryCount: attempt
        };

      } catch (retryError) {
        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(attempt, policy);
        
        // Update circuit breaker
        if (policy.circuitBreaker) {
          const circuitBreaker = this.getCircuitBreaker(policy.name);
          circuitBreaker.failures++;
          circuitBreaker.lastFailure = new Date();
          
          if (circuitBreaker.failures >= policy.circuitBreakerThreshold) {
            circuitBreaker.state = 'open';
            return this.executeFallbackStrategy(errorEvent, policy);
          }
        }

        // Wait before next retry
        if (attempt < policy.maxRetries) {
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    errorEvent.status = 'failed';
    return this.executeFallbackStrategy(errorEvent, policy);
  }

  /**
   * Execute fallback strategy when retries fail
   */
  private async executeFallbackStrategy(errorEvent: ErrorEvent, policy: RetryPolicy): Promise<RecoveryResult> {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (policy.fallbackStrategy) {
        case 'Use cached data and queue for sync':
          result = await this.useCachedDataAndQueueSync(errorEvent);
          break;
        case 'Fallback to rule-based processing':
          result = await this.fallbackToRuleBasedProcessing(errorEvent);
          break;
        case 'Queue for manual review':
          result = await this.queueForManualReview(errorEvent);
          break;
        default:
          result = { message: 'Fallback strategy not implemented' };
      }

      errorEvent.status = 'resolved';
      return {
        success: true,
        errorId: errorEvent.errorId,
        action: 'fallback_success',
        result,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        retryCount: errorEvent.retryCount
      };

    } catch (fallbackError) {
      errorEvent.status = 'failed';
      return {
        success: false,
        errorId: errorEvent.errorId,
        action: 'fallback_failed',
        result: { error: fallbackError.message },
        timestamp: new Date(),
        duration: Date.now() - startTime,
        retryCount: errorEvent.retryCount
      };
    }
  }

  /**
   * Execute compensation action
   */
  async executeCompensationAction(actionName: string, context: any): Promise<RecoveryResult> {
    const compensationAction = this.compensationActionsConfig.get(actionName);
    if (!compensationAction) {
      throw new Error(`Compensation action '${actionName}' not found`);
    }

    const startTime = Date.now();
    const errorId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Execute compensation actions
      for (const action of compensationAction.actions) {
        await this.executeCompensationStep(action, context);
      }

      // Log compensation event
      await this.logCompensationEvent(actionName, context, true);

      return {
        success: true,
        errorId,
        action: actionName,
        result: { message: 'Compensation completed successfully' },
        timestamp: new Date(),
        duration: Date.now() - startTime,
        retryCount: 0
      };

    } catch (error) {
      // Execute rollback steps
      for (const rollbackStep of compensationAction.rollbackSteps) {
        try {
          await this.executeRollbackStep(rollbackStep, context);
        } catch (rollbackError) {
          console.error(`Rollback step failed: ${rollbackStep}`, rollbackError);
        }
      }

      await this.logCompensationEvent(actionName, context, false);
      
      return {
        success: false,
        errorId,
        action: actionName,
        result: { error: error.message },
        timestamp: new Date(),
        duration: Date.now() - startTime,
        retryCount: 0
      };
    }
  }

  /**
   * Get circuit breaker for a service
   */
  private getCircuitBreaker(serviceName: string) {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, {
        failures: 0,
        lastFailure: new Date(),
        state: 'closed'
      });
    }
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Calculate backoff delay based on policy
   */
  private calculateBackoffDelay(attempt: number, policy: RetryPolicy): number {
    let delay = 1000; // Base delay of 1 second

    switch (policy.backoffStrategy) {
      case 'exponential':
        delay = Math.min(
          delay * Math.pow(policy.backoffMultiplier, attempt),
          policy.maxBackoffTime
        );
        break;
      case 'linear':
        delay = Math.min(
          delay * policy.backoffMultiplier * attempt,
          policy.maxBackoffTime
        );
        break;
      case 'constant':
        delay = policy.maxBackoffTime;
        break;
    }

    return delay;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context: any): 'low' | 'medium' | 'high' | 'critical' {
    // Simple severity determination logic
    if (context.orderId && context.operation === 'payment') {
      return 'critical';
    }
    if (context.service === 'ERP Connection') {
      return 'high';
    }
    if (context.service === 'AI Service') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Retry operation (placeholder for actual operation)
   */
  private async retryOperation(errorEvent: ErrorEvent, attempt: number): Promise<any> {
    // This would contain the actual operation logic
    // For now, we'll simulate a retry
    await this.sleep(100);
    
    // Simulate success on third attempt
    if (attempt >= 2) {
      return { message: 'Operation succeeded after retry' };
    }
    
    throw new Error(`Operation failed on attempt ${attempt + 1}`);
  }

  /**
   * Fallback strategies
   */
  private async useCachedDataAndQueueSync(errorEvent: ErrorEvent): Promise<any> {
    // Use cached data and queue for later sync
    return { message: 'Using cached data, queued for sync' };
  }

  private async fallbackToRuleBasedProcessing(errorEvent: ErrorEvent): Promise<any> {
    // Fallback to rule-based processing
    return { message: 'Using rule-based processing' };
  }

  private async queueForManualReview(errorEvent: ErrorEvent): Promise<any> {
    // Queue for manual review
    return { message: 'Queued for manual review' };
  }

  /**
   * Compensation and rollback steps
   */
  private async executeCompensationStep(action: string, context: any): Promise<void> {
    // Execute compensation step
    await this.sleep(100);
    console.log(`Executing compensation step: ${action}`);
  }

  private async executeRollbackStep(rollbackStep: string, context: any): Promise<void> {
    // Execute rollback step
    await this.sleep(100);
    console.log(`Executing rollback step: ${rollbackStep}`);
  }

  /**
   * Logging and notifications
   */
  private async logCompensationEvent(actionName: string, context: any, success: boolean): Promise<void> {
    const event = {
      type: 'compensation_event',
      actionName,
      context,
      success,
      timestamp: new Date()
    };

    // Log to event store
    await eventStore.appendEvent('system', {
      eventId: `comp-${Date.now()}`,
      orderId: 'system',
      eventType: 'COMPENSATION_EVENT',
      timestamp: new Date(),
      data: event,
      metadata: { version: 1 }
    });

    // Notify relevant teams
    notificationService.sendToRoom('error-recovery-team', 'compensation_event', event);
  }

  /**
   * Handle error without policy
   */
  private async handleErrorWithoutPolicy(errorEvent: ErrorEvent): Promise<RecoveryResult> {
    errorEvent.status = 'failed';
    return {
      success: false,
      errorId: errorEvent.errorId,
      action: 'no_policy',
      result: { error: 'No retry policy found for this error' },
      timestamp: new Date(),
      duration: 0,
      retryCount: 0
    };
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error statistics
   */
  getErrorStats(): any {
    const errors = Array.from(this.errorEvents.values());
    const stats = {
      total: errors.length,
      byStatus: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byService: {} as Record<string, number>,
      averageRetryCount: 0
    };

    let totalRetries = 0;
    for (const error of errors) {
      stats.byStatus[error.status] = (stats.byStatus[error.status] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      if (error.context.service) {
        stats.byService[error.context.service] = (stats.byService[error.context.service] || 0) + 1;
      }
      totalRetries += error.retryCount;
    }

    stats.averageRetryCount = errors.length > 0 ? totalRetries / errors.length : 0;
    return stats;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): any {
    const status: any = {};
    for (const [service, circuitBreaker] of this.circuitBreakers.entries()) {
      status[service] = {
        state: circuitBreaker.state,
        failures: circuitBreaker.failures,
        lastFailure: circuitBreaker.lastFailure
      };
    }
    return status;
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(serviceName: string): void {
    this.circuitBreakers.delete(serviceName);
    console.log(`Circuit breaker reset for service: ${serviceName}`);
  }

  /**
   * Get all retry policies
   */
  getRetryPolicies(): RetryPolicy[] {
    return Array.from(this.retryPoliciesConfig.values());
  }

  /**
   * Get all compensation actions
   */
  getCompensationActions(): CompensationAction[] {
    return Array.from(this.compensationActionsConfig.values());
  }
}

// Singleton instance
const errorRecoveryManager = new ErrorRecoveryManagerClass();

export default errorRecoveryManager; 