-- Email delivery tracking ---------------------------------------------------
-- Until now the only trace that a document was emailed was the status flip to
-- 'sent', which really means "Resend accepted the message" — not that it landed.
-- A bounced invoice was completely silent.
--
-- One row per SEND (not per invoice): a document can be emailed more than once —
-- a resend, a reminder, a recurring run — and each of those has its own fate.
-- Resend's webhook stamps the timestamps as events arrive.
--
-- Polymorphic parent (invoice | estimate) mirrors line_items: both kinds go out
-- through the same sendDocumentEmail(), so both are recorded the same way.
create table if not exists public.document_emails (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  parent_type     text not null check (parent_type in ('invoice','estimate')),
  parent_id       uuid not null,
  -- The id emails.send() returns, which every webhook event echoes back. Join key.
  resend_email_id text not null unique,
  recipient       text not null,
  sent_at         timestamptz not null default now(),

  -- Stamped by the webhook. First event of each kind wins.
  delivered_at    timestamptz,
  opened_at       timestamptz,   -- see the accuracy note below
  bounced_at      timestamptz,
  bounce_reason   text
);
create index if not exists document_emails_parent_idx
  on public.document_emails(parent_type, parent_id);
create index if not exists document_emails_user_idx on public.document_emails(user_id);

-- On opened_at: Resend's open tracking is a 1x1 pixel, and Resend's own docs say
-- it "is not a statistically accurate way of detecting if your users are engaging
-- with your content". Apple Mail pre-fetches images (an open with no human), and
-- corporate firewalls block them (a human with no open). Treat it as "probably
-- seen". delivered_at and bounced_at are the trustworthy ones.

-- RLS: read own-or-shared, write owner-only — same shape as every other table.
-- The webhook writes with the service-role key, which bypasses RLS, since the
-- request carries no session (it's Resend calling, not a user).
alter table public.document_emails enable row level security;

drop policy if exists "read own or shared" on public.document_emails;
create policy "read own or shared" on public.document_emails
  for select using (public.has_access(user_id));

drop policy if exists "modify own" on public.document_emails;
create policy "modify own" on public.document_emails
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
