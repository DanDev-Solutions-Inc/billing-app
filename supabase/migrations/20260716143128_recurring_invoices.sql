-- Recurring invoice schedules — a template + cadence the cron uses to generate
-- (and optionally email) invoices automatically.

do $$ begin
  create type recurring_frequency as enum ('daily','weekly','monthly','yearly');
exception when duplicate_object then null; end $$;

create table if not exists public.recurring_invoices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  customer_id  uuid references public.customers(id) on delete set null,
  title        text,
  line_items   jsonb not null default '[]',   -- [{description, quantity, unit_price}]
  tax_rate     numeric(5,2) not null default 13,
  notes        text,
  frequency    recurring_frequency not null,  -- unit: daily/weekly/monthly/yearly
  interval     int not null default 1,        -- every N units (e.g. 2 = every 2 weeks)
  next_run     date not null,
  last_run     date,
  end_date     date,
  net_days     int not null default 14,
  auto_send    boolean not null default false, -- email on generate vs create draft
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists recurring_user_idx on public.recurring_invoices(user_id);
create index if not exists recurring_due_idx on public.recurring_invoices(active, next_run);

drop trigger if exists recurring_set_updated_at on public.recurring_invoices;
create trigger recurring_set_updated_at
  before update on public.recurring_invoices
  for each row execute function public.set_updated_at();

alter table public.recurring_invoices enable row level security;
drop policy if exists "own rows" on public.recurring_invoices;
create policy "own rows" on public.recurring_invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
