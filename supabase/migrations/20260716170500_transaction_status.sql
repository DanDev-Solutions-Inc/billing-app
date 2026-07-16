-- Wave-style review workflow for transactions: each row is either awaiting
-- review ('pending') or approved ('approved'). New manual/AI/imported rows start
-- pending; income derived from paid invoices is auto-approved (already reconciled).
do $$ begin
  create type public.txn_status as enum ('pending','approved');
exception when duplicate_object then null; end $$;

alter table public.transactions
  add column if not exists status public.txn_status not null default 'pending';

-- Invoice-derived income is considered reconciled — approve it automatically.
update public.transactions set status = 'approved'
  where invoice_id is not null and status = 'pending';

create index if not exists transactions_user_status_idx
  on public.transactions(user_id, status);
