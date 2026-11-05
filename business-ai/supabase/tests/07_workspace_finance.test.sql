-- Column rules for onboarding, finance and workspace tables (owner perspective).
begin;
\ir _helpers.psql

select plan(29);

select tests.create_user('aaaaaaaa-0000-4000-8000-000000000001', 'a@example.test');
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');
insert into public.businesses (id, name, country_code) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Cafe', 'IL');

-- ---------------------------------------------------------------------------
-- onboarding_responses
-- ---------------------------------------------------------------------------
select lives_ok($$insert into public.onboarding_responses (business_id, question_key, value)
  values ('aaaaaaaa-1111-4000-8000-000000000001', 'business_idea', '{"idea": "Neighbourhood specialty coffee cart"}')
  on conflict (business_id, question_key) do update set value = excluded.value, skipped = excluded.skipped$$,
  'onboarding answer upsert (insert)');
select lives_ok($$insert into public.onboarding_responses (business_id, question_key, value)
  values ('aaaaaaaa-1111-4000-8000-000000000001', 'business_idea', '{"idea": "Coffee cart near the train station"}')
  on conflict (business_id, question_key) do update set value = excluded.value, skipped = excluded.skipped$$,
  'onboarding answer upsert (update)');
select is((select count(*)::int from public.onboarding_responses), 1, 'one row per question');
select lives_ok($$insert into public.onboarding_responses (business_id, question_key, skipped) values ('aaaaaaaa-1111-4000-8000-000000000001', 'weekly_hours', true)$$,
  'a skipped question may have no value');
select throws_ok($$insert into public.onboarding_responses (business_id, question_key) values ('aaaaaaaa-1111-4000-8000-000000000001', 'experience')$$,
  '23514', null, 'an answered question needs a value');
select throws_ok($$insert into public.onboarding_responses (business_id, question_key, value) values ('aaaaaaaa-1111-4000-8000-000000000001', 'favourite_colour', '{}')$$,
  '23514', null, 'unknown question key rejected');

-- ---------------------------------------------------------------------------
-- finance
-- ---------------------------------------------------------------------------
select throws_ok($$insert into public.startup_costs (business_id, label, amount_minor) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Espresso machine', -1)$$,
  '23514', null, 'negative startup cost rejected');
select throws_ok($$insert into public.startup_costs (business_id, label, amount_minor) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Too much', 10000000000001)$$,
  '23514', null, 'amounts above 1e13 minor units rejected (JS-safe sums)');
select throws_ok($$insert into public.startup_costs (business_id, label, basis) values ('aaaaaaaa-1111-4000-8000-000000000001', 'x', 'guess')$$,
  '23514', null, 'unknown basis rejected');
select lives_ok($$insert into public.startup_costs (business_id, label, amount_minor, category, basis) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Espresso machine', 1250000, 'equipment', 'ai_estimate')$$,
  'valid startup cost accepted');
select throws_ok($$insert into public.recurring_expenses (business_id, label, monthly_amount_minor) values ('aaaaaaaa-1111-4000-8000-000000000001', '', 100)$$,
  '23514', null, 'empty expense label rejected');
select throws_ok($$insert into public.revenue_streams (business_id, label, monthly_growth_pct) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Coffee', -101)$$,
  '23514', null, 'growth below -100% rejected');
select throws_ok($$insert into public.revenue_streams (business_id, label, monthly_growth_pct) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Coffee', 1000.01)$$,
  '23514', null, 'growth above 1000% rejected');
select lives_ok($$insert into public.revenue_streams (business_id, label, unit_price_minor, unit_variable_cost_minor, monthly_units, monthly_growth_pct)
  values ('aaaaaaaa-1111-4000-8000-000000000001', 'Coffee', 1500, 400, 1200.5, 3.25)$$,
  'valid revenue stream with fractional units and growth accepted');
select throws_ok($$insert into public.transactions (business_id, kind, amount_minor) values ('aaaaaaaa-1111-4000-8000-000000000001', 'income', 0)$$,
  '23514', null, 'zero transaction rejected (amount must be > 0)');
