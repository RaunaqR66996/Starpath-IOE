import { z } from 'zod';
import orderLifecycleManager, {
  OrderLifecycleState,
  OrderLifecycleOrderDetails
} from '@/lib/order-lifecycle/order-lifecycle-manager';
import {
  eventStore,
  OrderEventType,
  OrderEventFactory
} from '@/lib/events/event-store';
import { createLogger } from '@/lib/logger';
import { AppError, ValidationError } from '@/lib/api/app-error';

const logger = createLogger('OrderLifecycleService');

// Define Zod Schemas for Runtime Validation
const LineItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().nonnegative().optional(),
  description: z.string().optional(),
});

const StartLifecycleSchema = z.object({
  orderId: z.string().uuid("Invalid Order ID format"),
  organizationId: z.string().min(1, "Organization ID is required"),
  orderNumber: z.string().min(1, "Order Number is required"),
  customerName: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  totalAmount: z.number().nonnegative().optional(),
  totalItems: z.number().int().nonnegative().optional(),
  warehouse: z.string().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  lines: z.array(LineItemSchema).default([]),
});

type StartLifecycleInput = z.infer<typeof StartLifecycleSchema>;

class OrderLifecycleService {

  /**
   * Starts the lifecycle for a new order.
   * Validates input, appends ORDER_PLACED event, and returns initial state.
   */
  async startLifecycle(input: unknown): Promise<OrderLifecycleState | undefined> {
    const methodLog = logger.child({ method: 'startLifecycle' });

    try {
      // 1. Validate Input
      const validatedInput = StartLifecycleSchema.parse(input);
      methodLog.info({ orderId: validatedInput.orderId, orderNumber: validatedInput.orderNumber }, 'Starting order lifecycle');

      const {
        orderId,
        organizationId,
        orderNumber,
        customerName,
        priority,
        totalAmount,
        totalItems,
        warehouse,
        externalId,
        metadata,
        lines
      } = validatedInput;

      const payload: OrderLifecycleOrderDetails & Record<string, any> = {
        orderNumber,
        customerName,
        priority,
        totalValue: totalAmount,
        totalItems: totalItems ?? lines.reduce((sum, line) => sum + (line.quantity || 0), 0),
        warehouse,
        externalId,
        items: lines,
        metadata
      };

      // 2. Create and Append Event
      const event = OrderEventFactory.createOrderPlaced(orderId, payload, organizationId);
      await eventStore.append(event);

      methodLog.debug({ orderId }, 'ORDER_PLACED event appended');

      // 3. Return State
      return await orderLifecycleManager.getOrderLifecycle(orderId);

    } catch (error) {
      if (error instanceof z.ZodError) {
        methodLog.warn({ errors: error.errors }, 'Validation failed');
        throw new ValidationError(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
      }
      methodLog.error({ error }, 'Failed to start lifecycle');
      throw new AppError('Failed to start order lifecycle', 500);
    }
  }

  async recordEvent(
    orderId: string,
    eventType: OrderEventType,
    organizationId: string,
    data: Record<string, any> = {}
  ): Promise<OrderLifecycleState | undefined> {
    const methodLog = logger.child({ method: 'recordEvent', orderId, eventType });

    try {
      methodLog.debug('Recording event');
      const event = this.createEvent(orderId, eventType, organizationId, data);
      await eventStore.append(event);

      return await orderLifecycleManager.getOrderLifecycle(orderId);
    } catch (error) {
      methodLog.error({ error }, 'Failed to record event');
      throw new AppError(`Failed to record event ${eventType}`, 500);
    }
  }

  async getLifecycle(orderId: string): Promise<OrderLifecycleState | undefined> {
    try {
      return await orderLifecycleManager.getOrderLifecycle(orderId);
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to get lifecycle');
      throw new AppError('Failed to retrieve order lifecycle', 500);
    }
  }

  async listLifecycles(organizationId: string): Promise<OrderLifecycleState[]> {
    try {
      return await orderLifecycleManager.getAllLifecycles(organizationId);
    } catch (error) {
      logger.error({ error, organizationId }, 'Failed to list lifecycles');
      throw new AppError('Failed to list lifecycles', 500);
    }
  }

  private createEvent(
    orderId: string,
    eventType: OrderEventType,
    organizationId: string,
    data: Record<string, any>
  ) {
    switch (eventType) {
      case 'ORDER_PLACED':
        return OrderEventFactory.createOrderPlaced(orderId, data, organizationId);
      case 'INVENTORY_CHECKED':
        return OrderEventFactory.createInventoryChecked(orderId, data, organizationId, data.correlationId);
      case 'PO_GENERATED':
        return OrderEventFactory.createPOGenerated(orderId, data, organizationId, data.correlationId);
      case 'MATERIAL_RECEIVED':
        return OrderEventFactory.createMaterialReceived(orderId, data, organizationId, data.correlationId);
      case 'PRODUCTION_STARTED':
        return OrderEventFactory.createProductionStarted(orderId, data, organizationId, data.correlationId);
      case 'QUALITY_PASSED':
        return OrderEventFactory.createQualityPassed(orderId, data, organizationId, data.correlationId);
      case 'ORDER_SHIPPED':
        return OrderEventFactory.createOrderShipped(orderId, data, organizationId, data.correlationId);
      default:
        throw new AppError(`Unsupported event type: ${eventType}`, 400);
    }
  }
}

export const orderLifecycleService = new OrderLifecycleService();



