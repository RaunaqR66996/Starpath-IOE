import { z } from 'zod';
export * from './demo-data'; // Demo Data

// --- Enums ---
export const MakeBuyEnum = z.enum(['MAKE', 'BUY']);
export type MakeBuy = z.infer<typeof MakeBuyEnum>;

export const OrderStatusEnum = z.enum(['OPEN', 'PLANNED', 'COMPLETED', 'LATE']);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

// --- Master Data Schemas ---

export const ItemSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    sku: z.string(),
    name: z.string(),
    type: MakeBuyEnum,
    cost: z.number().min(0),
    lead_time_days: z.number().min(0),
});
export type Item = z.infer<typeof ItemSchema>;

export const WorkCenterSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    name: z.string(),
    code: z.string(), // e.g. "WC01"
    zoneId: z.string().uuid().optional(),
});
export type WorkCenter = z.infer<typeof WorkCenterSchema>;

export const RoutingSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    item_id: z.string().uuid(),
    work_center_id: z.string().uuid(),
    cycle_time_mins: z.number().min(0),
    setup_time_mins: z.number().min(0),
});
export type Routing = z.infer<typeof RoutingSchema>;

export const BomSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    parent_item_id: z.string().uuid(),
    child_item_id: z.string().uuid(),
    qty: z.number().positive(),
});
export type Bom = z.infer<typeof BomSchema>;

export const CalendarSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    work_center_id: z.string().uuid(),
    date: z.string(), // ISO Date string YYYY-MM-DD
    shift_id: z.number().int().default(1),
    capacity_mins: z.number().min(0),
});
export type Calendar = z.infer<typeof CalendarSchema>;

// --- Transactional Schemas ---

export const SalesOrderSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    customer: z.string(),
    due_date: z.string().datetime(), // ISO string
    priority: z.number().min(1).max(100),
});
export type SalesOrder = z.infer<typeof SalesOrderSchema>;

export const SalesOrderLineSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    so_id: z.string().uuid(),
    item_id: z.string().uuid(),
    qty: z.number().positive(),
});
export type SalesOrderLine = z.infer<typeof SalesOrderLineSchema>;

export const InventorySchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    item_id: z.string().uuid(),
    qty: z.number(),
    location: z.string().optional(),
    zoneId: z.string().uuid().optional(),
    status: z.string().default('AVAILABLE'), // Aha #2
    locked: z.boolean().default(false),      // Aha #2
});
export type Inventory = z.infer<typeof InventorySchema>;

// --- Planning Schemas ---

export const PlanLineSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    plan_id: z.string().uuid(),
    item_id: z.string().uuid(),
    work_center_id: z.string().uuid(),
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
    qty: z.number().positive(),
    reason_json: z.object({
        decision: z.string(),
        constraint_hit: z.string().optional(),
        msg: z.string(),
    }).optional(),
});
export type PlanLine = z.infer<typeof PlanLineSchema>;

export const AlertSchema = z.object({
    id: z.string().uuid(),
    org_id: z.string().uuid(),
    plan_id: z.string().uuid(),
    type: z.enum(['LATE_ORDER', 'CAPACITY_OVERLOAD', 'MATERIAL_SHORTAGE', 'STOCKOUT_PREDICTED', 'BOTTLENECK_WARNING', 'STOCK_BLOCKED']),
    message: z.string(),
    data_json: z.record(z.any()).optional(),
});
export type Alert = z.infer<typeof AlertSchema>;

// --- API Payloads ---

export const ZoneSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
    x: z.number(),
    y: z.number(),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const TransitTimeSchema = z.object({
    fromZoneId: z.string().uuid(),
    toZoneId: z.string().uuid(),
    minutes: z.number().int().min(0),
});
export type TransitTime = z.infer<typeof TransitTimeSchema>;

export const RunPlanRequestSchema = z.object({
    scenario_id: z.string().uuid().optional(),
    parameters: z.object({
        horizon_days: z.number().default(14),
    }).optional(),
});
export type RunPlanRequest = z.infer<typeof RunPlanRequestSchema>;
