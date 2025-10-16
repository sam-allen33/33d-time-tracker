-- ===== 33D Time Tracker — Unified Schema (idempotent) =====
-- Run this in Supabase. Safe to re-run.

-- Extensions
create extension if not exists "uuid-ossp";

-- ---------- TABLES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text check (role in ('admin','employee')) default 'employee',
  is_temp boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.customers (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  active boolean default true
);

create table if not exists public.functions (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  active boolean default true
);

create table if not exists public.time_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  function_id uuid not null references public.functions(id),
  start_ts timestamptz not null default now(),
  end_ts timestamptz null,
  source text,
  device_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prevent two open shifts per user
create unique index if not exists one_open_shift_per_user
  on public.time_entries(user_id) where end_ts is null;

-- ---------- VIEWS (15-minute rounding) ----------
create or replace view public.v_entries_detailed as
select te.id,
       te.user_id,
       p.display_name as employee,
       c.name as customer,
       f.name as function,
       te.start_ts,
       te.end_ts,
       extract(epoch from (coalesce(te.end_ts, now()) - te.start_ts))::int as duration_seconds,
       (round((extract(epoch from (coalesce(te.end_ts, now()) - te.start_ts)) / 60.0) / 15.0) * 15)::int as rounded_minutes,
       te.source,
       te.device_id,
       te.notes,
       te.created_at
from public.time_entries te
join public.profiles p on p.id = te.user_id
join public.customers c on c.id = te.customer_id
join public.functions f on f.id = te.function_id;

create or replace view public.v_hours_by_customer as
select customer,
       sum(rounded_minutes)/60.0 as hours,
       count(*) as entries,
       count(distinct user_id) as distinct_employees
from public.v_entries_detailed
group by customer
order by customer;

create or replace view public.v_hours_by_customer_function as
select customer, function,
       sum(rounded_minutes)/60.0 as hours,
       count(*) as entries
from public.v_entries_detailed
group by customer, function
order by customer, function;

-- ---------- RLS (enable + drop/create policies) ----------
alter table public.profiles     enable row level security;
alter table public.customers    enable row level security;
alter table public.functions    enable row level security;
alter table public.time_entries enable row level security;

-- PROFILES
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_admin_update on public.profiles;
drop policy if exists profiles_admin_insert on public.profiles;

create policy profiles_self_select
on public.profiles
for select
using (
  auth.uid() = id
  or exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin')
);

create policy profiles_admin_update
on public.profiles
for update
using (
  exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin')
);

create policy profiles_admin_insert
on public.profiles
for insert
with check (
  exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin')
);

-- CUSTOMERS
drop policy if exists customers_read on public.customers;
drop policy if exists customers_write on public.customers;

create policy customers_read
on public.customers
for select
using (auth.role() = 'authenticated');

create policy customers_write
on public.customers
for all
using (exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'));

-- FUNCTIONS
drop policy if exists functions_read on public.functions;
drop policy if exists functions_write on public.functions;

create policy functions_read
on public.functions
for select
using (auth.role() = 'authenticated');

create policy functions_write
on public.functions
for all
using (exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'));

-- TIME_ENTRIES
drop policy if exists te_insert_self on public.time_entries;
drop policy if exists te_select_own_or_admin on public.time_entries;
drop policy if exists te_update_own on public.time_entries;
drop policy if exists te_admin_all on public.time_entries;

create policy te_insert_self
on public.time_entries
for insert
with check (auth.uid() = user_id);

create policy te_select_own_or_admin
on public.time_entries
for select
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin')
);

create policy te_update_own
on public.time_entries
for update
using (user_id = auth.uid());

create policy te_admin_all
on public.time_entries
for all
using (exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'))
with check (exists (select 1 from public.profiles ap where ap.id = auth.uid() and ap.role = 'admin'));

-- ===== end unified schema =====
