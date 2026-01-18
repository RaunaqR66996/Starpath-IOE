
import {
    SalesOrder, SalesOrderLine, WorkCenter, Routing, Calendar, Inventory, PlanLine, Alert,
    Item, Bom, Zone, TransitTime // Imported for Aha #3
} from '../../shared';
import { addMinutes, isBefore, isAfter, startOfDay, addDays, subMinutes } from 'date-fns';

export interface PlannerInput {
    horizonStart: Date;
    horizonDays: number;
    orders: SimpleOrder[];
    items: Item[];
    boms: Bom[];
    routings: Routing[];
    workCenters: WorkCenter[];
    calendars: Calendar[];
    inventory: Inventory[];
    zones: Zone[];          // New for Spatial Info
    transitTimes: TransitTime[]; // New for Spatial Info
}

// Simplified view of an order line for planning
export interface SimpleOrder {
    id: string; // Line ID
    order_id: string;
    item_id: string;
    qty: number;
    due_date: Date;
    priority: number;
}

export interface PlannerOutput {
    lines: PlanLine[];
    alerts: Alert[];
}

interface InventoryRecord {
    qty: number;
    zoneId?: string;
    status: string; // Aha #2
}

export class PlannerEngine {
    private input: PlannerInput;
    private output: PlannerOutput;
    private calendarMap: Map<string, Calendar[]>; // WC_ID -> Calendars sorted
    private usedCapacity: Map<string, number>; // WC_ID:Date -> used_mins
    private runningInventory: Map<string, InventoryRecord[]>; // ITEM_ID -> List of Stacks with Zone

    // Aha #3: Transit Matrix (FromZone -> ToZone -> Mins)
    private transitMatrix: Map<string, Map<string, number>>;

    constructor(input: PlannerInput) {
        this.input = input;
        this.output = { lines: [], alerts: [] };
        this.calendarMap = new Map();
        this.usedCapacity = new Map();
        this.runningInventory = new Map();
        this.transitMatrix = new Map();

        this.indexCalendars();
        this.initInventory();
        this.initTransitMatrix();
    }

