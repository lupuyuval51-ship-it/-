-- =============================================================================
-- BUSINESS AI - 30/60/90 roadmap: phases, milestones, tasks, task dependencies.
-- =============================================================================

create table public.roadmap_phases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  phase text not null
    constraint roadmap_phases_phase_check check (phase in ('days_30', 'days_60', 'days_90')),
  objective text not null default ''
    constraint roadmap_phases_objective_length check (char_length(objective) <= 1000),
  starts_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roadmap_phases_business_phase_key unique (business_id, phase)
);

comment on table public.roadmap_phases is 'One row per phase per business. Upsert on (business_id, phase).';

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  phase text not null
    constraint milestones_phase_check check (phase in ('days_30', 'days_60', 'days_90')),
  title text not null
    constraint milestones_title_length check (char_length(title) between 1 and 200 and title ~ '\S'),
  target_date date,
  achieved_at timestamptz,
  source text not null default 'user'
    constraint milestones_source_check check (source in ('ai', 'user', 'advisor')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- target of the composite FK from tasks (same-business guarantee)
  constraint milestones_id_business_id_key unique (id, business_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  phase text
    constraint tasks_phase_check check (phase in ('days_30', 'days_60', 'days_90')),
  milestone_id uuid,
  title text not null
    constraint tasks_title_length check (char_length(title) between 1 and 200 and title ~ '\S'),
  description text not null default ''
    constraint tasks_description_length check (char_length(description) <= 2000),
  priority text not null default 'medium'
    constraint tasks_priority_check check (priority in ('high', 'medium', 'low')),
  status text not null default 'todo'
    constraint tasks_status_check check (status in ('todo', 'in_progress', 'done')),
  due_date date,
  completed_at timestamptz,
  source text not null default 'user'
    constraint tasks_source_check check (source in ('ai', 'user', 'advisor')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A task can only reference a milestone of the same business. Deleting the
  -- milestone clears only milestone_id (PG15+ column list).
  constraint tasks_milestone_fkey foreign key (milestone_id, business_id)
    references public.milestones (id, business_id) on delete set null (milestone_id)
);

comment on column public.tasks.completed_at is 'Trigger-maintained: set when status becomes done, cleared when it leaves done. Client values are ignored.';

create table public.task_dependencies (
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint task_dependencies_pkey primary key (task_id, depends_on_task_id),
  constraint task_dependencies_no_self check (task_id <> depends_on_task_id)
);

comment on table public.task_dependencies is 'task_id depends on depends_on_task_id. Same business, no self-dependency, no cycles (trigger). Rows are immutable (insert/delete only).';

-- Indexes (FKs + common filters)
-- roadmap_phases(business_id) is covered by roadmap_phases_business_phase_key.
create index milestones_business_phase_idx on public.milestones (business_id, phase, sort_order);
create index tasks_business_status_due_idx on public.tasks (business_id, status, due_date);
create index tasks_business_phase_idx on public.tasks (business_id, phase, sort_order);
create index tasks_milestone_id_idx on public.tasks (milestone_id, business_id);
create index task_dependencies_depends_on_idx on public.task_dependencies (depends_on_task_id);

-- -----------------------------------------------------------------------------
-- Helpers & triggers
-- -----------------------------------------------------------------------------
create or replace function public.owns_task(p_task_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    join public.businesses b on b.id = t.business_id
    where t.id = p_task_id
      and b.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_task(uuid) from public, anon;
grant execute on function public.owns_task(uuid) to authenticated, service_role;

-- completed_at follows status; clients cannot set it directly.
create or replace function public.tasks_maintain_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    if tg_op = 'UPDATE' and old.status = 'done' then
      new.completed_at := old.completed_at;
    else
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

-- Dependencies: no self-dependency, same business, no cycles. Definer rights so
-- both tasks are visible for the checks; ownership is verified explicitly.
create or replace function public.task_dependencies_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business uuid;
  v_dep_business uuid;
begin
  if new.task_id = new.depends_on_task_id then
    raise exception 'dependency_self' using errcode = 'P0001', detail = 'a task cannot depend on itself';
  end if;

  select t.business_id into v_business from public.tasks t where t.id = new.task_id;
  select t.business_id into v_dep_business from public.tasks t where t.id = new.depends_on_task_id;
  if v_business is null or v_dep_business is null then
    raise exception 'not_found' using errcode = 'P0001', detail = 'task not found';
  end if;
  if (select auth.uid()) is not null and not public.owns_business(v_business) then
    raise exception 'not_found' using errcode = 'P0001', detail = 'task not found';
  end if;
  if v_business <> v_dep_business then
    raise exception 'dependency_cross_business' using errcode = 'P0001', detail = 'both tasks must belong to the same business';
  end if;

  -- Serialize dependency writes per business so concurrent inserts cannot form a cycle.
  perform pg_advisory_xact_lock(hashtext('task_dependencies:' || v_business::text));

  if exists (
    with recursive reachable (id) as (
      select d.depends_on_task_id
      from public.task_dependencies d
      where d.task_id = new.depends_on_task_id
      union
      select d.depends_on_task_id
      from public.task_dependencies d
      join reachable r on d.task_id = r.id
    )
    select 1 from reachable where id = new.task_id
  ) then
    raise exception 'dependency_cycle' using errcode = 'P0001', detail = 'this dependency would create a cycle';
  end if;
  return new;
end;
$$;

revoke all on function public.tasks_maintain_completed_at() from public, anon, authenticated;
revoke all on function public.task_dependencies_guard() from public, anon, authenticated;

create trigger roadmap_phases_set_updated_at
  before update on public.roadmap_phases
  for each row execute function public.set_updated_at();
create trigger roadmap_phases_business_id_immutable
  before update of business_id on public.roadmap_phases
  for each row execute function public.prevent_business_id_change();

create trigger milestones_set_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();
create trigger milestones_business_id_immutable
  before update of business_id on public.milestones
  for each row execute function public.prevent_business_id_change();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger tasks_business_id_immutable
  before update of business_id on public.tasks
  for each row execute function public.prevent_business_id_change();
create trigger tasks_maintain_completed_at
  before insert or update on public.tasks
  for each row execute function public.tasks_maintain_completed_at();

create trigger task_dependencies_guard
  before insert or update on public.task_dependencies
  for each row execute function public.task_dependencies_guard();

-- -----------------------------------------------------------------------------
-- Row level security & grants
-- -----------------------------------------------------------------------------
alter table public.roadmap_phases enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;

revoke all on table public.roadmap_phases, public.milestones, public.tasks, public.task_dependencies from anon, authenticated;
grant all on table public.roadmap_phases, public.milestones, public.tasks, public.task_dependencies to service_role;

grant select, insert, update, delete on table public.roadmap_phases, public.milestones, public.tasks to authenticated;
grant select, insert, delete on table public.task_dependencies to authenticated;

create policy roadmap_phases_select_own on public.roadmap_phases
  for select to authenticated using ((select public.owns_business(business_id)));
create policy roadmap_phases_insert_own on public.roadmap_phases
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy roadmap_phases_update_own on public.roadmap_phases
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy roadmap_phases_delete_own on public.roadmap_phases
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy milestones_select_own on public.milestones
  for select to authenticated using ((select public.owns_business(business_id)));
create policy milestones_insert_own on public.milestones
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy milestones_update_own on public.milestones
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy milestones_delete_own on public.milestones
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy tasks_select_own on public.tasks
  for select to authenticated using ((select public.owns_business(business_id)));
create policy tasks_insert_own on public.tasks
  for insert to authenticated with check ((select public.owns_business(business_id)));
create policy tasks_update_own on public.tasks
  for update to authenticated
  using ((select public.owns_business(business_id)))
  with check ((select public.owns_business(business_id)));
create policy tasks_delete_own on public.tasks
  for delete to authenticated using ((select public.owns_business(business_id)));

create policy task_dependencies_select_own on public.task_dependencies
  for select to authenticated using ((select public.owns_task(task_id)));
create policy task_dependencies_insert_own on public.task_dependencies
  for insert to authenticated
  with check ((select public.owns_task(task_id)) and (select public.owns_task(depends_on_task_id)));
create policy task_dependencies_delete_own on public.task_dependencies
  for delete to authenticated using ((select public.owns_task(task_id)));

-- -----------------------------------------------------------------------------
-- RPC: replace_ai_roadmap (security invoker)
-- Removes open AI-sourced tasks and unachieved AI milestones so the AI function
-- can regenerate the roadmap ('replace_ai_items' mode). User/advisor items and
-- completed/achieved items are kept.
-- -----------------------------------------------------------------------------
create or replace function public.replace_ai_roadmap(p_business_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.assert_business_access(p_business_id);

  delete from public.tasks
  where business_id = p_business_id
    and source = 'ai'
    and status <> 'done';

  delete from public.milestones
  where business_id = p_business_id
    and source = 'ai'
    and achieved_at is null;
end;
$$;

revoke all on function public.replace_ai_roadmap(uuid) from public, anon;
grant execute on function public.replace_ai_roadmap(uuid) to authenticated, service_role;
