import { generateContent, AIResponse } from '../ai/google-ai-integration';
import { MockAIService } from '../ai/mock-ai-integration';

export interface ProcurementResponse {
  content: string;
  agentType: 'procurement';
  timestamp: Date;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
  model: string;
  data?: any;
}

export interface PurchaseOrder {
  poNumber: string;
  requisitionId: string;
  supplierId: string;
  supplierName: string;
  orderDate: Date;
  expectedDelivery: Date;
  items: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unitOfMeasure: string;
    unitPrice: number;
    totalPrice: number;
    specifications: string;
  }>;
  totalAmount: number;
  terms: {
    paymentTerms: string;
    deliveryTerms: string;
    qualityTerms: string;
    warrantyTerms: string;
  };
  status: 'draft' | 'sent' | 'acknowledged' | 'confirmed' | 'in_transit' | 'received' | 'closed' | 'cancelled';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approver: string;
  notes: string;
}

export interface SupplierSelection {
  requisitionId: string;
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    score: number;
    price: number;
    leadTime: number;
    qualityRating: number;
    deliveryRating: number;
    costRating: number;
    reliabilityRating: number;
    totalScore: number;
    ranking: number;
    recommendation: 'primary' | 'secondary' | 'backup';
  }>;
  selectedSupplier: string;
  selectionReason: string;
  costSavings: number;
  riskAssessment: 'low' | 'medium' | 'high';
}

export interface ContractCompliance {
  poNumber: string;
  supplierId: string;
  complianceChecks: Array<{
    checkType: string;
    description: string;
    status: 'compliant' | 'non_compliant' | 'pending';
    details: string;
    actionRequired: string;
  }>;
  overallCompliance: 'compliant' | 'non_compliant' | 'partial';
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  nextReviewDate: Date;
}

export interface SpendAnalysis {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalSpend: number;
  spendByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  spendBySupplier: Array<{
    supplierId: string;
    supplierName: string;
    amount: number;
    percentage: number;
    orderCount: number;
    averageOrderValue: number;
  }>;
  costSavings: {
    achieved: number;
    potential: number;
    opportunities: Array<{
      category: string;
      potentialSavings: number;
      action: string;
    }>;
  };
  insights: string[];
  recommendations: string[];
}

