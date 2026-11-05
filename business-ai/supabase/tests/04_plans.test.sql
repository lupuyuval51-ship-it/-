-- Plan versions: lifecycle, immutability, copy-on-write save_plan_section,
-- restore_plan_version. Everything runs with the owner's JWT, exactly like the
-- app and the plan.generate edge function.
begin;
\ir _helpers.psql

select plan(57);

select tests.create_user('aaaaaaaa-0000-4000-8000-000000000001', 'a@example.test');
-- version ids returned by the RPCs, by name
create temp table v (name text primary key, id uuid) on commit drop;
grant all on v to public;

select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');

insert into public.businesses (id, name) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Bakery');
insert into public.business_plans (id, business_id) values ('aaaaaaaa-3333-4000-8000-000000000001', 'aaaaaaaa-1111-4000-8000-000000000001');

select is((public.ensure_business_plan('aaaaaaaa-1111-4000-8000-000000000001')).id, 'aaaaaaaa-3333-4000-8000-000000000001'::uuid,
  'ensure_business_plan returns the existing plan');

-- ---------------------------------------------------------------------------
-- Version lifecycle (what plan.generate does with the user JWT)
-- ---------------------------------------------------------------------------
insert into public.plan_versions (id, plan_id, origin, model, version_number)
values ('aaaaaaaa-4444-4000-8000-000000000001', 'aaaaaaaa-3333-4000-8000-000000000001', 'ai_generated', 'claude-opus-5-5', 99);

select results_eq(
  $$ select version_number, status, created_by from public.plan_versions where id = 'aaaaaaaa-4444-4000-8000-000000000001' $$,
  $$ values (1, 'generating'::text, 'aaaaaaaa-0000-4000-8000-000000000001'::uuid) $$,
  'a new version gets number 1 (supplied value ignored), status generating, created_by = caller'
);
select throws_ok($$insert into public.plan_versions (plan_id, origin, status) values ('aaaaaaaa-3333-4000-8000-000000000001', 'ai_generated', 'ready')$$,
  'P0001', 'invalid_request', 'a version cannot be created as ready');
select throws_ok($$update public.plan_versions set status = 'ready' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'P0001', 'precondition_failed', 'a version without sections cannot become ready');
select throws_ok($$update public.business_plans set current_version_id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'P0001', 'invalid_request', 'current_version_id cannot point at a generating version');

-- write all 15 sections into the generating version
select lives_ok($$
  insert into public.plan_sections (plan_version_id, section_key, content, origin)
  select 'aaaaaaaa-4444-4000-8000-000000000001', k,
         jsonb_build_object('summary', 'Summary ' || k,
                            'blocks', jsonb_build_array(jsonb_build_object('id', 'b1', 'text', 'Text ' || k, 'basis', 'ai_estimate'))),
         'ai'
  from unnest(array['executive_summary', 'business_concept', 'value_proposition', 'target_audience', 'customer_personas',
                    'market_validation', 'competitive_positioning', 'revenue_model', 'pricing_strategy', 'startup_costs',
                    'operating_expenses', 'marketing_strategy', 'launch_strategy', 'risks_assumptions', 'roadmap_30_60_90']) as k
$$, 'owner writes sections into a generating version');

-- content validation (mirror of PlanSectionContentSchema)
select throws_ok($$update public.plan_sections set content = '{"summary": "x", "blocks": []}' where section_key = 'business_concept'$$,
  '23514', null, 'content with no blocks rejected');
select throws_ok($$update public.plan_sections set content = '{"blocks": [{"id": "b1", "text": "t", "basis": "assumption"}]}' where section_key = 'business_concept'$$,
  '23514', null, 'content without summary rejected');
select throws_ok($$update public.plan_sections set content = '{"summary": "", "blocks": [{"id": "b1", "text": "t", "basis": "guess"}]}' where section_key = 'business_concept'$$,
  '23514', null, 'unknown basis rejected');
select throws_ok($$update public.plan_sections set content = '{"summary": "", "blocks": [{"id": "b1", "text": "t", "basis": "verified"}]}' where section_key = 'business_concept'$$,
  '23514', null, 'verified block without a source rejected');
select throws_ok($$update public.plan_sections set content = '{"summary": "", "blocks": [{"id": "b1", "text": "t", "basis": "verified", "source": {"title": "x", "url": "javascript:alert(1)"}}]}' where section_key = 'business_concept'$$,
  '23514', null, 'non-http source url rejected');
select throws_ok($$update public.plan_sections set content = '{"summary": "", "blocks": [{"id": "b1", "text": "a", "basis": "assumption"}, {"id": "b1", "text": "b", "basis": "assumption"}]}' where section_key = 'business_concept'$$,
  '23514', null, 'duplicate block ids rejected');
