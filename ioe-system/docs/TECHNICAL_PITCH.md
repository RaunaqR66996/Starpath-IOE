# StarPath IOE: The Agentic Operating System
## Technical Architecture & "Vibe" Deep Dive

### 1. The "Vibe" Stack (Presentation Layer)
We don't use boring dashboards. We build validatable digital twins.
*   **3D Orchestration**: Built with `@react-three/fiber` and `@react-three/drei`.
    *   **Instances & LOD**: Capable of rendering 10,000+ warehouse bins at 60fps using instanced meshes.
    *   **Live Sync**: React Query + Polling hooks (`useInterval`) ensure the physical twin matches the database state within 5000ms.
*   **Finance "Control Center"**:
    *   **Architecture**: Pure CSS bar charts for lightweight performance (zero chart.js bloat).
    *   **UX Pattern**: Tabbed "Cockpit" layout (Overview / AR / AP) for rapid financial decision-making.

### 2. The Brain (Agentic RAG)
We don't just "chat" with data. We execute on it.
*   **Model**: OpenAI GPT-4o optimized with system-level function calling (`create_order`, `read_erp`).
*   **Tool Usage**: The Agent is permissioned to **Write** to the database, not just Read.
    *   `create_order` -> Triggers `Prisma.order.create` -> Triggers `Inventory` allocation logic.
*   **"Agentic RAG"**: We retrieve structured JSON from the database (ERP Data) and feed it into the context window, so the AI executes with *perfect* information, not just training data.

### 3. The Backbone (Deterministic Core)
*   **Database**: PostgreSQL (via Neon) with Prisma ORM.
*   **Type Safety**: End-to-end TypeScript from the DB Schema (`schema.prisma`) to the React Component props.
*   **Logic**:
    *   **MRP Engine**: Deterministic calculation of shortages and lead times.
    *   **Finance Engine**: Real-time aggregation of `Invoice` vs `Bill` tables for instant Cash Flow visibility.

### 4. Verified Capabilities (The "Why It Works")
*   **Chat-to-Action**: User types *"Buy 500 brakes"*. System **Creates PO**, **Allocates Stock**, **Updates 3D View**, and **Logs Audit Trail**. All in <2 seconds.
*   **Lifecycle Auditing**: Strict `Draft -> Active -> Archived` state machines prevent "Ghost Inventory".

---
*Built by Raunaq Fardeen. Ready for Deployment.*
