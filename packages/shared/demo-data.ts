import { Item, WorkCenter, Routing, Calendar, SalesOrder, Bom } from './index';

// A constant Org ID for the demo
export const DEMO_ORG_ID = 'demo-org-1';

// ---------------------------
// 1. ITEMS
// ---------------------------
export const DEMO_ITEMS: Item[] = [
    { id: 'item-fg-001', org_id: DEMO_ORG_ID, sku: 'FG-001', name: 'Pro Widget', type: 'MAKE', cost: 100, lead_time_days: 0 },
    { id: 'item-fg-002', org_id: DEMO_ORG_ID, sku: 'FG-002', name: 'Lite Widget', type: 'MAKE', cost: 50, lead_time_days: 0 },
    { id: 'item-sub-001', org_id: DEMO_ORG_ID, sku: 'SUB-001', name: 'Widget Frame', type: 'MAKE', cost: 20, lead_time_days: 0 },
    { id: 'item-raw-001', org_id: DEMO_ORG_ID, sku: 'RAW-001', name: 'Raw Metal', type: 'BUY', cost: 5, lead_time_days: 2 },
];

// ---------------------------
// 2. WORK CENTERS
// ---------------------------
export const DEMO_WORK_CENTERS: WorkCenter[] = [
    { id: 'wc-asy', org_id: DEMO_ORG_ID, name: 'Assembly Line', code: 'ASY' },
    { id: 'wc-paint', org_id: DEMO_ORG_ID, name: 'Painting Station', code: 'PAINT' },
];

// ---------------------------
// 3. ROUTINGS
// ---------------------------
export const DEMO_ROUTINGS: Routing[] = [
    // Pro Widget takes 60 mins on Assembly
    { id: 'rt-fg-001', org_id: DEMO_ORG_ID, item_id: 'item-fg-001', work_center_id: 'wc-asy', cycle_time_mins: 60, setup_time_mins: 15 },
    // Lite Widget takes 30 mins on Assembly
    { id: 'rt-fg-002', org_id: DEMO_ORG_ID, item_id: 'item-fg-002', work_center_id: 'wc-asy', cycle_time_mins: 30, setup_time_mins: 15 },
    // Widget Frame takes 45 mins on Paint
    { id: 'rt-sub-001', org_id: DEMO_ORG_ID, item_id: 'item-sub-001', work_center_id: 'wc-paint', cycle_time_mins: 45, setup_time_mins: 30 },
];

// ---------------------------
// 4. BILLS OF MATERIAL
// ---------------------------
export const DEMO_BOMS: Bom[] = [
    // Pro Widget -> 1 Frame, 2 Raw Metal
    { id: 'bom-1', org_id: DEMO_ORG_ID, parent_item_id: 'item-fg-001', child_item_id: 'item-sub-001', qty: 1 },
    { id: 'bom-2', org_id: DEMO_ORG_ID, parent_item_id: 'item-fg-001', child_item_id: 'item-raw-001', qty: 2 },
    // Widget Frame -> 1 Raw Metal
    { id: 'bom-3', org_id: DEMO_ORG_ID, parent_item_id: 'item-sub-001', child_item_id: 'item-raw-001', qty: 1 },
];

// ---------------------------
// 5. CALENDARS (Dynamic Generation Helper)
// ---------------------------
export function generateDemoCalendars(days = 14): Calendar[] {
    const cals: Calendar[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];

        // Assembly: 1 Shift (8 hours = 480 mins)
        cals.push({
            id: `cal-asy-${i}`,
            org_id: DEMO_ORG_ID,
            work_center_id: 'wc-asy',
            date: dateStr,
            shift_id: 1,
            capacity_mins: 480, // 8 hours
        });

        // Paint: 2 Shifts (16 hours = 960 mins)
        cals.push({
            id: `cal-paint-${i}`,
            org_id: DEMO_ORG_ID,
            work_center_id: 'wc-paint',
            date: dateStr,
            shift_id: 1,
            capacity_mins: 960, // 16 hours
        });
    }
    return cals;
}

// ---------------------------
// 6. SALES ORDERS (Scenarios)
// ---------------------------
export const DEMO_SALES_ORDERS: SalesOrder[] = [
    // 1. Standard Order (Due Day 5)
    {
        id: 'so-101',
        org_id: DEMO_ORG_ID,
        customer: 'Acme Corp',
        due_date: new Date(Date.now() + 86400000 * 5).toISOString(), // +5 days
        priority: 50 // Normal
    },
    // 2. Urgent Order (Same Due Date, Higher Priority) -> Should be scheduled FIRST
    {
        id: 'so-102',
        org_id: DEMO_ORG_ID,
        customer: 'Rush Delivery Inc',
        due_date: new Date(Date.now() + 86400000 * 5).toISOString(), // +5 days
        priority: 90 // High Priority
    },
    // 3. Bulk Order (Future)
    {
        id: 'so-103',
        org_id: DEMO_ORG_ID,
        customer: 'Massive Dynamics',
        due_date: new Date(Date.now() + 86400000 * 10).toISOString(), // +10 days
        priority: 30 // Low
    }
];

// Helper to expand SimpleOrders for Planner Engine (using the standard types)
// The engine expects a slightly different shape (SimpleOrder) than the SalesOrder DB schema
// We will do that mapping in the API route.
