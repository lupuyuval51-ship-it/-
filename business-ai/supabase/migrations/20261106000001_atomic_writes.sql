-- Atomic, idempotent writes for everything that turns a proposal into data.
--
-- Problem fixed here: several flows wrote the new row and the "this proposal was applied" marker
-- (or the rest of a multi-row change) as SEPARATE requests. A failure between them, a double tap,
-- a retry after a lost response, or a second device could create the same expense / task twice
-- (or leave a half-written roadmap / dependency list).
--
--  1. `source_ref` idempotency keys (unique per business) on every table proposals write into, so
--     re-applying the same proposal can never create a second row.
--  2. apply_advisor_action(): one transaction that locks the advisor message, inserts the row built
--     from the STORED proposal (the client cannot alter amounts/titles), and records the action id
--     in applied_action_ids. Concurrent or repeated calls apply it exactly once.
--  3. set_task_dependencies(): replaces a task's dependency set in one transaction.
--  4. persist_ai_roadmap(): writes phases, milestones, tasks and dependencies in one transaction
--     (used by the `ai` Edge Function), serialised per business, with the "AI roadmap already
--     exists" check inside the same transaction.
--
-- All functions are SECURITY INVOKER: RLS and the existing triggers still apply to every write.

-- -----------------------------------------------------------------------------------------------
-- 1. Idempotency keys
-- -----------------------------------------------------------------------------------------------
alter table public.tasks
  add column source_ref text
    constraint tasks_source_ref_length check (source_ref is null or char_length(source_ref) between 1 and 200),
  add constraint tasks_business_source_ref_key unique (business_id, source_ref);

alter table public.milestones
  add column source_ref text
    constraint milestones_source_ref_length check (source_ref is null or char_length(source_ref) between 1 and 200),
  add constraint milestones_business_source_ref_key unique (business_id, source_ref);

alter table public.startup_costs
  add column source_ref text
    constraint startup_costs_source_ref_length check (source_ref is null or char_length(source_ref) between 1 and 200),
  add constraint startup_costs_business_source_ref_key unique (business_id, source_ref);

alter table public.recurring_expenses
  add column source_ref text
    constraint recurring_expenses_source_ref_length check (source_ref is null or char_length(source_ref) between 1 and 200),
  add constraint recurring_expenses_business_source_ref_key unique (business_id, source_ref);

alter table public.revenue_streams
  add column source_ref text
    constraint revenue_streams_source_ref_length check (source_ref is null or char_length(source_ref) between 1 and 200),
  add constraint revenue_streams_business_source_ref_key unique (business_id, source_ref);

comment on column public.tasks.source_ref is 'Idempotency key of the proposal this row was created from (e.g. advisor:<message>:<action>, suggestion:<id>). NULL for ordinary rows; unique per business otherwise.';
comment on column public.milestones.source_ref is 'Idempotency key of the proposal this row was created from; unique per business.';
comment on column public.startup_costs.source_ref is 'Idempotency key of the proposal this row was created from; unique per business.';
comment on column public.recurring_expenses.source_ref is 'Idempotency key of the proposal this row was created from; unique per business.';
comment on column public.revenue_streams.source_ref is 'Idempotency key of the proposal this row was created from; unique per business.';

