import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Generate insights based on current data (no AI insights table yet)
    const generatedInsights = await generateInsightsFromData();
    return NextResponse.json(generatedInsights);
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI insights' },
      { status: 500 }
    );
  }
}

async function generateInsightsFromData() {
  try {
    const insights = [];

    // Check for shipments that might be delayed (past estimated delivery)
    const delayedShipments = await prisma.shipment.count({
      where: {
        status: { in: ['in_transit', 'picked_up', 'out_for_delivery'] },
        estimatedDelivery: { lt: new Date() }
      }
    });

    if (delayedShipments > 0) {
      insights.push({
        id: 'insight-1',
        type: 'risk',
        title: 'Shipment Delays Detected',
        description: `${delayedShipments} shipments are currently delayed. Consider rerouting or expediting.`,
        impact: 'high',
        confidence: 0.95,
        action: 'Review delayed shipments and take corrective action'
      });
    }

    // Check for high-value shipments that might need special attention
    const highValueShipments = await prisma.shipment.count({
      where: {
        totalValue: { gt: 10000 }
      }
    });

    if (highValueShipments > 0) {
      insights.push({
        id: 'insight-2',
        type: 'attention',
        title: 'High-Value Shipments',
        description: `${highValueShipments} high-value shipments require special monitoring.`,
        impact: 'medium',
        confidence: 0.90,
        action: 'Ensure proper tracking and insurance coverage'
      });
    }

    // Check for cost optimization opportunities
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    if (recentOrders > 10) {
      insights.push({
        id: 'insight-3',
        type: 'optimization',
        title: 'Route Optimization Opportunity',
        description: 'High order volume detected. Consider consolidating shipments for cost savings.',
        impact: 'medium',
        confidence: 0.85,
        action: 'Review shipment consolidation options'
      });
    }

    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
}










