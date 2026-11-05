-- =============================================================================
-- BUSINESS AI - core schema
--   shared helpers, tier limits, businesses, profiles, subscription entitlements,
--   onboarding responses, auth.users signup trigger.
--
-- Conventions (docs/ARCHITECTURE.md section 4, docs/DATA_MODEL.md):
--   * text + CHECK constraints instead of enums; CHECK value lists mirror the TS
--     constants in supabase/functions/_shared/domain (asserted by
--     supabase/tests/domain-parity.test.ts).
--   * money = bigint minor units, capped at 1e13 so values stay exact in JS numbers.
--   * RLS on every table; anon has no privileges; authenticated gets explicit,
--     minimal grants; every function sets search_path = ''.
--   * Business-rule errors are raised with SQLSTATE P0001 and message = error code
--     (see docs/DATA_MODEL.md "Error codes").
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Default privileges: nothing created in `public` by postgres is exposed to anon
-- or authenticated unless a migration grants it explicitly (fail closed).
-- service_role keeps the Supabase defaults.
-- -----------------------------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Generic trigger functions
-- -----------------------------------------------------------------------------

-- Maintains updated_at on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Business-scoped rows can never move to another business (prevents cross-business
-- links via later updates, e.g. a task moved away from its milestone/dependencies).
create or replace function public.prevent_business_id_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'immutable_column' using errcode = 'P0001', detail = 'business_id cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_business_id_change() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Tier limits (mirror of supabase/functions/_shared/domain/entitlements.ts).
-- Unknown tiers resolve to 'free', exactly like limitsFor() in TS.
-- -----------------------------------------------------------------------------
create or replace function public.tier_limits(p_tier text)
returns table (max_businesses integer, max_forecast_months integer)
language sql
immutable
set search_path = ''
as $$
  select l.max_businesses, l.max_forecast_months
  from (
    values
      ('free', 1, 12),
      ('pro', 10, 36)
  ) as l (tier, max_businesses, max_forecast_months)
  where l.tier = case when p_tier = 'pro' then 'pro' else 'free' end;
$$;

