# Shared Task Board

## Agent A: Product Architect (Setup & Specs)
- [x] Initialize workspace structure (apps, packages, docs)
- [x] Create /docs/prd.md (Scope, User Flows)
- [x] Create /docs/data-model.md (Schema definitions)
- [x] Create /docs/api.md (API Contracts)
- [x] Create /docs/planner-rules.md (Heuristics)
- [ ] Define shared types in /packages/shared

## Agent B: Data + Security (Supabase)
- [ ] Create /supabase/migrations folder
- [ ] Implement initial schema migration (orgs, items, orders, etc.)
- [ ] Add RLS policies (org_id isolation)
- [ ] Create seed data script (demo dataset, scenarios)
- [ ] Verify database setup (local or simulated)

## Agent C: Planner Engine (Logic)
- [ ] Initialize /packages/planner
- [ ] Implement core planner types
- [ ] Implement heuristic: EDD + Priority sorting
- [ ] Implement heuristic: Lot sizing & Changeover grouping
- [ ] Implement capacity constraints
- [ ] Implement BOM explosion & requirements calculation
- [ ] Implement "what-if" scenario diffing engine
- [ ] Add unit tests for planner logic

## Agent D: UI + Integration (Next.js)
- [ ] Initialize /apps/web (Next.js App Router)
- [ ] Setup Supabase client & Auth
- [ ] Create API Route: POST /api/plan/run
- [ ] Create API Route: GET /api/plan/:id
- [ ] Build Page: /planning (Chat, Grid, Heatmap, Explain)
- [ ] Build Page: /orders (CRUD)
- [ ] Build Page: /master-data (Import/View)
- [ ] Connect UI to Planner Engine & Database
