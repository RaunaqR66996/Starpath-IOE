import { eventStore, OrderEventFactory } from '../events/event-store';
import { notificationService } from '../realtime/notification-service';

export interface Order {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  specifications?: string;
}

export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  requiredQty: number;
  availableQty: number;
  allocatedQty: number;
  netRequirement: number;
  orderQty: number;
  orderDate: Date;
  dueDate: Date;
  leadTime: number;
  safetyStock: number;
  supplierId: string;
  supplierName: string;
  supplierCapacity: number;
  supplierLeadTime: number;
  cost: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  bomLevel: number;
  parentProduct?: string;
  criticalPath: boolean;
  constraints: MaterialConstraint[];
}

export interface MaterialConstraint {
  type: 'supplier_capacity' | 'lead_time' | 'safety_stock' | 'quality' | 'cost';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  mitigation: string;
}

export interface BillOfMaterials {
  productId: string;
  productName: string;
  components: BOMComponent[];
  version: string;
  effectiveDate: Date;
  revision: number;
}

export interface BOMComponent {
  materialId: string;
  materialName: string;
  quantity: number;
  unitOfMeasure: string;
  scrapFactor: number;
  leadTime: number;
  supplierId: string;
  cost: number;
  critical: boolean;
  alternatives: string[];
}

export interface InventoryItem {
  materialId: string;
  materialName: string;
  currentStock: number;
  allocatedStock: number;
  availableStock: number;
  safetyStock: number;
  reorderPoint: number;
  leadTime: number;
  unitCost: number;
  supplierId: string;
  lastUpdated: Date;
}

export interface Supplier {
  supplierId: string;
  supplierName: string;
  capacity: number;
  currentLoad: number;
  availableCapacity: number;
  leadTime: number;
  reliability: number;
  qualityRating: number;
  costRating: number;
  materials: string[];
  constraints: SupplierConstraint[];
}