select throws_ok($$update public.plan_sections set content = '{"summary": "", "blocks": [{"id": "b1", "text": "   ", "basis": "assumption"}]}' where section_key = 'business_concept'$$,
  '23514', null, 'blank block text rejected');
select lives_ok($$
  insert into public.plan_sections (plan_version_id, section_key, content, origin)
  values ('aaaaaaaa-4444-4000-8000-000000000001', 'business_concept',
          '{"summary": "Concept", "blocks": [{"id": "b1", "text": "Verified fact", "basis": "verified", "source": {"title": "Gov", "url": "https://www.gov.il/"}}, {"id": "b2", "text": "Note", "basis": "user_provided", "source": null}]}',
          'ai')
  on conflict (plan_version_id, section_key) do update set content = excluded.content, origin = excluded.origin
$$, 'upsert of a valid section (verified with source) while generating');
select throws_ok($$update public.plan_sections set section_key = 'revenue_model' where section_key = 'business_concept'$$,
  'P0001', 'immutable_column', 'section_key of a section cannot be changed');

select lives_ok($$update public.plan_versions set status = 'ready', finance_proposal = '{"notes": "estimate"}' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'generating version with sections becomes ready');
select lives_ok($$update public.business_plans set current_version_id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'current_version_id can point at the ready version');

-- ---------------------------------------------------------------------------
-- Ready versions are immutable
-- ---------------------------------------------------------------------------
select throws_ok($$update public.plan_sections set content = '{"summary": "x", "blocks": [{"id": "b1", "text": "t", "basis": "assumption"}]}' where plan_version_id = 'aaaaaaaa-4444-4000-8000-000000000001' and section_key = 'pricing_strategy'$$,
  'P0001', 'plan_version_immutable', 'sections of a ready version cannot be updated');
select throws_ok($$delete from public.plan_sections where plan_version_id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  '42501', null, 'sections cannot be deleted by users');
select throws_ok($$insert into public.plan_sections (plan_version_id, section_key, content, origin) values ('aaaaaaaa-4444-4000-8000-000000000001', 'executive_summary', '{"summary": "", "blocks": [{"id": "x", "text": "t", "basis": "assumption"}]}', 'user')$$,
  'P0001', 'plan_version_immutable', 'no section can be added to a ready version');
select throws_ok($$update public.plan_versions set status = 'failed' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'P0001', 'plan_version_immutable', 'a ready version cannot become failed');
select throws_ok($$update public.plan_versions set status = 'generating' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'P0001', 'plan_version_immutable', 'a ready version cannot go back to generating');
select throws_ok($$update public.plan_versions set change_note = 'edited' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'P0001', 'plan_version_immutable', 'metadata of a ready version cannot change');
select throws_ok($$update public.plan_versions set origin = 'user_edit' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  '42501', null, 'origin is not updatable by users');
select throws_ok($$delete from public.plan_versions where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  '42501', null, 'versions cannot be deleted by users');
select lives_ok($$update public.plan_versions set finance_proposal = '{"notes": "updated estimate"}' where id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'finance_proposal can still be attached to a ready version');

-- even the service role cannot rewrite a ready version's sections
select tests.clear_authentication();
select tests.authenticate_as_service_role();
select throws_ok($$delete from public.plan_sections where plan_version_id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'P0001', 'plan_version_immutable', 'service role cannot delete sections of a ready version');
select throws_ok($$update public.plan_sections set origin = 'user' where plan_version_id = 'aaaaaaaa-4444-4000-8000-000000000001'$$,
  'P0001', 'plan_version_immutable', 'service role cannot update sections of a ready version');
select tests.clear_authentication();
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');

-- ---------------------------------------------------------------------------
-- save_plan_section: copy-on-write
-- ---------------------------------------------------------------------------
insert into v
select 'v2', public.save_plan_section(
  'aaaaaaaa-1111-4000-8000-000000000001', 'pricing_strategy',
  '{"summary": "New pricing", "blocks": [{"id": "p1", "text": "Price at 18 ILS", "basis": "user_provided"}]}',
  'user', 'Adjusted price');

select results_eq(
  $$ select version_number, origin, status, based_on_version_id, change_note, created_by, finance_proposal
     from public.plan_versions where id = (select id from v where name = 'v2') $$,
  $$ values (2, 'user_edit'::text, 'ready'::text, 'aaaaaaaa-4444-4000-8000-000000000001'::uuid, 'Adjusted price'::text,
             'aaaaaaaa-0000-4000-8000-000000000001'::uuid, '{"notes": "updated estimate"}'::jsonb) $$,
  'save_plan_section creates ready version 2 (user_edit, based on v1, note, finance proposal carried over)'
);
select is((select current_version_id from public.business_plans), (select id from v where name = 'v2'),
  'current_version_id moved to the new version');
select is((select count(*)::int from public.plan_sections where plan_version_id = (select id from v where name = 'v2')), 15,
  'new version has all 15 sections');