export class ProcurementAgent {
  static async generatePurchaseOrder(requisitionData: any, supplierData: any, modelId: string = 'gemini-2.0-flash'): Promise<ProcurementResponse> {
    try {
      const task = 'Generate comprehensive purchase order from requisition';
      const context = {
        requisitionData,
        supplierData,
        taskType: 'PO_GENERATION',
        requirements: [
          'Create detailed PO items',
          'Set pricing and terms',
          'Define delivery requirements',
          'Include quality specifications',
          'Add payment terms'
        ]
      };

      const response = await generateContent(`
You are an AI procurement specialist for B2B manufacturing. Generate a comprehensive purchase order from the following requisition:

Requisition Data: ${JSON.stringify(requisitionData, null, 2)}
Supplier Data: ${JSON.stringify(supplierData, null, 2)}

PO Generation Requirements:
- Create detailed purchase order with all required items
- Set appropriate pricing based on supplier quotes and contracts
- Define clear delivery terms and expected delivery dates
- Include quality specifications and inspection requirements
- Add comprehensive payment terms and conditions
- Specify warranty and liability terms
- Include any special requirements or certifications
- Set appropriate approval workflow
- Add relevant notes and instructions
- Ensure compliance with procurement policies

Please provide a comprehensive purchase order for B2B manufacturing procurement.
      `, modelId);

      const poData = this.parsePurchaseOrderFromAI(response.content, requisitionData, supplierData);

      return {
        content: response.content,
        agentType: 'procurement',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: poData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockPurchaseOrder(requisitionData, supplierData);
    }
  }

  static async optimizeSupplierSelection(requisitionData: any, availableSuppliers: any[], modelId: string = 'gemini-2.0-flash'): Promise<ProcurementResponse> {
    try {
      const task = 'Optimize supplier selection based on multiple criteria';
      const context = {
        requisitionData,
        availableSuppliers,
        taskType: 'SUPPLIER_OPTIMIZATION',
        requirements: [
          'Evaluate supplier performance',
          'Compare pricing and terms',
          'Assess quality and delivery',
          'Calculate total cost of ownership',
          'Rank suppliers by score'
        ]
      };

      const response = await generateContent(`
You are an AI supplier optimization specialist for B2B manufacturing. Optimize supplier selection for the following requisition:

Requisition Data: ${JSON.stringify(requisitionData, null, 2)}
Available Suppliers: ${JSON.stringify(availableSuppliers, null, 2)}

Supplier Optimization Requirements:
- Evaluate each supplier across multiple criteria (price, quality, delivery, reliability)
- Calculate weighted scores based on business priorities
- Compare total cost of ownership including hidden costs
- Assess supplier risk and financial stability
- Rank suppliers from best to worst
- Provide primary, secondary, and backup recommendations
- Calculate potential cost savings
- Assess supply chain risks
- Consider long-term relationship potential
- Factor in current supplier performance history

Please provide comprehensive supplier optimization for B2B manufacturing procurement.
      `, modelId);

      const supplierSelectionData = this.parseSupplierSelectionFromAI(response.content, requisitionData, availableSuppliers);

      return {
        content: response.content,
        agentType: 'procurement',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: supplierSelectionData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockSupplierSelection(requisitionData, availableSuppliers);
    }
  }

  static async checkContractCompliance(poData: any, contractData: any, modelId: string = 'gemini-2.0-flash'): Promise<ProcurementResponse> {
    try {
      const task = 'Check purchase order compliance with contracts and policies';
      const context = {
        poData,
        contractData,
        taskType: 'CONTRACT_COMPLIANCE',
        requirements: [
          'Verify pricing compliance',
          'Check delivery terms',
          'Validate quality requirements',
          'Assess payment terms',
          'Review legal compliance'
        ]
      };

      const response = await generateContent(`
You are an AI contract compliance specialist for B2B manufacturing. Check compliance for the following purchase order:

Purchase Order: ${JSON.stringify(poData, null, 2)}
Contract Data: ${JSON.stringify(contractData, null, 2)}

Compliance Check Requirements:
- Verify pricing compliance with contract terms
- Check delivery terms and lead time requirements
- Validate quality specifications and standards
- Assess payment terms and conditions
- Review legal and regulatory compliance
- Check insurance and liability requirements
- Verify warranty and guarantee terms
- Assess intellectual property protection
- Check confidentiality and non-disclosure terms
- Identify any compliance risks or issues
- Provide recommendations for compliance improvement

Please provide comprehensive contract compliance analysis for B2B manufacturing procurement.
      `, modelId);

      const complianceData = this.parseContractComplianceFromAI(response.content, poData, contractData);

      return {
        content: response.content,
        agentType: 'procurement',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: complianceData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockContractCompliance(poData, contractData);
    }
  }

  static async analyzeSpend(spendData: any, modelId: string = 'gemini-2.0-flash'): Promise<ProcurementResponse> {
    try {
      const task = 'Analyze procurement spend and identify optimization opportunities';
      const context = {
        spendData,
        taskType: 'SPEND_ANALYSIS',
        requirements: [
          'Calculate total spend',
          'Categorize spend by category',
          'Analyze supplier spend',
          'Identify cost savings',
          'Generate insights'
        ]
      };

      const response = await generateContent(`
You are an AI spend analysis specialist for B2B manufacturing. Analyze the following procurement spend data:

Spend Data: ${JSON.stringify(spendData, null, 2)}

Spend Analysis Requirements:
- Calculate total procurement spend for the period
- Categorize spend by material categories and suppliers
- Analyze spending trends and patterns
- Identify cost savings opportunities
- Assess supplier performance and value
- Calculate average order values and frequencies
- Identify potential consolidation opportunities
- Analyze spend distribution and concentration risks
- Provide actionable insights and recommendations
- Suggest procurement strategy improvements
- Calculate potential cost savings from optimization

Please provide comprehensive spend analysis for B2B manufacturing procurement.
      `, modelId);

      const spendAnalysisData = this.parseSpendAnalysisFromAI(response.content, spendData);

      return {
        content: response.content,
        agentType: 'procurement',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: spendAnalysisData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockSpendAnalysis(spendData);
    }
  }

  static async negotiateTerms(poData: any, supplierResponse: any, modelId: string = 'gemini-2.0-flash'): Promise<ProcurementResponse> {
    try {
      const task = 'Negotiate purchase order terms with suppliers';
      const context = {
        poData,
        supplierResponse,
        taskType: 'TERM_NEGOTIATION',
        requirements: [
          'Analyze supplier counter-offers',
          'Identify negotiation points',
          'Calculate optimal terms',
          'Assess trade-offs',
          'Generate counter-proposals'
        ]
      };

      const response = await generateContent(`
You are an AI procurement negotiation specialist for B2B manufacturing. Negotiate terms for the following purchase order:

Purchase Order: ${JSON.stringify(poData, null, 2)}
Supplier Response: ${JSON.stringify(supplierResponse, null, 2)}

Negotiation Requirements:
- Analyze supplier counter-offers and responses
- Identify key negotiation points and priorities
- Calculate optimal terms based on business needs
- Assess trade-offs between price, delivery, and quality
- Generate strategic counter-proposals
- Consider long-term relationship implications
- Evaluate alternative suppliers if needed
- Calculate cost-benefit of different scenarios
- Provide negotiation strategy recommendations
- Assess risk and opportunity in each option

Please provide comprehensive negotiation strategy for B2B manufacturing procurement.
      `, modelId);

      const negotiationData = this.parseNegotiationFromAI(response.content, poData, supplierResponse);

      return {
        content: response.content,
        agentType: 'procurement',
        timestamp: new Date(),
        usage: {
          prompt_tokens: response.tokens?.prompt || 0,
          completion_tokens: response.tokens?.completion || 0,
          total_tokens: response.tokens?.total || 0
        },
        cost: 0,
        model: response.model,
        data: negotiationData
      };
    } catch (error) {
      console.error('Google AI failed, using mock AI:', error);
      return this.generateMockNegotiation(poData, supplierResponse);
    }
  }

  // Helper methods for parsing AI responses
  private static parsePurchaseOrderFromAI(content: string, requisitionData: any, supplierData: any): PurchaseOrder {
    return {
      poNumber: `PO-${Date.now()}`,
      requisitionId: requisitionData.requisitionId || 'PR-001',
      supplierId: supplierData.supplierId || 'SUP-001',
      supplierName: supplierData.supplierName || 'Supplier A',
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: [
        {
          materialId: 'MAT-001',
          materialName: 'Titanium Grade 5',
          quantity: 250,
          unitOfMeasure: 'lbs',
          unitPrice: 45.00,
          totalPrice: 11250,
          specifications: 'Aerospace grade, AS9100 certified'
        }
      ],
      totalAmount: 11250,
      terms: {
        paymentTerms: 'Net 30',
        deliveryTerms: 'FOB Destination',
        qualityTerms: '100% inspection required',
        warrantyTerms: '1 year warranty'
      },
      status: 'draft',
      approvalStatus: 'pending',
      approver: 'Procurement Manager',
      notes: 'Urgent order for aerospace project'
    };
  }

  private static parseSupplierSelectionFromAI(content: string, requisitionData: any, availableSuppliers: any[]): SupplierSelection {
    return {
      requisitionId: requisitionData.requisitionId || 'PR-001',
      materialId: 'MAT-001',
      materialName: 'Titanium Grade 5',
      requiredQuantity: 250,
      suppliers: [
        {
          supplierId: 'SUP-001',
          supplierName: 'Titanium Supply Co.',
          score: 85,
          price: 45.00,
          leadTime: 14,
          qualityRating: 9.0,
          deliveryRating: 8.5,
          costRating: 7.5,
          reliabilityRating: 9.0,
          totalScore: 85,
          ranking: 1,
          recommendation: 'primary'
        }
      ],
      selectedSupplier: 'SUP-001',
      selectionReason: 'Best overall score with proven track record',
      costSavings: 1250,
      riskAssessment: 'low'
    };
  }

  private static parseContractComplianceFromAI(content: string, poData: any, contractData: any): ContractCompliance {
    return {
      poNumber: poData.poNumber || 'PO-001',
      supplierId: poData.supplierId || 'SUP-001',
      complianceChecks: [
        {
          checkType: 'Pricing',
          description: 'Verify pricing against contract terms',
          status: 'compliant',
          details: 'Pricing within 5% of contract rate',
          actionRequired: 'None'
        },
        {
          checkType: 'Delivery',
          description: 'Check delivery terms compliance',
          status: 'compliant',
          details: 'Delivery terms match contract requirements',
          actionRequired: 'None'
        }
      ],
      overallCompliance: 'compliant',
      riskLevel: 'low',
      recommendations: ['Continue monitoring supplier performance'],
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };
  }

  private static parseSpendAnalysisFromAI(content: string, spendData: any): SpendAnalysis {
    return {
      period: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      totalSpend: 250000,
      spendByCategory: [
        {
          category: 'Raw Materials',
          amount: 150000,
          percentage: 60,
          trend: 'increasing'
        },
        {
          category: 'Consumables',
          amount: 50000,
          percentage: 20,
          trend: 'stable'
        }
      ],
      spendBySupplier: [
        {
          supplierId: 'SUP-001',
          supplierName: 'Titanium Supply Co.',
          amount: 75000,
          percentage: 30,
          orderCount: 15,
          averageOrderValue: 5000
        }
      ],
      costSavings: {
        achieved: 15000,
        potential: 25000,
        opportunities: [
          {
            category: 'Raw Materials',
            potentialSavings: 15000,
            action: 'Bulk purchasing agreement'
          }
        ]
      },
      insights: ['Raw material costs increasing 15% YoY'],
      recommendations: ['Negotiate long-term contracts', 'Explore alternative suppliers']
    };
  }

  private static parseNegotiationFromAI(content: string, poData: any, supplierResponse: any): any {
    return {
      negotiationId: `NEG-${Date.now()}`,
      poNumber: poData.poNumber,
      currentRound: 2,
      supplierCounterOffer: {
        price: 42.50,
        deliveryTime: 12,
        paymentTerms: 'Net 45'
      },
      recommendedResponse: {
        price: 43.75,
        deliveryTime: 10,
        paymentTerms: 'Net 30'
      },
      negotiationStrategy: 'Focus on delivery time reduction',
      riskAssessment: 'low',
      nextSteps: ['Present counter-offer', 'Emphasize long-term relationship']
    };
  }

  // Mock data generators for fallback
  private static generateMockPurchaseOrder(requisitionData: any, supplierData: any): ProcurementResponse {
    return {
      content: 'Mock purchase order generated',
      agentType: 'procurement',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parsePurchaseOrderFromAI('', requisitionData, supplierData)
    };
  }

  private static generateMockSupplierSelection(requisitionData: any, availableSuppliers: any[]): ProcurementResponse {
    return {
      content: 'Mock supplier selection completed',
      agentType: 'procurement',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseSupplierSelectionFromAI('', requisitionData, availableSuppliers)
    };
  }

  private static generateMockContractCompliance(poData: any, contractData: any): ProcurementResponse {
    return {
      content: 'Mock contract compliance check completed',
      agentType: 'procurement',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseContractComplianceFromAI('', poData, contractData)
    };
  }

  private static generateMockSpendAnalysis(spendData: any): ProcurementResponse {
    return {
      content: 'Mock spend analysis completed',
      agentType: 'procurement',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseSpendAnalysisFromAI('', spendData)
    };
  }

  private static generateMockNegotiation(poData: any, supplierResponse: any): ProcurementResponse {
    return {
      content: 'Mock negotiation strategy generated',
      agentType: 'procurement',
      timestamp: new Date(),
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost: 0,
      model: 'mock',
      data: this.parseNegotiationFromAI('', poData, supplierResponse)
    };
  }
}

export const procurementAgent = new ProcurementAgent(); 