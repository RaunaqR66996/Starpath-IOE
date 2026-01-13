import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/data-service';

export async function GET() {
    const customers = await getCustomers();
    return NextResponse.json(customers);
}
