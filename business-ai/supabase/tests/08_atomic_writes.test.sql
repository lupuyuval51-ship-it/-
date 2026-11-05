-- Atomic / idempotent proposal application: apply_advisor_action, set_task_dependencies,
-- persist_ai_roadmap, and the source_ref idempotency keys.
begin;
\ir _helpers.psql

select plan(34);

select tests.create_user('aaaaaaaa-0000-4000-8000-000000000081', 'a8@example.test');
select tests.create_user('bbbbbbbb-0000-4000-8000-000000000082', 'b8@example.test');
insert into public.businesses (id, owner_id, name) values
  ('aaaaaaaa-1111-4000-8000-000000000081', 'aaaaaaaa-0000-4000-8000-000000000081', 'A business'),
  ('bbbbbbbb-1111-4000-8000-000000000082', 'bbbbbbbb-0000-4000-8000-000000000082', 'B business');
insert into public.ai_conversations (id, business_id, user_id, title) values
  ('aaaaaaaa-eeee-4000-8000-000000000081', 'aaaaaaaa-1111-4000-8000-000000000081', 'aaaaaaaa-0000-4000-8000-000000000081', 'Advice');
-- Assistant message with stored proposals (written by the service role in production).
insert into public.ai_messages (id, conversation_id, role, content, actions) values
  ('aaaaaaaa-ffff-4000-8000-000000000081', 'aaaaaaaa-eeee-4000-8000-000000000081', 'assistant', 'Proposals', '[
    {"type":"add_recurring_expense","id":"a1","label":"Add rent","expenseLabel":"Kitchen rent","monthlyAmountMinor":450000},
    {"type":"add_startup_cost","id":"a2","label":"Add oven","costLabel":"Deck oven","amountMinor":2500000},
    {"type":"add_task","id":"a3","label":"Add task","title":"Call three suppliers","description":"Ask for flour prices","phase":"days_30","priority":"high","dueInDays":7},
    {"type":"add_milestone","id":"a4","label":"Add milestone","title":"First paying customer","phase":"days_60","dueInDays":40},
    {"type":"open_plan_section","id":"a5","label":"Open pricing","sectionKey":"pricing_strategy"},
    {"type":"add_task","id":"a6","label":"Broken","title":"   ","description":"","phase":"days_30","priority":"low","dueInDays":null}
  ]'::jsonb);

-- ---------------------------------------------------------------------------
-- apply_advisor_action
-- ---------------------------------------------------------------------------
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000081');

