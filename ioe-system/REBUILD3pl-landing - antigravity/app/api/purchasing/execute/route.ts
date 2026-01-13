import { NextRequest, NextResponse } from 'next/server';
import { PurchasingAgent } from '@/lib/ai-agents/purchasing-agent';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';

// Note: Phase 1 mock implementation – remove direct DB calls

// Validation schemas
const POGenerationSchema = z.object({
  supplierId: z.string(),
  items: z.array(z.object({
    sku: z.string(),
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive()
  })),
  deliveryDate: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  organizationId: z.string()
});

const SupplierComparisonSchema = z.object({
  category: z.string(),
  requirements: z.string(),
  budget: z.number().positive(),
  deliveryDate: z.string(),
  organizationId: z.string()
});

async function handlePost(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { taskType, parameters } = body;

    // Validate organization context
    const organizationId = request.user?.organizationId || parameters.organizationId || 'default';

    switch (taskType) {
      case 'PO_GENERATION':
        return await handlePOGeneration(parameters, organizationId);
      
      case 'SUPPLIER_COMPARISON':
        return await handleSupplierComparison(parameters, organizationId);
      
      case 'COST_ANALYSIS':
        return await handleCostAnalysis(parameters, organizationId);
      
      default:
        return NextResponse.json(
          { error: 'Unsupported task type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error executing purchasing task:', error);
    return NextResponse.json(
      { error: 'Failed to execute purchasing task' },
      { status: 500 }
    );
  }
}

async function handlePOGeneration(parameters: any, organizationId: string) {
  try {
    // Validate input
    const validatedParams = POGenerationSchema.parse(parameters);

    // Mock supplier
    const supplier = {
      id: validatedParams.supplierId,
      name: 'Acme Components',
      category: 'electronics',
      contact: {},
      paymentTerms: 'Net 30',
      address: {}
    } as any;

    // Calculate total amount
    const totalAmount = validatedParams.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice), 0
    );

    // Mock purchase order record
    const purchaseOrder = {
      id: 'po-' + Date.now(),
      organizationId,
      supplierId: validatedParams.supplierId,
      status: 'draft',
      totalAmount,
      expectedDelivery: new Date(validatedParams.deliveryDate),
      priority: validatedParams.priority,
      category: supplier.category,
      items: validatedParams.items
    } as any;

    // Execute AI agent for PO generation
    const aiResult = await PurchasingAgent.generatePurchaseOrder({
      selectedVendor: {
        id: supplier.id,
        name: supplier.name,
        contact: supplier.contact || {},
        paymentTerms: supplier.paymentTerms
      },
      items: validatedParams.items,
      deliveryDetails: {
        address: supplier.address || {},
        requiredDate: validatedParams.deliveryDate,
        shippingMethod: 'standard'
      },
      terms: {
        paymentTerms: supplier.paymentTerms,
        warrantyRequirements: 'standard',
        qualityStandards: supplier.certifications
      }
    }, parameters.modelId || 'gemini-2.0-flash');

    // Skip DB logging in Phase 1

    return NextResponse.json({
      success: true,
      purchaseOrderId: purchaseOrder.id,
      aiResult: aiResult.content,
      totalAmount,
      status: 'draft'
    });

  } catch (error) {
    console.error('Error generating purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to generate purchase order' },
      { status: 500 }
    );
  }
}

async function handleSupplierComparison(parameters: any, organizationId: string) {
  try {
    // Validate input
    const validatedParams = SupplierComparisonSchema.parse(parameters);

    // Mock suppliers list
    const suppliers = [
      { id: 'sup-1', name: 'Acme Components', basePrice: 10, qualityRating: 88, deliveryRating: 84, paymentTerms: 'Net 30', minimumOrder: 100, location: 'TX', certifications: '[]' },
      { id: 'sup-2', name: 'Beta Plastics', basePrice: 9.5, qualityRating: 82, deliveryRating: 80, paymentTerms: 'Net 45', minimumOrder: 200, location: 'CA', certifications: '[]' }
    ] as any[];

    if (suppliers.length === 0) {
      return NextResponse.json(
        { error: 'No suppliers found in this category' },
        { status: 404 }
      );
    }

    // Execute AI agent for supplier comparison
    const aiResult = await PurchasingAgent.evaluateVendors({
      vendors: suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        pricing: { base: supplier.basePrice || 0 },
        qualityRating: supplier.qualityRating,
        deliveryPerformance: supplier.deliveryRating,
        paymentTerms: supplier.paymentTerms,
        minimumOrder: supplier.minimumOrder,
        location: supplier.location,
        certifications: supplier.certifications
      })),
      requirements: {
        items: [{ sku: 'TBD', quantity: 1, specifications: {} }],
        budget: validatedParams.budget,
        deliveryDate: validatedParams.deliveryDate,
        qualityRequirements: ['standard']
      },
      evaluationCriteria: {
        costWeight: 0.3,
        qualityWeight: 0.3,
        deliveryWeight: 0.2,
        relationshipWeight: 0.2
      }
    }, parameters.modelId || 'gemini-2.0-flash');

    // Skip DB logging in Phase 1

    return NextResponse.json({
      success: true,
      suppliers: suppliers.length,
      aiResult: aiResult.content,
      recommendation: aiResult.content
    });

  } catch (error) {
    console.error('Error comparing suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to compare suppliers' },
      { status: 500 }
    );
  }
}

async function handleCostAnalysis(parameters: any, organizationId: string) {
  try {
    // Mock spend data
    const spendData = [
      { category: 'electronics', _sum: { totalAmount: 50000 } },
      { category: 'packaging', _sum: { totalAmount: 20000 } }
    ] as any[];

    // Execute AI agent for cost optimization
    const aiResult = await PurchasingAgent.optimizeCosts({
      currentSpend: Object.fromEntries(
        spendData.map(item => [item.category, Number(item._sum.totalAmount || 0)])
      ),
      vendorContracts: [],
      marketData: {
        commodityPrices: {},
        marketTrends: {},
        seasonalFactors: {}
      },
      constraints: {
        maxBudget: 1000000,
        qualityRequirements: ['standard'],
        supplierDiversification: true
      }
    }, parameters.modelId || 'gemini-2.0-flash');

    // Skip DB logging in Phase 1

    return NextResponse.json({
      success: true,
      aiResult: aiResult.content,
      recommendations: aiResult.content
    });

  } catch (error) {
    console.error('Error analyzing costs:', error);
    return NextResponse.json(
      { error: 'Failed to analyze costs' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handlePost); 