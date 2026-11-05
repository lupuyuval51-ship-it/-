-- =============================================================================
-- BUSINESS AI - business plans: plans, versions, sections, copy-on-write RPCs.
--
-- Immutability design (see docs/DATA_MODEL.md "Plan versions"):
--   * A version is born 'generating' (insert of any other status is rejected) and
--     moves exactly once to 'ready' (needs >= 1 section) or 'failed'. Terminal
--     states never change; only finance_proposal may still be attached to a
--     'ready' version.
--   * plan_sections can be inserted/updated ONLY while their version is
--     'generating' (trigger, all roles; the version row is locked FOR SHARE so a
--     concurrent flip to 'ready' cannot interleave). Nobody but the cascade from
--     a deleted version/plan/business can delete sections of a non-generating
--     version; authenticated has no DELETE grant on sections or versions.
--   * business_plans.current_version_id may only point at a 'ready' version of
--     the same plan.
--   * save_plan_section / restore_plan_version (security invoker) build a new
--     'generating' version, copy sections, flip it to 'ready' and move
--     current_version_id - all in one transaction, under the user's RLS.
--   * The plan.generate edge function does the same with the user's JWT: insert
--     a 'generating' version, write sections, flip to 'ready' (or 'failed' with
--     error_code), then set current_version_id.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Content validators (used by CHECK constraints; mirror domain/plan.ts)
-- -----------------------------------------------------------------------------
create or replace function public.is_valid_plan_section_content(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_block jsonb;
  v_source jsonb;
  v_ids text[] := '{}'::text[];
begin
  if p is null or jsonb_typeof(p) <> 'object' then
    return false;
  end if;
  if jsonb_typeof(p -> 'summary') is distinct from 'string' or char_length(p ->> 'summary') > 600 then
    return false;
  end if;
  if jsonb_typeof(p -> 'blocks') is distinct from 'array'
    or jsonb_array_length(p -> 'blocks') not between 1 and 24 then
    return false;
  end if;

  for v_block in select e from jsonb_array_elements(p -> 'blocks') as t (e) loop
    if jsonb_typeof(v_block) <> 'object' then
      return false;
    end if;
    if jsonb_typeof(v_block -> 'id') is distinct from 'string'
      or char_length(v_block ->> 'id') not between 1 and 40
      or (v_block ->> 'id') = any (v_ids) then
      return false;
    end if;
    v_ids := v_ids || (v_block ->> 'id');
    if jsonb_typeof(v_block -> 'text') is distinct from 'string'
      or char_length(v_block ->> 'text') not between 1 and 2000
      or (v_block ->> 'text') !~ '\S' then
      return false;
    end if;
    if jsonb_typeof(v_block -> 'basis') is distinct from 'string'
      or (v_block ->> 'basis') not in ('user_provided', 'assumption', 'ai_estimate', 'verified') then
      return false;
    end if;

    v_source := v_block -> 'source';
    if v_source is not null and jsonb_typeof(v_source) <> 'null' then
      if jsonb_typeof(v_source) <> 'object'
        or jsonb_typeof(v_source -> 'title') is distinct from 'string'
        or jsonb_typeof(v_source -> 'url') is distinct from 'string'
        or char_length(v_source ->> 'title') not between 1 and 200
        or char_length(v_source ->> 'url') not between 1 and 500
        or (v_source ->> 'url') !~* '^https?://' then
        return false;
      end if;
    elsif (v_block ->> 'basis') = 'verified' then
      return false; -- a verified statement must cite a source
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.is_valid_plan_section_content(jsonb) from public, anon;
grant execute on function public.is_valid_plan_section_content(jsonb) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.business_plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade
    constraint business_plans_business_id_key unique,
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_plans is 'One plan per business. current_version_id points at the ready version shown to the user.';

create table public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.business_plans (id) on delete cascade,
  version_number integer not null default 0
    constraint plan_versions_version_number_positive check (version_number > 0),
  origin text not null
    constraint plan_versions_origin_check check (origin in ('ai_generated', 'user_edit', 'ai_section', 'restored')),
  status text not null default 'generating'
    constraint plan_versions_status_check check (status in ('generating', 'ready', 'failed')),
  error_code text
    constraint plan_versions_error_code_length check (char_length(error_code) between 1 and 64),
  model text
    constraint plan_versions_model_length check (char_length(model) between 1 and 100),
  change_note text
    constraint plan_versions_change_note_length check (char_length(change_note) <= 500),
  finance_proposal jsonb
    constraint plan_versions_finance_proposal_shape check (
      finance_proposal is null
      or (jsonb_typeof(finance_proposal) = 'object' and char_length(finance_proposal::text) <= 100000)
    ),
  based_on_version_id uuid references public.plan_versions (id) on delete set null,
  -- Informational, deliberately not an FK: only the business owner (RLS) or the
  -- service role (null) creates versions, and versions are deleted with the
  -- business, which is deleted with its owner. An ON DELETE SET NULL FK would
  -- update versions mid-cascade during account deletion.
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_versions_plan_version_number_key unique (plan_id, version_number)
);

