import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Business Rule Types
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: 'validation' | 'workflow' | 'calculation' | 'notification';
  priority: 'low' | 'medium' | 'high' | 'critical';
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'validate' | 'calculate' | 'notify' | 'update' | 'create' | 'approve' | 'reject';
  target: string;
  parameters: Record<string, any>;
}

// Validation Schemas
export const OrderValidationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(z.object({
    sku: z.string().min(1, 'SKU is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive')
  })).min(1, 'At least one item is required'),
  deliveryDate: z.date().min(new Date(), 'Delivery date must be in the future'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
});

export const PurchaseOrderValidationSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Item is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    deliveryDate: z.date().min(new Date(), 'Delivery date must be in the future')
  })).min(1, 'At least one item is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  paymentTerms: z.string().optional(),
  notes: z.string().optional()
});

export const InventoryValidationSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.number().refine(val => val !== 0, 'Quantity cannot be zero'),
  location: z.string().min(1, 'Location is required'),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  reason: z.string().min(1, 'Reason is required'),
  reference: z.string().optional()
});

export class BusinessRuleEngine {
  private rules: BusinessRule[] = [];
  private validationSchemas: Map<string, z.ZodSchema> = new Map();

  constructor() {
    this.initializeValidationSchemas();
  }

  private initializeValidationSchemas() {
    this.validationSchemas.set('order', OrderValidationSchema);
    this.validationSchemas.set('purchaseOrder', PurchaseOrderValidationSchema);
    this.validationSchemas.set('inventory', InventoryValidationSchema);
  }

  async loadRules(organizationId: string): Promise<void> {
    try {
      // Load rules from database
      const dbRules = await prisma.businessRule.findMany({
        where: { organizationId, isActive: true },
        orderBy: { priority: 'desc' }
      });

      if (dbRules.length > 0) {
        this.rules = dbRules.map(rule => ({
          ...rule,
          conditions: JSON.parse(rule.conditions as string),
          actions: JSON.parse(rule.actions as string)
        }));
      } else {
        // Load default rules if no rules found in database
        this.loadDefaultRules(organizationId);
      }
    } catch (error) {
      console.error('Error loading business rules:', error);
      // Load default rules if database fails
      this.loadDefaultRules(organizationId);
    }
  }

