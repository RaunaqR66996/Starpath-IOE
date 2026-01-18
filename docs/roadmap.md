# Roadmap to Enterprise Complete

**Current Status**: "Execution & Visibility MVP"
The current StarPath IOE serves as a powerful **Visiblity & Orchestration Layer** that sits on top of operations. To run a standalone enterprise, the following "System of Record" features must be built.

---

## 1. ERP / OMS (Order Management)
**Goal**: Move from "Order Taking" to "Full Financial Lifecycle".

### ✅ Current (MVP)
- [x] Order Entry (Header/Line items)
- [x] Customer Management & Tiers
- [x] Basic Validation & Pricing (Unit Price)

### 🔴 Missing (High Priority)
- [ ] **Invoicing & Billing**: Generating PDF invoices from shipped orders.
- [ ] **Procurement / POs**: Managing vendors and creating Purchase Orders to replenish stock.
- [ ] **Payments**: Tracking status (Due, Paid, Overdue).
- [ ] **RMA / Returns**: Workflow for customer returns and refunds.

### 🟡 Future (Advanced)
- [ ] **General Ledger (GL)**: Double-entry accounting backend.
- [ ] **CRM Features**: Sales pipeline, opportunities, and lead tracking.

---

## 2. WMS (Warehouse Management)
**Goal**: Move from "Outbound Only" to "Full Inventory Cycle".

### ✅ Current (MVP)
- [x] Outbound Picking & Packing logic
- [x] 3D Digital Twin visualization
- [x] Real-time bin-level inventory tracking

### 🔴 Missing (High Priority)
- [ ] **Inbound / Receiving**: Workflow to receive POs --> Inspect --> Putaway into bins.
- [ ] **Replenishment**: Logic to trigger moves from Reserve Storage -> Fast Pick faces.
- [ ] **Cycle Counting**: functionality to audit inventory accuracy without freezing operations.

### 🟡 Future (Advanced)
- [ ] **Cross-docking**: Direct flow from Receiving -> Shipping.
- [ ] **Labor Management (LMS)**: Tracking productivity per user (picks/hr).

---

## 3. TMS (Transportation)
**Goal**: Move from "Mocked Tracking" to "Real Carrier Execution".

### ✅ Current (MVP)
- [x] Shipment creation linked to Orders
- [x] Visual Map of routes
- [x] Cost estimation fields

### 🔴 Missing (High Priority)
- [ ] **Carrier API Integration**: Real connections to UPS/FedEx/DHL APIs for rating and labels.
- [ ] **Load Planning / Consolidation**: Logic to combine multiple small orders into one LTL/FTL shipment.
- [ ] **Freight Audit**: Reconciling carrier invoices vs. expected costs.

### 🟡 Future (Advanced)
- [ ] **Telematics**: Real-time ELD/GPS truck tracking integration.
- [ ] **Dock Scheduling**: Portal for carriers to book appointment times.

---

## 4. APS (Advanced Planning)
**Goal**: Move from "Basic Heuristics" to "Constrained Optimization".

### ✅ Current (MVP)
- [x] Basic "Due Date" Sorting
- [x] Scenario/Version management
- [x] Basic BOM Explosion placeholder

### 🔴 Missing (High Priority)
- [ ] **Capacity Constraints**: Actually blocking scheduling when a Work Center is full.
- [ ] **Material Requirements Planning (MRP)**: Auto-generating Planned Orders (POs) when raw materials are low.
- [ ] **Changeover Logic**: Grouping similar items to minimize setup time.

### 🟡 Future (Advanced)
- [ ] **Solver Integration**: Integrating Gurobi/OR-Tools for mathematical optimization.
- [ ] **Demand Forecasting**: ML models to predict order volume.

---

## Implementation Phasing

### Phase 2: Closing the Loop (Q2)
Focus on **Inbound WMS** and **Procurement**. You cannot ship what you cannot receive.
- Build `PurchaseOrder` model.
- Build "Receiving" UI in WMS.
- Build MRP logic to trigger POs.

### Phase 3: Financial Rigor (Q3)
Focus on **Invoicing** and **Freight Audit**.
- Generate Invoices from Shipments.
- Implement Carrier Rate Shopping (EasyPost/Shippo integration).

### Phase 4: Intelligence (Q4)
Focus on **Advanced Planner** capabilities.
- Implement hard Capacity Constraints.
- Implement Changeover minimization logic.
