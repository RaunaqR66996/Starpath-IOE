# Integrated Operations Environment (IOE) Plan

## Objective
Convert StarPath from a collection of siloed mock systems into a unified "Integrated Operations Management" platform where ERP, TMS, and WMS domains share a single source of truth and react to each other's events.

## Current Architecture (Siloed)
 - **ERP**: Manages Orders (`Order` table) and Procurement (`PurchaseOrder` table).
 - **TMS**: Manages Shipments (`Shipment` table) somewhat independently.
 - **WMS**: Manages Inventory (`Inventory` table) and Tasks (`WarehouseTask`), but tasks aren't automatically triggered by orders.
 - **Mock Data**: Heavy reliance on `data-mocks.ts` when DB is empty; the `GlobalControlTower` uses hardcoded Mocks for visualization.

## proposed Architecture (Unified)
The "Golden Thread" linking the domains is the **Order Lifecycle**.

### 1. The Unified Schema (Existing but utilized poorly)
The `prisma/schema.prisma` already links `Order` -> `Shipment` and `Order` -> `WarehouseTask`. We will leverage these relationships rigorously.

### 2. New Service Layer: `ops-command.ts`
We will introduce a central service that aggregates state from all three domains.
- **Control Tower Feed**: Real-time counts of Open Orders (ERP), Active Shipments (TMS), and Pending Tasks (WMS).
- **Cross-Domain Actions**:
    - `releaseOrderToWarehouse(orderId)`: ERP -> WMS (Creates Picking Tasks)
    - `planShipment(orderIds[])`: ERP -> TMS (Creates Shipment, Associates Orders)
    - `dispatchShipment(shipmentId)`: TMS -> ERP (Invoices Orders, Updates Customer)

### 3. "Control Tower" Refactor
The `GlobalControlTower.tsx` will be refactored to:
- Feed from `ops-command.ts` instead of static mocks.
- Display "Health Scores" calculated from real data (e.g., % of On-Time Orders).
- Trigger the Cross-Domain Actions defined above.

## Implementation Steps

### Step 1: Create `ops-command.ts`
A server-side action file to provide the "Brain" of the operation.
- `getSystemHealth()`: Returns aggregated metrics.
- `getActiveTopology()`: Returns nodes and their real inventory levels.

### Step 2: Wire up the "Golden Thread"
Create a workflow that moves an Order from creation to delivery across all 3 systems.
- **Trigger**: New Order (ERP)
- **Action**: `autoPlanShipment` (TMS)
- **Action**: `generateWave` (WMS)

### Step 3: Visual Integration
Update the Control Tower UI to reflect this "Live" state.

---
*Created by Antigravity*
