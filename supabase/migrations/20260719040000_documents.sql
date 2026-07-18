-- Documents: a folder tree for the files an accountant asks for.
--
-- The bytes live in Vercel Blob, not here. These two tables hold only what
-- Blob has no concept of: a hierarchy. Blob is a flat key-value store, so
-- without a folder row an empty folder cannot exist (there'd be nothing to
-- represent it) and renaming one would mean copying every object beneath it.
-- A row is ~200 bytes; the PDFs it points at are megabytes, and they stay in
-- the bucket.
--
-- Follows the receipts pattern: blob_url is what we fetch with the store
-- token, blob_pathname is the key passed to del().

create table if not exists public.document_folders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  -- Null parent is a root folder. Cascade so deleting a folder takes its
  -- subtree with it — the blobs are cleaned up by delete_folder_cascade below,
  -- which must run first to collect the pathnames.
  parent_id  uuid references public.document_folders(id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- Null folder means the document sits at the root.
  folder_id     uuid references public.document_folders(id) on delete cascade,
  name          text not null,
  blob_url      text not null,
  blob_pathname text not null,
  size          bigint not null default 0,
  content_type  text,
  created_at    timestamptz not null default now()
);

create index if not exists document_folders_user_idx on public.document_folders(user_id);
create index if not exists document_folders_parent_idx on public.document_folders(parent_id);
create index if not exists documents_user_idx on public.documents(user_id);
create index if not exists documents_folder_idx on public.documents(folder_id);

-- One name per level, case-insensitively — "Taxes" and "taxes" in the same
-- folder is a filing mistake, not a distinction. parent_id is coalesced to a
-- sentinel because NULLs compare as distinct, which would let unlimited
-- duplicates accumulate at the root, the one level most likely to collect them.
create unique index if not exists document_folders_unique_name
  on public.document_folders (user_id, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

alter table public.document_folders enable row level security;
alter table public.documents enable row level security;

-- Read own-or-shared, write owner-only — the same split every other table uses
-- (see 20260716161254_profile_access.sql). This is what lets the accountant
-- open Documents and download, without being able to change anything.
drop policy if exists "read own or shared" on public.document_folders;
create policy "read own or shared" on public.document_folders
  for select using (public.has_access(user_id));
drop policy if exists "modify own" on public.document_folders;
create policy "modify own" on public.document_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read own or shared" on public.documents;
create policy "read own or shared" on public.documents
  for select using (public.has_access(user_id));
drop policy if exists "modify own" on public.documents;
create policy "modify own" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Every document at or beneath a folder, for the folder download and for
-- working out what to delete from the bucket.
--
-- Recursion in SQL rather than a query per level in JS: a deep tree would
-- otherwise be one round trip per folder, and the delete path needs the whole
-- subtree before it removes anything.
--
-- SECURITY INVOKER so RLS still scopes it to the caller.
create or replace function public.folder_documents(root uuid)
returns table (
  id            uuid,
  name          text,
  blob_url      text,
  blob_pathname text,
  size          bigint,
  content_type  text,
  -- Slash-joined path from the root folder, so a zip can rebuild the tree.
  rel_path      text
)
language sql
stable
set search_path = public as $$
  with recursive tree as (
    select f.id, f.name::text as path
    from public.document_folders f
    where f.id = root
    union all
    select c.id, t.path || '/' || c.name
    from public.document_folders c
    join tree t on c.parent_id = t.id
  )
  select
    d.id, d.name, d.blob_url, d.blob_pathname, d.size, d.content_type,
    t.path || '/' || d.name
  from tree t
  join public.documents d on d.folder_id = t.id;
$$;

-- Delete a folder subtree, returning the blob keys that are now orphaned.
--
-- Same shape as delete_transaction_cascade: the rows go in one transaction and
-- the caller deletes the blobs only after it commits. Doing it the other way
-- round would leave rows pointing at objects that no longer exist if the
-- delete failed — a broken download instead of a bit of wasted storage.
--
-- SECURITY INVOKER: the "modify own" policy means a viewer cannot call this to
-- destroy the owner's files.
create or replace function public.delete_folder_cascade(folder uuid)
returns table (blob_pathname text)
language plpgsql
volatile
set search_path = public as $$
declare
  paths text[];
begin
  -- Collected before the delete, deliberately: once the rows are gone the
  -- pathnames are unrecoverable and the blobs would be orphaned in the bucket
  -- with nothing left pointing at them.
  select array_agg(d.blob_pathname)
    into paths
    from public.folder_documents(folder) d;

  delete from public.document_folders f where f.id = folder;

  return query select unnest(coalesce(paths, '{}'::text[]));
end;
$$;
