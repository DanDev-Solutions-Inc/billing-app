-- Exchange rate to CAD, stored per document.
--
-- Reporting is in CAD, so a USD invoice needs converting. The rate is stored on
-- the row rather than applied at read time: an invoice raised at 1.37 must keep
-- reporting at 1.37 forever. Converting live would silently restate last year's
-- revenue every time the rate moved.
--
-- 1 for CAD (identity), so `total * exchange_rate` is the CAD value of any row
-- without special-casing the currency.
alter table public.invoices
  add column if not exists exchange_rate numeric(12,6) not null default 1;

alter table public.estimates
  add column if not exists exchange_rate numeric(12,6) not null default 1;

-- CAD rows are already correct at 1. USD rows need a real rate; they're left at
-- 1 here deliberately rather than guessed at — a wrong rate is worse than an
-- obvious one, and the backfill script sets them per issue year.
create index if not exists invoices_currency_idx
  on public.invoices(user_id, currency);
