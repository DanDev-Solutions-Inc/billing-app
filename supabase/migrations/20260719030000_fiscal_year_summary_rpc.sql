-- Per-fiscal-year tax summary: income, expenses, HST payable, corporate tax.
--
-- Aggregated in Postgres for the same reason monthly_cash_flow is: a bare
-- select() stops at PostgREST's 1,000-row cap, and a year-end report built
-- from the newest 1,000 transactions is worse than no report at all.
--
-- Fiscal years, not calendar years. DanDev's year end is August 31, so
-- FY2026 runs 2025-09-01 → 2026-08-31 and is labelled by the year it *ends*
-- in — the convention CRA filings use. year_end_month makes that a parameter
-- rather than a constant, so a year-end change doesn't need a migration.
--
-- Amounts are gross (tax-inclusive) single figures — see the note in
-- 20260719020000_receipt_transaction_tax.sql. Every number here is derived by
-- backing the tax out of the gross, exactly as splitTaxInclusive() does at
-- render time, so:
--   income / expenses  are net of HST (what the corporate return wants)
--   hst_collected      is HST charged on sales
--   hst_paid           is HST paid on purchases — the input tax credits
--   hst_payable        is what's actually remitted: collected - ITCs
--
-- The subtotal is rounded per row, not on the aggregate, so a year's total is
-- the sum of the figures each transaction's detail page shows. Rounding once
-- at the end would drift from the visible records by a few cents.
--
-- SECURITY INVOKER (the default) so RLS still scopes rows to the caller.
create or replace function public.fiscal_year_summary(
  year_end_month int default 8,
  tax_rate numeric default 13,
  corp_tax_rate numeric default 12.2
)
returns table (
  fy_start      date,
  fy_end        date,
  income        numeric(14,2),
  expenses      numeric(14,2),
  hst_collected numeric(14,2),
  hst_paid      numeric(14,2),
  hst_payable   numeric(14,2),
  net_income    numeric(14,2),
  corporate_tax numeric(14,2)
)
language sql
stable
set search_path = public as $$
  with split as (
    select
      t.direction,
      -- A transaction dated after the year-end month falls into the fiscal
      -- year that ends the *following* calendar year.
      extract(year from t.txn_date)::int
        + case when extract(month from t.txn_date)::int > year_end_month
               then 1 else 0 end as fy,
      t.amount as gross,
      case
        when t.tax_included and tax_rate > 0
          then round(t.amount / (1 + tax_rate / 100), 2)
        -- tax_included = false: zero-rated or exempt (groceries, insurance,
        -- bank fees). The whole amount is the subtotal, no ITC to claim.
        else t.amount
      end as subtotal
    from public.transactions t
    where t.txn_date is not null
  ),
  totals as (
    select
      fy,
      coalesce(sum(subtotal) filter (where direction = 'income'), 0) as income,
      coalesce(sum(subtotal) filter (where direction = 'expense'), 0) as expenses,
      coalesce(sum(gross - subtotal) filter (where direction = 'income'), 0) as hst_collected,
      coalesce(sum(gross - subtotal) filter (where direction = 'expense'), 0) as hst_paid
    from split
    group by fy
  )
  select
    -- The day after the previous year end. Deriving it by adding a month to
    -- the first of the year-end month keeps December year ends correct
    -- (FY2026 would then start 2026-01-01, not 2025-01-01).
    (make_date(fy - 1, year_end_month, 1) + interval '1 month')::date,
    (make_date(fy, year_end_month, 1) + interval '1 month' - interval '1 day')::date,
    income::numeric(14,2),
    expenses::numeric(14,2),
    hst_collected::numeric(14,2),
    hst_paid::numeric(14,2),
    (hst_collected - hst_paid)::numeric(14,2),
    (income - expenses)::numeric(14,2),
    -- A loss owes no corporate tax; greatest() floors it at zero rather than
    -- reporting a negative "refund" the return won't produce. Losses carry
    -- forward, which is a filing decision this report doesn't model.
    round(greatest(income - expenses, 0) * corp_tax_rate / 100, 2)::numeric(14,2)
  from totals
  order by fy desc;
$$;
