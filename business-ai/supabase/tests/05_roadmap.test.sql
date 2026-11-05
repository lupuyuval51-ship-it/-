-- Roadmap: completed_at trigger, dependency rules, milestone links,
-- replace_ai_roadmap, phase upsert.
begin;
\ir _helpers.psql

select plan(28);

select tests.create_user('aaaaaaaa-0000-4000-8000-000000000001', 'a@example.test');
-- pro so A can own two businesses (cross-business checks within one account)
update public.subscription_entitlements set tier = 'pro', source = 'manual'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';

create temp table snap (name text primary key, at timestamptz) on commit drop;
grant all on snap to public;

select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');
insert into public.businesses (id, name) values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'One'),
  ('aaaaaaaa-1111-4000-8000-000000000002', 'Two');

-- ---------------------------------------------------------------------------
-- completed_at is trigger-maintained
-- ---------------------------------------------------------------------------
insert into public.tasks (id, business_id, title, completed_at) values
  ('aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'Register the business', '2020-01-01');
select is((select completed_at from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000001'), null,
  'a todo task has no completed_at (client value ignored)');

update public.tasks set status = 'done' where id = 'aaaaaaaa-8888-4000-8000-000000000001';
insert into snap select 'done', completed_at from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000001';
select ok((select at is not null and at <= now() from snap where name = 'done'), 'moving to done sets completed_at');

update public.tasks set title = 'Register the business (online)', completed_at = '2020-01-01' where id = 'aaaaaaaa-8888-4000-8000-000000000001';
select is((select completed_at from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000001'), (select at from snap where name = 'done'),
  'editing a done task keeps its completed_at (client value ignored)');

update public.tasks set status = 'in_progress' where id = 'aaaaaaaa-8888-4000-8000-000000000001';
select is((select completed_at from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000001'), null,
  'leaving done clears completed_at');

insert into public.tasks (id, business_id, title, status) values
  ('aaaaaaaa-8888-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000001', 'Open bank account', 'done');
select isnt((select completed_at from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000002'), null,
  'inserting a done task sets completed_at');

-- column checks
select throws_ok($$insert into public.tasks (business_id, title) values ('aaaaaaaa-1111-4000-8000-000000000001', repeat('x', 201))$$,
  '23514', null, 'task title longer than 200 rejected');
select throws_ok($$insert into public.tasks (business_id, title) values ('aaaaaaaa-1111-4000-8000-000000000001', '  ')$$,
  '23514', null, 'blank task title rejected');
select throws_ok($$insert into public.tasks (business_id, title, status) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x', 'blocked')$$,
  '23514', null, 'unknown task status rejected');
select throws_ok($$insert into public.tasks (business_id, title, priority) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x', 'urgent')$$,
  '23514', null, 'unknown task priority rejected');
select throws_ok($$update public.tasks set business_id = 'aaaaaaaa-1111-4000-8000-000000000002' where id = 'aaaaaaaa-8888-4000-8000-000000000001'$$,
  'P0001', 'immutable_column', 'a task cannot move to another business');

-- ---------------------------------------------------------------------------
-- Dependencies
-- ---------------------------------------------------------------------------
insert into public.tasks (id, business_id, title) values
  ('aaaaaaaa-8888-4000-8000-000000000003', 'aaaaaaaa-1111-4000-8000-000000000001', 'Pick a name'),
  ('aaaaaaaa-8888-4000-8000-000000000009', 'aaaaaaaa-1111-4000-8000-000000000002', 'Other business task');

select throws_ok($$insert into public.task_dependencies (task_id, depends_on_task_id) values ('aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-8888-4000-8000-000000000001')$$,
  'P0001', 'dependency_self', 'a task cannot depend on itself');
select throws_ok($$insert into public.task_dependencies (task_id, depends_on_task_id) values ('aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-8888-4000-8000-000000000009')$$,
  'P0001', 'dependency_cross_business', 'dependencies must stay within one business (even for the same owner)');
select lives_ok($$insert into public.task_dependencies (task_id, depends_on_task_id) values
  ('aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-8888-4000-8000-000000000002'),
  ('aaaaaaaa-8888-4000-8000-000000000002', 'aaaaaaaa-8888-4000-8000-000000000003')$$,
  'valid dependencies are accepted (1 -> 2 -> 3)');
select throws_ok($$insert into public.task_dependencies (task_id, depends_on_task_id) values ('aaaaaaaa-8888-4000-8000-000000000003', 'aaaaaaaa-8888-4000-8000-000000000001')$$,
  'P0001', 'dependency_cycle', 'a dependency that closes a cycle is rejected');
select throws_ok($$insert into public.task_dependencies (task_id, depends_on_task_id) values ('aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-8888-4000-8000-000000000002')$$,
  '23505', null, 'duplicate dependency rejected');
delete from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000003';
select is((select count(*)::int from public.task_dependencies), 1, 'deleting a task removes its dependency rows');

-- ---------------------------------------------------------------------------
-- Milestone links stay within the business
-- ---------------------------------------------------------------------------
insert into public.milestones (id, business_id, phase, title) values
  ('aaaaaaaa-7777-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'Legal setup done'),
  ('aaaaaaaa-7777-4000-8000-000000000009', 'aaaaaaaa-1111-4000-8000-000000000002', 'days_30', 'Other business milestone');

select throws_ok($$insert into public.tasks (business_id, title, milestone_id) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x', 'aaaaaaaa-7777-4000-8000-000000000009')$$,
  '23503', null, 'a task cannot reference a milestone of another business');
update public.tasks set milestone_id = 'aaaaaaaa-7777-4000-8000-000000000001' where id = 'aaaaaaaa-8888-4000-8000-000000000001';
delete from public.milestones where id = 'aaaaaaaa-7777-4000-8000-000000000001';
select results_eq(
  $$ select milestone_id, business_id from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000001' $$,
  $$ values (null::uuid, 'aaaaaaaa-1111-4000-8000-000000000001'::uuid) $$,
  'deleting a milestone clears only tasks.milestone_id'
);

-- ---------------------------------------------------------------------------
-- roadmap_phases upsert on (business_id, phase)
-- ---------------------------------------------------------------------------
insert into public.roadmap_phases (business_id, phase, objective) values ('aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'Validate demand');
select lives_ok($$insert into public.roadmap_phases (business_id, phase, objective) values ('aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'Validate demand v2')
  on conflict (business_id, phase) do update set objective = excluded.objective$$, 'phase upsert works');
select results_eq(
  $$ select count(*)::int, max(objective) from public.roadmap_phases where business_id = 'aaaaaaaa-1111-4000-8000-000000000001' $$,
  $$ values (1, 'Validate demand v2'::text) $$,
  'one row per (business, phase)'
);

-- ---------------------------------------------------------------------------
-- replace_ai_roadmap
-- ---------------------------------------------------------------------------
insert into public.milestones (id, business_id, phase, title, source, achieved_at) values
  ('aaaaaaaa-7777-4000-8000-000000000011', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'AI open milestone', 'ai', null),
  ('aaaaaaaa-7777-4000-8000-000000000012', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_60', 'AI achieved milestone', 'ai', now()),
  ('aaaaaaaa-7777-4000-8000-000000000013', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_60', 'User milestone', 'user', null),
  ('aaaaaaaa-7777-4000-8000-000000000019', 'aaaaaaaa-1111-4000-8000-000000000002', 'days_30', 'AI milestone elsewhere', 'ai', null);
insert into public.tasks (id, business_id, title, source, status, milestone_id) values
  ('aaaaaaaa-8888-4000-8000-000000000021', 'aaaaaaaa-1111-4000-8000-000000000001', 'AI todo', 'ai', 'todo', 'aaaaaaaa-7777-4000-8000-000000000011'),
  ('aaaaaaaa-8888-4000-8000-000000000022', 'aaaaaaaa-1111-4000-8000-000000000001', 'AI in progress', 'ai', 'in_progress', null),
  ('aaaaaaaa-8888-4000-8000-000000000023', 'aaaaaaaa-1111-4000-8000-000000000001', 'AI done', 'ai', 'done', 'aaaaaaaa-7777-4000-8000-000000000011'),
  ('aaaaaaaa-8888-4000-8000-000000000024', 'aaaaaaaa-1111-4000-8000-000000000001', 'Advisor task', 'advisor', 'todo', null),
  ('aaaaaaaa-8888-4000-8000-000000000025', 'aaaaaaaa-1111-4000-8000-000000000001', 'User task on AI milestone', 'user', 'todo', 'aaaaaaaa-7777-4000-8000-000000000011'),
  ('aaaaaaaa-8888-4000-8000-000000000029', 'aaaaaaaa-1111-4000-8000-000000000002', 'AI todo elsewhere', 'ai', 'todo', null);

select lives_ok($$select public.replace_ai_roadmap('aaaaaaaa-1111-4000-8000-000000000001')$$, 'replace_ai_roadmap runs for the owner');
select set_eq(
  $$ select title from public.tasks where business_id = 'aaaaaaaa-1111-4000-8000-000000000001' $$,
  array['Register the business (online)', 'Open bank account', 'AI done', 'Advisor task', 'User task on AI milestone'],
  'open AI tasks removed; done AI tasks, user and advisor tasks kept'
);
select set_eq(
  $$ select title from public.milestones where business_id = 'aaaaaaaa-1111-4000-8000-000000000001' $$,
  array['AI achieved milestone', 'User milestone'],
  'unachieved AI milestones removed; achieved and user milestones kept'
);
select is((select milestone_id from public.tasks where id = 'aaaaaaaa-8888-4000-8000-000000000025'), null,
  'kept tasks lose the link to a removed AI milestone');
select results_eq(
  $$ select (select count(*)::int from public.tasks where business_id = 'aaaaaaaa-1111-4000-8000-000000000002' and source = 'ai'),
            (select count(*)::int from public.milestones where business_id = 'aaaaaaaa-1111-4000-8000-000000000002' and source = 'ai') $$,
  $$ values (1, 1) $$,
  'other businesses are untouched'
);
select throws_ok($$select public.replace_ai_roadmap(null)$$, 'P0001', 'not_found', 'replace_ai_roadmap(null) fails with not_found');

-- service role (edge function fallback) may call it for an existing business
select tests.clear_authentication();
select tests.authenticate_as_service_role();
select lives_ok($$select public.replace_ai_roadmap('aaaaaaaa-1111-4000-8000-000000000002')$$, 'service role can run replace_ai_roadmap');
select is((select count(*)::int from public.tasks where business_id = 'aaaaaaaa-1111-4000-8000-000000000002' and source = 'ai'), 0,
  'service role call removed the open AI task');

select * from finish();
rollback;
