-- Structure, RLS coverage and privilege surface of schema public.
begin;
\ir _helpers.psql

select plan(41);

-- ---------------------------------------------------------------------------
-- Tables exist and every table has RLS enabled
-- ---------------------------------------------------------------------------
select tables_are(
  'public',
  array[
    'profiles', 'subscription_entitlements', 'businesses', 'onboarding_responses',
    'business_plans', 'plan_versions', 'plan_sections',
    'roadmap_phases', 'milestones', 'tasks', 'task_dependencies',
    'financial_models', 'startup_costs', 'recurring_expenses', 'revenue_streams', 'transactions', 'business_goals',
    'ai_conversations', 'ai_messages', 'ai_usage_records',
    'marketing_assets', 'launch_checklist_items'
  ],
  'public schema contains exactly the documented tables'
);

select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'RLS is enabled on every table in public'
);

select is(
  (select count(*)::int
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
  0,
  'every table has at least one policy'
);

-- ---------------------------------------------------------------------------
-- anon has nothing
-- ---------------------------------------------------------------------------
select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'PUBLIC')),
  0,
  'anon/PUBLIC hold no table privileges in public'
);

select is(
  (select count(*)::int from information_schema.column_privileges
   where table_schema = 'public' and grantee in ('anon', 'PUBLIC')),
  0,
  'anon/PUBLIC hold no column privileges in public'
);

