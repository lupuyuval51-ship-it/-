-- =============================================================================
-- BUSINESS AI - finance: financial model, startup costs, recurring expenses,
-- revenue streams, actual transactions, business goals.
-- Money is bigint minor units in businesses.currency, capped at 1e13 so values
-- (and their sums over a 36-month forecast) stay exact as JS numbers.
-- =============================================================================

create table public.financial_models (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  starting_capital_minor bigint not null default 0
    constraint financial_models_starting_capital_range check (starting_capital_minor between 0 and 10000000000000),
  forecast_months integer not null default 12
    constraint financial_models_forecast_months_range check (forecast_months between 1 and 36),
  conservative_volume_pct integer not null default 70
    constraint financial_models_conservative_volume_pct_range check (conservative_volume_pct between 0 and 1000),
  conservative_price_pct integer not null default 100
    constraint financial_models_conservative_price_pct_range check (conservative_price_pct between 0 and 1000),
  conservative_cost_pct integer not null default 110
    constraint financial_models_conservative_cost_pct_range check (conservative_cost_pct between 0 and 1000),
  optimistic_volume_pct integer not null default 130
    constraint financial_models_optimistic_volume_pct_range check (optimistic_volume_pct between 0 and 1000),
  optimistic_price_pct integer not null default 100
    constraint financial_models_optimistic_price_pct_range check (optimistic_price_pct between 0 and 1000),
  optimistic_cost_pct integer not null default 95
    constraint financial_models_optimistic_cost_pct_range check (optimistic_cost_pct between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.financial_models is 'One per business (PK business_id). forecast_months is capped by tier (trigger). Currency comes from businesses.currency.';

create table public.startup_costs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  label text not null
    constraint startup_costs_label_length check (char_length(label) between 1 and 120 and label ~ '\S'),
  amount_minor bigint not null default 0
    constraint startup_costs_amount_range check (amount_minor between 0 and 10000000000000),
  category text not null default ''
    constraint startup_costs_category_length check (char_length(category) <= 60),
  basis text not null default 'user_provided'
    constraint startup_costs_basis_check check (basis in ('user_provided', 'assumption', 'ai_estimate', 'verified')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  label text not null
    constraint recurring_expenses_label_length check (char_length(label) between 1 and 120 and label ~ '\S'),
  monthly_amount_minor bigint not null default 0
    constraint recurring_expenses_amount_range check (monthly_amount_minor between 0 and 10000000000000),
  category text not null default ''
    constraint recurring_expenses_category_length check (char_length(category) <= 60),
  basis text not null default 'user_provided'
    constraint recurring_expenses_basis_check check (basis in ('user_provided', 'assumption', 'ai_estimate', 'verified')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.revenue_streams (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  label text not null
    constraint revenue_streams_label_length check (char_length(label) between 1 and 120 and label ~ '\S'),
  unit_price_minor bigint not null default 0
    constraint revenue_streams_unit_price_range check (unit_price_minor between 0 and 10000000000000),
  unit_variable_cost_minor bigint not null default 0
    constraint revenue_streams_unit_variable_cost_range check (unit_variable_cost_minor between 0 and 10000000000000),
  monthly_units numeric(12, 2) not null default 0
    constraint revenue_streams_monthly_units_range check (monthly_units >= 0),
  monthly_growth_pct numeric(6, 2) not null default 0
    constraint revenue_streams_monthly_growth_pct_range check (monthly_growth_pct between -100 and 1000),
  basis text not null default 'user_provided'
    constraint revenue_streams_basis_check check (basis in ('user_provided', 'assumption', 'ai_estimate', 'verified')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null
    constraint transactions_kind_check check (kind in ('income', 'expense')),
  amount_minor bigint not null
    constraint transactions_amount_range check (amount_minor between 1 and 10000000000000),
  occurred_on date not null default current_date,
  category text not null default ''
    constraint transactions_category_length check (char_length(category) <= 60),
  note text not null default ''
    constraint transactions_note_length check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transactions is 'Actual income/expenses after launch. amount_minor is always positive; kind gives the sign.';

create table public.business_goals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null
    constraint business_goals_title_length check (char_length(title) between 1 and 200 and title ~ '\S'),
  metric text not null
    constraint business_goals_metric_check check (metric in ('revenue', 'customers', 'profit', 'custom')),
  target_value numeric(20, 2) not null
    constraint business_goals_target_value_range check (target_value >= 0),
  current_value numeric(20, 2) not null default 0,
  unit text not null default ''
    constraint business_goals_unit_length check (char_length(unit) <= 20),
  due_date date,
  status text not null default 'active'
    constraint business_goals_status_check check (status in ('active', 'achieved', 'dropped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.business_goals.target_value is 'For metric revenue/profit: minor units of businesses.currency. Otherwise in `unit`.';
comment on column public.business_goals.current_value is 'Manual progress for customers/custom metrics; revenue/profit progress is computed from transactions in-app.';

-- Indexes (FKs + common filters)
create index startup_costs_business_idx on public.startup_costs (business_id, sort_order);
create index recurring_expenses_business_idx on public.recurring_expenses (business_id, sort_order);
create index revenue_streams_business_idx on public.revenue_streams (business_id, sort_order);
create index transactions_business_occurred_idx on public.transactions (business_id, occurred_on desc);
create index business_goals_business_status_idx on public.business_goals (business_id, status);

-- -----------------------------------------------------------------------------
-- forecast_months cap by the owner's tier. Raising the horizon beyond the tier
-- maximum is rejected; an already-longer horizon (after a downgrade) may be kept
-- or shortened, never lengthened.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_forecast_months_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_max integer;
begin
  if tg_op = 'UPDATE' and new.forecast_months <= old.forecast_months then
    return new;
  end if;

  select b.owner_id into v_owner from public.businesses b where b.id = new.business_id;
  if v_owner is null then
    return new; -- FK violation will be raised
  end if;
  -- Non-owners are rejected by RLS; do not reveal the owner's tier here.
  if (select auth.uid()) is not null and v_owner <> (select auth.uid()) then
    return new;
  end if;

  select l.max_forecast_months into v_max
  from public.tier_limits(public.current_tier(v_owner)) as l;

  if new.forecast_months > v_max then
    raise exception 'forecast_limit_exceeded'
      using errcode = 'P0001', detail = format('max_forecast_months=%s', v_max);
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_forecast_months_limit() from public, anon, authenticated;

create trigger financial_models_enforce_forecast_limit
  before insert or update of forecast_months on public.financial_models
  for each row execute function public.enforce_forecast_months_limit();

create trigger financial_models_set_updated_at
  before update on public.financial_models
  for each row execute function public.set_updated_at();
create trigger financial_models_business_id_immutable
  before update of business_id on public.financial_models
  for each row execute function public.prevent_business_id_change();

create trigger startup_costs_set_updated_at
  before update on public.startup_costs
  for each row execute function public.set_updated_at();
create trigger startup_costs_business_id_immutable
  before update of business_id on public.startup_costs
  for each row execute function public.prevent_business_id_change();

create trigger recurring_expenses_set_updated_at
  before update on public.recurring_expenses
  for each row execute function public.set_updated_at();
create trigger recurring_expenses_business_id_immutable
  before update of business_id on public.recurring_expenses
  for each row execute function public.prevent_business_id_change();

create trigger revenue_streams_set_updated_at
  before update on public.revenue_streams
  for each row execute function public.set_updated_at();
create trigger revenue_streams_business_id_immutable
  before update of business_id on public.revenue_streams
  for each row execute function public.prevent_business_id_change();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger transactions_business_id_immutable
  before update of business_id on public.transactions
  for each row execute function public.prevent_business_id_change();

create trigger business_goals_set_updated_at
  before update on public.business_goals
  for each row execute function public.set_updated_at();
create trigger business_goals_business_id_immutable
  before update of business_id on public.business_goals
  for each row execute function public.prevent_business_id_change();

-- -----------------------------------------------------------------------------
-- Row level security & grants: owner CRUD on every finance table.
-- -----------------------------------------------------------------------------
alter table public.financial_models enable row level security;
alter table public.startup_costs enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.revenue_streams enable row level security;
alter table public.transactions enable row level security;
alter table public.business_goals enable row level security;

revoke all on table
  public.financial_models, public.startup_costs, public.recurring_expenses,
  public.revenue_streams, public.transactions, public.business_goals
  from anon, authenticated;
grant all on table
  public.financial_models, public.startup_costs, public.recurring_expenses,
  public.revenue_streams, public.transactions, public.business_goals
  to service_role;
grant select, insert, update, delete on table
  public.financial_models, public.startup_costs, public.recurring_expenses,
  public.revenue_streams, public.transactions, public.business_goals
  to authenticated;

create policy financial_models_select_own on public.financial_models
  for select to authenticated using ((select public.owns_business(business_id)));
create policy financial_models_insert_own on public.financial_models
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy financial_models_update_own on public.financial_models
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy financial_models_delete_own on public.financial_models
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy startup_costs_select_own on public.startup_costs
  for select to authenticated using ((select public.owns_business(business_id)));
create policy startup_costs_insert_own on public.startup_costs
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy startup_costs_update_own on public.startup_costs
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy startup_costs_delete_own on public.startup_costs
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy recurring_expenses_select_own on public.recurring_expenses
  for select to authenticated using ((select public.owns_business(business_id)));
create policy recurring_expenses_insert_own on public.recurring_expenses
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy recurring_expenses_update_own on public.recurring_expenses
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy recurring_expenses_delete_own on public.recurring_expenses
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy revenue_streams_select_own on public.revenue_streams
  for select to authenticated using ((select public.owns_business(business_id)));
create policy revenue_streams_insert_own on public.revenue_streams
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy revenue_streams_update_own on public.revenue_streams
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy revenue_streams_delete_own on public.revenue_streams
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy transactions_select_own on public.transactions
  for select to authenticated using ((select public.owns_business(business_id)));
create policy transactions_insert_own on public.transactions
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy transactions_update_own on public.transactions
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy transactions_delete_own on public.transactions
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy business_goals_select_own on public.business_goals
  for select to authenticated using ((select public.owns_business(business_id)));
create policy business_goals_insert_own on public.business_goals
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy business_goals_update_own on public.business_goals
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy business_goals_delete_own on public.business_goals
  for delete to authenticated using ((select public.owns_business(business_id)));

-- -----------------------------------------------------------------------------
-- RPC: ensure_financial_model (security invoker) - returns the business's
-- financial model, inserting the default row if missing.
-- -----------------------------------------------------------------------------
create or replace function public.ensure_financial_model(p_business_id uuid)
returns public.financial_models
language plpgsql
set search_path = ''
as $$
declare
  v_model public.financial_models;
begin
  perform public.assert_business_access(p_business_id);

  insert into public.financial_models (business_id)
  values (p_business_id)
  on conflict (business_id) do nothing;

  select * into v_model from public.financial_models where business_id = p_business_id;
  return v_model;
end;
$$;

revoke all on function public.ensure_financial_model(uuid) from public, anon;
grant execute on function public.ensure_financial_model(uuid) to authenticated, service_role;
