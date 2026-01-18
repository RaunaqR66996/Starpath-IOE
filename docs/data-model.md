# Data Model

## Concepts
All tables must have `org_id` for RLS.

## Schema

### Core Organization
- **orgs**: `id`, `name`, `created_at`
- **users_orgs**: `user_id`, `org_id`, `role`

### Master Data
- **items**: `id`, `org_id`, `sku`, `name`, `type` (make/buy), `cost`, `lead_time_days`
- **bom**: `id`, `org_id`, `parent_item_id`, `child_item_id`, `qty`
- **work_centers**: `id`, `org_id`, `name`, `code`
- **routings**: `id`, `org_id`, `item_id`, `work_center_id`, `cycle_time_mins`, `setup_time_mins`
- **calendars**: `id`, `org_id`, `work_center_id`, `date`, `shift_id`, `capacity_mins`

### Demand & Supply
- **sales_orders**: `id`, `org_id`, `customer`, `due_date`, `priority` (1-100)
- **sales_order_lines**: `id`, `org_id`, `so_id`, `item_id`, `qty`
- **inventory_onhand**: `id`, `org_id`, `item_id`, `qty`, `location`

### Planning
- **scenarios**: `id`, `org_id`, `name`, `parent_scenario_id`, `changes_json`
- **plans**: `id`, `org_id`, `scenario_id`, `run_at`, `status`
- **plan_lines**: 
    - `id`, `org_id`, `plan_id`, 
    - `item_id`, `work_center_id`
    - `start_time`, `end_time`
    - `qty`
    - `reason_json` (Explainability)
- **alerts**: `id`, `org_id`, `plan_id`, `type` (late, capacity, material), `message`, `data_json`

## RLS Policies
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` using `auth.uid()` mapped to `users_orgs`.
