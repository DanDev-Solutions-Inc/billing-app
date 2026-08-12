-- How the money arrived, from a fixed list rather than a free-text note.
--
-- "cheque #204", "Cheque", "chq" and "e transfer" are the same four answers
-- typed four ways, and nothing can be counted or filtered on that. A constrained
-- column keeps "how do they usually pay" answerable.
--
-- `note` stays: it carries the provenance line the backfill wrote, and a cheque
-- number is a detail the method itself can't hold.
alter table public.invoice_payments
  add column if not exists method text;

alter table public.invoice_payments
  drop constraint if exists invoice_payments_method_check;
alter table public.invoice_payments
  add constraint invoice_payments_method_check
  check (method is null or method in
    ('cheque','bank','e_transfer','cash','card','other'));

comment on column public.invoice_payments.method is
  'How the payment was received. Null on rows recorded before the method was asked for.';