  private loadDefaultRules(organizationId: string): void {
    this.rules = [
      // Order validation rules
      {
        id: 'order-minimum-value',
        name: 'Minimum Order Value',
        description: 'Enforce minimum order value',
        category: 'validation',
        priority: 'high',
        conditions: [
          { field: 'totalAmount', operator: 'less_than', value: 100 }
        ],
        actions: [
          { type: 'reject', target: 'order', parameters: { reason: 'Order value below minimum threshold' } }
        ],
        isActive: true,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'order-credit-limit',
        name: 'Customer Credit Limit',
        description: 'Check customer credit limit before order approval',
        category: 'validation',
        priority: 'critical',
        conditions: [
          { field: 'customerCreditLimit', operator: 'less_than', value: 'orderTotal' }
        ],
        actions: [
          { type: 'reject', target: 'order', parameters: { reason: 'Customer credit limit exceeded' } }
        ],
        isActive: true,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Inventory rules
      {
        id: 'inventory-low-stock',
        name: 'Low Stock Alert',
        description: 'Alert when inventory falls below reorder point',
        category: 'notification',
        priority: 'medium',
        conditions: [
          { field: 'quantityOnHand', operator: 'less_than', value: 'reorderPoint' }
        ],
        actions: [
          { type: 'notify', target: 'inventory_manager', parameters: { message: 'Low stock alert for item' } },
          { type: 'create', target: 'purchase_order', parameters: { autoGenerate: true } }
        ],
        isActive: true,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Purchase order rules
      {
        id: 'po-approval-threshold',
        name: 'Purchase Order Approval Threshold',
        description: 'Require approval for high-value purchase orders',
        category: 'workflow',
        priority: 'high',
        conditions: [
          { field: 'totalAmount', operator: 'greater_than', value: 10000 }
        ],
        actions: [
          { type: 'notify', target: 'approver', parameters: { message: 'High-value PO requires approval' } },
          { type: 'update', target: 'purchase_order', parameters: { status: 'PENDING_APPROVAL' } }
        ],
        isActive: true,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async validateData(dataType: string, data: any): Promise<ValidationResult> {
    const schema = this.validationSchemas.get(dataType);
    if (!schema) {
      return { isValid: false, errors: [`No validation schema found for ${dataType}`] };
    }

    try {
      schema.parse(data);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { isValid: false, errors: ['Validation failed'] };
    }
  }

  async executeRules(context: RuleContext): Promise<RuleExecutionResult> {
    const results: RuleExecutionResult = {
      executed: [],
      violations: [],
      notifications: [],
      updates: []
    };

    for (const rule of this.rules) {
      if (await this.evaluateConditions(rule.conditions, context)) {
        const ruleResult = await this.executeActions(rule.actions, context);
        
        results.executed.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          priority: rule.priority
        });

        // Categorize results
        if (ruleResult.violations.length > 0) {
          results.violations.push(...ruleResult.violations);
        }
        if (ruleResult.notifications.length > 0) {
          results.notifications.push(...ruleResult.notifications);
        }
        if (ruleResult.updates.length > 0) {
          results.updates.push(...ruleResult.updates);
        }
      }
    }

    return results;
  }

  private async evaluateConditions(conditions: RuleCondition[], context: RuleContext): Promise<boolean> {
    if (conditions.length === 0) return true;

    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(condition.field, context);
      const conditionResult = this.evaluateCondition(condition, fieldValue);

      if (logicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      logicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private getFieldValue(field: string, context: RuleContext): any {
    const fieldPath = field.split('.');
    let value = context;

    for (const path of fieldPath) {
      if (value && typeof value === 'object' && path in value) {
        value = value[path];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private evaluateCondition(condition: RuleCondition, fieldValue: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private async executeActions(actions: RuleAction[], context: RuleContext): Promise<RuleExecutionResult> {
    const result: RuleExecutionResult = {
      executed: [],
      violations: [],
      notifications: [],
      updates: []
    };

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'validate':
            const validationResult = await this.executeValidationAction(action, context);
            if (!validationResult.isValid) {
              result.violations.push({
                type: 'validation',
                message: validationResult.message,
                field: action.target
              });
            }
            break;

          case 'calculate':
            const calculationResult = await this.executeCalculationAction(action, context);
            result.updates.push({
              type: 'calculation',
              field: action.target,
              value: calculationResult.value
            });
            break;

          case 'notify':
            const notificationResult = await this.executeNotificationAction(action, context);
            result.notifications.push({
              type: 'notification',
              target: action.target,
              message: notificationResult.message
            });
            break;

          case 'update':
            const updateResult = await this.executeUpdateAction(action, context);
            result.updates.push({
              type: 'update',
              field: action.target,
              value: updateResult.value
            });
            break;

          case 'create':
            const createResult = await this.executeCreateAction(action, context);
            result.updates.push({
              type: 'create',
              target: action.target,
              id: createResult.id
            });
            break;

          case 'approve':
            result.updates.push({
              type: 'approve',
              target: action.target
            });
            break;

          case 'reject':
            result.violations.push({
              type: 'rejection',
              message: action.parameters.reason || 'Action rejected by business rule',
              field: action.target
            });
            break;
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
        result.violations.push({
          type: 'error',
          message: `Failed to execute ${action.type} action: ${error.message}`,
          field: action.target
        });
      }
    }

    return result;
  }

  private async executeValidationAction(action: RuleAction, context: RuleContext): Promise<{ isValid: boolean; message?: string }> {
    // Implement specific validation logic
    return { isValid: true };
  }

  private async executeCalculationAction(action: RuleAction, context: RuleContext): Promise<{ value: any }> {
    // Implement calculation logic
    return { value: null };
  }

  private async executeNotificationAction(action: RuleAction, context: RuleContext): Promise<{ message: string }> {
    // Implement notification logic
    return { message: action.parameters.message || 'Notification sent' };
  }

  private async executeUpdateAction(action: RuleAction, context: RuleContext): Promise<{ value: any }> {
    // Implement update logic
    return { value: action.parameters.value };
  }

  private async executeCreateAction(action: RuleAction, context: RuleContext): Promise<{ id: string }> {
    // Implement create logic
    return { id: `created-${Date.now()}` };
  }

  async addRule(rule: Omit<BusinessRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessRule> {
    const newRule: BusinessRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.push(newRule);
    return newRule;
  }

  async updateRule(ruleId: string, updates: Partial<BusinessRule>): Promise<BusinessRule | null> {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return null;

    this.rules[ruleIndex] = {
      ...this.rules[ruleIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.rules[ruleIndex];
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.rules.splice(ruleIndex, 1);
    return true;
  }

  getRules(category?: string): BusinessRule[] {
    if (category) {
      return this.rules.filter(rule => rule.category === category);
    }
    return this.rules;
  }
}

// Types
export interface RuleContext {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RuleExecutionResult {
  executed: Array<{
    ruleId: string;
    ruleName: string;
    category: string;
    priority: string;
  }>;
  violations: Array<{
    type: string;
    message: string;
    field?: string;
  }>;
  notifications: Array<{
    type: string;
    target: string;
    message: string;
  }>;
  updates: Array<{
    type: string;
    target?: string;
    field?: string;
    value?: any;
    id?: string;
  }>;
} 