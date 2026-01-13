import { PrismaClient } from '@prisma/client';
import { DemandPlanningAgent } from '../ai-agents/planning/planning-agent-system';

const prisma = new PrismaClient();

export interface MRPDemand {
  itemId: string;
  quantity: number;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  source: 'sales_order' | 'forecast' | 'safety_stock';
}

export interface MRPSupply {
  itemId: string;
  quantity: number;
  availableDate: Date;
  source: 'purchase_order' | 'work_order' | 'on_hand';
  cost: number;
}

export interface MRPResult {
  itemId: string;
  netRequirements: number;
  plannedOrders: MRPPlannedOrder[];
  shortages: MRPShortage[];
  recommendations: MRPRecommendation[];
}

export interface MRPPlannedOrder {
  type: 'purchase' | 'production';
  quantity: number;
  startDate: Date;
  dueDate: Date;
  supplierId?: string;
  bomId?: string;
  estimatedCost: number;
}

export interface MRPShortage {
  itemId: string;
  shortageQuantity: number;
  shortageDate: Date;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface MRPRecommendation {
  type: 'increase_safety_stock' | 'adjust_lead_time' | 'find_alternative_supplier' | 'expedite_order';
  itemId: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedSavings?: number;
}

export class EnhancedMRPEngine {
  private demandAgent: DemandPlanningAgent;
  private planningHorizon: number; // days
  private safetyStockMultiplier: number;

  constructor(planningHorizon: number = 90, safetyStockMultiplier: number = 1.5) {
    this.demandAgent = new DemandPlanningAgent('mrp-demand-agent');
    this.planningHorizon = planningHorizon;
    this.safetyStockMultiplier = safetyStockMultiplier;
  }

  async calculateMRP(organizationId: string, startDate: Date = new Date()): Promise<MRPResult[]> {
    try {
      // Get all active items for the organization
      const items = await prisma.item.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        include: {
          stockLevels: true,
          bomComponents: {
            include: {
              bom: true
            }
          }
        }
      });

      const results: MRPResult[] = [];

      for (const item of items) {
        const result = await this.calculateItemMRP(item, organizationId, startDate);
        results.push(result);
      }

      // Generate AI-powered recommendations
      const aiRecommendations = await this.generateAIRecommendations(results, organizationId);
      
      // Merge AI recommendations into results
      results.forEach(result => {
        const aiRecs = aiRecommendations.filter(rec => rec.itemId === result.itemId);
        result.recommendations.push(...aiRecs);
      });

