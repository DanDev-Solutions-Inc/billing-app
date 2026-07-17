-- Structured customer addresses.
--
-- `address` was a single free-text blob, which can't be validated, sorted, or
-- rendered per-line on an invoice. These columns hold the parts; the legacy
-- column stays as a fallback for the 28 Wave-imported customers whose text we
-- don't want to guess at (and so nothing breaks mid-deploy).
alter table public.customers
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city          text,
  add column if not exists province      text,
  add column if not exists postal_code   text,
  add column if not exists country       text;

-- Wave exported the address as newline-separated lines:
--   line1 / line2? / "city, province, postal" / country
-- Only the unambiguous cases are backfilled — a 3-line address is line1 +
-- locality + country, a 4-line one has a line2. Anything else keeps its text
-- and is left for a human, rather than being mangled by a guess.
update public.customers
set
  address_line1 = split_part(address, E'\n', 1),
  address_line2 = case
    when array_length(string_to_array(address, E'\n'), 1) >= 4
      then split_part(address, E'\n', 2)
  end,
  city = trim(split_part(
    split_part(address, E'\n',
      case when array_length(string_to_array(address, E'\n'), 1) >= 4 then 3 else 2 end),
    ',', 1)),
  province = nullif(trim(split_part(
    split_part(address, E'\n',
      case when array_length(string_to_array(address, E'\n'), 1) >= 4 then 3 else 2 end),
    ',', 2)), ''),
  postal_code = nullif(trim(split_part(
    split_part(address, E'\n',
      case when array_length(string_to_array(address, E'\n'), 1) >= 4 then 3 else 2 end),
    ',', 3)), ''),
  country = nullif(trim(split_part(address, E'\n',
    array_length(string_to_array(address, E'\n'), 1))), '')
where address is not null
  and address <> ''
  and address_line1 is null
  and array_length(string_to_array(address, E'\n'), 1) between 3 and 4;