select is(
  (select count(*)::int
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
  0,
  'anon cannot execute any function in public'
);

select is(
  (select count(*)::int from pg_policy p
   join pg_class c on c.oid = p.polrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and not (p.polroles = array[(select oid from pg_roles where rolname = 'authenticated')])),
  0,
  'every policy targets the authenticated role only'
);

-- ---------------------------------------------------------------------------
-- Functions: search_path pinned; service-role RPCs locked down
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(p.proname::text order by p.proname)
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and not coalesce(p.proconfig, '{}'::text[]) @> array['search_path=""']),
  null,
  'every function in public sets search_path = '''''
);

select ok(not has_function_privilege('authenticated', 'public.reserve_ai_usage(uuid, uuid, text, integer, bigint, text)', 'execute'),
  'authenticated cannot execute reserve_ai_usage');
select ok(not has_function_privilege('authenticated', 'public.finalize_ai_usage(uuid, text, integer, integer, bigint, text)', 'execute'),
  'authenticated cannot execute finalize_ai_usage');
select ok(has_function_privilege('service_role', 'public.reserve_ai_usage(uuid, uuid, text, integer, bigint, text)', 'execute'),
  'service_role can execute reserve_ai_usage');
select ok(has_function_privilege('service_role', 'public.finalize_ai_usage(uuid, text, integer, integer, bigint, text)', 'execute'),
  'service_role can execute finalize_ai_usage');
select ok(not has_function_privilege('public', 'public.reserve_ai_usage(uuid, uuid, text, integer, bigint, text)', 'execute'),
  'PUBLIC cannot execute reserve_ai_usage');

select is(prosecdef, true, 'reserve_ai_usage is security definer')
from pg_proc where oid = 'public.reserve_ai_usage(uuid, uuid, text, integer, bigint, text)'::regprocedure;
select is(prosecdef, false, 'save_plan_section is security invoker')
from pg_proc where oid = 'public.save_plan_section(uuid, text, jsonb, text, text)'::regprocedure;
select is(prosecdef, false, 'restore_plan_version is security invoker')
from pg_proc where oid = 'public.restore_plan_version(uuid)'::regprocedure;
select is(prosecdef, false, 'ai_usage_summary is security invoker')
from pg_proc where oid = 'public.ai_usage_summary()'::regprocedure;
select is(prosecdef, false, 'replace_ai_roadmap is security invoker')
from pg_proc where oid = 'public.replace_ai_roadmap(uuid)'::regprocedure;
select is(prosecdef, false, 'ensure_financial_model is security invoker')
from pg_proc where oid = 'public.ensure_financial_model(uuid)'::regprocedure;
select is(prosecdef, true, 'owns_business is security definer')
from pg_proc where oid = 'public.owns_business(uuid)'::regprocedure;

select ok(has_function_privilege('authenticated', 'public.save_plan_section(uuid, text, jsonb, text, text)', 'execute'),
  'authenticated can execute save_plan_section');
select ok(has_function_privilege('authenticated', 'public.ai_usage_summary()', 'execute'),
  'authenticated can execute ai_usage_summary');

-- ---------------------------------------------------------------------------
-- authenticated privilege surface on the sensitive tables
-- ---------------------------------------------------------------------------
select ok(has_table_privilege('authenticated', 'public.subscription_entitlements', 'select'),
  'authenticated can select subscription_entitlements');
select ok(not has_table_privilege('authenticated', 'public.subscription_entitlements', 'insert, update, delete'),
  'authenticated cannot write subscription_entitlements');
select ok(not has_any_column_privilege('authenticated', 'public.subscription_entitlements', 'update'),
  'authenticated has no column update on subscription_entitlements');
select ok(not has_table_privilege('authenticated', 'public.ai_usage_records', 'insert, update, delete'),
  'authenticated cannot write ai_usage_records');
select ok(not has_any_column_privilege('authenticated', 'public.ai_usage_records', 'insert, update'),
  'authenticated has no column insert/update on ai_usage_records');
select ok(not has_any_column_privilege('authenticated', 'public.ai_messages', 'insert'),
  'authenticated cannot insert ai_messages');
select ok(not has_table_privilege('authenticated', 'public.ai_messages', 'delete'),
  'authenticated cannot delete ai_messages');
select is(
  (select array_agg(column_name::text order by column_name) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'ai_messages' and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  array['applied_action_ids'],
  'authenticated can update only ai_messages.applied_action_ids'
);
select is(
  (select array_agg(column_name::text order by column_name) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'ai_conversations' and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  array['title'],
  'authenticated can update only ai_conversations.title'
);
select ok(not has_table_privilege('authenticated', 'public.plan_versions', 'delete'),
  'authenticated cannot delete plan versions');
select ok(not has_table_privilege('authenticated', 'public.plan_sections', 'delete'),
  'authenticated cannot delete plan sections');
select is(
  (select array_agg(column_name::text order by column_name) from information_schema.column_privileges
   where table_schema = 'public' and table_name = 'profiles' and grantee = 'authenticated' and privilege_type = 'UPDATE'),
  array['active_business_id', 'display_name', 'locale', 'theme'],
  'authenticated can update only profile preference columns (not id)'
);

-- ---------------------------------------------------------------------------
-- Every foreign key is covered by an index whose leading columns match it
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(format('%s(%s)', c.conrelid::regclass, c.conname) order by 1)
   from pg_constraint c
   where c.contype = 'f'
     and c.connamespace = 'public'::regnamespace
     and not exists (
       select 1 from pg_index i
       where i.indrelid = c.conrelid
         and (string_to_array(i.indkey::text, ' ')::int2[])[1:cardinality(c.conkey)] @> c.conkey
         and (string_to_array(i.indkey::text, ' ')::int2[])[1:cardinality(c.conkey)] <@ c.conkey
     )),
  null,
  'every foreign key has a supporting index'
);

select has_index('public', 'tasks', 'tasks_business_status_due_idx', array['business_id', 'status', 'due_date'],
  'tasks(business_id, status, due_date) index');
select has_index('public', 'ai_usage_records', 'ai_usage_records_user_created_idx', array['user_id', 'created_at'],
  'ai_usage_records(user_id, created_at) index');
select has_index('public', 'ai_messages', 'ai_messages_conversation_created_idx', array['conversation_id', 'created_at'],
  'ai_messages(conversation_id, created_at) index');

-- ---------------------------------------------------------------------------
-- Money columns are bigint minor units
-- ---------------------------------------------------------------------------
select is(
  (select array_agg(format('%s.%s:%s', table_name, column_name, data_type) order by 1)
   from information_schema.columns
   where table_schema = 'public' and column_name like '%\_minor' and data_type <> 'bigint'),
  null,
  'every *_minor column is bigint'
);

-- tier_limits mirrors domain/entitlements.ts (also asserted from TS in domain-parity.test.ts)
select results_eq(
  $$ select * from public.tier_limits('free') $$,
  $$ values (1, 12) $$,
  'tier_limits(free) = 1 business, 12 months'
);
select results_eq(
  $$ select * from public.tier_limits('pro') union all select * from public.tier_limits('unknown') $$,
  $$ values (10, 36), (1, 12) $$,
  'tier_limits(pro) = 10 businesses, 36 months; unknown tiers fall back to free'
);

select * from finish();
rollback;
