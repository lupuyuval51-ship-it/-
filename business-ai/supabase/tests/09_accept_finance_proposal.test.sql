-- "Accept all" for an AI finance proposal is all-or-nothing and idempotent.
begin;
\ir _helpers.psql

select plan(19);

select tests.create_user('aaaaaaaa-0000-4000-8000-000000000091', 'a9@example.test');
select tests.create_user('bbbbbbbb-0000-4000-8000-000000000092', 'b9@example.test');
insert into public.businesses (id, owner_id, name) values
  ('aaaaaaaa-1111-4000-8000-000000000091', 'aaaaaaaa-0000-4000-8000-000000000091', 'A business'),
  ('bbbbbbbb-1111-4000-8000-000000000092', 'bbbbbbbb-0000-4000-8000-000000000092', 'B business');

select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000091');

-- A failure in the LAST item (blank label violates the CHECK) must roll back everything before it,
-- including the starting capital.
select throws_ok($$select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091', '[
    {"kind":"startup","label":"Deck oven","category":"equipment","amount_minor":2500000,"source_ref":"proposal:s1"},
    {"kind":"expense","label":"Kitchen rent","category":"rent","monthly_amount_minor":450000,"source_ref":"proposal:e1"},
    {"kind":"revenue","label":"   ","unit_price_minor":2800,"unit_variable_cost_minor":900,"monthly_units":600,"monthly_growth_pct":5,"source_ref":"proposal:r1"}
  ]'::jsonb, 4000000)$$,
  '23514', null, 'an invalid item fails the whole acceptance');
select is((select count(*)::int from public.startup_costs where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 0,
  'no startup cost saved after the failure (rolled back)');
select is((select count(*)::int from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 0,
  'no expense saved after the failure (rolled back)');
select is((select count(*)::int from public.financial_models where business_id = 'aaaaaaaa-1111-4000-8000-000000000091' and starting_capital_minor <> 0), 0,
  'starting capital unchanged after the failure');

-- Accept all (valid): every line and the starting capital in one call.
select is(
  (select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091', '[
      {"kind":"startup","label":"Deck oven","category":"equipment","amount_minor":2500000,"source_ref":"proposal:s1"},
      {"kind":"expense","label":"Kitchen rent","category":"rent","monthly_amount_minor":450000,"source_ref":"proposal:e1"},
      {"kind":"revenue","label":"Sourdough loaf","unit_price_minor":2800,"unit_variable_cost_minor":900,"monthly_units":600.5,"monthly_growth_pct":5,"source_ref":"proposal:r1"}
    ]'::jsonb, 4000000)),
  '{"inserted": 3, "skipped": 0, "starting_capital_applied": true}'::jsonb, 'accept all saves every item');
select is((select count(*)::int from public.startup_costs where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 1, 'one startup cost');
select is((select count(*)::int from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 1, 'one expense');
select is((select monthly_units from public.revenue_streams where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 600.5::numeric, 'revenue stream values kept');
select is((select starting_capital_minor from public.financial_models where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 4000000::bigint,
  'starting capital applied in the same transaction');
select is((select string_agg(distinct basis, ',') from (
    select basis from public.startup_costs where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'
    union all select basis from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'
    union all select basis from public.revenue_streams where business_id = 'aaaaaaaa-1111-4000-8000-000000000091') b),
  'ai_estimate', 'every accepted line is labelled as an AI estimate');

-- Retry / second tap / second device: nothing is duplicated.
select is(
  (select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091', '[
      {"kind":"startup","label":"Deck oven","category":"equipment","amount_minor":2500000,"source_ref":"proposal:s1"},
      {"kind":"expense","label":"Kitchen rent","category":"rent","monthly_amount_minor":450000,"source_ref":"proposal:e1"}
    ]'::jsonb, null)),
  '{"inserted": 0, "skipped": 2, "starting_capital_applied": false}'::jsonb, 'accepting the same items again saves nothing');
select is((select count(*)::int from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 1, 'still one expense');

-- Validation.
select throws_ok($$select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091',
  '[{"kind":"expense","label":"No key","category":"","monthly_amount_minor":1}]'::jsonb, null)$$,
  'P0001', 'invalid_request', 'lines without a source_ref are refused');
select throws_ok($$select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091',
  '[{"kind":"loan","label":"X","source_ref":"proposal:x"}]'::jsonb, null)$$,
  'P0001', 'invalid_request', 'unknown line kinds are refused');
select throws_ok($$select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091', '[]'::jsonb, null)$$,
  'P0001', 'invalid_request', 'an empty acceptance is refused');
select throws_ok($$select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091',
  (select jsonb_agg(jsonb_build_object('kind','expense','label','L'||g,'category','','monthly_amount_minor',1,'source_ref','proposal:many'||g)) from generate_series(1, 51) g), null)$$,
  'P0001', 'invalid_request', 'more than 50 lines are refused');

-- Isolation.
select tests.authenticate_as('bbbbbbbb-0000-4000-8000-000000000092');
select throws_ok($$select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091',
  '[{"kind":"expense","label":"Intruder","category":"","monthly_amount_minor":1,"source_ref":"proposal:evil"}]'::jsonb, 1)$$,
  'P0001', 'not_found', 'another user cannot accept into someone else''s business');
select tests.clear_authentication();
select is((select count(*)::int from public.recurring_expenses where business_id = 'aaaaaaaa-1111-4000-8000-000000000091'), 1,
  'the other user''s attempt wrote nothing');

select tests.authenticate_as_anon();
select throws_ok($$select public.accept_finance_proposal('aaaaaaaa-1111-4000-8000-000000000091', '[]'::jsonb, 1)$$,
  '42501', null, 'anon cannot execute accept_finance_proposal');

select * from finish();
rollback;
