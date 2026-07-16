-- DanDev Billing — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query → Run).
-- Safe to re-run: uses "if not exists" / "drop ... if exists" where practical.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid(), gen_random_bytes()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type invoice_status  as enum ('draft','sent','paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estimate_status as enum ('draft','sent','accepted','declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type txn_direction   as enum ('income','expense');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Profiles: one per auth user. Holds the per-user email-in token.
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  business_name text,
  inbound_token text not null unique default encode(extensions.gen_random_bytes(9), 'hex'),
  created_at    timestamptz not null default now()
);

create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  address     text,
  wave_id     text,               -- source id when imported from Wave
  created_at  timestamptz not null default now()
);
create index if not exists customers_user_idx on public.customers(user_id);
create unique index if not exists customers_user_wave_idx
  on public.customers(user_id, wave_id) where wave_id is not null;

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  customer_id    uuid references public.customers(id) on delete set null,
  invoice_number text,
  status         invoice_status not null default 'draft',
  issue_date     date not null default current_date,
  due_date       date,
  notes          text,
  subtotal       numeric(12,2) not null default 0,
  tax            numeric(12,2) not null default 0,
  total          numeric(12,2) not null default 0,
  wave_id        text,               -- source id when imported from Wave
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists invoices_user_idx on public.invoices(user_id);
create index if not exists invoices_user_status_idx on public.invoices(user_id, status);
create unique index if not exists invoices_user_wave_idx
  on public.invoices(user_id, wave_id) where wave_id is not null;

create table if not exists public.estimates (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  customer_id          uuid references public.customers(id) on delete set null,
  estimate_number      text,
  status               estimate_status not null default 'draft',
  issue_date           date not null default current_date,
  expiry_date          date,
  notes                text,
  subtotal             numeric(12,2) not null default 0,
  tax                  numeric(12,2) not null default 0,
  total                numeric(12,2) not null default 0,
  converted_invoice_id uuid references public.invoices(id) on delete set null,
  wave_id              text,          -- source id when imported from Wave
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists estimates_user_idx on public.estimates(user_id);
create unique index if not exists estimates_user_wave_idx
  on public.estimates(user_id, wave_id) where wave_id is not null;

-- Shared, polymorphic line items for invoices + estimates.
create table if not exists public.line_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parent_type text not null check (parent_type in ('invoice','estimate')),
  parent_id   uuid not null,
  description text not null,
  quantity    numeric(12,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  amount      numeric(12,2) generated always as (quantity * unit_price) stored,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists line_items_parent_idx on public.line_items(parent_type, parent_id);
create index if not exists line_items_user_idx on public.line_items(user_id);

create table if not exists public.receipts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  vendor         text,
  amount         numeric(12,2) not null default 0,
  receipt_date   date not null default current_date,
  category       text,
  notes          text,
  image_url      text,
  image_pathname text,
  source         text not null default 'upload' check (source in ('upload','email')),
  created_at     timestamptz not null default now()
);
create index if not exists receipts_user_idx on public.receipts(user_id);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  txn_date    date not null default current_date,
  description text,
  amount      numeric(12,2) not null,
  direction   txn_direction not null,
  category    text,
  receipt_id  uuid references public.receipts(id) on delete set null,
  invoice_id  uuid references public.invoices(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, txn_date);
create index if not exists transactions_user_dir_idx on public.transactions(user_id, direction);

-- ---------------------------------------------------------------------------
-- updated_at trigger for invoices + estimates
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop trigger if exists estimates_set_updated_at on public.estimates;
create trigger estimates_set_updated_at
  before update on public.estimates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile (with a unique inbound token) for each new user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, extensions as $$
begin
  insert into public.profiles (user_id, inbound_token)
  values (new.id, encode(extensions.gen_random_bytes(9), 'hex'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security — every table scoped to the owning user
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.customers    enable row level security;
alter table public.invoices     enable row level security;
alter table public.estimates    enable row level security;
alter table public.line_items   enable row level security;
alter table public.receipts     enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own rows" on public.profiles;
create policy "own rows" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.customers;
create policy "own rows" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.invoices;
create policy "own rows" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.estimates;
create policy "own rows" on public.estimates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.line_items;
create policy "own rows" on public.line_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.receipts;
create policy "own rows" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.transactions;
create policy "own rows" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: the inbound-email webhook uses the service-role key, which bypasses RLS,
-- to look up profiles.inbound_token and insert receipts on the user's behalf.
