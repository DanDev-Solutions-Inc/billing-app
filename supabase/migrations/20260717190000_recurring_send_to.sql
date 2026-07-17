-- Which address a schedule emails to.
--
-- Schedules always used the customer's primary email. Now that a customer can
-- hold secondary addresses (AP clerk, shared inbox), a schedule picks one.
-- NULL keeps the old behaviour — follow the customer's primary address, so it
-- stays correct if that address later changes.
alter table public.recurring_invoices
  add column if not exists send_to text;
