-- 1. Secondary emails ------------------------------------------------------
-- A customer often has more than one contact (AP clerk, owner, shared inbox).
-- `email` stays the primary/default so nothing that reads it changes; these are
-- the extra addresses an invoice or schedule can be sent to instead.
alter table public.customers
  add column if not exists secondary_emails text[] not null default '{}';

-- 2. Billing summary --------------------------------------------------------
-- Invoice count + total billed per customer, aggregated in Postgres rather than
-- by pulling every invoice into the app and summing there (548 rows today, and
-- it only grows).
--
-- security_invoker = on: the view runs as the caller, so the existing RLS on
-- invoices still applies and one user can never see another's totals.
create or replace view public.customer_billing_summary
with (security_invoker = on) as
select
  c.id                                        as customer_id,
  c.user_id,
  count(i.id)                                 as invoice_count,
  coalesce(sum(i.total), 0)::numeric(12,2)    as total_billed,
  -- Paid vs outstanding is the question that actually gets asked next.
  coalesce(sum(i.total) filter (where i.status = 'paid'), 0)::numeric(12,2)
                                              as total_paid,
  max(i.issue_date)                           as last_invoiced
from public.customers c
left join public.invoices i on i.customer_id = c.id
group by c.id, c.user_id;
