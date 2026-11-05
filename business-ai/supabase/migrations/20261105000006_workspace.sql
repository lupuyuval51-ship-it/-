-- =============================================================================
-- BUSINESS AI - workspace: marketing assets and launch checklist.
-- =============================================================================

-- Mirrors MarketingContentSchema in domain/marketing.ts.
create or replace function public.is_valid_marketing_content(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_item jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' then
    return false;
  end if;
  if jsonb_typeof(p -> 'summary') is distinct from 'string' or char_length(p ->> 'summary') > 1200 then
    return false;
  end if;
  if jsonb_typeof(p -> 'items') is distinct from 'array' or jsonb_array_length(p -> 'items') > 40 then
    return false;
  end if;

  for v_item in select e from jsonb_array_elements(p -> 'items') as t (e) loop
    if jsonb_typeof(v_item) <> 'object'
      or jsonb_typeof(v_item -> 'id') is distinct from 'string'
      or char_length(v_item ->> 'id') not between 1 and 40
      or jsonb_typeof(v_item -> 'heading') is distinct from 'string'
      or char_length(v_item ->> 'heading') > 200
      or jsonb_typeof(v_item -> 'body') is distinct from 'string'
      or char_length(v_item ->> 'body') > 3000 then
      return false;
    end if;
    if v_item ? 'label' and jsonb_typeof(v_item -> 'label') <> 'null'
      and (jsonb_typeof(v_item -> 'label') <> 'string' or char_length(v_item ->> 'label') > 60) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

revoke all on function public.is_valid_marketing_content(jsonb) from public, anon;
grant execute on function public.is_valid_marketing_content(jsonb) to authenticated, service_role;

create table public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  kind text not null
    constraint marketing_assets_kind_check check (kind in ('positioning', 'name_ideas', 'taglines', 'personas', 'social_strategy', 'content_calendar', 'launch_campaign', 'marketing_copy', 'acquisition_experiments')),
  title text not null
    constraint marketing_assets_title_length check (char_length(title) between 1 and 200 and title ~ '\S'),
  content jsonb not null default '{"summary": "", "items": []}'::jsonb
    constraint marketing_assets_content_valid check (public.is_valid_marketing_content(content)),
  origin text not null default 'user'
    constraint marketing_assets_origin_check check (origin in ('ai', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.marketing_assets is 'Editable marketing assets (MarketingContent). Owner CRUD.';

create table public.launch_checklist_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  template_key text
    constraint launch_checklist_items_template_key_format check (template_key ~ '^[a-z0-9][a-z0-9_.-]{0,79}$'),
  category text not null
    constraint launch_checklist_items_category_check check (category in ('registration', 'tax', 'licensing', 'privacy', 'insurance', 'banking', 'other')),
  title text not null
    constraint launch_checklist_items_title_length check (char_length(title) between 1 and 200 and title ~ '\S'),
  description text not null default ''
    constraint launch_checklist_items_description_length check (char_length(description) <= 4000),
  source_name text
    constraint launch_checklist_items_source_name_length check (char_length(source_name) between 1 and 200),
  source_url text
    constraint launch_checklist_items_source_url_format check (char_length(source_url) <= 500 and source_url ~* '^https?://'),
  status text not null default 'todo'
    constraint launch_checklist_items_status_check check (status in ('todo', 'done', 'not_applicable')),
  notes text not null default ''
    constraint launch_checklist_items_notes_length check (char_length(notes) <= 2000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- NULLS DISTINCT (default): uniqueness applies only where template_key is not
  -- null, and PostgREST upserts can target on_conflict=business_id,template_key.
  constraint launch_checklist_items_business_template_key unique (business_id, template_key)
);

comment on table public.launch_checklist_items is 'Launch Center checklist. Template items carry template_key (unique per business); custom items have template_key null.';

-- Indexes (FKs + common filters)
create index marketing_assets_business_kind_idx on public.marketing_assets (business_id, kind, created_at desc);
-- launch_checklist_items(business_id) is covered by launch_checklist_items_business_template_key.
create index launch_checklist_items_business_sort_idx on public.launch_checklist_items (business_id, category, sort_order);

create trigger marketing_assets_set_updated_at
  before update on public.marketing_assets
  for each row execute function public.set_updated_at();
create trigger marketing_assets_business_id_immutable
  before update of business_id on public.marketing_assets
  for each row execute function public.prevent_business_id_change();

create trigger launch_checklist_items_set_updated_at
  before update on public.launch_checklist_items
  for each row execute function public.set_updated_at();
create trigger launch_checklist_items_business_id_immutable
  before update of business_id on public.launch_checklist_items
  for each row execute function public.prevent_business_id_change();

-- -----------------------------------------------------------------------------
-- Row level security & grants: owner CRUD.
-- -----------------------------------------------------------------------------
alter table public.marketing_assets enable row level security;
alter table public.launch_checklist_items enable row level security;

revoke all on table public.marketing_assets, public.launch_checklist_items from anon, authenticated;
grant all on table public.marketing_assets, public.launch_checklist_items to service_role;
grant select, insert, update, delete on table public.marketing_assets, public.launch_checklist_items to authenticated;

create policy marketing_assets_select_own on public.marketing_assets
  for select to authenticated using ((select public.owns_business(business_id)));
create policy marketing_assets_insert_own on public.marketing_assets
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy marketing_assets_update_own on public.marketing_assets
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy marketing_assets_delete_own on public.marketing_assets
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy launch_checklist_items_select_own on public.launch_checklist_items
  for select to authenticated using ((select public.owns_business(business_id)));
create policy launch_checklist_items_insert_own on public.launch_checklist_items
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy launch_checklist_items_update_own on public.launch_checklist_items
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy launch_checklist_items_delete_own on public.launch_checklist_items
  for delete to authenticated using ((select public.owns_business(business_id)));

-- -----------------------------------------------------------------------------
-- Final safety net for the whole schema: anon/PUBLIC hold no privileges on any
-- table, sequence or function in public (re-run by later migrations if needed).
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon, public;