select results_eq(
  $$ select content, origin from public.plan_sections where plan_version_id = (select id from v where name = 'v2') and section_key = 'pricing_strategy' $$,
  $$ values ('{"summary": "New pricing", "blocks": [{"id": "p1", "text": "Price at 18 ILS", "basis": "user_provided"}]}'::jsonb, 'user'::text) $$,
  'the edited section holds the new content with origin user'
);
select set_eq(
  $$ select section_key, content, origin from public.plan_sections where plan_version_id = (select id from v where name = 'v2') and section_key <> 'pricing_strategy' $$,
  $$ select section_key, content, origin from public.plan_sections where plan_version_id = 'aaaaaaaa-4444-4000-8000-000000000001' and section_key <> 'pricing_strategy' $$,
  'all other sections were copied unchanged'
);
select is((select content ->> 'summary' from public.plan_sections where plan_version_id = 'aaaaaaaa-4444-4000-8000-000000000001' and section_key = 'pricing_strategy'),
  'Summary pricing_strategy', 'the old version still has the old content');
select results_eq(
  $$ select status, version_number, (select count(*)::int from public.plan_sections s where s.plan_version_id = pv.id)
     from public.plan_versions pv where pv.id = 'aaaaaaaa-4444-4000-8000-000000000001' $$,
  $$ values ('ready'::text, 1, 15) $$,
  'the old version is otherwise unchanged'
);

insert into v
select 'v3', public.save_plan_section(
  'aaaaaaaa-1111-4000-8000-000000000001', 'risks_assumptions',
  '{"summary": "Regenerated", "blocks": [{"id": "r1", "text": "Seasonality risk", "basis": "assumption"}]}',
  'ai');
select results_eq(
  $$ select pv.version_number, pv.origin, s.origin, pv.based_on_version_id
     from public.plan_versions pv join public.plan_sections s on s.plan_version_id = pv.id and s.section_key = 'risks_assumptions'
     where pv.id = (select id from v where name = 'v3') $$,
  $$ select 3, 'ai_section'::text, 'ai'::text, (select id from v where name = 'v2') $$,
  'p_origin ai creates an ai_section version with an ai section, based on the previous current version'
);
select is((select content ->> 'summary' from public.plan_sections where plan_version_id = (select id from v where name = 'v3') and section_key = 'pricing_strategy'),
  'New pricing', 'copy-on-write builds on the current version (earlier edit kept)');

select throws_ok($$select public.save_plan_section('aaaaaaaa-1111-4000-8000-000000000001', 'pricing_strategy', '{"summary": "x", "blocks": []}')$$,
  'P0001', 'invalid_request', 'save_plan_section validates content shape');
select throws_ok($$select public.save_plan_section('aaaaaaaa-1111-4000-8000-000000000001', 'appendix', '{"summary": "x", "blocks": [{"id": "b", "text": "t", "basis": "assumption"}]}')$$,
  'P0001', 'invalid_request', 'save_plan_section rejects unknown section keys');
select throws_ok($$select public.save_plan_section('aaaaaaaa-1111-4000-8000-000000000001', 'pricing_strategy', '{"summary": "x", "blocks": [{"id": "b", "text": "t", "basis": "assumption"}]}', 'advisor')$$,
  'P0001', 'invalid_request', 'save_plan_section rejects unknown origins');
select throws_ok($$select public.save_plan_section('cccccccc-1111-4000-8000-000000000009', 'pricing_strategy', '{"summary": "x", "blocks": [{"id": "b", "text": "t", "basis": "assumption"}]}')$$,
  'P0001', 'not_found', 'save_plan_section on a business without a plan fails with not_found');

-- ---------------------------------------------------------------------------
-- restore_plan_version
-- ---------------------------------------------------------------------------
insert into v select 'v4', public.restore_plan_version('aaaaaaaa-4444-4000-8000-000000000001');

select results_eq(
  $$ select version_number, origin, status, based_on_version_id, model from public.plan_versions where id = (select id from v where name = 'v4') $$,
  $$ values (4, 'restored'::text, 'ready'::text, 'aaaaaaaa-4444-4000-8000-000000000001'::uuid, 'claude-opus-5-5'::text) $$,
  'restore creates version 4 (restored, based on v1)'
);
select set_eq(
  $$ select section_key, content, origin from public.plan_sections where plan_version_id = (select id from v where name = 'v4') $$,
  $$ select section_key, content, origin from public.plan_sections where plan_version_id = 'aaaaaaaa-4444-4000-8000-000000000001' $$,
  'the restored version is an exact copy of v1'
);
select is((select current_version_id from public.business_plans), (select id from v where name = 'v4'),
  'restore moves current_version_id');
select is((select count(*)::int from public.plan_sections where plan_version_id = (select id from v where name = 'v3')), 15,
  'restoring leaves later versions intact');

