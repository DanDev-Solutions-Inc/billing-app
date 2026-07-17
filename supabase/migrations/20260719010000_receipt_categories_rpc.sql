-- The distinct set of categories actually present on receipts, with counts.
--
-- The category filter can't be a hardcoded list. Receipts imported from Wave
-- carry Wave's own names ("Computer – Software", "Meals and Entertainment"),
-- which don't match the app's RECEIPT_CATEGORIES — a dropdown built from the
-- constant reaches ~11% of rows and silently hides the rest.
--
-- Aggregated here rather than in JS because a plain select of every category
-- stops at PostgREST's 1,000-row cap, so the tail would be missing with no
-- error — exactly the class of bug this app has hit before.
--
-- SECURITY INVOKER (the default) so RLS still scopes rows to the caller.
create or replace function public.receipt_categories()
returns table (
  category text,
  count    bigint
)
language sql
stable
set search_path = public as $$
  select category, count(*)
  from public.receipts
  where category is not null and category <> ''
  group by category
  order by count(*) desc, category;
$$;
