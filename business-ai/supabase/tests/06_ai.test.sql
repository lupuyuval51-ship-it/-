-- AI advisor tables and usage metering: who can write what, quotas, cost cap.
begin;
\ir _helpers.psql

select plan(47);

select tests.create_user('aaaaaaaa-0000-4000-8000-000000000001', 'a@example.test');
select tests.create_user('bbbbbbbb-0000-4000-8000-000000000002', 'b@example.test');
insert into public.businesses (id, owner_id, name) values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'A business'),
  ('bbbbbbbb-1111-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'B business');

create temp table r (name text primary key, id uuid) on commit drop;
grant all on r to public;

-- ---------------------------------------------------------------------------
-- ai_conversations (owner)
-- ---------------------------------------------------------------------------
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');

select lives_ok($$insert into public.ai_conversations (id, business_id, title) values
  ('aaaaaaaa-eeee-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'Pricing'),
  ('aaaaaaaa-eeee-4000-8000-000000000002', 'aaaaaaaa-1111-4000-8000-000000000001', 'Scratch')$$,
  'owner creates conversations');
select is((select user_id from public.ai_conversations where id = 'aaaaaaaa-eeee-4000-8000-000000000001'),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid, 'user_id defaults to auth.uid()');
select is(tests.row_count($$update public.ai_conversations set title = 'Pricing ideas' where id = 'aaaaaaaa-eeee-4000-8000-000000000001'$$), 1,
  'owner can rename a conversation');
select throws_ok($$update public.ai_conversations set last_message_at = now() where id = 'aaaaaaaa-eeee-4000-8000-000000000001'$$,
  '42501', null, 'only the title column is updatable');
select throws_ok($$insert into public.ai_conversations (business_id, user_id) values ('aaaaaaaa-1111-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002')$$,
  'P0001', 'forbidden', 'a conversation cannot be created for another user');
select is(tests.row_count($$delete from public.ai_conversations where id = 'aaaaaaaa-eeee-4000-8000-000000000002'$$), 1,
  'owner can delete a conversation');

-- ---------------------------------------------------------------------------
-- ai_messages: service role writes, owner reads + marks actions applied
-- ---------------------------------------------------------------------------
select throws_ok($$insert into public.ai_messages (conversation_id, role, content) values ('aaaaaaaa-eeee-4000-8000-000000000001', 'assistant', 'forged')$$,
  '42501', null, 'authenticated cannot insert (forge) messages');

select tests.clear_authentication();
select tests.authenticate_as_service_role();
select lives_ok($$insert into public.ai_messages (id, conversation_id, role, content, created_at) values
  ('aaaaaaaa-ffff-4000-8000-000000000001', 'aaaaaaaa-eeee-4000-8000-000000000001', 'user', 'How should I price?', now())$$,
  'service role inserts the user message');
select lives_ok($$insert into public.ai_messages (id, conversation_id, role, content, actions, follow_ups, model, input_tokens, output_tokens, created_at) values
  ('aaaaaaaa-ffff-4000-8000-000000000002', 'aaaaaaaa-eeee-4000-8000-000000000001', 'assistant', 'Consider 18 ILS.',
   '[{"type": "open_plan_section", "id": "act1", "label": "Open pricing", "sectionKey": "pricing_strategy"},
     {"type": "add_task", "id": "act2", "label": "Add task", "title": "Survey 10 customers", "description": "", "phase": "days_30", "priority": "high", "dueInDays": 7}]',
   '["What about costs?"]', 'claude-opus-5-5', 1200, 300, now() + interval '1 minute')$$,
  'service role inserts the assistant message with actions');
select throws_ok($$insert into public.ai_messages (conversation_id, role, content, actions) values ('aaaaaaaa-eeee-4000-8000-000000000001', 'assistant', 'x', '{"not": "an array"}')$$,
  '23514', null, 'actions must be a JSON array');
select is((select last_message_at from public.ai_conversations where id = 'aaaaaaaa-eeee-4000-8000-000000000001'), now() + interval '1 minute',
  'inserting a message bumps the conversation last_message_at');

select tests.clear_authentication();
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');
select is((select count(*)::int from public.ai_messages), 2, 'owner reads the conversation messages');
select is(tests.row_count($$update public.ai_messages set applied_action_ids = array['act2'] where id = 'aaaaaaaa-ffff-4000-8000-000000000002'$$), 1,
  'owner marks an action as applied');
select is((select applied_action_ids from public.ai_messages where id = 'aaaaaaaa-ffff-4000-8000-000000000002'), array['act2'],
  'applied_action_ids stored');
select throws_ok($$update public.ai_messages set applied_action_ids = array['unknown'] where id = 'aaaaaaaa-ffff-4000-8000-000000000002'$$,
  '23514', null, 'applied_action_ids must reference actions of the message');
select throws_ok($$update public.ai_messages set content = 'rewritten' where id = 'aaaaaaaa-ffff-4000-8000-000000000002'$$,
  '42501', null, 'message content is not updatable');
select throws_ok($$update public.ai_messages set actions = '[]' where id = 'aaaaaaaa-ffff-4000-8000-000000000002'$$,
  '42501', null, 'message actions are not updatable');
select throws_ok($$delete from public.ai_messages where id = 'aaaaaaaa-ffff-4000-8000-000000000001'$$,
  '42501', null, 'messages cannot be deleted directly');

-- ---------------------------------------------------------------------------
-- ai_usage_records: not writable by authenticated; RPCs are service-role only
-- ---------------------------------------------------------------------------
select throws_ok($$insert into public.ai_usage_records (user_id, feature, model) values ('aaaaaaaa-0000-4000-8000-000000000001', 'advisor_message', 'm')$$,
  '42501', null, 'authenticated cannot insert usage records');
select throws_ok($$update public.ai_usage_records set cost_usd_micros = 0$$, '42501', null, 'authenticated cannot update usage records');
select throws_ok($$delete from public.ai_usage_records$$, '42501', null, 'authenticated cannot delete usage records');
select throws_ok($$select public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', null, 'advisor_message', 1000, 25000000, 'm')$$,
  '42501', null, 'authenticated cannot call reserve_ai_usage');
select throws_ok($$select public.finalize_ai_usage(gen_random_uuid(), 'success', 0, 0, 0, null)$$,
  '42501', null, 'authenticated cannot call finalize_ai_usage');

-- ---------------------------------------------------------------------------
-- reserve_ai_usage / finalize_ai_usage (service role)
-- ---------------------------------------------------------------------------
select tests.clear_authentication();
select tests.authenticate_as_service_role();

insert into r select 'r1', public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'plan_generation', 2, 1500000, 'claude-opus-5-5');
insert into r select 'r2', public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'plan_generation', 2, 1500000, 'claude-opus-5-5');
select results_eq(
  $$ select status, feature, business_id, cost_usd_micros from public.ai_usage_records where id = (select id from r where name = 'r1') $$,
  $$ values ('reserved'::text, 'plan_generation'::text, 'aaaaaaaa-1111-4000-8000-000000000001'::uuid, 0::bigint) $$,
  'reserve inserts a reserved row'
);
select throws_ok($$select public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'plan_generation', 2, 1500000, 'claude-opus-5-5')$$,
  'P0001', 'quota_exceeded', 'the third call in a month exceeds a quota of 2 (reserved rows count)');

