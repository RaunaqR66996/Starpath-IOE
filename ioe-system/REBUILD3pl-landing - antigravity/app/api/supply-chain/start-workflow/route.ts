import { NextRequest, NextResponse } from 'next/server'
import { supplyChainWorkflowEngine } from '@/lib/workflows/supply-chain-workflow-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { purchaseOrderId, customerId, organizationId } = body

    if (!purchaseOrderId || !customerId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: purchaseOrderId, customerId, organizationId'
      }, { status: 400 })
    }

    // Start the supply chain workflow
    const workflowId = await supplyChainWorkflowEngine.startWorkflow(
      purchaseOrderId,
      customerId,
      organizationId
    )

    return NextResponse.json({
      success: true,
      data: {
        workflowId,
        message: 'Supply chain workflow started successfully',
        status: 'processing'
      }
    })

  } catch (error: any) {
    console.error('Failed to start supply chain workflow:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to start supply chain workflow'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')

    if (workflowId) {
      // Get specific workflow status
      const workflow = supplyChainWorkflowEngine.getWorkflowStatus(workflowId)
      
      if (!workflow) {
        return NextResponse.json({
          success: false,
          error: 'Workflow not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: workflow
      })
    } else {
      // Get all workflows
      const workflows = supplyChainWorkflowEngine.getAllWorkflows()
      
      return NextResponse.json({
        success: true,
        data: workflows
      })
    }

  } catch (error: any) {
    console.error('Failed to get workflow status:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get workflow status'
    }, { status: 500 })
  }
}






