/**
 * Test endpoint to check integration connectivity
 * GET /api/integration/erp/test
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // Test 1: Database connection
  try {
    await prisma.$connect()
    results.tests.database = { status: 'connected', success: true }
  } catch (error) {
    results.tests.database = { 
      status: 'failed', 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 2: Prisma query
  try {
    const customerCount = await prisma.customer.count()
    results.tests.prismaQuery = { 
      status: 'success', 
      success: true,
      customerCount 
    }
  } catch (error) {
    results.tests.prismaQuery = { 
      status: 'failed', 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test 3: Environment variables
  results.tests.environment = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDefaultOrg: !!process.env.DEFAULT_ORGANIZATION_ID,
    defaultOrg: process.env.DEFAULT_ORGANIZATION_ID || 'not-set'
  }

  const allTestsPassed = Object.values(results.tests).every((test: any) => test.success !== false)

  return NextResponse.json({
    success: allTestsPassed,
    ...results
  })
}

