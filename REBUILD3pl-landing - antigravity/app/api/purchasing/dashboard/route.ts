import { NextRequest, NextResponse } from 'next/server';
import { optionalAuth, AuthenticatedRequest } from '@/lib/auth/middleware';

async function handleGet(request: AuthenticatedRequest) {
  try {
    // Fix the URL issue by using the original request
    const url = new URL(request.url || 'http://localhost:3000/api/purchasing/dashboard');
    const { searchParams } = url;
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';
    const organizationId = request.user?.organizationId || searchParams.get('organizationId') || 'default';

    // Mock suppliers
    const suppliers = [
      {
        id: 'sup-1',
        name: 'Acme Components',
        category: 'electronics',
        overallScore: 86,
        qualityRating: 88,
        deliveryRating: 84,
        costRating: 82,
        reliabilityRating: 90,
        purchaseOrders: [{ id: 'po-1' }],
        averageDeliveryTime: 4.2,
        lastOrderDate: new Date(),
        riskLevel: 'low',
        certifications: '[]',
        location: 'TX',
        paymentTerms: 'Net 30',
        minimumOrder: 100
      }
    ];

    // Mock purchase orders
    const purchaseOrders = [
      {
        id: 'po-1',
        supplier: { name: 'Acme Components' },
        items: [
          { sku: 'SKU001', description: 'Widget', quantity: 100, unitPrice: 12.5 }
        ],
        totalAmount: 1250,
        status: 'approved',
        createdAt: new Date(),
        expectedDelivery: new Date(Date.now() + 7 * 86400000),
        priority: 'medium'
      }
    ];

    // Mock cost analysis and summary
    const costAnalysis = [
      {
        category: 'electronics',
        currentSpend: 50000,
        optimizedSpend: 42500,
        potentialSavings: 7500,
        savingsPercentage: 15,
        recommendations: ['Consolidate orders', 'Negotiate volume discounts']
      }
    ];

    const summary = {
      totalSuppliers: 12,
      activeOrders: 7,
      totalSpend: 120000,
      potentialSavings: 18000,
      averageDeliveryTime: 4.6
    };

    const recentExecutions = [] as any[];

    const dashboardData = {
      suppliers: suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        category: supplier.category,
        overallScore: supplier.overallScore,
        qualityRating: supplier.qualityRating,
        deliveryRating: supplier.deliveryRating,
        costRating: supplier.costRating,
        reliabilityRating: supplier.reliabilityRating,
        totalOrders: supplier.purchaseOrders.length,
        averageDeliveryTime: supplier.averageDeliveryTime,
        lastOrderDate: supplier.lastOrderDate,
        riskLevel: supplier.riskLevel,
        certifications: supplier.certifications ? JSON.parse(supplier.certifications) : [],
        location: supplier.location,
        paymentTerms: supplier.paymentTerms,
        minimumOrder: supplier.minimumOrder
      })),
      purchaseOrders: purchaseOrders.map(po => ({
        id: po.id,
        supplier: po.supplier.name,
        items: po.items.map(item => ({
          sku: item.sku,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        })),
        totalAmount: po.totalAmount,
        status: po.status,
        createdDate: po.createdAt,
        expectedDelivery: po.expectedDelivery,
        priority: po.priority
      })),
      costAnalysis,
      summary,
      recentExecutions
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching purchasing dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchasing dashboard data' },
      { status: 500 }
    );
  }
}

export const GET = optionalAuth(handleGet);

// The following functions are no-ops in the mock implementation to keep the file structure stable
async function calculateCostAnalysis(_: string) { return []; }
async function calculateSummaryMetrics(_: string) { return { totalSuppliers: 0, activeOrders: 0, totalSpend: 0, potentialSavings: 0, averageDeliveryTime: 0 }; }