-- Sequential, auto-generated invoice numbers. Continues from the highest
-- existing numeric invoice number per user (so imported Wave invoices carry on,
-- e.g. 551 → 552). Non-numeric numbers are ignored.
create or replace function public.next_invoice_number(uid uuid)
returns text language sql stable
set search_path = public as $$
  select (coalesce(max(invoice_number::bigint), 0) + 1)::text
  from public.invoices
  where user_id = uid and invoice_number ~ '^\d+$';
$$;
