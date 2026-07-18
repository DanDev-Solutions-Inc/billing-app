-- ---------------------------------------------------------------------------
-- HST breakdown for receipts + transactions
-- ---------------------------------------------------------------------------
-- Both tables store one gross, tax-inclusive `amount` — what was actually paid
-- (the receipt AI prompt asks for "the FINAL total ... including tax"). We keep
-- it that way: every read path in the app, the cash-flow RPC, and the dashboard
-- sums all assume `amount` is the real money that moved. Splitting the column
-- into subtotal/tax would silently halve those aggregates.
--
-- Instead we record *whether* tax is bundled inside the amount, and derive the
-- split at render time (splitTaxInclusive in utils/money.ts). Nothing about the
-- existing numbers changes.
--
-- Default true: these are Ontario CAD purchases, which normally carry 13% HST.
-- False is the escape hatch for the genuinely untaxed — zero-rated groceries,
-- exempt insurance and bank fees, out-of-province and USD-invoice money.

alter table public.receipts
  add column if not exists tax_included boolean not null default true;

alter table public.transactions
  add column if not exists tax_included boolean not null default true;

comment on column public.receipts.tax_included is
  'Whether `amount` is HST-inclusive. False = zero-rated/exempt, no tax to back out.';
comment on column public.transactions.tax_included is
  'Whether `amount` is HST-inclusive. False = zero-rated/exempt, no tax to back out.';

-- Backfill: transactions created from a paid invoice already have an authoritative
-- tax figure on the invoice, so trust it rather than assuming 13%. An invoice that
-- charged no tax (USD invoices are 0% — see taxRateFor) must not have 13% imputed
-- back out of its payment.
update public.transactions t
   set tax_included = (i.tax > 0)
  from public.invoices i
 where t.invoice_id = i.id;
