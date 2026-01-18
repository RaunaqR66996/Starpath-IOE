# Product Requirements Document (PRD) - Blue Ship Sync MVP

## 1. Introduction
**Blue Ship Sync** is a production planning MVP designed to give planners a deterministic, explainable, and responsive planning engine.

## 2. Scope & Constraints (MVP)
### In Scope
- **Time Horizon**: 14 Days.
- **Resources**: 1 Work Center, 2 Shifts per day.
- **Tenancy**: Multi-tenant via `org_id`.
- **Planning Logic**: Deterministic heuristics (EDD, Priority).
- **UI**: Chat-first interface + Schedule Grid + Interactive Heatmap.
- **Scenarios**: "What if" analysis (Capacity drops, Rush orders).

### Out of Scope
- Infinite capacity planning (we assume finite but allow lateness with alerts).
- Complex solvers (Linear Programming, Genetic Algorithms).
- Complex routing (Multi-step routing is simplified to single WC for MVP).
- Real-time machine integration (PLCs).

## 3. Personas
- **Planner (Pat)**: Wants to trust the plan. Needs to know *why* a lot was scheduled at a specific time. Hates "black box" optimization.
- **Admin**: Manages Master Data (Items, BOMs, Calendars).

## 4. Key User Flows
1. **Master Data Import**: Admin uploads CSVs for Items, BOM, Work Centers.
2. **Order Entry**: Orders flow in (via API or Manual Entry).
3. **Run Plan**: Planner clicks "run". Engine processes logic.
4. **Review**: Planner sees the Gantt/Grid.
    - *Anomaly*: Sees a late order.
    - *Explain*: Clicks the line. Panel says: "Delayed because material X was unavailable until Day 3".
5. **Scenario**: Planner clones the plan.
    - "What if we add overtime on Saturday?"
    - Engine re-runs. Diff shows: "5 orders no longer late."
