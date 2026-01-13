import { NextResponse } from 'next/server';
import { getOrders } from '@/lib/data-service';

export async function GET() {
    const orders = await getOrders();
    return NextResponse.json(orders);
}
