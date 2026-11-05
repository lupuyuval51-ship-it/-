-- =============================================================================
-- BUSINESS AI - AI advisor conversations/messages and AI usage metering.
--
--   * ai_conversations: owner select/insert/delete; update only `title`.
--   * ai_messages: written by the service role only (assistant messages cannot be
--     forged); owners may read them and update only `applied_action_ids`.
--   * ai_usage_records: written by the service role through reserve_ai_usage /
--     finalize_ai_usage; owners may read their own rows. business_id is ON DELETE
--     SET NULL so deleting a business never resets the monthly quota / cost cap.
-- =============================================================================

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default ''
    constraint ai_conversations_title_length check (char_length(title) <= 200),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.ai_conversations.last_message_at is 'Bumped by trigger whenever a message is inserted.';

-- Ids of the actions inside an AdvisorAction[] array (used by a CHECK constraint).
create or replace function public.advisor_action_ids(p_actions jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_actions) = 'array' then
      coalesce(
        (select array_agg(e ->> 'id') from jsonb_array_elements(p_actions) as t (e) where e ->> 'id' is not null),
        '{}'::text[]
      )
    else '{}'::text[]
  end;
$$;

revoke all on function public.advisor_action_ids(jsonb) from public, anon;
grant execute on function public.advisor_action_ids(jsonb) to authenticated, service_role;

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null
    constraint ai_messages_role_check check (role in ('user', 'assistant')),
  content text not null default ''
    constraint ai_messages_content_length check (char_length(content) <= 40000),
  actions jsonb not null default '[]'::jsonb
    constraint ai_messages_actions_shape check (jsonb_typeof(actions) = 'array' and char_length(actions::text) <= 50000),
  follow_ups jsonb not null default '[]'::jsonb
    constraint ai_messages_follow_ups_shape check (jsonb_typeof(follow_ups) = 'array' and char_length(follow_ups::text) <= 10000),
  applied_action_ids text[] not null default '{}'::text[]
    constraint ai_messages_applied_action_ids_valid check (
      cardinality(applied_action_ids) <= 50
      and applied_action_ids <@ public.advisor_action_ids(actions)
    ),
  status text not null default 'complete'
    constraint ai_messages_status_check check (status in ('complete', 'error')),
  model text
    constraint ai_messages_model_length check (char_length(model) between 1 and 100),
  input_tokens integer
    constraint ai_messages_input_tokens_range check (input_tokens >= 0),
  output_tokens integer
    constraint ai_messages_output_tokens_range check (output_tokens >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_messages is 'Advisor chat messages. Inserted by the service role only. Owners may update applied_action_ids (subset of actions[].id).';

create table public.ai_usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  feature text not null
    constraint ai_usage_records_feature_check check (feature in ('plan_generation', 'section_regeneration', 'roadmap_generation', 'roadmap_recommendation', 'advisor_message', 'marketing_generation', 'finance_proposal')),
  model text not null
    constraint ai_usage_records_model_length check (char_length(model) between 1 and 100),
  input_tokens integer not null default 0
    constraint ai_usage_records_input_tokens_range check (input_tokens >= 0),
  output_tokens integer not null default 0
    constraint ai_usage_records_output_tokens_range check (output_tokens >= 0),
  cost_usd_micros bigint not null default 0
    constraint ai_usage_records_cost_range check (cost_usd_micros >= 0),
  status text not null default 'reserved'
    constraint ai_usage_records_status_check check (status in ('reserved', 'success', 'error')),
  error_code text
    constraint ai_usage_records_error_code_length check (char_length(error_code) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_usage_records is 'One row per AI call (reserved before the call, finalized after). Service-role writes only; users read their own.';

-- Indexes (FKs + common filters)
create index ai_conversations_business_last_message_idx on public.ai_conversations (business_id, last_message_at desc);
create index ai_conversations_user_id_idx on public.ai_conversations (user_id);
create index ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);
create index ai_usage_records_user_created_idx on public.ai_usage_records (user_id, created_at);
create index ai_usage_records_business_id_idx on public.ai_usage_records (business_id);

-- -----------------------------------------------------------------------------
-- Helpers & triggers
-- -----------------------------------------------------------------------------
create or replace function public.owns_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ai_conversations c
    join public.businesses b on b.id = c.business_id
    where c.id = p_conversation_id
      and c.user_id = (select auth.uid())
      and b.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_conversation(uuid) from public, anon;
grant execute on function public.owns_conversation(uuid) to authenticated, service_role;

-- user_id must be the business owner; identity columns immutable.
create or replace function public.ai_conversations_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id or new.business_id is distinct from old.business_id then
      raise exception 'immutable_column' using errcode = 'P0001', detail = 'user_id and business_id cannot be changed';
    end if;
    return new;
  end if;

  if not exists (
    select 1 from public.businesses b where b.id = new.business_id and b.owner_id = new.user_id
  ) then
    raise exception 'forbidden' using errcode = 'P0001', detail = 'conversation user must own the business';
  end if;
  return new;
end;
$$;

create or replace function public.ai_messages_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ai_conversations
  set last_message_at = greatest(last_message_at, new.created_at)
  where id = new.conversation_id;
  return null;
end;
$$;

create or replace function public.ai_messages_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.conversation_id is distinct from old.conversation_id or new.role is distinct from old.role then
    raise exception 'immutable_column' using errcode = 'P0001', detail = 'conversation_id and role cannot be changed';
  end if;
  return new;
end;
$$;

revoke all on function public.ai_conversations_guard() from public, anon, authenticated;
revoke all on function public.ai_messages_touch_conversation() from public, anon, authenticated;
revoke all on function public.ai_messages_guard_update() from public, anon, authenticated;

create trigger ai_conversations_guard
  before insert or update on public.ai_conversations
  for each row execute function public.ai_conversations_guard();
create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create trigger ai_messages_guard_update
  before update on public.ai_messages
  for each row execute function public.ai_messages_guard_update();
create trigger ai_messages_set_updated_at
  before update on public.ai_messages
  for each row execute function public.set_updated_at();
create trigger ai_messages_touch_conversation
  after insert on public.ai_messages
  for each row execute function public.ai_messages_touch_conversation();

create trigger ai_usage_records_set_updated_at
  before update on public.ai_usage_records
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row level security & grants
-- -----------------------------------------------------------------------------
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage_records enable row level security;

revoke all on table public.ai_conversations, public.ai_messages, public.ai_usage_records from anon, authenticated;
grant all on table public.ai_conversations, public.ai_messages, public.ai_usage_records to service_role;

-- ai_conversations
grant select, insert, delete on table public.ai_conversations to authenticated;
grant update (title) on table public.ai_conversations to authenticated;

create policy ai_conversations_select_own on public.ai_conversations
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.owns_business(business_id)));
create policy ai_conversations_insert_own on public.ai_conversations
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.owns_business(business_id)));
create policy ai_conversations_update_own on public.ai_conversations
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.owns_business(business_id)))
  with check (user_id = (select auth.uid()) and (select public.owns_business(business_id)));
