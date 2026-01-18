-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ORGS & USERS
create table public.orgs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.users_orgs (
  user_id uuid references auth.users not null,
  org_id uuid references public.orgs not null,
  role text default 'member',
  primary key (user_id, org_id)
);

-- RLS Helper
create or replace function public.get_user_org_ids()
returns setof uuid as $$
  select org_id from public.users_orgs where user_id = auth.uid();
$$ language sql security definer;

-- MASTER DATA

create table public.work_centers (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  name text not null,
  code text not null
);

create table public.items (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  sku text not null,
  name text not null,
  type text check (type in ('MAKE', 'BUY')) not null,
  cost numeric default 0,
  lead_time_days int default 0,
  unique (org_id, sku)
);

create table public.bom (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  parent_item_id uuid references public.items not null,
  child_item_id uuid references public.items not null,
  qty numeric not null check (qty > 0)
);

create table public.routings (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  item_id uuid references public.items not null,
  work_center_id uuid references public.work_centers not null,
  cycle_time_mins numeric default 0,
  setup_time_mins numeric default 0
);

create table public.calendars (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  work_center_id uuid references public.work_centers not null,
  date date not null,
  shift_id int default 1,
  capacity_mins numeric default 480 -- 8 hours
);

-- DEMAND & SUPPLY

create table public.sales_orders (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  customer text not null,
  due_date timestamp with time zone not null,
  priority int default 50
);

create table public.sales_order_lines (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  so_id uuid references public.sales_orders not null,
  item_id uuid references public.items not null,
  qty numeric not null
);

create table public.inventory_onhand (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  item_id uuid references public.items not null,
  qty numeric default 0,
  location text
);

-- PLANNING

create table public.scenarios (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  name text not null,
  parent_scenario_id uuid references public.scenarios,
  changes_json jsonb default '{}'::jsonb
);

create table public.plans (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  scenario_id uuid references public.scenarios,
  run_at timestamp with time zone default now(),
  status text default 'DRAFT'
);

create table public.plan_lines (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  plan_id uuid references public.plans not null,
  item_id uuid references public.items not null,
  work_center_id uuid references public.work_centers not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  qty numeric not null,
  reason_json jsonb
);

create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references public.orgs not null,
  plan_id uuid references public.plans not null,
  type text not null,
  message text not null,
  data_json jsonb
);

-- RLS POLICIES (Apply to all tables)
-- For brevity showing pattern. In production, repeat for all.

alter table public.orgs enable row level security;
create policy "User can view own orgs" on public.orgs
  for select using (id in (select org_id from public.users_orgs where user_id = auth.uid()));

-- Macro to apply RLS to org-scoped tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'work_centers', 'items', 'bom', 'routings', 'calendars', 
    'sales_orders', 'sales_order_lines', 'inventory_onhand',
    'scenarios', 'plans', 'plan_lines', 'alerts'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy "Tenant isolation" on public.%I for all using (org_id in (select org_id from public.users_orgs where user_id = auth.uid()));', t);
  end loop;
end $$;
