-- Monthly income/expense totals, aggregated in Postgres.
--
-- The dashboard fetched every transaction and summed them in JS — 4,693 rows
-- transferred and parsed on each request to render a 6-to-24 point chart, plus
-- three totals. Worse, a bare select() stops at PostgREST's 1,000-row cap, so
-- the chart was quietly built from the newest 1,000 only and older months
-- under-reported.
--
-- Returns one row per month in the window, zero-filled: generate_series makes
-- months with no activity explicit, so the chart doesn't have to invent them
-- and a gap can't be mistaken for a missing month.
--
-- SECURITY INVOKER (the default) so RLS still scopes rows to the caller.
create or replace function public.monthly_cash_flow(months int default 6)
returns table (
  month   date,
  income  numeric(12,2),
  expense numeric(12,2)
)
language sql
stable
set search_path = public as $$
  with window_months as (
    select generate_series(
      date_trunc('month', current_date) - make_interval(months => months - 1),
      date_trunc('month', current_date),
      interval '1 month'
    )::date as month
  )
  select
    w.month,
    coalesce(sum(t.amount) filter (where t.direction = 'income'), 0)::numeric(12,2),
    coalesce(sum(t.amount) filter (where t.direction = 'expense'), 0)::numeric(12,2)
  from window_months w
  left join public.transactions t
    on date_trunc('month', t.txn_date)::date = w.month
  group by w.month
  order by w.month;
$$;