create policy ai_conversations_delete_own on public.ai_conversations
  for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.owns_business(business_id)));

-- ai_messages: read via conversation ownership; update applied_action_ids only.
grant select on table public.ai_messages to authenticated;
grant update (applied_action_ids) on table public.ai_messages to authenticated;

create policy ai_messages_select_own on public.ai_messages
  for select to authenticated
  using ((select public.owns_conversation(conversation_id)));
create policy ai_messages_update_own on public.ai_messages
  for update to authenticated
  using ((select public.owns_conversation(conversation_id)))
  with check ((select public.owns_conversation(conversation_id)));

-- ai_usage_records: read own only.
grant select on table public.ai_usage_records to authenticated;

create policy ai_usage_records_select_own on public.ai_usage_records
  for select to authenticated
  using (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Usage metering RPCs
-- -----------------------------------------------------------------------------

-- Start of the current calendar month in UTC.
create or replace function public.ai_usage_month_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'utc') at time zone 'utc';
$$;

revoke all on function public.ai_usage_month_start() from public, anon;
grant execute on function public.ai_usage_month_start() to authenticated, service_role;

-- Reserve one AI call before calling the model. SERVICE ROLE ONLY.
-- Counts this month's reserved+success rows for the feature (quota) and sums
-- cost_usd_micros of all this month's rows (cost cap). Raises 'quota_exceeded'
-- or 'cost_cap_reached' (SQLSTATE P0001), else inserts a 'reserved' row.
create or replace function public.reserve_ai_usage(
  p_user uuid,
  p_business uuid,
  p_feature text,
  p_monthly_limit integer,
  p_cost_cap_micros bigint,
  p_model text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month_start timestamptz := public.ai_usage_month_start();
  v_used integer;
  v_cost bigint;
  v_id uuid;
begin
  if p_user is null or p_feature is null or p_model is null
    or p_monthly_limit is null or p_monthly_limit < 0
    or p_cost_cap_micros is null or p_cost_cap_micros < 0 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'missing or negative argument';
  end if;
  if p_feature not in ('plan_generation', 'section_regeneration', 'roadmap_generation', 'roadmap_recommendation', 'advisor_message', 'marketing_generation', 'finance_proposal') then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'unknown AI feature';
  end if;
  if p_business is not null and not exists (
    select 1 from public.businesses b where b.id = p_business and b.owner_id = p_user
  ) then
    raise exception 'forbidden' using errcode = 'P0001', detail = 'business does not belong to user';
  end if;

  -- One reservation at a time per user: the count + insert below is atomic.
  perform pg_advisory_xact_lock(hashtext(p_user::text));

  select
    count(*) filter (where r.feature = p_feature and r.status in ('reserved', 'success')),
    coalesce(sum(r.cost_usd_micros), 0)
  into v_used, v_cost
  from public.ai_usage_records r
  where r.user_id = p_user
    and r.created_at >= v_month_start;

  if v_used >= p_monthly_limit then
    raise exception 'quota_exceeded'
      using errcode = 'P0001', detail = format('feature=%s used=%s limit=%s', p_feature, v_used, p_monthly_limit);
  end if;
  if v_cost >= p_cost_cap_micros then
    raise exception 'cost_cap_reached'
      using errcode = 'P0001', detail = format('cost_usd_micros=%s cap=%s', v_cost, p_cost_cap_micros);
  end if;

  insert into public.ai_usage_records (user_id, business_id, feature, model, status)
  values (p_user, p_business, p_feature, p_model, 'reserved')
  returning id into v_id;

  return v_id;
end;
$$;

-- Finalize a reservation after the model call. SERVICE ROLE ONLY.
-- p_status: 'success' | 'error'. A reservation can be finalized once.
create or replace function public.finalize_ai_usage(
  p_id uuid,
  p_status text,
  p_input integer,
  p_output integer,
  p_cost bigint,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_status is null or p_status not in ('success', 'error') then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'p_status must be success or error';
  end if;
  if coalesce(p_input, 0) < 0 or coalesce(p_output, 0) < 0 or coalesce(p_cost, 0) < 0 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'token counts and cost must be non-negative';
  end if;

  select r.status into v_status from public.ai_usage_records r where r.id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'usage record not found';
  end if;
  if v_status <> 'reserved' then
    raise exception 'conflict' using errcode = 'P0001', detail = format('usage record already %s', v_status);
  end if;

  update public.ai_usage_records
  set status = p_status,
      input_tokens = coalesce(p_input, 0),
      output_tokens = coalesce(p_output, 0),
      cost_usd_micros = coalesce(p_cost, 0),
      error_code = case when p_status = 'error' then nullif(left(coalesce(p_error, 'internal'), 64), '') else null end
  where id = p_id;
end;
$$;

-- Current user's usage this month (UTC) per feature, every feature listed.
create or replace function public.ai_usage_summary()
returns table (feature text, used integer)
language sql
stable
set search_path = ''
as $$
  select f.feature, count(r.id)::integer as used
  from unnest(array['plan_generation', 'section_regeneration', 'roadmap_generation', 'roadmap_recommendation', 'advisor_message', 'marketing_generation', 'finance_proposal'])
    with ordinality as f (feature, ord)
  left join public.ai_usage_records r
    on r.feature = f.feature
    and r.user_id = (select auth.uid())
    and r.status in ('reserved', 'success')
    and r.created_at >= public.ai_usage_month_start()
  group by f.feature, f.ord
  order by f.ord;
$$;

revoke all on function public.reserve_ai_usage(uuid, uuid, text, integer, bigint, text) from public, anon, authenticated;
revoke all on function public.finalize_ai_usage(uuid, text, integer, integer, bigint, text) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid, uuid, text, integer, bigint, text) to service_role;
grant execute on function public.finalize_ai_usage(uuid, text, integer, integer, bigint, text) to service_role;

revoke all on function public.ai_usage_summary() from public, anon;
grant execute on function public.ai_usage_summary() to authenticated, service_role;