export interface SupplierConstraint {
  type: 'capacity' | 'lead_time' | 'quality' | 'cost' | 'geographic';
  description: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface MRPResult {
  orderId: string;
  materialRequirements: MaterialRequirement[];
  totalCost: number;
  criticalPath: MaterialRequirement[];
  constraints: MaterialConstraint[];
  recommendations: string[];
  feasibility: 'feasible' | 'constrained' | 'infeasible';
  completionDate: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class MRPEngine {
  private bomDatabase: Map<string, BillOfMaterials> = new Map();
  private inventoryDatabase: Map<string, InventoryItem> = new Map();
  private supplierDatabase: Map<string, Supplier> = new Map();
  private workInProgress: Map<string, number> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Initialize sample BOMs
    this.bomDatabase.set('PROD-001', {
      productId: 'PROD-001',
      productName: 'Aerospace Component A',
      components: [
        {
          materialId: 'MAT-001',
          materialName: 'Titanium Alloy',
          quantity: 2.5,
          unitOfMeasure: 'kg',
          scrapFactor: 0.05,
          leadTime: 14,
          supplierId: 'SUP-001',
          cost: 150,
          critical: true,
          alternatives: ['MAT-001-ALT']
        },
        {
          materialId: 'MAT-002',
          materialName: 'Precision Bearings',
          quantity: 4,
          unitOfMeasure: 'EA',
          scrapFactor: 0.02,
          leadTime: 7,
          supplierId: 'SUP-002',
          cost: 75,
          critical: true,
          alternatives: []
        },
        {
          materialId: 'MAT-003',
          materialName: 'Electronic Controller',
          quantity: 1,
          unitOfMeasure: 'EA',
          scrapFactor: 0.01,
          leadTime: 21,
          supplierId: 'SUP-003',
          cost: 500,
          critical: true,
          alternatives: ['MAT-003-ALT']
        }
      ],
      version: '1.0',
      effectiveDate: new Date('2024-01-01'),
      revision: 1
    });

    // Initialize sample inventory
    this.inventoryDatabase.set('MAT-001', {
      materialId: 'MAT-001',
      materialName: 'Titanium Alloy',
      currentStock: 100,
      allocatedStock: 25,
      availableStock: 75,
      safetyStock: 50,
      reorderPoint: 75,
      leadTime: 14,
      unitCost: 150,
      supplierId: 'SUP-001',
      lastUpdated: new Date()
    });

    this.inventoryDatabase.set('MAT-002', {
      materialId: 'MAT-002',
      materialName: 'Precision Bearings',
      currentStock: 200,
      allocatedStock: 0,
      availableStock: 200,
      safetyStock: 100,
      reorderPoint: 150,
      leadTime: 7,
      unitCost: 75,
      supplierId: 'SUP-002',
      lastUpdated: new Date()
    });

    this.inventoryDatabase.set('MAT-003', {
      materialId: 'MAT-003',
      materialName: 'Electronic Controller',
      currentStock: 15,
      allocatedStock: 5,
      availableStock: 10,
      safetyStock: 20,
      reorderPoint: 25,
      leadTime: 21,
      unitCost: 500,
      supplierId: 'SUP-003',
      lastUpdated: new Date()
    });

    // Initialize sample suppliers
    this.supplierDatabase.set('SUP-001', {
      supplierId: 'SUP-001',
      supplierName: 'TitaniumCorp Industries',
      capacity: 1000,
      currentLoad: 600,
      availableCapacity: 400,
      leadTime: 14,
      reliability: 0.95,
      qualityRating: 0.98,
      costRating: 0.85,
      materials: ['MAT-001'],
      constraints: []
    });

    this.supplierDatabase.set('SUP-002', {
      supplierId: 'SUP-002',
      supplierName: 'Precision Bearings Ltd',
      capacity: 5000,
      currentLoad: 3000,
      availableCapacity: 2000,
      leadTime: 7,
      reliability: 0.92,
      qualityRating: 0.95,
      costRating: 0.90,
      materials: ['MAT-002'],
      constraints: []
    });

    this.supplierDatabase.set('SUP-003', {
      supplierId: 'SUP-003',
      supplierName: 'ElectroTech Systems',
      capacity: 200,
      currentLoad: 180,
      availableCapacity: 20,
      leadTime: 21,
      reliability: 0.88,
      qualityRating: 0.96,
      costRating: 0.75,
      materials: ['MAT-003'],
      constraints: [{
        type: 'capacity',
        description: 'Limited production capacity',
        impact: 'high',
        mitigation: 'Consider alternative suppliers or extended lead times'
      }]
    });
  }

  calculateMaterialNeeds(customerOrders: Order[]): MRPResult[] {
    const results: MRPResult[] = [];

    for (const order of customerOrders) {
      try {
        const materialRequirements = this.explodeBOM(order);
        const constrainedRequirements = this.applyConstraints(materialRequirements);
        const optimizedRequirements = this.optimizeProcurement(constrainedRequirements);
        
        const result: MRPResult = {
          orderId: order.orderId,
          materialRequirements: optimizedRequirements,
          totalCost: this.calculateTotalCost(optimizedRequirements),
          criticalPath: this.identifyCriticalPath(optimizedRequirements),
          constraints: this.identifyConstraints(optimizedRequirements),
          recommendations: this.generateRecommendations(optimizedRequirements, order),
          feasibility: this.assessFeasibility(optimizedRequirements),
          completionDate: this.calculateCompletionDate(optimizedRequirements, order.dueDate),
          riskLevel: this.assessRiskLevel(optimizedRequirements)
        };

        results.push(result);

        // Create MRP event
        this.createMRPEvent(order, result);

      } catch (error) {
        console.error(`Error calculating MRP for order ${order.orderId}:`, error);
        
        // Create error event
        const errorResult: MRPResult = {
          orderId: order.orderId,
          materialRequirements: [],
          totalCost: 0,
          criticalPath: [],
          constraints: [{
            type: 'quality',
            description: `MRP calculation failed: ${error.message}`,
            severity: 'critical',
            impact: 'Cannot proceed with order',
            mitigation: 'Review order data and BOM configuration'
          }],
          recommendations: ['Review order configuration', 'Check BOM availability'],
          feasibility: 'infeasible',
          completionDate: order.dueDate,
          riskLevel: 'critical'
        };

        results.push(errorResult);
      }
    }

    return results;
  }

  private explodeBOM(order: Order): MaterialRequirement[] {
    const materialRequirements: MaterialRequirement[] = [];
    const processedMaterials = new Set<string>();

    for (const orderItem of order.items) {
      const bom = this.bomDatabase.get(orderItem.productId);
      if (!bom) {
        throw new Error(`BOM not found for product ${orderItem.productId}`);
      }

      // Calculate gross requirements
      const grossRequirements = this.calculateGrossRequirements(bom, orderItem.quantity);
      
      // Explode each component
      for (const component of bom.components) {
        const materialKey = `${component.materialId}-${order.orderId}`;
        
        if (processedMaterials.has(materialKey)) {
          // Add to existing requirement
          const existingReq = materialRequirements.find(req => 
            req.materialId === component.materialId && req.parentProduct === orderItem.productId
          );
          if (existingReq) {
            existingReq.requiredQty += grossRequirements[component.materialId];
            existingReq.orderQty = this.calculateOrderQuantity(existingReq);
          }
        } else {
          processedMaterials.add(materialKey);
          
          const inventory = this.inventoryDatabase.get(component.materialId);
          const supplier = this.supplierDatabase.get(component.supplierId);
          
          if (!inventory || !supplier) {
            throw new Error(`Inventory or supplier not found for material ${component.materialId}`);
          }

          const requiredQty = grossRequirements[component.materialId];
          const availableQty = inventory.availableStock;
          const allocatedQty = inventory.allocatedStock;
          const netRequirement = Math.max(0, requiredQty - availableQty + inventory.safetyStock);
          
          const materialRequirement: MaterialRequirement = {
            materialId: component.materialId,
            materialName: component.materialName,
            requiredQty,
            availableQty,
            allocatedQty,
            netRequirement,
            orderQty: this.calculateOrderQuantity({
              materialId: component.materialId,
              requiredQty,
              availableQty,
              netRequirement,
              leadTime: component.leadTime,
              safetyStock: inventory.safetyStock
            } as MaterialRequirement),
            orderDate: this.calculateOrderDate(order.dueDate, component.leadTime),
            dueDate: order.dueDate,
            leadTime: component.leadTime,
            safetyStock: inventory.safetyStock,
            supplierId: component.supplierId,
            supplierName: supplier.supplierName,
            supplierCapacity: supplier.availableCapacity,
            supplierLeadTime: supplier.leadTime,
            cost: component.cost * requiredQty,
            priority: order.priority,
            bomLevel: 1,
            parentProduct: orderItem.productId,
            criticalPath: component.critical,
            constraints: this.identifyMaterialConstraints(component, inventory, supplier)
          };

          materialRequirements.push(materialRequirement);
        }
      }
    }

    return materialRequirements;
  }

  private calculateGrossRequirements(bom: BillOfMaterials, orderQuantity: number): Record<string, number> {
    const grossRequirements: Record<string, number> = {};

    for (const component of bom.components) {
      // Apply scrap factor
      const scrapAdjustedQty = component.quantity * (1 + component.scrapFactor);
      grossRequirements[component.materialId] = scrapAdjustedQty * orderQuantity;
    }

    return grossRequirements;
  }

  private calculateOrderQuantity(materialReq: MaterialRequirement): number {
    // Consider lot sizing, minimum order quantities, and supplier constraints
    const minOrderQty = 10; // Minimum order quantity
    const lotSize = 25; // Lot size for economic ordering
    
    let orderQty = Math.max(materialReq.netRequirement, minOrderQty);
    
    // Round up to lot size
    if (orderQty % lotSize !== 0) {
      orderQty = Math.ceil(orderQty / lotSize) * lotSize;
    }
    
    // Consider supplier capacity constraints
    if (materialReq.supplierCapacity < orderQty) {
      orderQty = materialReq.supplierCapacity;
    }
    
    return orderQty;
  }

  private calculateOrderDate(dueDate: Date, leadTime: number): Date {
    const orderDate = new Date(dueDate);
    orderDate.setDate(orderDate.getDate() - leadTime);
    return orderDate;
  }

  private applyConstraints(materialRequirements: MaterialRequirement[]): MaterialRequirement[] {
    const constrainedRequirements = [...materialRequirements];

    for (const requirement of constrainedRequirements) {
      const constraints: MaterialConstraint[] = [];

      // Check supplier capacity constraints
      if (requirement.orderQty > requirement.supplierCapacity) {
        constraints.push({
          type: 'supplier_capacity',
          description: `Supplier ${requirement.supplierName} capacity exceeded`,
          severity: 'high',
          impact: 'Extended lead time or alternative supplier required',
          mitigation: 'Consider alternative suppliers or split orders'
        });
        
        // Adjust order quantity to capacity
        requirement.orderQty = requirement.supplierCapacity;
      }

      // Check lead time constraints
      const orderDate = this.calculateOrderDate(requirement.dueDate, requirement.leadTime);
      if (orderDate < new Date()) {
        constraints.push({
          type: 'lead_time',
          description: `Lead time exceeds available time`,
          severity: 'critical',
          impact: 'Order cannot be completed on time',
          mitigation: 'Expedite shipping or find alternative supplier'
        });
      }

      // Check safety stock constraints
      if (requirement.availableQty < requirement.safetyStock) {
        constraints.push({
          type: 'safety_stock',
          description: `Safety stock level breached`,
          severity: 'medium',
          impact: 'Risk of stockout',
          mitigation: 'Increase safety stock or expedite orders'
        });
      }

      // Check cost constraints
      if (requirement.cost > 10000) { // Example cost threshold
        constraints.push({
          type: 'cost',
          description: `High material cost`,
          severity: 'low',
          impact: 'Budget impact',
          mitigation: 'Negotiate better pricing or find alternatives'
        });
      }

      requirement.constraints = constraints;
    }

    return constrainedRequirements;
  }

  private optimizeProcurement(materialRequirements: MaterialRequirement[]): MaterialRequirement[] {
    const optimizedRequirements = [...materialRequirements];

    // Group by supplier for optimization
    const supplierGroups = this.groupBySupplier(optimizedRequirements);

    for (const [supplierId, requirements] of supplierGroups) {
      const supplier = this.supplierDatabase.get(supplierId);
      if (!supplier) continue;

      // Check if total requirements exceed supplier capacity
      const totalRequired = requirements.reduce((sum, req) => sum + req.orderQty, 0);
      
      if (totalRequired > supplier.availableCapacity) {
        // Optimize by priority and constraints
        const sortedRequirements = requirements.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        let remainingCapacity = supplier.availableCapacity;
        
        for (const requirement of sortedRequirements) {
          if (remainingCapacity >= requirement.orderQty) {
            remainingCapacity -= requirement.orderQty;
          } else {
            // Reduce order quantity to fit capacity
            requirement.orderQty = remainingCapacity;
            requirement.constraints.push({
              type: 'supplier_capacity',
              description: `Order quantity reduced due to supplier capacity`,
              severity: 'high',
              impact: 'Partial fulfillment',
              mitigation: 'Find alternative supplier for remaining quantity'
            });
            remainingCapacity = 0;
          }
        }
      }
    }

    return optimizedRequirements;
  }

  private groupBySupplier(requirements: MaterialRequirement[]): Map<string, MaterialRequirement[]> {
    const groups = new Map<string, MaterialRequirement[]>();
    
    for (const requirement of requirements) {
      if (!groups.has(requirement.supplierId)) {
        groups.set(requirement.supplierId, []);
      }
      groups.get(requirement.supplierId)!.push(requirement);
    }
    
    return groups;
  }

  private identifyMaterialConstraints(
    component: BOMComponent, 
    inventory: InventoryItem, 
    supplier: Supplier
  ): MaterialConstraint[] {
    const constraints: MaterialConstraint[] = [];

    // Check if material is critical
    if (component.critical && inventory.availableStock < component.quantity) {
      constraints.push({
        type: 'quality',
        description: 'Critical component with low stock',
        severity: 'high',
        impact: 'Production risk',
        mitigation: 'Expedite procurement'
      });
    }

    // Check supplier constraints
    for (const constraint of supplier.constraints) {
      constraints.push({
        type: constraint.type as any,
        description: constraint.description,
        severity: constraint.impact as any,
        impact: constraint.impact,
        mitigation: constraint.mitigation
      });
    }

    return constraints;
  }

  private calculateTotalCost(requirements: MaterialRequirement[]): number {
    return requirements.reduce((total, req) => total + req.cost, 0);
  }

  private identifyCriticalPath(requirements: MaterialRequirement[]): MaterialRequirement[] {
    return requirements.filter(req => req.criticalPath);
  }

  private identifyConstraints(requirements: MaterialRequirement[]): MaterialConstraint[] {
    const allConstraints: MaterialConstraint[] = [];
    
    for (const requirement of requirements) {
      allConstraints.push(...requirement.constraints);
    }
    
    return allConstraints;
  }

  private generateRecommendations(requirements: MaterialRequirement[], order: Order): string[] {
    const recommendations: string[] = [];

    // Check for critical path items
    const criticalItems = requirements.filter(req => req.criticalPath);
    if (criticalItems.length > 0) {
      recommendations.push('Expedite critical path materials');
    }

    // Check for capacity constraints
    const capacityConstraints = requirements.filter(req => 
      req.constraints.some(c => c.type === 'supplier_capacity')
    );
    if (capacityConstraints.length > 0) {
      recommendations.push('Consider alternative suppliers for capacity-constrained items');
    }

    // Check for lead time issues
    const leadTimeIssues = requirements.filter(req => 
      req.constraints.some(c => c.type === 'lead_time')
    );
    if (leadTimeIssues.length > 0) {
      recommendations.push('Expedite shipping for lead-time-constrained items');
    }

    // Check for high-cost items
    const highCostItems = requirements.filter(req => req.cost > 5000);
    if (highCostItems.length > 0) {
      recommendations.push('Negotiate pricing for high-cost materials');
    }

    return recommendations;
  }

  private assessFeasibility(requirements: MaterialRequirement[]): 'feasible' | 'constrained' | 'infeasible' {
    const criticalConstraints = requirements.filter(req => 
      req.constraints.some(c => c.severity === 'critical')
    );

    if (criticalConstraints.length > 0) {
      return 'infeasible';
    }

    const highConstraints = requirements.filter(req => 
      req.constraints.some(c => c.severity === 'high')
    );

    if (highConstraints.length > 0) {
      return 'constrained';
    }

    return 'feasible';
  }

  private calculateCompletionDate(requirements: MaterialRequirement[], orderDueDate: Date): Date {
    const maxLeadTime = Math.max(...requirements.map(req => req.leadTime));
    const completionDate = new Date(orderDueDate);
    completionDate.setDate(completionDate.getDate() + maxLeadTime);
    return completionDate;
  }

  private assessRiskLevel(requirements: MaterialRequirement[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalConstraints = requirements.filter(req => 
      req.constraints.some(c => c.severity === 'critical')
    );

    const highConstraints = requirements.filter(req => 
      req.constraints.some(c => c.severity === 'high')
    );

    if (criticalConstraints.length > 0) {
      return 'critical';
    }

    if (highConstraints.length > 2) {
      return 'high';
    }

    if (highConstraints.length > 0) {
      return 'medium';
    }

    return 'low';
  }

  private createMRPEvent(order: Order, result: MRPResult): void {
    const mrpEvent = OrderEventFactory.createPOGenerated(
      order.orderId,
      {
        mrpResult: result,
        orderData: order,
        timestamp: new Date()
      },
      'default' // organizationId
    );

    eventStore.append(mrpEvent);
  }

  // Public methods for external access
  addBOM(bom: BillOfMaterials): void {
    this.bomDatabase.set(bom.productId, bom);
  }

  updateInventory(inventory: InventoryItem): void {
    this.inventoryDatabase.set(inventory.materialId, inventory);
  }

  addSupplier(supplier: Supplier): void {
    this.supplierDatabase.set(supplier.supplierId, supplier);
  }

  getBOM(productId: string): BillOfMaterials | undefined {
    return this.bomDatabase.get(productId);
  }

  getInventory(materialId: string): InventoryItem | undefined {
    return this.inventoryDatabase.get(materialId);
  }

  getSupplier(supplierId: string): Supplier | undefined {
    return this.supplierDatabase.get(supplierId);
  }

  getAllBOMs(): BillOfMaterials[] {
    return Array.from(this.bomDatabase.values());
  }

  getAllInventory(): InventoryItem[] {
    return Array.from(this.inventoryDatabase.values());
  }

  getAllSuppliers(): Supplier[] {
    return Array.from(this.supplierDatabase.values());
  }
}

// Global MRP Engine instance
export const mrpEngine = new MRPEngine(); 