      return results;
    } catch (error) {
      console.error('MRP calculation failed:', error);
      throw new Error(`MRP calculation failed: ${error.message}`);
    }
  }

  private async calculateItemMRP(
    item: any, 
    organizationId: string, 
    startDate: Date
  ): Promise<MRPResult> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + this.planningHorizon);

    // Get demand for the item
    const demand = await this.getDemand(item.id, organizationId, startDate, endDate);
    
    // Get supply for the item
    const supply = await this.getSupply(item.id, organizationId, startDate, endDate);
    
    // Get current inventory
    const currentInventory = await this.getCurrentInventory(item.id, organizationId);
    
    // Calculate net requirements
    const netRequirements = this.calculateNetRequirements(demand, supply, currentInventory);
    
    // Generate planned orders
    const plannedOrders = await this.generatePlannedOrders(item, netRequirements, organizationId);
    
    // Identify shortages
    const shortages = this.identifyShortages(netRequirements, item);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(item, shortages, demand, organizationId);

    return {
      itemId: item.id,
      netRequirements,
      plannedOrders,
      shortages,
      recommendations
    };
  }

  private async getDemand(
    itemId: string, 
    organizationId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<MRPDemand[]> {
    const demands: MRPDemand[] = [];

    // Get sales order demand
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        organizationId,
        expectedDelivery: {
          gte: startDate,
          lte: endDate
        },
        status: { in: ['pending'] }
      }
    });

    // SalesOrder doesn't have items relation in schema, so we'll skip for now
    // In a real implementation, this would be handled differently
    salesOrders.forEach(so => {
      // Mock demand calculation
      demands.push({
        itemId,
        quantity: 10, // Mock quantity
        dueDate: so.expectedDelivery || so.createdAt,
        priority: 'medium',
        source: 'sales_order'
      });
    });

    // Get forecasted demand (AI-powered)
    const forecastedDemand = await this.getForecastedDemand(itemId, organizationId, startDate, endDate);
    demands.push(...forecastedDemand);

    // Get safety stock demand
    const safetyStockDemand = await this.getSafetyStockDemand(itemId, organizationId);
    demands.push(...safetyStockDemand);

    return demands.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  private async getSupply(
    itemId: string, 
    organizationId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<MRPSupply[]> {
    const supplies: MRPSupply[] = [];

    // Get purchase order supply
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        organizationId,
        expectedDelivery: {
          gte: startDate,
          lte: endDate
        },
        status: { in: ['sent', 'approved'] }
      },
      include: {
        items: {
          where: { itemId }
        }
      }
    });

    purchaseOrders.forEach(po => {
      po.items.forEach(item => {
        const remainingQty = item.quantity; // No receivedQty field in schema
        if (remainingQty > 0) {
          supplies.push({
            itemId,
            quantity: remainingQty,
            availableDate: po.expectedDelivery || po.createdAt,
            source: 'purchase_order',
            cost: item.unitPrice * remainingQty
          });
        }
      });
    });

    // Get work order supply
    const workOrders = await prisma.workOrder.findMany({
      where: {
        organizationId,
        endDate: {
          gte: startDate,
          lte: endDate
        },
        status: { in: ['pending'] }
      }
    });

    workOrders.forEach(wo => {
      // WorkOrder doesn't have items relation in schema, so we'll skip for now
      // In a real implementation, this would be handled differently
    });

    return supplies.sort((a, b) => a.availableDate.getTime() - b.availableDate.getTime());
  }

  private async getCurrentInventory(itemId: string, organizationId: string): Promise<number> {
    const stockLevels = await prisma.stockLevel.findMany({
      where: {
        itemId,
        organizationId
      }
    });

    return stockLevels.reduce((total, level) => total + level.availableQuantity, 0);
  }

  private calculateNetRequirements(
    demand: MRPDemand[], 
    supply: MRPSupply[], 
    currentInventory: number
  ): { date: Date; quantity: number }[] {
    const netRequirements: { date: Date; quantity: number }[] = [];
    let availableInventory = currentInventory;

    // Create a timeline of events
    const events: Array<{ date: Date; type: 'demand' | 'supply'; quantity: number }> = [];

    demand.forEach(d => {
      events.push({ date: d.dueDate, type: 'demand', quantity: d.quantity });
    });

    supply.forEach(s => {
      events.push({ date: s.availableDate, type: 'supply', quantity: s.quantity });
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    events.forEach(event => {
      if (event.type === 'demand') {
        if (availableInventory < event.quantity) {
          const shortage = event.quantity - availableInventory;
          netRequirements.push({
            date: event.date,
            quantity: shortage
          });
          availableInventory = 0;
        } else {
          availableInventory -= event.quantity;
        }
      } else {
        availableInventory += event.quantity;
      }
    });

    return netRequirements;
  }

  private async generatePlannedOrders(
    item: any, 
    netRequirements: { date: Date; quantity: number }[], 
    organizationId: string
  ): Promise<MRPPlannedOrder[]> {
    const plannedOrders: MRPPlannedOrder[] = [];

    for (const requirement of netRequirements) {
      if (requirement.quantity <= 0) continue;

      // Determine if this is a purchased or manufactured item
      const isManufactured = item.bomComponents.length > 0;

      if (isManufactured) {
        // Generate production order
        const productionOrder = await this.generateProductionOrder(item, requirement, organizationId);
        plannedOrders.push(productionOrder);
      } else {
        // Generate purchase order
        const purchaseOrder = await this.generatePurchaseOrder(item, requirement, organizationId);
        plannedOrders.push(purchaseOrder);
      }
    }

    return plannedOrders;
  }

  private async generateProductionOrder(
    item: any, 
    requirement: { date: Date; quantity: number }, 
    organizationId: string
  ): Promise<MRPPlannedOrder> {
    // Find the most recent BOM for this item
    const bom = await prisma.bOM.findFirst({
      where: {
        productId: item.id,
        isActive: true
      },
      include: {
        components: {
          include: {
            item: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!bom) {
      throw new Error(`No active BOM found for item ${item.code}`);
    }

    // Calculate production lead time (simplified)
    const productionLeadTime = 5; // days
    const startDate = new Date(requirement.date);
    startDate.setDate(startDate.getDate() - productionLeadTime);

    // Calculate estimated cost based on BOM
    const componentCost = bom.components.reduce((total, comp) => {
      return total + (comp.item.cost * comp.quantity * requirement.quantity);
    }, 0);

    return {
      type: 'production',
      quantity: requirement.quantity,
      startDate,
      dueDate: requirement.date,
      bomId: bom.id,
      estimatedCost: componentCost
    };
  }

  private async generatePurchaseOrder(
    item: any, 
    requirement: { date: Date; quantity: number }, 
    organizationId: string
  ): Promise<MRPPlannedOrder> {
    // Find the best supplier for this item
    const supplier = await prisma.supplier.findFirst({
      where: {
        organizationId,
        isActive: true
      },
      orderBy: {
        overallScore: 'desc'
      }
    });

    if (!supplier) {
      throw new Error(`No active supplier found for organization ${organizationId}`);
    }

    // Calculate purchase lead time
    const purchaseLeadTime = Math.ceil(supplier.averageDeliveryTime) || 14; // days
    const orderDate = new Date(requirement.date);
    orderDate.setDate(orderDate.getDate() - purchaseLeadTime);

    return {
      type: 'purchase',
      quantity: requirement.quantity,
      startDate: orderDate,
      dueDate: requirement.date,
      supplierId: supplier.id,
      estimatedCost: item.cost * requirement.quantity
    };
  }

  private identifyShortages(
    netRequirements: { date: Date; quantity: number }[], 
    item: any
  ): MRPShortage[] {
    return netRequirements.map(req => ({
      itemId: item.id,
      shortageQuantity: req.quantity,
      shortageDate: req.date,
      impact: this.calculateShortageImpact(req.quantity, item)
    }));
  }

  private calculateShortageImpact(quantity: number, item: any): 'critical' | 'high' | 'medium' | 'low' {
    // Calculate impact based on quantity, item cost, and reorder point
    const shortageRatio = quantity / item.reorderPoint;
    
    if (shortageRatio > 2) return 'critical';
    if (shortageRatio > 1.5) return 'high';
    if (shortageRatio > 1) return 'medium';
    return 'low';
  }

  private async generateRecommendations(
    item: any, 
    shortages: MRPShortage[], 
    demand: MRPDemand[], 
    organizationId: string
  ): Promise<MRPRecommendation[]> {
    const recommendations: MRPRecommendation[] = [];

    // Analyze demand patterns
    const demandAnalysis = this.analyzeDemandPatterns(demand);
    
    if (demandAnalysis.volatility > 0.3) {
      recommendations.push({
        type: 'increase_safety_stock',
        itemId: item.id,
        description: `High demand volatility detected. Consider increasing safety stock by ${Math.round(demandAnalysis.volatility * 100)}%`,
        priority: 'medium',
        estimatedSavings: demandAnalysis.volatility * item.cost * 100
      });
    }

    // Check for frequent shortages
    const criticalShortages = shortages.filter(s => s.impact === 'critical');
    if (criticalShortages.length > 0) {
      recommendations.push({
        type: 'adjust_lead_time',
        itemId: item.id,
        description: `${criticalShortages.length} critical shortages detected. Consider reducing lead time or finding alternative suppliers.`,
        priority: 'high',
        estimatedSavings: criticalShortages.reduce((total, s) => total + s.shortageQuantity * item.cost, 0)
      });
    }

    return recommendations;
  }

  private async getForecastedDemand(
    itemId: string, 
    organizationId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<MRPDemand[]> {
    // Use AI agent to generate demand forecast
    try {
      const forecast = await this.demandAgent.generateDemandForecast(itemId, organizationId, startDate, endDate);
      
      return forecast.map(f => ({
        itemId,
        quantity: f.quantity,
        dueDate: f.date,
        priority: 'medium',
        source: 'forecast'
      }));
    } catch (error) {
      // Fallback to mock forecast if AI agent fails
      return [{
        itemId,
        quantity: 10,
        dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        source: 'forecast'
      }];
    }
  }

  private async getSafetyStockDemand(
    itemId: string, 
    organizationId: string
  ): Promise<MRPDemand[]> {
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item || item.reorderPoint <= 0) return [];

    return [{
      itemId,
      quantity: item.reorderPoint,
      dueDate: new Date(),
      priority: 'low',
      source: 'safety_stock'
    }];
  }

  private async generateAIRecommendations(
    results: MRPResult[], 
    organizationId: string
  ): Promise<MRPRecommendation[]> {
    // Use AI agent to generate strategic recommendations
    try {
      const aiRecommendations = await this.demandAgent.generateMRPRecommendations(results, organizationId);
      return aiRecommendations;
    } catch (error) {
      // Fallback to empty recommendations if AI agent fails
      return [];
    }
  }

  private mapOrderPriority(priority: string): 'high' | 'medium' | 'low' {
    switch (priority) {
      case 'high': return 'high';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private analyzeDemandPatterns(demand: MRPDemand[]): { volatility: number; trend: number } {
    if (demand.length < 2) return { volatility: 0, trend: 0 };

    const quantities = demand.map(d => d.quantity);
    const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / quantities.length;
    const volatility = Math.sqrt(variance) / mean;

    // Simple trend calculation
    const trend = quantities[quantities.length - 1] - quantities[0];

    return { volatility, trend };
  }
} 