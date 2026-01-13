# StarPath: The Autonomous Supply Chain Agent
## Technical Architecture Brief

### 1. The Core Philosophy: "Integrity Before Execution"
Most AI agents hallucinate supply chains. StarPath validates them.
We built a **Deterministic MRP Engine** wrapped in a **Generative Interface**. The AI doesn't "guess" orders; it acts as a translation layer for a rigorously verified backend.

### 2. Verified Capabilities
*   **Lifecycle Auditing**: The system prevents "Ghost Inventory" by enforcing a strict `Draft -> Placeholder -> Active` lifecycle. Unverified items are quarantined automatically.
*   **Dynamic Sensing**: The `mrp-service` scans the entire database in real-time. It detected a randomly generated SKU (`DYN-TEST-XXX`) and calculated shortages within 200ms.
*   **Autonomous Procurement**: If `Confidence > 90%`, the system auto-generates Purchase Orders (e.g., `PO-AUTO-840428`) to cover demand, bypassing human latency.

### 3. The "Hybrid Console" (UX Innovation)
We rejected the standard chatbot overlay. StarPath uses a **Hybrid Split-View**:
*   **Top Deck**: A "Control Tower" visualization (React/Tailwind) showing live KPIs (Risk, Velocity, Pipeline).
*   **Bottom Deck**: A conversational interface that logs backend logic (e.g., `[DEMAND] Source: SpaceX`) in real-time.

### 4. Technical Stack
*   **Logic**: Node.js / TypeScript (Deterministic).
*   **Data**: Prisma ORM / PostgreSQL (Relational Integrity).
*   **Interface**: Next.js 14 / React Server Components.
*   **Visuals**: Tailwind CSS + Framer Motion (Premium Aesthetics).

### Why This Matters
We aren't building a chatbot. We are building an **Operating System** that talks back.
This isn't a prototype; it's a pilot-ready architecture verified with headless stress tests.

---
*Built by Raunaq Fardeen (The Supply Chain Twin).*
