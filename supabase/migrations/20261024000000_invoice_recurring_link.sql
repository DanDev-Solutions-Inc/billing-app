-- Which schedule raised an invoice, so a schedule can show what it has billed
-- and what has been paid. Null for hand-made and imported invoices. Set null
-- (not cascade) on delete: deleting a schedule keeps its invoices.
alter table public.invoices
  add column if not exists recurring_invoice_id uuid
    references public.recurring_invoices(id) on delete set null;

create index if not exists invoices_recurring_idx
  on public.invoices(recurring_invoice_id)
  where recurring_invoice_id is not null;

-- Backfill what the cron already generated. Deliberately narrow: same owner and
-- customer, same subtotal as the schedule's line items, and created after the
-- schedule was — older look-alikes are Wave imports, not this schedule's runs.
update public.invoices i
   set recurring_invoice_id = r.id
  from public.recurring_invoices r
 where i.recurring_invoice_id is null
   and i.user_id = r.user_id
   and i.customer_id = r.customer_id
   and i.created_at > r.created_at
   and i.subtotal = (
     select coalesce(sum((li->>'quantity')::numeric * (li->>'unit_price')::numeric), 0)
       from jsonb_array_elements(r.line_items) li
   );
