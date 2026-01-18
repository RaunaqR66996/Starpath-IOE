# API Specification

## Conventions
- **Base URL**: `/api`
- **Headers**: `Content-Type: application/json`
- **Auth**: Supabase Session Cookie / Bearer Token

## Endpoints

### Planning Function
#### `POST /api/plan/run`
**Payload**:
```json
{
  "scenario_id": "uuid" (optional, defaults to live),
  "parameters": {
    "horizon_days": 14
  }
}
```
**Response**:
```json
{
  "plan_id": "uuid",
  "status": "processing"
}
```

#### `GET /api/plan/:id`
Returns the full plan details including lines and alerts.
**Response**:
```json
{
  "id": "...",
  "lines": [...],
  "alerts": [...],
  "kpis": {
    "on_time_delivery": 0.95,
    "makespan_mins": 4500
  }
}
```

### Scenarios
#### `POST /api/scenario`
Create a fork of the current data for analysis.
**Payload**:
```json
{
  "name": "Scenario A - Rush Order",
  "changes": [
    { "type": "ADD_ORDER", "data": { ... } },
    { "type": "REDUCE_CAPACITY", "wc_id": "...", "date": "...", "mins": 0 }
  ]
}
```

### Master Data (CRUD)
Standard REST endpoints for bulk data management.
- `GET /api/items`
- `POST /api/items/import` (CSV Upload)