insert into r select 'r3', public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'advisor_message', 30, 1500000, 'claude-opus-5-5');
select isnt((select id from r where name = 'r3'), null, 'quotas are per feature');

select lives_ok($$select public.finalize_ai_usage((select id from r where name = 'r1'), 'error', 50, 0, 0, 'ai_unavailable')$$,
  'finalize marks a failed call');
select results_eq(
  $$ select status, input_tokens, error_code from public.ai_usage_records where id = (select id from r where name = 'r1') $$,
  $$ values ('error'::text, 50, 'ai_unavailable'::text) $$,
  'error row stores tokens and error code'
);
insert into r select 'r4', public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001', 'plan_generation', 2, 1500000, 'claude-opus-5-5');
select isnt((select id from r where name = 'r4'), null, 'error rows do not count toward the quota');
select throws_ok($$select public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', null, 'plan_generation', 2, 1500000, 'claude-opus-5-5')$$,
  'P0001', 'quota_exceeded', 'quota reached again with reserved + success rows');

select lives_ok($$select public.finalize_ai_usage((select id from r where name = 'r2'), 'success', 1000, 2000, 1500000, 'ignored on success')$$,
  'finalize records a successful call with its cost');
select results_eq(
  $$ select status, input_tokens, output_tokens, cost_usd_micros, error_code from public.ai_usage_records where id = (select id from r where name = 'r2') $$,
  $$ values ('success'::text, 1000, 2000, 1500000::bigint, null::text) $$,
  'success row stores usage and no error code'
);
select throws_ok($$select public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', null, 'advisor_message', 30, 1500000, 'claude-opus-5-5')$$,
  'P0001', 'cost_cap_reached', 'monthly cost cap applies across features');