    private indexCalendars() {
        for (const c of this.input.calendars) {
            const list = this.calendarMap.get(c.work_center_id) || [];
            list.push(c);
            this.calendarMap.set(c.work_center_id, list);
        }
        for (const [wc, list] of this.calendarMap) {
            list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
    }

    private initInventory() {
        for (const inv of this.input.inventory) {
            // Aggregate inventory by item AND stack (zone)
            // We store multiple stacks per item
            const stacks = this.runningInventory.get(inv.item_id) || [];
            stacks.push({ qty: inv.qty, zoneId: inv.zoneId, status: inv.status }); // Aha #2
            this.runningInventory.set(inv.item_id, stacks);
        }
    }

    private initTransitMatrix() {
        for (const t of this.input.transitTimes || []) {
            if (!this.transitMatrix.has(t.fromZoneId)) {
                this.transitMatrix.set(t.fromZoneId, new Map());
            }
            this.transitMatrix.get(t.fromZoneId)?.set(t.toZoneId, t.minutes);
        }
    }

    public run(): PlannerOutput {
        const sortedOrders = [...this.input.orders].sort((a, b) => {
            if (a.due_date.getTime() !== b.due_date.getTime()) {
                return a.due_date.getTime() - b.due_date.getTime();
            }
            return b.priority - a.priority;
        });

        for (const order of sortedOrders) {
            this.planOrder(order);
        }

        // Post-run analysis for Bottlenecks
        this.detectBottlenecks();

        return this.output;
    }

    private planOrder(order: SimpleOrder, constraintDate?: Date) {
        // 1. Check if we have stock to fulfill this WITHOUT production
        const routing = this.input.routings.find(r => r.item_id === order.item_id);

        // If no routing, it's a generic supply item (Raw Material) or Buy Item
        if (!routing) {
            // For Buy items, we consume inventory but check where it's needed?
            // "Needed" implies a parent order location. Since planOrder does not know parent location here easily unless passed.
            // But usually planOrder is top level or sub level.
            this.consumeInventory(order);
            return null;
        }

        const runTime = routing.cycle_time_mins * order.qty;
        const totalMins = routing.setup_time_mins + runTime;

        const relevantCalendars = this.calendarMap.get(routing.work_center_id) || [];

        let scheduled = false;

        // Find first day with available capacity
        for (const day of relevantCalendars) {
            const dayDate = new Date(day.date);

            // If we have a constraint (e.g. child must be done before parent), skip days after constraint
            if (constraintDate && isAfter(dayDate, constraintDate)) continue;

            const capacityKey = `${routing.work_center_id}:${day.date}`;
            const alreadyUsed = this.usedCapacity.get(capacityKey) || 0;
            const available = day.capacity_mins - alreadyUsed;

            if (available >= totalMins) {
                // Book it
                const start = new Date(day.date);
                start.setHours(8); // Default shift start
                const offsetStart = addMinutes(start, alreadyUsed);
                const end = addMinutes(offsetStart, totalMins);

                const planLine: PlanLine = {
                    id: crypto.randomUUID(),
                    org_id: this.input.workCenters[0]?.org_id || 'starpath',
                    plan_id: 'active-plan',
                    item_id: order.item_id,
                    work_center_id: routing.work_center_id,
                    start_time: offsetStart.toISOString(),
                    end_time: end.toISOString(),
                    qty: order.qty,
                    reason_json: {
                        decision: "SCHEDULED",
                        msg: `Finite Capacity OK. Used ${totalMins}m of ${day.capacity_mins}m available.`
                    }
                };

                this.output.lines.push(planLine);
                this.usedCapacity.set(capacityKey, alreadyUsed + totalMins);

                // Explode components
                // Pass current WC ID so children can check transit time to here
                this.explodeBOM(order, offsetStart, routing.work_center_id);

                scheduled = true;
                return offsetStart;
            }
        }

        if (!scheduled) {
            this.addAlert('CAPACITY_OVERLOAD', `No capacity for ${order.id} (${order.item_id})`, {
                required: totalMins,
                wc: routing.work_center_id
            });
        }
        return null;
    }

    private consumeInventory(order: SimpleOrder, destinationWcId?: string) {
        // Predictive Shock: Check if we will run out relative to current stock
        const stacks = this.runningInventory.get(order.item_id) || [];

        let remainingNeeded = order.qty;

        // Iterate through stacks to consume
        for (const stack of stacks) {
            if (remainingNeeded <= 0) break;

            // Aha #2: Alive Inventory Check
            if (stack.status !== 'AVAILABLE') {
                // We see it, but can't touch it. Alert!
                this.addAlert('STOCK_BLOCKED', `Stock ignored: ${stack.qty} units are ${stack.status}`, {
                    itemId: order.item_id,
                    qty: stack.qty,
                    status: stack.status,
                    zone: stack.zoneId
                });
                continue; // Skip this stack
            }

            const take = Math.min(stack.qty, remainingNeeded);
            stack.qty -= take;
            remainingNeeded -= take;

            // Aha #3: SPATIAL CHECK
            // If we are consuming material for a specific WC, check transit from Inventory Zone -> Machine Zone
            if (take > 0 && destinationWcId && stack.zoneId) {
                const destWc = this.input.workCenters.find(w => w.id === destinationWcId);
                if (destWc?.zoneId && destWc.zoneId !== stack.zoneId) {
                    const transit = this.getTransitTime(stack.zoneId, destWc.zoneId);
                    if (transit > 0) {
                        // Alert the user about "Physics" or just log it as a constraint?
                        // For Aha moment, let's create a specialized alert
                        this.addAlert('BOTTLENECK_WARNING', `Transit Delay: ${transit}m moving material from Zone ${stack.zoneId.slice(0, 4)}...`, {
                            type: 'TRANSIT',
                            minutes: transit,
                            from: stack.zoneId,
                            to: destWc.zoneId,
                            material: order.item_id
                        });
                    }
                }
            }
        }

        if (remainingNeeded > 0) {
            const missing = order.qty - stacks.reduce((acc, s) => acc + s.qty, 0); // approx
            // Actually remainingNeeded is exactly what is missing after draining stacks
            this.addAlert('STOCKOUT_PREDICTED', `Projected stockout for ${order.item_id}`, {
                missingQty: remainingNeeded,
                orderId: order.order_id,
                requiredBy: order.due_date.toISOString()
            });
            // We simulated consumption to 0 already for the stacks used.
        }
    }

    private explodeBOM(parentOrder: SimpleOrder, parentStart: Date, parentWcId?: string) {
        const children = this.input.boms.filter(b => b.parent_item_id === parentOrder.item_id);
        const parentWc = parentWcId ? this.input.workCenters.find(w => w.id === parentWcId) : undefined;

        for (const child of children) {
            let requiredDate = parentStart;

            // Aha #3: Transit Time Lookahead
            // If Child is Make item, check where it is made vs where Parent needs it
            const childRouting = this.input.routings.find(r => r.item_id === child.child_item_id);
            if (childRouting && parentWc?.zoneId) {
                const childWc = this.input.workCenters.find(w => w.id === childRouting.work_center_id);
                if (childWc?.zoneId && childWc.zoneId !== parentWc.zoneId) {
                    const transit = this.getTransitTime(childWc.zoneId, parentWc.zoneId);
                    // Child must be done 'transit' mins BEFORE parent starts
                    requiredDate = subMinutes(parentStart, transit);

                    if (transit > 0) {
                        // Optional: Log transit logic trace?
                    }
                }
            }
            // Note: If child is Buy item, consumeInventory handles the transit check from Stock -> ParentWC

            const childOrder: SimpleOrder = {
                id: `SUB-${parentOrder.id}-${child.child_item_id.slice(0, 4)}`,
                order_id: parentOrder.order_id,
                item_id: child.child_item_id,
                qty: parentOrder.qty * child.qty,
                due_date: requiredDate,
                priority: parentOrder.priority
            };

            // Recursive call
            if (childRouting) {
                this.planOrder(childOrder, requiredDate);
            } else {
                this.consumeInventory(childOrder, parentWcId);
            }
        }
    }

    private getTransitTime(fromId: string, toId: string): number {
        return this.transitMatrix.get(fromId)?.get(toId) || 0;
    }

    private detectBottlenecks() {
        // Scan used capacity keys
        for (const [key, used] of this.usedCapacity) {
            const [wcId, date] = key.split(':');
            const cal = this.calendarMap.get(wcId)?.find(c => c.date === date);
            if (cal) {
                // Check simplified availability (capacity_mins)
                const util = used / cal.capacity_mins;
                if (util > 0.95) { // 95% utilization threshold
                    this.addAlert('BOTTLENECK_WARNING', `Stall risk on ${wcId} at ${date}`, {
                        utilization: (util * 100).toFixed(1) + '%',
                        wcId,
                        date
                    });
                }
            }
        }
    }

    private addAlert(type: any, message: string, data?: any) {
        this.output.alerts.push({
            id: crypto.randomUUID(),
            org_id: 'starpath',
            plan_id: 'active-plan',
            type,
            message,
            data_json: data
        });
    }
}
