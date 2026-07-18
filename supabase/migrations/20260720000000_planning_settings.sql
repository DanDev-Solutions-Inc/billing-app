-- ---------------------------------------------------------------------------
-- Compensation planning settings
-- ---------------------------------------------------------------------------
-- Inputs for the salary-vs-dividend planner on /reports. Deliberately NOT a
-- ledger: none of this is money that has moved. Payroll and dividends are never
-- recorded as transactions (bank transactions aren't imported), so these values
-- exist only to drive a what-if calculation layered on the real figures.
--
-- One row per user, upserted on the primary key.
--
-- Every rate here is an ASSUMPTION the owner tunes with their accountant, not a
-- calculated figure. The personal rates in particular are flat approximations
-- standing in for progressive brackets, the dividend gross-up and the dividend
-- tax credit — the UI has to present them as such.

create table if not exists public.planning_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- Total intended compensation per month, before the salary/dividend split.
  monthly_total          numeric(12,2) not null default 0
    check (monthly_total >= 0),

  -- How that total is split. 100 = all salary, 0 = all dividend.
  salary_share_percent   numeric(5,2)  not null default 100
    check (salary_share_percent between 0 and 100),

  -- Employer CPP/EI, charged on the salary portion only. A real additional
  -- cost to the corporation, and deductible — so it belongs in the estimate.
  employer_cost_percent  numeric(5,2)  not null default 7.4
    check (employer_cost_percent >= 0),

  -- Flat effective personal rates in the recipient's hands. Salary is taxed as
  -- employment income; dividends are lower via the dividend tax credit, which
  -- is the entire reason a split is worth modelling.
  personal_salary_rate   numeric(5,2)  not null default 20
    check (personal_salary_rate between 0 and 100),
  personal_dividend_rate numeric(5,2)  not null default 10
    check (personal_dividend_rate between 0 and 100),

  updated_at timestamptz not null default now()
);

alter table public.planning_settings enable row level security;

-- The do-block in 20260716161254_profile_access.sql loops a FIXED table list,
-- so new tables get no policy automatically — declare them here. Same split as
-- every other table: a shared viewer (the accountant) reads, only the owner
-- writes.
drop policy if exists "read own or shared" on public.planning_settings;
create policy "read own or shared" on public.planning_settings
  for select using (public.has_access(user_id));

drop policy if exists "modify own" on public.planning_settings;
create policy "modify own" on public.planning_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists planning_settings_set_updated_at on public.planning_settings;
create trigger planning_settings_set_updated_at
  before update on public.planning_settings
  for each row execute function public.set_updated_at();
