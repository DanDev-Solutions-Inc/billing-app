-- Partial payments
--
-- "Mark as paid" could only say yes or no, so a customer who paid half an
-- invoice left it looking untouched — outstanding showed the full amount, and
-- the income only landed in the books once the last dollar arrived.
--
-- Payments become rows: one per amount actually received, each with the instant
-- it arrived. `invoices.amount_paid` is the running sum, maintained by trigger
-- so the list and dashboard can read it as a column instead of joining. Status
-- follows from it — an invoice is 'paid' when the payments cover the total, and
-- goes back to 'sent' if one is removed. "Partially paid" is derived at render
-- time from amount_paid, the same way "overdue" is derived from due_date: it is
-- a view of the numbers, not a fourth state to keep in sync.

create table if not exists public.invoice_payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  -- In the invoice's own currency, like every other money column on it.
  amount     numeric(12,2) not null check (amount > 0),
  -- timestamptz, not date: "when did that transfer land" is an instant, and the
  -- ledger date is derived from it (transactions.txn_date).
  paid_at    timestamptz not null default now(),
  -- Optional "how" — cheque number, e-transfer reference, "cash on site".
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists invoice_payments_user_idx
  on public.invoice_payments(user_id);
create index if not exists invoice_payments_invoice_idx
  on public.invoice_payments(invoice_id, paid_at);

alter table public.invoice_payments enable row level security;

-- Read own-or-shared, write owner-only — the split every other table uses
-- (see 20260716161254_profile_access.sql).
drop policy if exists "read own or shared" on public.invoice_payments;
create policy "read own or shared" on public.invoice_payments
  for select using (public.has_access(user_id));
drop policy if exists "modify own" on public.invoice_payments;
create policy "modify own" on public.invoice_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Running total, denormalised onto the invoice. The invoices list, the
-- dashboard's outstanding figure and the customer summary all need "how much of
-- this is still owed" for every row; a correlated sum over payments would be a
-- subquery on each of those paths for a number that changes only when a payment
-- does.
alter table public.invoices
  add column if not exists amount_paid numeric(12,2) not null default 0;

comment on column public.invoices.amount_paid is
  'Sum of invoice_payments.amount, maintained by trigger. Balance = total - amount_paid.';

-- Which payment booked this income. Cascade, unlike receipt_id/invoice_id's set
-- null: the transaction exists *because* the payment does, so deleting a
-- payment recorded by mistake must take its income row with it rather than
-- leaving money in the books with nothing behind it.
alter table public.transactions
  add column if not exists payment_id uuid
    references public.invoice_payments(id) on delete cascade;

create index if not exists transactions_payment_idx
  on public.transactions(payment_id);

-- ---------------------------------------------------------------------------
-- Keep amount_paid and status in step with the payment rows
-- ---------------------------------------------------------------------------
-- In the trigger rather than the app: the invoice detail page, the status
-- dropdown in the list and any future importer all write payments, and each of
-- them recomputing the total is three chances for the column to drift from the
-- rows it summarises. This way the sum is never stale by construction.
create or replace function public.sync_invoice_payment_total()
returns trigger
language plpgsql
security invoker
set search_path = public as $$
declare
  inv  uuid := coalesce(new.invoice_id, old.invoice_id);
  paid numeric(12,2);
begin
  select coalesce(sum(p.amount), 0)
    into paid
    from public.invoice_payments p
   where p.invoice_id = inv;

  update public.invoices i
     set amount_paid = paid,
         status = case
           -- Covered: paid. `total > 0` guards a zero-dollar invoice, which
           -- would otherwise be "paid" the moment the row existed.
           when i.total > 0 and paid >= i.total then 'paid'::invoice_status
           -- A payment was removed or reduced below the total: it's owed again.
           -- Only from 'paid' — a draft stays a draft.
           when i.status = 'paid' then 'sent'::invoice_status
           else i.status
         end
   where i.id = inv;

  return null;  -- after trigger; the return value is ignored
end;
$$;

drop trigger if exists invoice_payments_sync on public.invoice_payments;
create trigger invoice_payments_sync
  after insert or update or delete on public.invoice_payments
  for each row execute function public.sync_invoice_payment_total();

-- ---------------------------------------------------------------------------
-- Backfill: every invoice already marked paid gets the payment it implies
-- ---------------------------------------------------------------------------
-- Without this, 500-odd settled invoices would read "$0 of $2,400 paid" the
-- moment the new UI shipped. Dated from the income transaction that was booked
-- when it was marked paid (which used the issue date), falling back to the
-- invoice itself for anything imported without one.
insert into public.invoice_payments (user_id, invoice_id, amount, paid_at, note)
select
  i.user_id,
  i.id,
  i.total,
  coalesce(t.txn_date::timestamptz, i.issue_date::timestamptz, i.created_at),
  'Recorded when this invoice was marked paid'
from public.invoices i
left join lateral (
  select t.txn_date
    from public.transactions t
   where t.invoice_id = i.id and t.direction = 'income'
   order by t.txn_date
   limit 1
) t on true
where i.status = 'paid'
  and i.total > 0
  and not exists (
    select 1 from public.invoice_payments p where p.invoice_id = i.id
  );

-- Adopt the income transactions those invoices already have, so deleting a
-- backfilled payment cleans up after itself like a new one does. One payment
-- per invoice above, so there's nothing to disambiguate.
update public.transactions t
   set payment_id = p.id
  from public.invoice_payments p
 where t.invoice_id = p.invoice_id
   and t.direction = 'income'
   and t.payment_id is null;

-- ---------------------------------------------------------------------------
-- Customer summary: paid means paid, not "fully paid"
-- ---------------------------------------------------------------------------
-- Was sum(total) filter (status = 'paid'), which counted a half-settled invoice
-- as nothing. amount_paid is the money actually received, so a partial payment
-- now shows up the day it arrives.
--
-- Same columns in the same order — CREATE OR REPLACE VIEW can only append.
create or replace view public.customer_billing_summary
with (security_invoker = on) as
select
  c.id      as customer_id,
  c.user_id,
  count(i.id) as invoice_count,
  coalesce(sum(i.total * i.exchange_rate), 0)::numeric(12,2) as total_billed,
  coalesce(sum(i.amount_paid * i.exchange_rate), 0)::numeric(12,2) as total_paid,
  max(i.issue_date) as last_invoiced,
  nullif(
    coalesce(sum(i.total) filter (where i.currency <> 'CAD'), 0), 0
  )::numeric(12,2) as total_billed_foreign
from public.customers c
left join public.invoices i on i.customer_id = c.id
group by c.id, c.user_id;
