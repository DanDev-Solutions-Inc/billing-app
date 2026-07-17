-- Currency on documents, defaulting from the customer.
--
-- DanDev bills in CAD with 13% HST. US work is billed in USD with no tax, so
-- currency and tax are linked: a USD document is always 0%.
--
-- The currency lives on the document, not just the customer: it's what the
-- invoice was actually raised in, and must not change retroactively if the
-- customer's default is later edited. The customer's is only a starting point.
do $$ begin
  create type public.currency_code as enum ('CAD','USD');
exception when duplicate_object then null; end $$;

alter table public.customers
  add column if not exists currency public.currency_code not null default 'CAD';

alter table public.invoices
  add column if not exists currency public.currency_code not null default 'CAD';

alter table public.estimates
  add column if not exists currency public.currency_code not null default 'CAD';

alter table public.recurring_invoices
  add column if not exists currency public.currency_code not null default 'CAD';

-- Everything to date is Canadian work, so the CAD default is already correct
-- for the 548 imported invoices — no backfill needed.