insert into r select 'r5', public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', null, 'advisor_message', 30, 25000000, 'claude-opus-5-5');
select isnt((select id from r where name = 'r5'), null, 'a higher cap (pro) allows the call');

select throws_ok($$select public.finalize_ai_usage((select id from r where name = 'r2'), 'success', 0, 0, 0, null)$$,
  'P0001', 'conflict', 'a reservation can only be finalized once');
select throws_ok($$select public.finalize_ai_usage(gen_random_uuid(), 'success', 0, 0, 0, null)$$,
  'P0001', 'not_found', 'finalizing an unknown reservation fails');
select throws_ok($$select public.finalize_ai_usage((select id from r where name = 'r3'), 'reserved', 0, 0, 0, null)$$,
  'P0001', 'invalid_request', 'finalize only accepts success or error');
select throws_ok($$select public.finalize_ai_usage((select id from r where name = 'r3'), 'success', -1, 0, 0, null)$$,
  'P0001', 'invalid_request', 'finalize rejects negative token counts');
select throws_ok($$select public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', 'bbbbbbbb-1111-4000-8000-000000000002', 'advisor_message', 30, 25000000, 'claude-opus-5-5')$$,
  'P0001', 'forbidden', 'reserve rejects a business the user does not own');
select throws_ok($$select public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', null, 'image_generation', 30, 25000000, 'claude-opus-5-5')$$,
  'P0001', 'invalid_request', 'reserve rejects unknown features');

-- last month's usage does not count
select tests.clear_authentication();
insert into public.ai_usage_records (user_id, feature, model, status, cost_usd_micros, created_at)
values ('aaaaaaaa-0000-4000-8000-000000000001', 'finance_proposal', 'claude-opus-5-5', 'success', 30000000,
        public.ai_usage_month_start() - interval '1 day');
select tests.authenticate_as_service_role();
insert into r select 'r6', public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', null, 'finance_proposal', 1, 25000000, 'claude-opus-5-5');
select isnt((select id from r where name = 'r6'), null, 'previous-month usage and cost are not counted');

-- ---------------------------------------------------------------------------
-- ai_usage_summary (owner view of this month)
-- ---------------------------------------------------------------------------
select tests.clear_authentication();
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');
select results_eq(
  $$ select feature, used from public.ai_usage_summary() $$,
  $$ values ('plan_generation'::text, 2), ('section_regeneration', 0), ('roadmap_generation', 0), ('roadmap_recommendation', 0),
            ('advisor_message', 2), ('marketing_generation', 0), ('finance_proposal', 1) $$,
  'ai_usage_summary lists every feature with this month''s reserved+success count'
);
select is((select count(*)::int from public.ai_usage_records), 7, 'owner can read their own usage records');

-- deleting a business does not reset usage
select lives_ok($$delete from public.businesses where id = 'aaaaaaaa-1111-4000-8000-000000000001'$$, 'owner deletes the business');
select results_eq(
  $$ select count(*)::int, count(business_id)::int from public.ai_usage_records $$,
  $$ values (7, 0) $$,
  'usage records survive business deletion (business_id set null)'
);
select is((select count(*)::int from public.ai_messages), 0, 'conversation messages are deleted with the business');
select tests.clear_authentication();
select tests.authenticate_as_service_role();
select throws_ok($$select public.reserve_ai_usage('aaaaaaaa-0000-4000-8000-000000000001', null, 'plan_generation', 2, 25000000, 'claude-opus-5-5')$$,
  'P0001', 'quota_exceeded', 'quota still enforced after deleting the business');

select * from finish();
rollback;
