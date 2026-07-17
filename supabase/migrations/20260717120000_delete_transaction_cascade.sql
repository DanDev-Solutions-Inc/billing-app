-- Delete a transaction and the receipt it was filed from, in one statement.
--
-- Doing this as two round-trips from the app leaves an orphaned receipt (and a
-- Blob object billing forever) if the second call fails. A function runs inside
-- a single transaction: both rows go, or neither does.
--
-- Returns the receipt's image_pathname so the caller can delete the Blob object
-- AFTER the DB commit — storage can't participate in the transaction, so the
-- file is removed only once the rows are definitely gone.
--
-- SECURITY INVOKER (the default): RLS still applies, so a user can only ever
-- delete their own rows. Do NOT make this SECURITY DEFINER.
create or replace function public.delete_transaction_cascade(txn_id uuid)
returns text
language plpgsql
set search_path = public as $$
declare
  rid  uuid;
  path text;
begin
  select receipt_id into rid from public.transactions where id = txn_id;

  -- Transaction first: receipt_id is ON DELETE SET NULL, so removing the
  -- receipt while the row still referenced it would null the link rather than
  -- delete the pair.
  delete from public.transactions where id = txn_id;

  if rid is not null then
    delete from public.receipts where id = rid returning image_pathname into path;
  end if;

  return path;
end;
$$;
