-- Dedupe key for mailbox-polled receipts. The Gmail poller records the message
-- id (and attachment index) it came from, so re-running the cron — or a retry
-- after a partial failure — can never import the same attachment twice.
alter table public.receipts
  add column if not exists source_message_id text;

-- Partial unique index: only polled rows carry an id; uploads stay null and are
-- unaffected (many nulls would otherwise collide under a plain unique index).
create unique index if not exists receipts_source_message_uidx
  on public.receipts(user_id, source_message_id)
  where source_message_id is not null;