select throws_ok($$insert into public.transactions (business_id, kind, amount_minor) values ('aaaaaaaa-1111-4000-8000-000000000001', 'refund', 10)$$,
  '23514', null, 'unknown transaction kind rejected');
select throws_ok($$insert into public.business_goals (business_id, title, metric, target_value) values ('aaaaaaaa-1111-4000-8000-000000000001', 'Grow', 'followers', 10)$$,
  '23514', null, 'unknown goal metric rejected');
select throws_ok($$update public.startup_costs set business_id = gen_random_uuid()$$,
  'P0001', 'immutable_column', 'finance rows cannot move to another business');

-- ---------------------------------------------------------------------------
-- marketing_assets
-- ---------------------------------------------------------------------------
select lives_ok($$insert into public.marketing_assets (business_id, kind, title, content, origin) values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'content_calendar', 'Launch month',
   '{"summary": "Four weeks", "items": [{"id": "w1", "heading": "Week 1", "body": "Teasers", "label": "Instagram"}, {"id": "w2", "heading": "Week 2", "body": "Opening"}]}', 'ai')$$,
  'valid marketing asset accepted');
select lives_ok($$insert into public.marketing_assets (business_id, kind, title) values ('aaaaaaaa-1111-4000-8000-000000000001', 'positioning', 'Draft')$$,
  'content defaults to an empty editable document');
select throws_ok($$insert into public.marketing_assets (business_id, kind, title, content) values ('aaaaaaaa-1111-4000-8000-000000000001', 'taglines', 'x', '{"summary": "", "items": [{"heading": "no id", "body": ""}]}')$$,
  '23514', null, 'marketing item without id rejected');
select throws_ok($$insert into public.marketing_assets (business_id, kind, title, content) values ('aaaaaaaa-1111-4000-8000-000000000001', 'taglines', 'x', '{"summary": "", "items": [{"id": "i", "heading": "h", "body": "b", "label": 5}]}')$$,
  '23514', null, 'non-string label rejected');
select throws_ok($$insert into public.marketing_assets (business_id, kind, title) values ('aaaaaaaa-1111-4000-8000-000000000001', 'billboards', 'x')$$,
  '23514', null, 'unknown marketing kind rejected');

-- ---------------------------------------------------------------------------
-- launch_checklist_items
-- ---------------------------------------------------------------------------
select lives_ok($$insert into public.launch_checklist_items (business_id, template_key, category, title, source_name, source_url)
  values ('aaaaaaaa-1111-4000-8000-000000000001', 'il.vat_registration', 'tax', 'Register for VAT', 'Israel Tax Authority', 'https://www.gov.il/he/departments/israel_tax_authority')
  on conflict (business_id, template_key) do nothing$$,
  'template item insert (upsert target business_id, template_key)');
select throws_ok($$insert into public.launch_checklist_items (business_id, template_key, category, title) values ('aaaaaaaa-1111-4000-8000-000000000001', 'il.vat_registration', 'tax', 'Duplicate')$$,
  '23505', null, 'template_key is unique per business');
select lives_ok($$insert into public.launch_checklist_items (business_id, category, title) values
  ('aaaaaaaa-1111-4000-8000-000000000001', 'other', 'Custom item one'),
  ('aaaaaaaa-1111-4000-8000-000000000001', 'other', 'Custom item two')$$,
  'many custom items (template_key null) are allowed');
select throws_ok($$insert into public.launch_checklist_items (business_id, category, title, source_url) values ('aaaaaaaa-1111-4000-8000-000000000001', 'other', 'x', 'javascript:alert(1)')$$,
  '23514', null, 'source_url must be http(s)');
select throws_ok($$insert into public.launch_checklist_items (business_id, category, title, status) values ('aaaaaaaa-1111-4000-8000-000000000001', 'other', 'x', 'skipped')$$,
  '23514', null, 'unknown checklist status rejected');
select is(tests.row_count($$update public.launch_checklist_items set status = 'not_applicable', notes = 'Exempt' where template_key = 'il.vat_registration'$$), 1,
  'owner updates checklist status and notes');

select * from finish();
rollback;
