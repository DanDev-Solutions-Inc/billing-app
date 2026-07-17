-- Indexes for query patterns the app actually runs.
--
-- Each one below is matched to a real call site, not added speculatively.

-- listReceipts orders by (receipt_date desc, created_at desc) over 3,598 rows,
-- and only receipts(user_id) existed — so every receipts page load sorted the
-- whole table.
create index if not exists receipts_user_date_idx
  on public.receipts(user_id, receipt_date desc, created_at desc);

-- customer_billing_summary left-joins invoices on customer_id for every
-- /customers load, and listInvoices filters on it. There was no index on
-- invoices.customer_id at all — a full scan per join.
create index if not exists invoices_customer_idx
  on public.invoices(customer_id);

-- listInvoices / listEstimates order by (issue_date desc, created_at desc).
create index if not exists invoices_user_issued_idx
  on public.invoices(user_id, issue_date desc, created_at desc);
create index if not exists estimates_user_issued_idx
  on public.estimates(user_id, issue_date desc, created_at desc);

-- hasInvoiceIncome runs on every "mark as paid" and once per invoice during a
-- Wave import (548×), filtering transactions by invoice_id — unindexed, so it
-- scanned 4,693 rows each time.
create index if not exists transactions_invoice_idx
  on public.transactions(invoice_id)
  where invoice_id is not null;

-- delete_transaction_cascade and receipt deletion look transactions up by
-- receipt_id.
create index if not exists transactions_receipt_idx
  on public.transactions(receipt_id)
  where receipt_id is not null;

-- Search is `ilike '%term%'`, which a b-tree can never serve — it needs
-- trigrams. Without these, every keystroke scans the table: 4,693 transactions
-- for the ledger search, and all customers on every invoice/estimate search.
create extension if not exists pg_trgm;

create index if not exists transactions_description_trgm_idx
  on public.transactions using gin (description gin_trgm_ops);
create index if not exists transactions_category_trgm_idx
  on public.transactions using gin (category gin_trgm_ops);
create index if not exists customers_name_trgm_idx
  on public.customers using gin (name gin_trgm_ops);
