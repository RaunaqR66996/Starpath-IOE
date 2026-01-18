import { NextResponse } from 'next/server';
import { PlannerEngine } from '@starpath/planner';
import { createClient } from '@supabase/supabase-js';

import {
    DEMO_ITEMS, DEMO_ROUTINGS, DEMO_WORK_CENTERS, DEMO_BOMS, DEMO_SALES_ORDERS, generateDemoCalendars
} from '@starpath/shared';

// Init Supabase (Mocked if env missing for now)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
);

export async function POST(request: Request) {

    // 2. Instantiate Engine
    const engine = new PlannerEngine({
        horizonStart: new Date(),
        horizonDays: 14,
        // Map centralized demo orders to Planner's SimpleOrder format
        orders: DEMO_SALES_ORDERS.map(o => ({
            id: o.id,
            order_id: o.id,
            // Same logic as IOE Chat for consistency
            item_id: (o.id === 'so-103' ? 'item-fg-002' : 'item-fg-001'),
            qty: (o.id === 'so-103' ? 50 : (o.id === 'so-101' ? 10 : 5)),
            due_date: new Date(o.due_date),
            priority: o.priority
        })),
        items: DEMO_ITEMS,
        boms: DEMO_BOMS,
        routings: DEMO_ROUTINGS,
        workCenters: DEMO_WORK_CENTERS,
        calendars: generateDemoCalendars(14),
        inventory: []
    });

    // 3. Run
    const result = engine.run();

    // 4. Save Result (Optional / Async)
    // await supabase.from('plans').insert(...)

    // 5. Return to UI
    return NextResponse.json(result);
}