-- -----------------------------------------------------------------------------------------------
-- 2. apply_advisor_action
-- -----------------------------------------------------------------------------------------------
create or replace function public.apply_advisor_action(
  p_message_id uuid,
  p_action_id text,
  p_today date default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_business uuid;
  v_actions jsonb;
  v_applied text[];
  v_action jsonb;
  v_type text;
  v_today date;
  v_due date;
  v_ref text;
  v_table text;
  v_row_id uuid;
  v_title text;
  v_amount bigint;
begin
  if p_message_id is null or p_action_id is null or char_length(p_action_id) not between 1 and 100 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'message and action id are required';
  end if;

  -- Lock the message row: concurrent applies of the same message are serialised here, so the
  -- applied check below sees the result of the previous transaction. RLS limits this to the owner.
  select c.business_id, m.actions, m.applied_action_ids
    into v_business, v_actions, v_applied
  from public.ai_messages m
  join public.ai_conversations c on c.id = m.conversation_id
  where m.id = p_message_id and m.role = 'assistant'
  for update of m;

  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'advisor message';
  end if;

  if p_action_id = any (v_applied) then
    return jsonb_build_object(
      'status', 'already_applied',
      'applied_action_ids', to_jsonb(v_applied)
    );
  end if;

  select a.value into v_action
  from jsonb_array_elements(case when jsonb_typeof(v_actions) = 'array' then v_actions else '[]'::jsonb end) a
  where a.value ->> 'id' = p_action_id
  limit 1;

  if v_action is null then
    raise exception 'not_found' using errcode = 'P0001', detail = 'advisor action';
  end if;

  -- The client's calendar date (time zones); bounded so it cannot be used to back/forward-date.
  v_today := coalesce(p_today, current_date);
  if v_today not between current_date - 1 and current_date + 1 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'p_today out of range';
  end if;

  if jsonb_typeof(v_action -> 'dueInDays') = 'number' then
    v_due := v_today + greatest(0, least(365, round((v_action ->> 'dueInDays')::numeric)::integer));
  end if;

  v_ref := 'advisor:' || p_message_id::text || ':' || p_action_id;
  v_type := v_action ->> 'type';

  case v_type
    when 'add_task' then
      v_table := 'tasks';
      v_title := left(btrim(coalesce(v_action ->> 'title', '')), 200);
      insert into public.tasks (business_id, title, description, phase, priority, due_date, status, source, source_ref, sort_order)
      values (
        v_business,
        v_title,
        left(btrim(coalesce(v_action ->> 'description', '')), 2000),
        v_action ->> 'phase',
        coalesce(v_action ->> 'priority', 'medium'),
        v_due,
        'todo',
        'advisor',
        v_ref,
        (select coalesce(max(t.sort_order) + 1, 0) from public.tasks t
         where t.business_id = v_business and t.phase is not distinct from (v_action ->> 'phase'))
      )
      on conflict (business_id, source_ref) do nothing
      returning id into v_row_id;

    when 'add_milestone' then
      v_table := 'milestones';
      v_title := left(btrim(coalesce(v_action ->> 'title', '')), 200);
      insert into public.milestones (business_id, title, phase, target_date, source, source_ref, sort_order)
      values (
        v_business,
        v_title,
        v_action ->> 'phase',
        v_due,
        'advisor',
        v_ref,
        (select coalesce(max(ms.sort_order) + 1, 0) from public.milestones ms
         where ms.business_id = v_business and ms.phase = (v_action ->> 'phase'))
      )
      on conflict (business_id, source_ref) do nothing
      returning id into v_row_id;

    when 'add_recurring_expense' then
      v_table := 'recurring_expenses';
      v_amount := greatest(0, least(10000000000000, round(coalesce((v_action ->> 'monthlyAmountMinor')::numeric, 0))::bigint));
      insert into public.recurring_expenses (business_id, label, monthly_amount_minor, basis, source_ref, sort_order)
      values (
        v_business,
        left(btrim(coalesce(v_action ->> 'expenseLabel', '')), 120),
        v_amount,
        'ai_estimate',
        v_ref,
        (select coalesce(max(r.sort_order) + 1, 0) from public.recurring_expenses r where r.business_id = v_business)
      )
      on conflict (business_id, source_ref) do nothing
      returning id into v_row_id;

    when 'add_startup_cost' then
      v_table := 'startup_costs';
      v_amount := greatest(0, least(10000000000000, round(coalesce((v_action ->> 'amountMinor')::numeric, 0))::bigint));
      insert into public.startup_costs (business_id, label, amount_minor, basis, source_ref, sort_order)
      values (
        v_business,
        left(btrim(coalesce(v_action ->> 'costLabel', '')), 120),
        v_amount,
        'ai_estimate',
        v_ref,
        (select coalesce(max(s.sort_order) + 1, 0) from public.startup_costs s where s.business_id = v_business)
      )
      on conflict (business_id, source_ref) do nothing
      returning id into v_row_id;

    else
      -- open_plan_section is navigation only; anything else is not a write action.
      raise exception 'invalid_request' using errcode = 'P0001', detail = 'not a write action: ' || coalesce(v_type, 'null');
  end case;

  -- Same transaction as the insert: either both happen or neither does.
  update public.ai_messages
  set applied_action_ids = array_append(applied_action_ids, p_action_id)
  where id = p_message_id;

  return jsonb_build_object(
    'status', 'applied',
    'table', v_table,
    'row_id', v_row_id,
    'applied_action_ids', to_jsonb(array_append(v_applied, p_action_id))
  );
end;
$$;

comment on function public.apply_advisor_action(uuid, text, date) is
  'Applies one advisor proposal atomically and idempotently: inserts the row built from the stored action and records the action id in applied_action_ids in the same transaction. Returns {status: applied|already_applied, table, row_id, applied_action_ids}.';

revoke all on function public.apply_advisor_action(uuid, text, date) from public, anon;
grant execute on function public.apply_advisor_action(uuid, text, date) to authenticated, service_role;

-- -----------------------------------------------------------------------------------------------
-- 3. set_task_dependencies
-- -----------------------------------------------------------------------------------------------
create or replace function public.set_task_dependencies(p_task_id uuid, p_depends_on uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_wanted uuid[];
begin
  select coalesce(array_agg(distinct d), '{}'::uuid[]) into v_wanted
  from unnest(coalesce(p_depends_on, '{}'::uuid[])) d
  where d is not null;

  if cardinality(v_wanted) > 50 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'too many dependencies';
  end if;

  -- Lock the task (RLS: owner only). Concurrent edits of the same task's dependencies serialise.
  perform 1 from public.tasks t where t.id = p_task_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'task';
  end if;

  delete from public.task_dependencies td
  where td.task_id = p_task_id and not (td.depends_on_task_id = any (v_wanted));

  -- Self / cross-business / cycle rules are enforced by the existing trigger; any violation
  -- aborts the whole call, so the previous dependency set is kept intact.
  insert into public.task_dependencies (task_id, depends_on_task_id)
  select p_task_id, d from unnest(v_wanted) d
  on conflict (task_id, depends_on_task_id) do nothing;
end;
$$;

comment on function public.set_task_dependencies(uuid, uuid[]) is
  'Replaces the full set of prerequisites of a task in one transaction (RLS and dependency rules apply).';

revoke all on function public.set_task_dependencies(uuid, uuid[]) from public, anon;
grant execute on function public.set_task_dependencies(uuid, uuid[]) to authenticated, service_role;

-- -----------------------------------------------------------------------------------------------
-- 4. persist_ai_roadmap
-- -----------------------------------------------------------------------------------------------
-- p_payload shape (built and validated by the Edge Function):
--   { "starts_on": "YYYY-MM-DD",
--     "phases":       [{ "phase", "objective" }],
--     "milestones":   [{ "key", "phase", "title", "target_date", "sort_order" }],
--     "tasks":        [{ "ref"|null, "phase", "milestone_key"|null, "title", "description",
--                        "priority", "due_date", "sort_order" }],
--     "dependencies": [{ "ref", "depends_on" }] }
create or replace function public.persist_ai_roadmap(p_business_id uuid, p_mode text, p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_starts date;
  v_item jsonb;
  v_id uuid;
  v_milestone_ids jsonb := '{}'::jsonb;
  v_task_ids jsonb := '{}'::jsonb;
  v_phases integer := 0;
  v_milestones integer := 0;
  v_tasks integer := 0;
begin
  if p_mode not in ('create', 'replace_ai_items') or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'mode or payload';
  end if;

  perform 1 from public.businesses b where b.id = p_business_id;
  if not found then
    raise exception 'not_found' using errcode = 'P0001', detail = 'business';
  end if;

  -- One roadmap write per business at a time (plan generation and a manual "create" can race).
  perform pg_advisory_xact_lock(hashtext('persist_ai_roadmap:' || p_business_id::text));

  if p_mode = 'replace_ai_items' then
    perform public.replace_ai_roadmap(p_business_id);
  elsif exists (select 1 from public.tasks t where t.business_id = p_business_id and t.source = 'ai') then
    raise exception 'conflict' using errcode = 'P0001', detail = 'AI roadmap already exists';
  end if;

  v_starts := coalesce((p_payload ->> 'starts_on')::date, current_date);

  for v_item in select value from jsonb_array_elements(coalesce(p_payload -> 'phases', '[]'::jsonb)) loop
    insert into public.roadmap_phases (business_id, phase, objective, starts_on)
    values (p_business_id, v_item ->> 'phase', left(coalesce(v_item ->> 'objective', ''), 1000), v_starts)
    on conflict (business_id, phase)
      do update set objective = excluded.objective, starts_on = excluded.starts_on;
    v_phases := v_phases + 1;
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(p_payload -> 'milestones', '[]'::jsonb)) loop
    insert into public.milestones (business_id, phase, title, target_date, source, sort_order)
    values (
      p_business_id,
      v_item ->> 'phase',
      v_item ->> 'title',
      (v_item ->> 'target_date')::date,
      'ai',
      coalesce((v_item ->> 'sort_order')::integer, 0)
    )
    returning id into v_id;
    v_milestone_ids := v_milestone_ids || jsonb_build_object(v_item ->> 'key', v_id);
    v_milestones := v_milestones + 1;
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(p_payload -> 'tasks', '[]'::jsonb)) loop
    insert into public.tasks (business_id, phase, milestone_id, title, description, priority, due_date, source, sort_order)
    values (
      p_business_id,
      v_item ->> 'phase',
      case when v_item ->> 'milestone_key' is null then null
           else (v_milestone_ids ->> (v_item ->> 'milestone_key'))::uuid end,
      v_item ->> 'title',
      coalesce(v_item ->> 'description', ''),
      coalesce(v_item ->> 'priority', 'medium'),
      (v_item ->> 'due_date')::date,
      'ai',
      coalesce((v_item ->> 'sort_order')::integer, 0)
    )
    returning id into v_id;
    if v_item ->> 'ref' is not null and not (v_task_ids ? (v_item ->> 'ref')) then
      v_task_ids := v_task_ids || jsonb_build_object(v_item ->> 'ref', v_id);
    end if;
    v_tasks := v_tasks + 1;
  end loop;

  if v_tasks = 0 then
    raise exception 'invalid_request' using errcode = 'P0001', detail = 'roadmap has no tasks';
  end if;

  insert into public.task_dependencies (task_id, depends_on_task_id)
  select (v_task_ids ->> (d.value ->> 'ref'))::uuid, (v_task_ids ->> (d.value ->> 'depends_on'))::uuid
  from jsonb_array_elements(coalesce(p_payload -> 'dependencies', '[]'::jsonb)) d
  where v_task_ids ? (d.value ->> 'ref')
    and v_task_ids ? (d.value ->> 'depends_on')
    and (d.value ->> 'ref') <> (d.value ->> 'depends_on')
  on conflict (task_id, depends_on_task_id) do nothing;

  return jsonb_build_object('phases', v_phases, 'milestones', v_milestones, 'tasks', v_tasks);
end;
$$;

comment on function public.persist_ai_roadmap(uuid, text, jsonb) is
  'Writes a generated 30/60/90 roadmap (phases, milestones, tasks, dependencies) in one transaction. mode create fails with conflict if AI tasks exist; replace_ai_items removes open AI items first.';

revoke all on function public.persist_ai_roadmap(uuid, text, jsonb) from public, anon;
grant execute on function public.persist_ai_roadmap(uuid, text, jsonb) to authenticated, service_role;
