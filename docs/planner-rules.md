# Planner Rules & Heuristics

## Philosophy
**Deterministic & Explainable**. No random seed solvers. Every run with inputs X produces outputs Y.

## Heuristics Engine

### 1. Sorting (Sequencing)
Order of operations for determining which job gets planned first:
1. **Due Date (EDD)**: Earliest Due Date first.
2. **Priority**: If due dates match, higher priority order wins.
3. **SKU Grouping**: (Soft Constraint) Try to put same SKU next to each other to minimize setups, *within a meaningful time window*.

### 2. Capacity Allocation
- **Buckets**: Days / Shifts.
- **Logic**: 
  - Find earliest bucket with `available_capacity >= job_duration`.
  - If a bucket is partially full, fill it.
  - If a job > bucket size, split it (if allowed) or span shifts. *MVP Assumption: No job > 1 shift for simplicity, or simple spanning logic.*

### 3. BOM Explosion
- **Backward Scheduling** (Ideal): Start from Due Date, subtract lead times.
- **Forward Scheduling** (MVP fallback): Start from Today. Check material availability.
- **Logic**:
  - For each End Item Lot:
    - Check stock on hand.
    - If insufficient, create requirements for components.
    - Schedule component production (if Make) or check Lead Time (if Buy).

### 4. Explainability (`reason_json`) structure
Each `plan_line` will contain a trace:

```json
{
  "decision": "SCHEDULED",
  "score": {
    "due_date_urgency": 0.9,
    "setup_optimization": 0.1
  },
  "constraint_hit": "SHIFT_CAPACITY_LIMIT",
  "alternatives_considered": 3,
  "msg": "Scheduled in Shift 2 because Shift 1 was full."
}
```

## What-If Diffing
When comparing Plan A vs Plan B (Scenario):
1. **Match Lines**: Match by OrderID + ItemID.
2. **Detect Moves**: Start Time shift > threshold.
3. **Detect Status**: Late -> OnTime (Improvement), OnTime -> Late (Regression).
4. **Summary**: "2 Orders Delayed, 5 Hours Capacity Saved".
