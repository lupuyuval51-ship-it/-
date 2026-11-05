-- Per-user isolation for every table: user B can neither read nor write user A's
-- rows, user A can read their own, anon can read nothing.
begin;
\ir _helpers.psql

select plan(128);

-- ---------------------------------------------------------------------------
-- Fixture (as postgres): user A owns one row in every table; user B owns bizB.
-- ---------------------------------------------------------------------------
select tests.create_user('aaaaaaaa-0000-4000-8000-000000000001', 'a@example.test');
select tests.create_user('bbbbbbbb-0000-4000-8000-000000000002', 'b@example.test');

insert into public.businesses (id, owner_id, name) values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'A business'),
  ('bbbbbbbb-1111-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'B business');

insert into public.onboarding_responses (id, business_id, question_key, value)
values ('aaaaaaaa-2222-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'country', '{"code": "IL"}');

insert into public.business_plans (id, business_id)
values ('aaaaaaaa-3333-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001');
insert into public.plan_versions (id, plan_id, origin)
values ('aaaaaaaa-4444-4000-8000-000000000001', 'aaaaaaaa-3333-4000-8000-000000000001', 'ai_generated');
insert into public.plan_sections (id, plan_version_id, section_key, content, origin)
values ('aaaaaaaa-5555-4000-8000-000000000001', 'aaaaaaaa-4444-4000-8000-000000000001', 'executive_summary',
        '{"summary": "S", "blocks": [{"id": "b1", "text": "Text", "basis": "assumption"}]}', 'ai');
update public.plan_versions set status = 'ready' where id = 'aaaaaaaa-4444-4000-8000-000000000001';
update public.business_plans set current_version_id = 'aaaaaaaa-4444-4000-8000-000000000001'
where id = 'aaaaaaaa-3333-4000-8000-000000000001';

insert into public.roadmap_phases (id, business_id, phase, objective)
values ('aaaaaaaa-6666-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'Validate');
insert into public.milestones (id, business_id, phase, title, source)
values ('aaaaaaaa-7777-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'First customer', 'ai');
insert into public.tasks (id, business_id, phase, milestone_id, title, source) values
  ('aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'aaaaaaaa-7777-4000-8000-000000000001', 'Task one', 'ai'),
  ('aaaaaaaa-8888-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000001', 'days_30', null, 'Task two', 'user');
insert into public.task_dependencies (task_id, depends_on_task_id)
values ('aaaaaaaa-8888-4000-8000-000000000002', 'aaaaaaaa-8888-4000-8000-000000000001');

insert into public.financial_models (business_id) values ('aaaaaaaa-1111-4000-8000-000000000001');
insert into public.startup_costs (id, business_id, label, amount_minor)
values ('aaaaaaaa-9999-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'Laptop', 500000);
insert into public.recurring_expenses (id, business_id, label, monthly_amount_minor)
values ('aaaaaaaa-aaaa-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'Rent', 300000);
insert into public.revenue_streams (id, business_id, label, unit_price_minor, monthly_units)
values ('aaaaaaaa-bbbb-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'Coffee', 1500, 400);
insert into public.transactions (id, business_id, kind, amount_minor)
values ('aaaaaaaa-cccc-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'income', 12000);
insert into public.business_goals (id, business_id, title, metric, target_value)
values ('aaaaaaaa-dddd-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'First 100 customers', 'customers', 100);

insert into public.ai_conversations (id, business_id, user_id, title)
values ('aaaaaaaa-eeee-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Pricing');
insert into public.ai_messages (id, conversation_id, role, content, actions)
values ('aaaaaaaa-ffff-4000-8000-000000000001', 'aaaaaaaa-eeee-4000-8000-000000000001', 'assistant', 'Answer',
        '[{"type": "open_plan_section", "id": "act1", "label": "Open", "sectionKey": "pricing_strategy"}]');
insert into public.ai_usage_records (id, user_id, business_id, feature, model, status)
values ('aaaaaaaa-0101-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001',
        'advisor_message', 'claude-opus-5-5', 'success');

insert into public.marketing_assets (id, business_id, kind, title, content, origin)
values ('aaaaaaaa-0202-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'taglines', 'Taglines',
        '{"summary": "", "items": [{"id": "i1", "heading": "H", "body": "B"}]}', 'ai');
insert into public.launch_checklist_items (id, business_id, template_key, category, title)
values ('aaaaaaaa-0303-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'il.osek_patur', 'registration', 'Open a business file');

-- B owns a task (used for cross-business dependency attempts)
insert into public.tasks (id, business_id, title)
values ('bbbbbbbb-8888-4000-8000-000000000001', 'bbbbbbbb-1111-4000-8000-000000000002', 'B task');

-- ---------------------------------------------------------------------------
-- As user A: the owner sees every fixture row (so the B checks are meaningful)
-- ---------------------------------------------------------------------------
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');

select is(
  (select array_agg(t order by t) from (
    select 'businesses' as t where exists (select 1 from public.businesses where id = 'aaaaaaaa-1111-4000-8000-000000000001')
    union all select 'onboarding_responses' where exists (select 1 from public.onboarding_responses)
    union all select 'business_plans' where exists (select 1 from public.business_plans)
    union all select 'plan_versions' where exists (select 1 from public.plan_versions)
    union all select 'plan_sections' where exists (select 1 from public.plan_sections)
    union all select 'roadmap_phases' where exists (select 1 from public.roadmap_phases)
    union all select 'milestones' where exists (select 1 from public.milestones)
    union all select 'tasks' where exists (select 1 from public.tasks)
    union all select 'task_dependencies' where exists (select 1 from public.task_dependencies)
    union all select 'financial_models' where exists (select 1 from public.financial_models)
    union all select 'startup_costs' where exists (select 1 from public.startup_costs)
    union all select 'recurring_expenses' where exists (select 1 from public.recurring_expenses)
    union all select 'revenue_streams' where exists (select 1 from public.revenue_streams)
    union all select 'transactions' where exists (select 1 from public.transactions)
    union all select 'business_goals' where exists (select 1 from public.business_goals)
    union all select 'ai_conversations' where exists (select 1 from public.ai_conversations)
    union all select 'ai_messages' where exists (select 1 from public.ai_messages)
    union all select 'ai_usage_records' where exists (select 1 from public.ai_usage_records)
    union all select 'marketing_assets' where exists (select 1 from public.marketing_assets)
    union all select 'launch_checklist_items' where exists (select 1 from public.launch_checklist_items)
    union all select 'profiles' where exists (select 1 from public.profiles)
    union all select 'subscription_entitlements' where exists (select 1 from public.subscription_entitlements)
  ) s),
  array['ai_conversations', 'ai_messages', 'ai_usage_records', 'business_goals', 'business_plans', 'businesses',
        'financial_models', 'launch_checklist_items', 'marketing_assets', 'milestones', 'onboarding_responses',
        'plan_sections', 'plan_versions', 'profiles', 'recurring_expenses', 'revenue_streams', 'roadmap_phases',
        'startup_costs', 'subscription_entitlements', 'task_dependencies', 'tasks', 'transactions'],
  'owner A can read their rows in all 22 tables'
);
select is((select count(*)::int from public.tasks), 2, 'A sees only their own two tasks (not B''s)');
select is((select count(*)::int from public.businesses), 1, 'A sees only their own business');
select is((select count(*)::int from public.profiles), 1, 'A sees only their own profile');
select is((select count(*)::int from public.subscription_entitlements), 1, 'A sees only their own entitlement');
-- positive controls for tests.row_count (proves the 0-row checks below are not vacuous)
select is(tests.row_count($$select 1 from public.tasks where business_id = 'aaaaaaaa-1111-4000-8000-000000000001'$$), 2,
  'control: row_count counts selected rows');
select is(tests.row_count($$update public.transactions set note = 'owner edit' where id = 'aaaaaaaa-cccc-4000-8000-000000000001'$$), 1,
  'control: owner can update their row (row_count counts updated rows)');

-- ---------------------------------------------------------------------------
-- As user B: no select / update / delete on A's rows
-- ---------------------------------------------------------------------------
select tests.clear_authentication();
select tests.authenticate_as('bbbbbbbb-0000-4000-8000-000000000002');

select * from tests.assert_cannot_touch('businesses', 'id', 'aaaaaaaa-1111-4000-8000-000000000001', $$name = 'hacked'$$);
select * from tests.assert_cannot_touch('onboarding_responses', 'id', 'aaaaaaaa-2222-4000-8000-000000000001', 'skipped = true');
select * from tests.assert_cannot_touch('business_plans', 'id', 'aaaaaaaa-3333-4000-8000-000000000001', 'current_version_id = null');
select * from tests.assert_cannot_touch('roadmap_phases', 'id', 'aaaaaaaa-6666-4000-8000-000000000001', $$objective = 'x'$$);
select * from tests.assert_cannot_touch('milestones', 'id', 'aaaaaaaa-7777-4000-8000-000000000001', $$title = 'x'$$);
select * from tests.assert_cannot_touch('tasks', 'id', 'aaaaaaaa-8888-4000-8000-000000000001', $$title = 'x'$$);
select * from tests.assert_cannot_touch('financial_models', 'business_id', 'aaaaaaaa-1111-4000-8000-000000000001', 'forecast_months = 6');
select * from tests.assert_cannot_touch('startup_costs', 'id', 'aaaaaaaa-9999-4000-8000-000000000001', $$label = 'x'$$);
select * from tests.assert_cannot_touch('recurring_expenses', 'id', 'aaaaaaaa-aaaa-4000-8000-000000000001', $$label = 'x'$$);
select * from tests.assert_cannot_touch('revenue_streams', 'id', 'aaaaaaaa-bbbb-4000-8000-000000000001', $$label = 'x'$$);
select * from tests.assert_cannot_touch('transactions', 'id', 'aaaaaaaa-cccc-4000-8000-000000000001', $$note = 'x'$$);
select * from tests.assert_cannot_touch('business_goals', 'id', 'aaaaaaaa-dddd-4000-8000-000000000001', $$title = 'x'$$);
select * from tests.assert_cannot_touch('ai_conversations', 'id', 'aaaaaaaa-eeee-4000-8000-000000000001', $$title = 'x'$$);
select * from tests.assert_cannot_touch('marketing_assets', 'id', 'aaaaaaaa-0202-4000-8000-000000000001', $$title = 'x'$$);
select * from tests.assert_cannot_touch('launch_checklist_items', 'id', 'aaaaaaaa-0303-4000-8000-000000000001', $$notes = 'x'$$);

-- plan_versions / plan_sections: select + update filtered; delete not granted at all
select is(tests.row_count($$select 1 from public.plan_versions where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$), 0,
  'plan_versions: other user cannot select the row');
select is(tests.row_count($$update public.plan_versions set finance_proposal = '{}' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$), 0,
  'plan_versions: other user cannot update the row');
select throws_ok($$delete from public.plan_versions where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$, '42501', null,
  'plan_versions: delete is not granted');
select is(tests.row_count($$select 1 from public.plan_sections where id = 'aaaaaaaa-5555-4000-8000-000000000001'$$), 0,
  'plan_sections: other user cannot select the row');
select is(tests.row_count($$update public.plan_sections set origin = 'user' where id = 'aaaaaaaa-5555-4000-8000-000000000001'$$), 0,
  'plan_sections: other user cannot update the row');
select throws_ok($$delete from public.plan_sections where id = 'aaaaaaaa-5555-4000-8000-000000000001'$$, '42501', null,
  'plan_sections: delete is not granted');

-- task_dependencies: no update grant; select/delete filtered
select is(tests.row_count($$select 1 from public.task_dependencies where task_id = 'aaaaaaaa-8888-4000-8000-000000000002'$$), 0,
  'task_dependencies: other user cannot select the row');
select is(tests.row_count($$delete from public.task_dependencies where task_id = 'aaaaaaaa-8888-4000-8000-000000000002'$$), 0,
  'task_dependencies: other user cannot delete the row');
select throws_ok($$update public.task_dependencies set created_at = now()$$, '42501', null,
  'task_dependencies: update is not granted');

-- ai_messages: select/update(applied_action_ids) filtered; delete not granted
select is(tests.row_count($$select 1 from public.ai_messages where id = 'aaaaaaaa-ffff-4000-8000-000000000001'$$), 0,
  'ai_messages: other user cannot select the row');
select is(tests.row_count($$update public.ai_messages set applied_action_ids = '{}' where id = 'aaaaaaaa-ffff-4000-8000-000000000001'$$), 0,
  'ai_messages: other user cannot update the row');
select throws_ok($$delete from public.ai_messages where id = 'aaaaaaaa-ffff-4000-8000-000000000001'$$, '42501', null,
  'ai_messages: delete is not granted');

-- ai_usage_records / subscription_entitlements / profiles
select is(tests.row_count($$select 1 from public.ai_usage_records where id = 'aaaaaaaa-0101-4000-8000-000000000001'$$), 0,
  'ai_usage_records: other user cannot select the row');
select throws_ok($$update public.ai_usage_records set cost_usd_micros = 0$$, '42501', null,
  'ai_usage_records: update is not granted');
select is(tests.row_count($$select 1 from public.subscription_entitlements where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 0,
  'subscription_entitlements: other user cannot select the row');
select is(tests.row_count($$select 1 from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 0,
  'profiles: other user cannot select the row');
select is(tests.row_count($$update public.profiles set display_name = 'x' where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$), 0,
  'profiles: other user cannot update the row');
select throws_ok($$delete from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001'$$, '42501', null,
  'profiles: delete is not granted');

-- ---------------------------------------------------------------------------
-- As user B: inserts into A's business are rejected
-- ---------------------------------------------------------------------------
select throws_ok($$insert into public.businesses (owner_id, name) values ('aaaaaaaa-0000-4000-8000-000000000001', 'x')$$,
  '42501', null, 'businesses: cannot insert a business owned by someone else');
select throws_ok($$insert into public.onboarding_responses (business_id, question_key, value) values ('aaaaaaaa-1111-4000-8000-000000000001', 'experience', '{"level": "none"}')$$,
  '42501', null, 'onboarding_responses: insert into other business rejected');
select throws_ok($$insert into public.business_plans (business_id) values ('aaaaaaaa-1111-4000-8000-000000000001')$$,
  '42501', null, 'business_plans: insert into other business rejected');
select throws_ok($$insert into public.plan_versions (plan_id, origin) values ('aaaaaaaa-3333-4000-8000-000000000001', 'user_edit')$$,
  'P0001', 'not_found', 'plan_versions: insert into other plan rejected');
select throws_ok($$insert into public.plan_sections (plan_version_id, section_key, content, origin) values ('aaaaaaaa-4444-4000-8000-000000000001', 'business_concept', '{"summary": "", "blocks": [{"id": "b", "text": "t", "basis": "assumption"}]}', 'user')$$,
  'P0001', 'not_found', 'plan_sections: insert into other version rejected');
select throws_ok($$insert into public.roadmap_phases (business_id, phase) values ('aaaaaaaa-1111-4000-8000-000000000001', 'days_60')$$,
  '42501', null, 'roadmap_phases: insert into other business rejected');
select throws_ok($$insert into public.milestones (business_id, phase, title) values ('aaaaaaaa-1111-4000-8000-000000000001', 'days_30', 'x')$$,
  '42501', null, 'milestones: insert into other business rejected');
select throws_ok($$insert into public.tasks (business_id, title) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x')$$,
  '42501', null, 'tasks: insert into other business rejected');
select throws_ok($$insert into public.task_dependencies (task_id, depends_on_task_id) values ('aaaaaaaa-8888-4000-8000-000000000001', 'aaaaaaaa-8888-4000-8000-000000000002')$$,
  'P0001', 'not_found', 'task_dependencies: insert between other user''s tasks rejected');
select throws_ok($$insert into public.task_dependencies (task_id, depends_on_task_id) values ('bbbbbbbb-8888-4000-8000-000000000001', 'aaaaaaaa-8888-4000-8000-000000000001')$$,
  'P0001', 'dependency_cross_business', 'task_dependencies: own task cannot depend on another user''s task');
select throws_ok($$insert into public.financial_models (business_id, forecast_months) values ('aaaaaaaa-1111-4000-8000-000000000001', 24)$$,
  '42501', null, 'financial_models: insert for other business rejected by RLS (no tier leak)');
select throws_ok($$insert into public.startup_costs (business_id, label) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x')$$,
  '42501', null, 'startup_costs: insert into other business rejected');
select throws_ok($$insert into public.recurring_expenses (business_id, label) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x')$$,
  '42501', null, 'recurring_expenses: insert into other business rejected');
select throws_ok($$insert into public.revenue_streams (business_id, label) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x')$$,
  '42501', null, 'revenue_streams: insert into other business rejected');
select throws_ok($$insert into public.transactions (business_id, kind, amount_minor) values ('aaaaaaaa-1111-4000-8000-000000000001', 'expense', 1)$$,
  '42501', null, 'transactions: insert into other business rejected');
select throws_ok($$insert into public.business_goals (business_id, title, metric, target_value) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x', 'custom', 1)$$,
  '42501', null, 'business_goals: insert into other business rejected');
select throws_ok($$insert into public.ai_conversations (business_id) values ('aaaaaaaa-1111-4000-8000-000000000001')$$,
  'P0001', 'forbidden', 'ai_conversations: insert into other business rejected');
select throws_ok($$insert into public.marketing_assets (business_id, kind, title) values ('aaaaaaaa-1111-4000-8000-000000000001', 'taglines', 'x')$$,
  '42501', null, 'marketing_assets: insert into other business rejected');
select throws_ok($$insert into public.launch_checklist_items (business_id, category, title) values ('aaaaaaaa-1111-4000-8000-000000000001', 'tax', 'x')$$,
  '42501', null, 'launch_checklist_items: insert into other business rejected');
select throws_ok($$update public.profiles set active_business_id = 'aaaaaaaa-1111-4000-8000-000000000001' where id = 'bbbbbbbb-0000-4000-8000-000000000002'$$,
  '42501', null, 'profiles: cannot point active_business_id at another user''s business');

-- RPCs against A's data
select throws_ok($$select public.save_plan_section('aaaaaaaa-1111-4000-8000-000000000001', 'executive_summary', '{"summary": "", "blocks": [{"id": "b", "text": "t", "basis": "assumption"}]}')$$,
  'P0001', 'not_found', 'save_plan_section on another user''s business fails with not_found');
select throws_ok($$select public.restore_plan_version('aaaaaaaa-4444-4000-8000-000000000001')$$,
  'P0001', 'not_found', 'restore_plan_version on another user''s version fails with not_found');
select throws_ok($$select public.replace_ai_roadmap('aaaaaaaa-1111-4000-8000-000000000001')$$,
  'P0001', 'not_found', 'replace_ai_roadmap on another user''s business fails with not_found');
select throws_ok($$select public.ensure_financial_model('aaaaaaaa-1111-4000-8000-000000000001')$$,
  'P0001', 'not_found', 'ensure_financial_model on another user''s business fails with not_found');
select throws_ok($$select public.ensure_business_plan('aaaaaaaa-1111-4000-8000-000000000001')$$,
  'P0001', 'not_found', 'ensure_business_plan on another user''s business fails with not_found');
select is(public.owns_business('aaaaaaaa-1111-4000-8000-000000000001'), false, 'owns_business is false for another user''s business');
select is(public.current_tier('aaaaaaaa-0000-4000-8000-000000000001'), 'free', 'current_tier of another user reveals nothing (free)');
select is((select sum(used)::int from public.ai_usage_summary()), 0, 'ai_usage_summary shows only the caller''s usage');

-- ---------------------------------------------------------------------------
-- A's data is intact after B's attempts
-- ---------------------------------------------------------------------------
select tests.clear_authentication();
select is((select name from public.businesses where id = 'aaaaaaaa-1111-4000-8000-000000000001'), 'A business', 'A business unchanged');
select is((select count(*)::int from public.tasks where business_id = 'aaaaaaaa-1111-4000-8000-000000000001'), 2, 'A tasks intact');
select is((select count(*)::int from public.task_dependencies td join public.tasks t on t.id = td.task_id
           where t.business_id = 'aaaaaaaa-1111-4000-8000-000000000001'), 1, 'A dependency intact');
select is((select title from public.ai_conversations where id = 'aaaaaaaa-eeee-4000-8000-000000000001'), 'Pricing', 'A conversation unchanged');

-- ---------------------------------------------------------------------------
-- anon: no table, no RPC
-- ---------------------------------------------------------------------------
create or replace function tests.anon_select_denied()
returns setof text
language plpgsql
as $$
declare
  v_table text;
begin
  for v_table in select tablename from pg_tables where schemaname = 'public' order by tablename loop
    return next throws_ok(format('select 1 from public.%I limit 1', v_table), '42501', null,
      format('anon cannot select from %s', v_table));
  end loop;
end;
$$;
grant execute on function tests.anon_select_denied() to public;

select tests.authenticate_as_anon();
select * from tests.anon_select_denied();
select throws_ok($$insert into public.businesses (name) values ('x')$$, '42501', null, 'anon cannot insert businesses');
select throws_ok($$select public.save_plan_section('aaaaaaaa-1111-4000-8000-000000000001', 'executive_summary', '{}')$$,
  '42501', null, 'anon cannot execute save_plan_section');
select throws_ok($$select public.ai_usage_summary()$$, '42501', null, 'anon cannot execute ai_usage_summary');
select throws_ok($$select public.owns_business('aaaaaaaa-1111-4000-8000-000000000001')$$, '42501', null, 'anon cannot execute owns_business');

select * from finish();
rollback;