revoke all on function public.tier_limits(text) from public, anon;
grant execute on function public.tier_limits(text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- businesses
-- -----------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null
    constraint businesses_name_length check (char_length(name) between 1 and 120 and name ~ '\S'),
  idea text not null default ''
    constraint businesses_idea_length check (char_length(idea) <= 4000),
  stage text not null default 'idea'
    constraint businesses_stage_check check (stage in ('idea', 'planning', 'launching', 'operating', 'growing')),
  country_code text
    constraint businesses_country_code_format check (country_code ~ '^[A-Z]{2}$'),
  currency text not null default 'ILS'
    constraint businesses_currency_format check (currency ~ '^[A-Z]{3}$'),
  onboarding_completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.businesses is 'A business owned by one user. Max non-archived businesses per tier enforced by trigger.';
comment on column public.businesses.owner_id is 'Defaults to auth.uid(); immutable.';
comment on column public.businesses.currency is 'ISO-4217 code; all *_minor amounts of this business are in this currency.';

create index businesses_owner_id_idx on public.businesses (owner_id);
create index businesses_owner_active_idx on public.businesses (owner_id) where archived_at is null;

-- RLS helper used by every business-scoped policy.
create or replace function public.owns_business(b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses
    where id = b
      and owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_business(uuid) from public, anon;
grant execute on function public.owns_business(uuid) to authenticated, service_role;

-- Used by security-invoker RPCs: passes for the owner, or for service_role /
-- postgres when the business exists; otherwise raises not_found (no existence leak).
create or replace function public.assert_business_access(p_business_id uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_business_id is not null then
    if public.owns_business(p_business_id) then
      return;
    end if;
    if current_user in ('service_role', 'postgres')
      and exists (select 1 from public.businesses where id = p_business_id) then
      return;
    end if;
  end if;
  raise exception 'not_found' using errcode = 'P0001', detail = 'business not found';
end;
$$;

revoke all on function public.assert_business_access(uuid) from public, anon;
grant execute on function public.assert_business_access(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- subscription_entitlements (writes: service role only)
-- -----------------------------------------------------------------------------
create table public.subscription_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free'
    constraint subscription_entitlements_tier_check check (tier in ('free', 'pro')),
  status text not null default 'active'
    constraint subscription_entitlements_status_check check (status in ('active', 'expired', 'canceled')),
  source text not null default 'default'
    constraint subscription_entitlements_source_check check (source in ('default', 'manual', 'store')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscription_entitlements is 'One row per user, created at signup (free/active/default). Users may only read their own row; writes are service-role only.';

-- 'pro' only when the entitlement is active and not past current_period_end.
-- SECURITY INVOKER: an authenticated caller can only see their own row, so asking
-- about another user yields 'free'. Definer-rights triggers call it for any owner.
create or replace function public.current_tier(p_user uuid default auth.uid())
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select case
        when e.tier = 'pro'
          and e.status = 'active'
          and (e.current_period_end is null or e.current_period_end > now())
        then 'pro'
        else 'free'
      end
      from public.subscription_entitlements e
      where e.user_id = p_user
    ),
    'free'
  );
$$;

revoke all on function public.current_tier(uuid) from public, anon;
grant execute on function public.current_tier(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text
    constraint profiles_display_name_length check (char_length(display_name) between 1 and 100),
  locale text not null default 'he'
    constraint profiles_locale_check check (locale in ('he', 'en')),
  theme text not null default 'system'
    constraint profiles_theme_check check (theme in ('system', 'light', 'dark')),
  active_business_id uuid references public.businesses (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Created by trigger on auth.users insert. Users select/update their own row only (columns display_name, locale, theme, active_business_id).';

create index profiles_active_business_id_idx on public.profiles (active_business_id);

-- -----------------------------------------------------------------------------
-- onboarding_responses
-- -----------------------------------------------------------------------------
create table public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  question_key text not null
    constraint onboarding_responses_question_key_check check (question_key in ('business_idea', 'country', 'starting_budget', 'experience', 'target_customers', 'primary_goal', 'weekly_hours', 'launch_timeline')),
  value jsonb,
  skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_responses_business_question_key unique (business_id, question_key),
  constraint onboarding_responses_value_present check (skipped or value is not null),
  constraint onboarding_responses_value_size check (value is null or char_length(value::text) <= 20000)
);

comment on table public.onboarding_responses is 'One row per onboarding question per business. Upsert on (business_id, question_key).';

-- unique (business_id, question_key) also serves as the business_id index.

-- -----------------------------------------------------------------------------
-- Business rules on businesses
-- -----------------------------------------------------------------------------

-- Max non-archived businesses per tier, on insert and on unarchive. Definer rights
-- so the owner's entitlement is read consistently whoever performs the write.
create or replace function public.enforce_business_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max integer;
  v_count integer;
begin
  if new.archived_at is not null or new.owner_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.archived_at is null then
    return new; -- not an unarchive
  end if;
  -- A signed-in user writing someone else's row is rejected by RLS; do not
  -- reveal that owner's limit state through this trigger's error.
  if (select auth.uid()) is not null and new.owner_id <> (select auth.uid()) then
    return new;
  end if;

  -- Serialize concurrent creations for the same owner.
  perform pg_advisory_xact_lock(hashtext('business_limit:' || new.owner_id::text));

  select l.max_businesses into v_max
  from public.tier_limits(public.current_tier(new.owner_id)) as l;

  select count(*) into v_count
  from public.businesses
  where owner_id = new.owner_id
    and archived_at is null
    and id <> new.id;

  if v_count >= v_max then
    raise exception 'business_limit_reached'
      using errcode = 'P0001', detail = format('max_businesses=%s', v_max);
  end if;
  return new;
end;
$$;

create or replace function public.businesses_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'immutable_column' using errcode = 'P0001', detail = 'owner_id cannot be changed';
  end if;
  if new.id is distinct from old.id then
    raise exception 'immutable_column' using errcode = 'P0001', detail = 'id cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_business_limit() from public, anon, authenticated;
revoke all on function public.businesses_guard_update() from public, anon, authenticated;

create trigger businesses_guard_update
  before update on public.businesses
  for each row execute function public.businesses_guard_update();

create trigger businesses_enforce_limit
  before insert or update of archived_at on public.businesses
  for each row execute function public.enforce_business_limit();

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create trigger subscription_entitlements_set_updated_at
  before update on public.subscription_entitlements
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger onboarding_responses_set_updated_at
  before update on public.onboarding_responses
  for each row execute function public.set_updated_at();

create trigger onboarding_responses_business_id_immutable
  before update of business_id on public.onboarding_responses
  for each row execute function public.prevent_business_id_change();

-- -----------------------------------------------------------------------------
-- Signup: profile + free entitlement
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
  v_display_name text := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 100), '');
begin
  if v_locale is null or v_locale not in ('he', 'en') then
    v_locale := 'he';
  end if;

  insert into public.profiles (id, display_name, locale)
  values (new.id, v_display_name, v_locale)
  on conflict (id) do nothing;

  insert into public.subscription_entitlements (user_id, tier, status, source)
  values (new.id, 'free', 'active', 'default')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row level security & grants
-- -----------------------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.profiles enable row level security;
alter table public.onboarding_responses enable row level security;

revoke all on table public.businesses, public.subscription_entitlements, public.profiles, public.onboarding_responses
  from anon, authenticated;
grant all on table public.businesses, public.subscription_entitlements, public.profiles, public.onboarding_responses
  to service_role;

-- businesses: owner CRUD
grant select, insert, update, delete on table public.businesses to authenticated;

create policy businesses_select_own on public.businesses
  for select to authenticated
  using (owner_id = (select auth.uid()));
create policy businesses_insert_own on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy businesses_update_own on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy businesses_delete_own on public.businesses
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- subscription_entitlements: select own only
grant select on table public.subscription_entitlements to authenticated;

create policy subscription_entitlements_select_own on public.subscription_entitlements
  for select to authenticated
  using (user_id = (select auth.uid()));

-- profiles: select/update own; active business must be owned
grant select on table public.profiles to authenticated;
grant update (display_name, locale, theme, active_business_id) on table public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (active_business_id is null or (select public.owns_business(active_business_id)))
  );

-- onboarding_responses: owner CRUD (upsert = insert + update)
grant select, insert, update, delete on table public.onboarding_responses to authenticated;

create policy onboarding_responses_select_own on public.onboarding_responses
  for select to authenticated
  using ((select public.owns_business(business_id)));
create policy onboarding_responses_insert_own on public.onboarding_responses
  for insert to authenticated
  with check ((select public.owns_business(business_id)));
create policy onboarding_responses_update_own on public.onboarding_responses
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy onboarding_responses_delete_own on public.onboarding_responses
  for delete to authenticated
  using ((select public.owns_business(business_id)));