select is(
  (select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a1') ->> 'status'),
  'applied', 'first apply of an expense proposal applies it');
select is(
  (select count(*)::int from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000081'),
  1, 'exactly one expense row');
select is(
  (select monthly_amount_minor from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000081'),
  450000::bigint, 'amount comes from the stored proposal');
select is(
  (select basis || '|' || source_ref from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000081'),
  'ai_estimate|advisor:aaaaaaaa-ffff-4000-8000-000000000081:a1', 'labelled as AI estimate with an idempotency key');
select is(
  (select applied_action_ids from public.ai_messages where id = 'aaaaaaaa-ffff-4000-8000-000000000081'),
  array['a1']::text[], 'the action is recorded as applied in the same call');

select is(
  (select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a1') ->> 'status'),
  'already_applied', 'applying the same proposal again is a no-op');
select is(
  (select count(*)::int from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000081'),
  1, 'still exactly one expense row after the repeat');
select is(
  (select applied_action_ids from public.ai_messages where id = 'aaaaaaaa-ffff-4000-8000-000000000081'),
  array['a1']::text[], 'applied ids are not duplicated');

-- Lost-update scenario of the old two-request flow: row exists but the marker was never written.
select tests.clear_authentication();
update public.ai_messages set applied_action_ids = '{}' where id = 'aaaaaaaa-ffff-4000-8000-000000000081';
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000081');
select is(
  (select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a1') ->> 'status'),
  'applied', 're-applying after a lost marker succeeds');
select is(
  (select count(*)::int from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000081'),
  1, 'but the source_ref key still prevents a second expense row');

select is(
  (select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a2') ->> 'table'),
  'startup_costs', 'startup cost proposal writes startup_costs');
select is(
  (select amount_minor from public.startup_costs where business_id = 'aaaaaaaa-1111-4000-8000-000000000081'),
  2500000::bigint, 'startup cost amount from the stored proposal');

select is(
  (select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a3', current_date) ->> 'table'),
  'tasks', 'task proposal writes tasks');
select is(
  (select title || '|' || priority || '|' || phase || '|' || source || '|' || (due_date - current_date)::text
   from public.tasks where business_id = 'aaaaaaaa-1111-4000-8000-000000000081'),
  'Call three suppliers|high|days_30|advisor|7', 'task fields and due date (today + dueInDays)');

select is(
  (select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a4') ->> 'table'),
  'milestones', 'milestone proposal writes milestones');

select throws_ok($$select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a5')$$,
  'P0001', 'invalid_request', 'navigation-only proposals cannot be applied');
select throws_ok($$select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'nope')$$,
  'P0001', 'not_found', 'unknown action id');
select throws_ok($$select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a6')$$,
  '23514', null, 'an invalid proposal (blank title) fails the CHECK');
select is(
  (select applied_action_ids from public.ai_messages where id = 'aaaaaaaa-ffff-4000-8000-000000000081'),
  array['a1', 'a2', 'a3', 'a4']::text[], 'a failed apply records nothing (atomic)');
select is(
  (select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a2', current_date + 5) ->> 'status'),
  'already_applied', 'an already-applied proposal returns already_applied (no error, no write)');
select throws_ok($$select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a6', current_date + 5)$$,
  'P0001', 'invalid_request', 'client date far from the server date is rejected');

-- Another user cannot apply someone else's proposal (RLS hides the message).
select tests.authenticate_as('bbbbbbbb-0000-4000-8000-000000000082');
select throws_ok($$select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a1')$$,
  'P0001', 'not_found', 'another user gets not_found');

select tests.authenticate_as_anon();
select throws_ok($$select public.apply_advisor_action('aaaaaaaa-ffff-4000-8000-000000000081', 'a1')$$,
  '42501', null, 'anon cannot execute apply_advisor_action');

-- ---------------------------------------------------------------------------
-- set_task_dependencies
-- ---------------------------------------------------------------------------
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000081');
insert into public.tasks (id, business_id, title) values
  ('aaaaaaaa-7777-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000081', 'T1'),
  ('aaaaaaaa-7777-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000081', 'T2'),
  ('aaaaaaaa-7777-4000-8000-000000000003', 'aaaaaaaa-1111-4000-8000-000000000081', 'T3');

select lives_ok($$select public.set_task_dependencies('aaaaaaaa-7777-4000-8000-000000000001',
  array['aaaaaaaa-7777-4000-8000-000000000002', 'aaaaaaaa-7777-4000-8000-000000000002']::uuid[])$$,
  'set dependencies (duplicates collapsed)');
select is((select count(*)::int from public.task_dependencies where task_id = 'aaaaaaaa-7777-4000-8000-000000000001'), 1,
  'one dependency stored');
select lives_ok($$select public.set_task_dependencies('aaaaaaaa-7777-4000-8000-000000000001',
  array['aaaaaaaa-7777-4000-8000-000000000003']::uuid[])$$, 'replace the dependency set');
select is((select array_agg(depends_on_task_id) from public.task_dependencies where task_id = 'aaaaaaaa-7777-4000-8000-000000000001'),
  array['aaaaaaaa-7777-4000-8000-000000000003']::uuid[], 'old dependency removed, new one added');
-- T3 -> T1 would create a cycle: the whole call fails and T3's (empty) set is unchanged.
select throws_ok($$select public.set_task_dependencies('aaaaaaaa-7777-4000-8000-000000000003',
  array['aaaaaaaa-7777-4000-8000-000000000001']::uuid[])$$, 'P0001', 'dependency_cycle', 'cycle rejected');
select is((select array_agg(depends_on_task_id) from public.task_dependencies where task_id = 'aaaaaaaa-7777-4000-8000-000000000001'),
  array['aaaaaaaa-7777-4000-8000-000000000003']::uuid[], 'a rejected change leaves existing dependencies intact');

-- ---------------------------------------------------------------------------
-- persist_ai_roadmap
-- ---------------------------------------------------------------------------
select is(
  (select public.persist_ai_roadmap('aaaaaaaa-1111-4000-8000-000000000081', 'create', '{
     "starts_on": "2026-11-05",
     "phases": [{"phase":"days_30","objective":"Validate"},{"phase":"days_60","objective":"Launch"},{"phase":"days_90","objective":"Grow"}],
     "milestones": [{"key":"0:0","phase":"days_30","title":"Five interviews","target_date":"2026-11-15","sort_order":0}],
     "tasks": [
       {"ref":"t1","phase":"days_30","milestone_key":"0:0","title":"Interview","description":"","priority":"high","due_date":"2026-11-10","sort_order":0},
       {"ref":"t2","phase":"days_30","milestone_key":null,"title":"Price test","description":"","priority":"medium","due_date":"2026-11-20","sort_order":1}
     ],
     "dependencies": [{"ref":"t2","depends_on":"t1"},{"ref":"t2","depends_on":"missing"}]
   }'::jsonb) ->> 'tasks'),
  '2', 'persist_ai_roadmap writes the roadmap');
select is((select count(*)::int from public.task_dependencies td join public.tasks t on t.id = td.task_id
           where t.business_id = 'aaaaaaaa-1111-4000-8000-000000000081' and t.source = 'ai'), 1,
  'dependencies resolved by ref (unknown refs ignored)');
select throws_ok($$select public.persist_ai_roadmap('aaaaaaaa-1111-4000-8000-000000000081', 'create',
  '{"phases":[],"milestones":[],"tasks":[{"phase":"days_30","title":"X","priority":"low","due_date":"2026-11-10"}],"dependencies":[]}'::jsonb)$$,
  'P0001', 'conflict', 'create mode refuses when an AI roadmap exists');
select throws_ok($$select public.persist_ai_roadmap('aaaaaaaa-1111-4000-8000-000000000081', 'replace_ai_items',
  '{"phases":[],"milestones":[],"tasks":[{"phase":"days_30","title":"","priority":"low","due_date":"2026-11-10"}],"dependencies":[]}'::jsonb)$$,
  '23514', null, 'an invalid row aborts the whole write');
select is((select count(*)::int from public.tasks where business_id = 'aaaaaaaa-1111-4000-8000-000000000081' and source = 'ai'), 2,
  'after the failed replace the previous AI roadmap is still complete (rolled back)');

select * from finish();
rollback;
