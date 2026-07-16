-- Store each user's email on their profile so the inbound-receipts webhook can
-- match a plain `receipts@dandev.solutions` message by its sender address
-- (in addition to the per-user `receipts+<token>@…` alias).

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.user_id and p.email is null;

create index if not exists profiles_email_idx on public.profiles(lower(email));

-- Update the signup trigger to capture email going forward.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, extensions as $$
begin
  insert into public.profiles (user_id, email, inbound_token)
  values (new.id, new.email, encode(extensions.gen_random_bytes(9), 'hex'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