-- failed versions
insert into public.plan_versions (id, plan_id, origin) values ('aaaaaaaa-4444-4000-8000-000000000005', 'aaaaaaaa-3333-4000-8000-000000000001', 'ai_generated');
select lives_ok($$update public.plan_versions set status = 'failed', error_code = 'ai_unavailable' where id = 'aaaaaaaa-4444-4000-8000-000000000005'$$,
  'a generating version can be marked failed with an error code');
select throws_ok($$update public.plan_versions set status = 'ready' where id = 'aaaaaaaa-4444-4000-8000-000000000005'$$,
  'P0001', 'plan_version_immutable', 'a failed version is terminal');
select throws_ok($$select public.restore_plan_version('aaaaaaaa-4444-4000-8000-000000000005')$$,
  'P0001', 'precondition_failed', 'a failed version cannot be restored');
select throws_ok($$update public.business_plans set current_version_id = 'aaaaaaaa-4444-4000-8000-000000000005'$$,
  'P0001', 'invalid_request', 'current_version_id cannot point at a failed version');
select throws_ok($$select public.restore_plan_version('cccccccc-4444-4000-8000-000000000009')$$,
  'P0001', 'not_found', 'restoring an unknown version fails with not_found');

select is(
  (select array_agg(version_number order by version_number) from public.plan_versions),
  array[1, 2, 3, 4, 5],
  'version numbers are sequential per plan'
);

-- no current version -> save fails
update public.business_plans set current_version_id = null;
select throws_ok($$select public.save_plan_section('aaaaaaaa-1111-4000-8000-000000000001', 'pricing_strategy', '{"summary": "x", "blocks": [{"id": "b", "text": "t", "basis": "assumption"}]}')$$,
  'P0001', 'precondition_failed', 'save_plan_section fails when there is no ready current version');

-- ---------------------------------------------------------------------------
-- Deleting the business removes the whole plan history (cascade is allowed)
-- ---------------------------------------------------------------------------
select lives_ok($$delete from public.businesses where id = 'aaaaaaaa-1111-4000-8000-000000000001'$$,
  'owner can delete a business that has ready plan versions');
select tests.clear_authentication();
select is((select count(*)::int from public.plan_versions), 0, 'plan versions cascade-deleted');
select is((select count(*)::int from public.plan_sections), 0, 'plan sections cascade-deleted');

-- Account deletion (auth.users) with a ready, current plan also cascades cleanly
-- (created_by set-null and section deletes must not trip the immutability guards).
select tests.create_user('cccccccc-0000-4000-8000-000000000003', 'c@example.test');
select tests.authenticate_as('cccccccc-0000-4000-8000-000000000003');
insert into public.businesses (id, name) values ('cccccccc-1111-4000-8000-000000000003', 'C business');
select public.ensure_business_plan('cccccccc-1111-4000-8000-000000000003');
insert into public.plan_versions (id, plan_id, origin)
select 'cccccccc-4444-4000-8000-000000000003', id, 'ai_generated' from public.business_plans
where business_id = 'cccccccc-1111-4000-8000-000000000003';
insert into public.plan_sections (plan_version_id, section_key, content, origin)
values ('cccccccc-4444-4000-8000-000000000003', 'executive_summary', '{"summary": "", "blocks": [{"id": "b", "text": "t", "basis": "assumption"}]}', 'ai');
update public.plan_versions set status = 'ready' where id = 'cccccccc-4444-4000-8000-000000000003';
update public.business_plans set current_version_id = 'cccccccc-4444-4000-8000-000000000003';
update public.profiles set active_business_id = 'cccccccc-1111-4000-8000-000000000003';
insert into public.ai_conversations (business_id) values ('cccccccc-1111-4000-8000-000000000003');
insert into public.tasks (business_id, title, status) values ('cccccccc-1111-4000-8000-000000000003', 'Done task', 'done');
select tests.clear_authentication();
insert into public.ai_usage_records (user_id, business_id, feature, model)
values ('cccccccc-0000-4000-8000-000000000003', 'cccccccc-1111-4000-8000-000000000003', 'plan_generation', 'claude-opus-5-5');
select lives_ok($$delete from auth.users where id = 'cccccccc-0000-4000-8000-000000000003'$$,
  'deleting an account with a ready current plan succeeds');
select results_eq(
  $$ select (select count(*)::int from public.plan_sections) + (select count(*)::int from public.plan_versions)
          + (select count(*)::int from public.businesses) + (select count(*)::int from public.profiles where id = 'cccccccc-0000-4000-8000-000000000003')
          + (select count(*)::int from public.ai_usage_records) + (select count(*)::int from public.ai_conversations) $$,
  $$ values (0) $$,
  'account deletion removes all of the user''s rows'
);

select * from finish();
rollback;
