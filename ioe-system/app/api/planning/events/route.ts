import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        if (!dateStr) return NextResponse.json({ error: 'Date required' }, { status: 400 });

        const date = new Date(dateStr);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        // Parallel Fetch
        const [orders, productionOrders, purchaseOrders] = await Promise.all([
            // Outbound Orders (Due Date)
            db.order.findMany({
                where: {
                    requestedDeliveryDate: { gte: startOfDay, lt: endOfDay }
                },
                select: { id: true, erpReference: true, destination: true }
            }),
            // Production Orders
            db.productionOrder.findMany({
                where: {
                    startDate: { gte: startOfDay, lt: endOfDay }
                },
                select: { id: true, orderNumber: true, item: { select: { name: true } } }
            }),
            // Inbound POs
            db.purchaseOrder.findMany({
                where: {
                    expectedDate: { gte: startOfDay, lt: endOfDay }
                },
                select: { id: true, poNumber: true, supplier: { select: { name: true } } }
            })
        ]);

        const events = [
            ...orders.map(o => ({
                id: o.id,
                title: `Order ${o.erpReference}`,
                time: '12:00 PM',
                location: o.destination.substring(0, 15) + '...',
                color: 'bg-emerald-500',
                type: 'SHIPMENT'
            })),
            ...productionOrders.map(p => ({
                id: p.id,
                title: `Produce ${p.item.name}`,
                time: '08:00 AM',
                location: 'Factory Floor',
                color: 'bg-purple-500',
                type: 'PRODUCTION'
            })),
            ...purchaseOrders.map(po => ({
                id: po.id,
                title: `Receive ${po.poNumber}`,
                time: '10:00 AM',
                location: `Dock (${po?.supplier?.name || 'Unknown'})`,
                color: 'bg-blue-500',
                type: 'RECEIVING'
            }))
        ];

        return NextResponse.json({ events });

    } catch (error) {
        console.error('Events API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
