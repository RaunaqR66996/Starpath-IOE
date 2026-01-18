# The Senior Architect's Playbook: How to Build Legacy-Grade Enterprise Software

**Author**: Senior Architect (ex-SAP/Oracle/JDA)
**Subject**: Transitioning from "Startup Code" to "Industrial Grade System"

## 1. The Core Philosophy: "Data Integrity is God"
In a startup, speed is everything. In Enterprise ERP/WMS, **Correctness** is everything. If we lose a $0.05 inventory adjustment, a factory shuts down.

### A. Database Design (The Foundation)
A senior dev doesn't just "add a column." They design for **Auditability** and **Multi-Tenancy**.

1.  **Multi-Tenancy is Security**:
    *   *Startup Way*: `SELECT * FROM Orders`
    *   *Senior Way*: Every single table has `tenant_id`. Every single query includes `WHERE tenant_id = ?`. We never trust the code; we enforce isolation at the database level (Row Level Security).
2.  **Immutability (The Ledger)**:
    *   *Startup Way*: Update an inventory record: `UPDATE Inventory SET qty = 5`.
    *   *Senior Way*: **NEVER** overwrite data. We insert a transaction: `INSERT INTO InventoryTrx (qty_change: -1, reason: 'PICK')`. The current stock is the *sum* of all transactions. This provides a perfect audit trail.
3.  **Soft Deletes**:
    *   *Startup Way*: `DELETE FROM Users WHERE id = 1`
    *   *Senior Way*: `UPDATE Users SET deleted_at = NOW()`. Data is an asset; never destroy it.

### B. The Application Layer (The Guardrails)
We don't build "features"; we build "Processes."

1.  **State Machines**:
    *   *Startup Way*: Change status string from "New" to "Shipped".
    *   *Senior Way*: Define a strict State Machine. You cannot go from `NEW` to `SHIPPED` without passing through `PICKED` and `PACKED`. The code forbids illegal transitions.
2.  **Decimal Precision**:
    *   *Startup Way*: Use `float` or `double` for money. (Floating point errors ensue: $10.0000001).
    *   *Senior Way*: Use `Decimal(19,4)` or store everything in cents (integers). We need penny-perfect financial accuracy.
3.  **Idempotency**:
    *   *Startup Way*: Client sends "Create Order" API request.
    *   *Senior Way*: Client sends "Create Order" with a unique `idempotency_key`. If the network fails and they retry, we don't accidentally create two orders.

### C. The "Physics" of Operations (WMS/TMS Specifics)
1.  **Bin Capacity Constraints**:
    *   *Startup Way*: Put infinite items in a bin.
    *   *Senior Way*: Calculate volume (`L x W x H`). If a pallet is 1.1m high and the rack slot is 1.0m, the system *rejects* the move.
2.  **Date-Controlled Inventory (FEFO)**:
    *   *Startup Way*: Pick any item.
    *   *Senior Way*: First-Expired-First-Out (FEFO). The system forces the picker to take the older milk carton first to prevent spoilage costs.

---

## Action Plan: Application of Senior Principles
To move `StarPath IOE` to this level, we must execute the following **Refactoring Sprint**:

### Step 1: The "Iron-Clad" Schema (Multi-Tenancy)
*   [ ] Create `Organization` (Tenant) entity.
*   [ ] Add `organizationId` to ALL Top-Level tables (`Order`, `Inventory`, `Shipment`, `User`).
*   [ ] Update `schema.prisma`.

### Step 2: The "Ledger" Logic (Inventory Accuracy)
*   [ ] Create `InventoryTransaction` table (The Ledger).
*   [ ] Refactor `Inventory` model to be a cache of the Ledger sum.

### Step 3: Decimal Money
*   [ ] Convert all `Float` costs/prices to `Decimal` in Prisma to avoid rounding errors.

---
*This approach ensures that when a Fortune 500 auditor looks at your system, they see a familiar, robust architecture—not a toy.*
