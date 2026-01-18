-- Seed Data (Assuming a fresh DB or for local usage)
-- Note: This requires manually creating a user in auth.users if you check foreign keys strictly, 
-- but for data seeding we often bypass or insert dummy users if strict FKs are disabled or if we insert into auth.users (not recommended in pure migrations).
-- Here we'll just insert an Org and assume we link a user later.

INSERT INTO public.orgs (id, name) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Blue Ship Manufacturing')
ON CONFLICT DO NOTHING;

-- Work Center
INSERT INTO public.work_centers (id, org_id, name, code)
VALUES 
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Assembly Line 1', 'ASY01')
ON CONFLICT DO NOTHING;

-- Items
INSERT INTO public.items (id, org_id, sku, name, type, cost, lead_time_days)
VALUES
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'FIN-001', 'Finished Widget', 'MAKE', 100, 0),
('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RAW-A', 'Raw Material A', 'BUY', 10, 2),
('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'RAW-B', 'Raw Material B', 'BUY', 20, 3)
ON CONFLICT DO NOTHING;

-- BOM
INSERT INTO public.bom (org_id, parent_item_id, child_item_id, qty)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 2),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', 1);

-- Routing
INSERT INTO public.routings (org_id, item_id, work_center_id, cycle_time_mins, setup_time_mins)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 15, 30);

-- Orders
INSERT INTO public.sales_orders (id, org_id, customer, due_date, priority)
VALUES
('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corp', NOW() + INTERVAL '5 days', 10);

INSERT INTO public.sales_order_lines (org_id, so_id, item_id, qty)
VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380f66', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 50);
