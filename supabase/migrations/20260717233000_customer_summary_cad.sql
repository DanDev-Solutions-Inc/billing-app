-- Report the customer billing summary in CAD.
--
-- The view summed raw totals, so a USD customer's "billed" was their USD figure
-- labelled as dollars — Precision Media Group read $8,517 when the CAD value is
-- $11,520. Worse, a mixed-currency customer would have had the two added
-- together, which means nothing.
--
-- Each invoice converts at the rate stored on its own row, so the figure is
-- stable: it's what those invoices were worth in CAD when they were raised, and
-- it won't restate as the rate moves. total_billed_foreign keeps the original
-- amount so the UI can say what's inside the number.
--
-- total_billed_foreign is appended last on purpose: CREATE OR REPLACE VIEW can
-- only add columns at the end — inserting one mid-list is rejected (42P16).
create or replace view public.customer_billing_summary
with (security_invoker = on) as
select
  c.id      as customer_id,
  c.user_id,
  count(i.id) as invoice_count,
  coalesce(sum(i.total * i.exchange_rate), 0)::numeric(12,2) as total_billed,
  coalesce(
    sum(i.total * i.exchange_rate) filter (where i.status = 'paid'), 0
  )::numeric(12,2) as total_paid,
  max(i.issue_date) as last_invoiced,
  -- Non-CAD billing in its own currency (null when the customer is CAD-only).
  nullif(
    coalesce(sum(i.total) filter (where i.currency <> 'CAD'), 0), 0
  )::numeric(12,2) as total_billed_foreign
from public.customers c
left join public.invoices i on i.customer_id = c.id
group by c.id, c.user_id;
