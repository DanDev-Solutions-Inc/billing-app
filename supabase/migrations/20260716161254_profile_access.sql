-- Profile sharing: an owner grants other people (e.g. an accountant) READ access
-- to their data. Keyed by the invitee's email so access works the moment they
-- sign up. Writes remain owner-only.

create table if not exists public.profile_access (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  member_email text not null,
  role         text not null default 'viewer' check (role in ('viewer','editor')),
  created_at   timestamptz not null default now(),
  unique (owner_id, member_email)
);
create index if not exists profile_access_owner_idx on public.profile_access(owner_id);
create index if not exists profile_access_member_idx on public.profile_access(lower(member_email));

alter table public.profile_access enable row level security;

drop policy if exists "owner manages" on public.profile_access;
create policy "owner manages" on public.profile_access
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "member sees own" on public.profile_access;
create policy "member sees own" on public.profile_access
  for select using (lower(member_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- True when the current user owns, or has been granted access to, target_owner's data.
create or replace function public.has_access(target_owner uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select auth.uid() = target_owner
    or exists (
      select 1 from public.profile_access pa
      where pa.owner_id = target_owner
        and lower(pa.member_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

-- Replace each table's single owner policy with: read = own-or-shared, write = owner-only.
do $$
declare t text;
begin
  foreach t in array array[
    'customers','invoices','estimates','line_items','receipts',
    'transactions','recurring_invoices'
  ] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('drop policy if exists "read own or shared" on public.%I', t);
    execute format('drop policy if exists "modify own" on public.%I', t);
    execute format(
      'create policy "read own or shared" on public.%I for select using (public.has_access(user_id))', t);
    execute format(
      'create policy "modify own" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