comment on table public.plan_versions is 'Immutable plan snapshots. Born generating; moves once to ready/failed. version_number is assigned by trigger (any supplied value is ignored).';
comment on column public.plan_versions.version_number is 'Assigned by trigger as max+1 per plan; do not supply.';
comment on column public.plan_versions.based_on_version_id is 'Version this one was derived from (copy-on-write edit or restore); null for fresh AI generations.';

alter table public.business_plans
  add constraint business_plans_current_version_id_fkey
  foreign key (current_version_id) references public.plan_versions (id) on delete set null;

create table public.plan_sections (
  id uuid primary key default gen_random_uuid(),
  plan_version_id uuid not null references public.plan_versions (id) on delete cascade,
  section_key text not null
    constraint plan_sections_section_key_check check (section_key in ('executive_summary', 'business_concept', 'value_proposition', 'target_audience', 'customer_personas', 'market_validation', 'competitive_positioning', 'revenue_model', 'pricing_strategy', 'startup_costs', 'operating_expenses', 'marketing_strategy', 'launch_strategy', 'risks_assumptions', 'roadmap_30_60_90')),
  content jsonb not null
    constraint plan_sections_content_valid check (public.is_valid_plan_section_content(content)),
  origin text not null
    constraint plan_sections_origin_check check (origin in ('ai', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_sections_version_section_key unique (plan_version_id, section_key)
);

comment on table public.plan_sections is 'Sections of a plan version (PlanSectionContent). Writable only while the version is generating.';

create index business_plans_current_version_id_idx on public.business_plans (current_version_id);
-- plan_versions(plan_id) is covered by plan_versions_plan_version_number_key.
create index plan_versions_based_on_version_id_idx on public.plan_versions (based_on_version_id);
create index plan_versions_plan_status_idx on public.plan_versions (plan_id, status);
-- plan_sections(plan_version_id) is covered by plan_sections_version_section_key.

-- -----------------------------------------------------------------------------
-- Ownership helpers (definer rights: one indexed lookup instead of nested RLS)
-- -----------------------------------------------------------------------------
create or replace function public.owns_plan(p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_plans bp
    join public.businesses b on b.id = bp.business_id
    where bp.id = p_plan_id
      and b.owner_id = (select auth.uid())
  );
$$;

create or replace function public.owns_plan_version(p_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.plan_versions v
    join public.business_plans bp on bp.id = v.plan_id
    join public.businesses b on b.id = bp.business_id
    where v.id = p_version_id
      and b.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_plan(uuid) from public, anon;
revoke all on function public.owns_plan_version(uuid) from public, anon;
grant execute on function public.owns_plan(uuid) to authenticated, service_role;
grant execute on function public.owns_plan_version(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Guard triggers
-- -----------------------------------------------------------------------------

-- business_plans: business_id immutable; current_version_id must be a ready
-- version of this plan. Invoker rights: the caller must be able to see it.
create or replace function public.business_plans_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.business_id is distinct from old.business_id then
    raise exception 'immutable_column' using errcode = 'P0001', detail = 'business_id cannot be changed';
  end if;
  if new.current_version_id is not null
    and (tg_op = 'INSERT' or new.current_version_id is distinct from old.current_version_id) then
    if not exists (
      select 1 from public.plan_versions v
      where v.id = new.current_version_id
        and v.plan_id = new.id
        and v.status = 'ready'
    ) then
      raise exception 'invalid_request'
        using errcode = 'P0001', detail = 'current_version_id must reference a ready version of this plan';
    end if;
  end if;
  return new;
end;
$$;

-- plan_versions insert: serialize numbering on the plan row, force status
-- 'generating', stamp created_by. Invoker rights: a caller who cannot see/lock
-- the plan gets not_found (RLS hides it).
create or replace function public.plan_versions_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.business_plans where id = new.plan_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'plan not found';
  end if;

  if new.status <> 'generating' then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'a plan version must be created with status generating';
  end if;

  if new.based_on_version_id is not null and not exists (
    select 1 from public.plan_versions v
    where v.id = new.based_on_version_id and v.plan_id = new.plan_id
  ) then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'based_on_version_id must belong to the same plan';
  end if;

  select coalesce(max(v.version_number), 0) + 1 into new.version_number
  from public.plan_versions v
  where v.plan_id = new.plan_id;

  if (select auth.uid()) is not null then
    new.created_by := (select auth.uid());
  end if;
  return new;
end;
$$;

-- plan_versions update: identity columns immutable; one-way status machine.
create or replace function public.plan_versions_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.plan_id is distinct from old.plan_id
    or new.version_number is distinct from old.version_number
    or new.origin is distinct from old.origin
    or new.created_by is distinct from old.created_by
    -- based_on_version_id may only become null (FK on delete set null)
    or new.created_at is distinct from old.created_at
    or (new.based_on_version_id is distinct from old.based_on_version_id and new.based_on_version_id is not null) then
    raise exception 'immutable_column' using errcode = 'P0001', detail = 'plan version identity columns cannot be changed';
  end if;

  if old.status <> 'generating' then
    if new.status is distinct from old.status
      or new.error_code is distinct from old.error_code
      or new.model is distinct from old.model
      or new.change_note is distinct from old.change_note
      or (old.status = 'failed' and new.finance_proposal is distinct from old.finance_proposal) then
      raise exception 'plan_version_immutable' using errcode = 'P0001', detail = format('version is %s', old.status);
    end if;
    return new;
  end if;

  if new.status = 'ready' then
    if not exists (select 1 from public.plan_sections s where s.plan_version_id = new.id) then
      raise exception 'precondition_failed' using errcode = 'P0001', detail = 'a ready version needs at least one section';
    end if;
    new.error_code := null;
  end if;
  return new;
end;
$$;

-- plan_sections: writable only while the version is generating (all roles).
-- Definer rights so the version row can be locked FOR SHARE regardless of caller.
create or replace function public.plan_sections_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if tg_op = 'DELETE' then
    select v.status into v_status from public.plan_versions v where v.id = old.plan_version_id;
    -- Not found = cascade from a deleted version/plan/business: allowed.
    if found and v_status <> 'generating' then
      raise exception 'plan_version_immutable' using errcode = 'P0001', detail = format('version is %s', v_status);
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE'
    and (new.plan_version_id is distinct from old.plan_version_id or new.section_key is distinct from old.section_key) then
    raise exception 'immutable_column' using errcode = 'P0001', detail = 'plan_version_id and section_key cannot be changed';
  end if;

  if (select auth.uid()) is not null and not public.owns_plan_version(new.plan_version_id) then
    raise exception 'not_found' using errcode = 'P0001', detail = 'plan version not found';
  end if;

  select v.status into v_status from public.plan_versions v where v.id = new.plan_version_id for share;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'plan version not found';
  end if;
  if v_status <> 'generating' then
    raise exception 'plan_version_immutable' using errcode = 'P0001', detail = format('version is %s', v_status);
  end if;
  return new;
end;
$$;

revoke all on function public.business_plans_guard() from public, anon, authenticated;
revoke all on function public.plan_versions_before_insert() from public, anon, authenticated;
revoke all on function public.plan_versions_before_update() from public, anon, authenticated;
revoke all on function public.plan_sections_guard() from public, anon, authenticated;

create trigger business_plans_guard
  before insert or update on public.business_plans
  for each row execute function public.business_plans_guard();
create trigger business_plans_set_updated_at
  before update on public.business_plans
  for each row execute function public.set_updated_at();

create trigger plan_versions_before_insert
  before insert on public.plan_versions
  for each row execute function public.plan_versions_before_insert();
create trigger plan_versions_before_update
  before update on public.plan_versions
  for each row execute function public.plan_versions_before_update();
create trigger plan_versions_set_updated_at
  before update on public.plan_versions
  for each row execute function public.set_updated_at();

create trigger plan_sections_guard
  before insert or update or delete on public.plan_sections
  for each row execute function public.plan_sections_guard();
create trigger plan_sections_set_updated_at
  before update on public.plan_sections
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row level security & grants
-- -----------------------------------------------------------------------------
alter table public.business_plans enable row level security;
alter table public.plan_versions enable row level security;
alter table public.plan_sections enable row level security;

revoke all on table public.business_plans, public.plan_versions, public.plan_sections from anon, authenticated;
grant all on table public.business_plans, public.plan_versions, public.plan_sections to service_role;

-- business_plans: select/insert/delete; update only current_version_id.
grant select, insert, delete on table public.business_plans to authenticated;
grant update (current_version_id) on table public.business_plans to authenticated;

create policy business_plans_select_own on public.business_plans
  for select to authenticated
  using ((select public.owns_business(business_id)));
create policy business_plans_insert_own on public.business_plans
  for insert to authenticated
  with check ((select public.owns_business(business_id)));
create policy business_plans_update_own on public.business_plans
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy business_plans_delete_own on public.business_plans
  for delete to authenticated
  using ((select public.owns_business(business_id)));

-- plan_versions: select/insert; update limited to lifecycle columns; no delete.
grant select, insert on table public.plan_versions to authenticated;
grant update (status, error_code, model, change_note, finance_proposal) on table public.plan_versions to authenticated;

create policy plan_versions_select_own on public.plan_versions
  for select to authenticated
  using ((select public.owns_plan(plan_id)));
create policy plan_versions_insert_own on public.plan_versions
  for insert to authenticated
  with check ((select public.owns_plan(plan_id)));
create policy plan_versions_update_own on public.plan_versions
  for update to authenticated
  using ((select public.owns_plan(plan_id)))
  with check ((select public.owns_plan(plan_id)));

-- plan_sections: select/insert/update (upsert into a generating version); no delete.
-- plan_version_id/section_key are granted only so PostgREST upserts (which SET
-- every payload column) work; the guard trigger rejects actual changes.
grant select, insert on table public.plan_sections to authenticated;
grant update (plan_version_id, section_key, content, origin) on table public.plan_sections to authenticated;

create policy plan_sections_select_own on public.plan_sections
  for select to authenticated
  using ((select public.owns_plan_version(plan_version_id)));
create policy plan_sections_insert_own on public.plan_sections
  for insert to authenticated
  with check ((select public.owns_plan_version(plan_version_id)));
create policy plan_sections_update_own on public.plan_sections
  for update to authenticated
  using ((select public.owns_plan_version(plan_version_id)))
  with check ((select public.owns_plan_version(plan_version_id)));

-- -----------------------------------------------------------------------------
-- RPCs (security invoker: everything runs under the caller's RLS)
-- -----------------------------------------------------------------------------

-- Returns the business's plan row, creating it if missing.
create or replace function public.ensure_business_plan(p_business_id uuid)
returns public.business_plans
language plpgsql
set search_path = ''
as $$
declare
  v_plan public.business_plans;
begin
  perform public.assert_business_access(p_business_id);

  insert into public.business_plans (business_id)
  values (p_business_id)
  on conflict (business_id) do nothing;

  select * into v_plan from public.business_plans where business_id = p_business_id;
  return v_plan;
end;
$$;

-- Copy-on-write edit of one section. Returns the new (ready, current) version id.
create or replace function public.save_plan_section(
  p_business_id uuid,
  p_section_key text,
  p_content jsonb,
  p_origin text default 'user',
  p_note text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_plan public.business_plans;
  v_current public.plan_versions;
  v_new_id uuid;
begin
  if p_origin is null or p_origin not in ('user', 'ai') then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'p_origin must be user or ai';
  end if;
  if p_section_key is null or p_section_key not in ('executive_summary', 'business_concept', 'value_proposition', 'target_audience', 'customer_personas', 'market_validation', 'competitive_positioning', 'revenue_model', 'pricing_strategy', 'startup_costs', 'operating_expenses', 'marketing_strategy', 'launch_strategy', 'risks_assumptions', 'roadmap_30_60_90') then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'unknown section key';
  end if;
  if not public.is_valid_plan_section_content(p_content) then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'content must be {summary: string, blocks: non-empty array of valid blocks}';
  end if;
  if p_note is not null and char_length(p_note) > 500 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'note too long';
  end if;

  -- Lock the plan row: concurrent saves are serialized and never lose an edit.
  select * into v_plan from public.business_plans where business_id = p_business_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'plan not found';
  end if;

  select * into v_current from public.plan_versions where id = v_plan.current_version_id;
  if not found or v_current.status <> 'ready' then
    raise exception 'precondition_failed' using errcode = 'P0001', detail = 'the current plan version is not ready';
  end if;

  insert into public.plan_versions (plan_id, origin, status, change_note, finance_proposal, based_on_version_id)
  values (
    v_plan.id,
    case when p_origin = 'ai' then 'ai_section' else 'user_edit' end,
    'generating',
    p_note,
    v_current.finance_proposal,
    v_current.id
  )
  returning id into v_new_id;

  insert into public.plan_sections (plan_version_id, section_key, content, origin)
  select v_new_id, s.section_key, s.content, s.origin
  from public.plan_sections s
  where s.plan_version_id = v_current.id
    and s.section_key <> p_section_key;

  insert into public.plan_sections (plan_version_id, section_key, content, origin)
  values (v_new_id, p_section_key, p_content, p_origin);

  update public.plan_versions set status = 'ready' where id = v_new_id;
  update public.business_plans set current_version_id = v_new_id where id = v_plan.id;

  return v_new_id;
end;
$$;

-- Creates a new current version (origin 'restored') copying a ready version.
create or replace function public.restore_plan_version(p_version_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_source public.plan_versions;
  v_plan_id uuid;
  v_new_id uuid;
begin
  select * into v_source from public.plan_versions where id = p_version_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'plan version not found';
  end if;
  if v_source.status <> 'ready' then
    raise exception 'precondition_failed' using errcode = 'P0001', detail = 'only ready versions can be restored';
  end if;

  select id into v_plan_id from public.business_plans where id = v_source.plan_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'plan not found';
  end if;

  insert into public.plan_versions (plan_id, origin, status, model, finance_proposal, based_on_version_id)
  values (v_plan_id, 'restored', 'generating', v_source.model, v_source.finance_proposal, v_source.id)
  returning id into v_new_id;

  insert into public.plan_sections (plan_version_id, section_key, content, origin)
  select v_new_id, s.section_key, s.content, s.origin
  from public.plan_sections s
  where s.plan_version_id = v_source.id;

  update public.plan_versions set status = 'ready' where id = v_new_id;
  update public.business_plans set current_version_id = v_new_id where id = v_plan_id;

  return v_new_id;
end;
$$;

revoke all on function public.ensure_business_plan(uuid) from public, anon;
revoke all on function public.save_plan_section(uuid, text, jsonb, text, text) from public, anon;
revoke all on function public.restore_plan_version(uuid) from public, anon;
grant execute on function public.ensure_business_plan(uuid) to authenticated, service_role;
grant execute on function public.save_plan_section(uuid, text, jsonb, text, text) to authenticated, service_role;
grant execute on function public.restore_plan_version(uuid) to authenticated, service_role;
