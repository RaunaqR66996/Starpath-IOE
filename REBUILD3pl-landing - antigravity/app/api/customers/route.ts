import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/monitoring/logger'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const take = Number(searchParams.get('take') || 50)
    const skip = Number(searchParams.get('skip') || 0)
    const q = searchParams.get('q')?.trim()
    const organizationId = searchParams.get('organizationId') || 'default-org'

    // Build where clause
    const where: any = {
      organizationId,
      customerStatus: 'Active',
    }

    // Apply search filter
    if (q) {
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { contactEmail: { contains: q, mode: 'insensitive' } },
        { contactPhone: { contains: q } },
        { customerId: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Query customers from database
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: {
          customerName: 'asc',
        },
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ])

    // Transform to expected format
    const data = customers.map((customer) => ({
      id: customer.id,
      customerId: customer.customerId,
      name: customer.customerName,
      email: customer.contactEmail,
      phone: customer.contactPhone,
      address: `${customer.addressLine1}${customer.addressLine2 ? ', ' + customer.addressLine2 : ''}, ${customer.city}, ${customer.state} ${customer.zipCode}`,
      paymentTerms: customer.paymentTerms,
      isActive: customer.customerStatus === 'Active',
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    }))

    logger.info('Fetched customers', {
      organizationId,
      count: data.length,
      search: q,
    })

    return NextResponse.json({ success: true, total, data })
  } catch (error) {
    logger.error('Failed to fetch customers', error as Error)
    return NextResponse.json({ success: false, error: 'Failed to fetch customers' }, { status: 500 })
  }
}



