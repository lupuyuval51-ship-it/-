-- Signup trigger, entitlements, tier resolution, max-business and forecast caps,
-- profile rules, business immutability.
begin;
\ir _helpers.psql

select plan(43);

-- ---------------------------------------------------------------------------
-- handle_new_user
-- ---------------------------------------------------------------------------
select tests.create_user('aaaaaaaa-0000-4000-8000-000000000001', 'a@example.test',
  '{"locale": "en", "display_name": "  Dana Levi  "}');
select tests.create_user('bbbbbbbb-0000-4000-8000-000000000002', 'b@example.test', '{"locale": "fr"}');
select tests.create_user('cccccccc-0000-4000-8000-000000000003', 'c@example.test');

select results_eq(
  $$ select locale, display_name, theme, active_business_id from public.profiles where id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values ('en'::text, 'Dana Levi'::text, 'system'::text, null::uuid) $$,
  'signup creates a profile with locale/display_name from metadata (trimmed)'
);
select is((select locale from public.profiles where id = 'bbbbbbbb-0000-4000-8000-000000000002'), 'he',
  'unsupported locale falls back to he');
select is((select display_name from public.profiles where id = 'cccccccc-0000-4000-8000-000000000003'), null,
  'missing display_name stays null');
select results_eq(
  $$ select tier, status, source, current_period_end from public.subscription_entitlements where user_id = 'aaaaaaaa-0000-4000-8000-000000000001' $$,
  $$ values ('free'::text, 'active'::text, 'default'::text, null::timestamptz) $$,
  'signup creates a free/active/default entitlement'
);
select is(public.current_tier('aaaaaaaa-0000-4000-8000-000000000001'), 'free', 'new users are free');

-- ---------------------------------------------------------------------------
-- Entitlements are read-only for authenticated
-- ---------------------------------------------------------------------------
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');

select is((select tier from public.subscription_entitlements), 'free', 'user reads own entitlement');
select throws_ok($$update public.subscription_entitlements set tier = 'pro'$$, '42501', null,
  'user cannot upgrade themselves');
select throws_ok($$insert into public.subscription_entitlements (user_id, tier) values ('aaaaaaaa-0000-4000-8000-000000000001', 'pro')$$,
  '42501', null, 'user cannot insert an entitlement');
select throws_ok($$delete from public.subscription_entitlements$$, '42501', null, 'user cannot delete an entitlement');
select is(public.current_tier(), 'free', 'current_tier() defaults to the caller');

-- ---------------------------------------------------------------------------
-- Max non-archived businesses (free = 1)
-- ---------------------------------------------------------------------------
select lives_ok($$insert into public.businesses (id, name) values ('aaaaaaaa-1111-4000-8000-000000000001', 'First')$$,
  'free user can create the first business');
select is((select owner_id from public.businesses where id = 'aaaaaaaa-1111-4000-8000-000000000001'),
  'aaaaaaaa-0000-4000-8000-000000000001'::uuid, 'owner_id defaults to auth.uid()');
select throws_ok($$insert into public.businesses (name) values ('Second')$$, 'P0001', 'business_limit_reached',
  'free user cannot create a second active business');
select lives_ok($$insert into public.businesses (id, name, archived_at) values ('aaaaaaaa-1111-4000-8000-000000000002', 'Archived', now())$$,
  'an archived business does not count against the limit');
select throws_ok($$update public.businesses set archived_at = null where id = 'aaaaaaaa-1111-4000-8000-000000000002'$$,
  'P0001', 'business_limit_reached', 'unarchiving beyond the limit is rejected');
select lives_ok($$update public.businesses set archived_at = now() where id = 'aaaaaaaa-1111-4000-8000-000000000001'$$,
  'archiving the active business works');
select lives_ok($$update public.businesses set archived_at = null where id = 'aaaaaaaa-1111-4000-8000-000000000002'$$,
  'unarchiving is allowed once under the limit');
select lives_ok($$update public.businesses set name = 'Renamed', stage = 'planning' where id = 'aaaaaaaa-1111-4000-8000-000000000002'$$,
  'ordinary updates of an active business are not affected by the limit');

-- owner_id / id are immutable
select throws_ok($$update public.businesses set owner_id = 'bbbbbbbb-0000-4000-8000-000000000002' where id = 'aaaaaaaa-1111-4000-8000-000000000002'$$,
  'P0001', 'immutable_column', 'owner_id cannot be changed by update');

-- column checks
select throws_ok($$insert into public.businesses (name, archived_at) values ('', now())$$, '23514', null, 'empty business name rejected');
select throws_ok($$insert into public.businesses (name, archived_at, currency) values ('x', now(), 'ils')$$, '23514', null, 'lower-case currency rejected');
select throws_ok($$insert into public.businesses (name, archived_at, stage) values ('x', now(), 'unicorn')$$, '23514', null, 'unknown stage rejected');

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
select lives_ok($$update public.profiles set locale = 'he', theme = 'dark', active_business_id = 'aaaaaaaa-1111-4000-8000-000000000002'$$,
  'user updates own preferences and active business');
select throws_ok($$update public.profiles set locale = 'de'$$, '23514', null, 'unsupported locale rejected');
select throws_ok($$update public.profiles set id = 'bbbbbbbb-0000-4000-8000-000000000002'$$, '42501', null, 'profile id is not updatable');

-- ---------------------------------------------------------------------------
-- Forecast horizon (free = 12 months)
-- ---------------------------------------------------------------------------
select throws_ok($$insert into public.financial_models (business_id, forecast_months) values ('aaaaaaaa-1111-4000-8000-000000000002', 24)$$,
  'P0001', 'forecast_limit_exceeded', 'free user cannot create a 24-month forecast');
select results_eq(
  $$ select business_id, forecast_months, starting_capital_minor, conservative_volume_pct, conservative_price_pct,
            conservative_cost_pct, optimistic_volume_pct, optimistic_price_pct, optimistic_cost_pct
     from public.ensure_financial_model('aaaaaaaa-1111-4000-8000-000000000002') $$,
  $$ values ('aaaaaaaa-1111-4000-8000-000000000002'::uuid, 12, 0::bigint, 70, 100, 110, 130, 100, 95) $$,
  'ensure_financial_model inserts the documented defaults'
);
select lives_ok($$select public.ensure_financial_model('aaaaaaaa-1111-4000-8000-000000000002')$$,
  'ensure_financial_model is idempotent');
select is((select count(*)::int from public.financial_models), 1, 'still exactly one financial model');
select throws_ok($$update public.financial_models set forecast_months = 13$$, 'P0001', 'forecast_limit_exceeded',
  'free user cannot extend the forecast beyond 12 months');
select lives_ok($$update public.financial_models set forecast_months = 6, starting_capital_minor = 1000000$$,
  'free user can shorten the forecast');

-- ---------------------------------------------------------------------------
-- Upgrade to pro (service role) -> higher limits
-- ---------------------------------------------------------------------------
select tests.clear_authentication();
select tests.authenticate_as_service_role();
select lives_ok($$update public.subscription_entitlements set tier = 'pro', source = 'manual', current_period_end = now() + interval '30 days'
                  where user_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  'service role can upgrade a user');
select tests.clear_authentication();
select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');

select is(public.current_tier(), 'pro', 'active pro entitlement resolves to pro');
select lives_ok($$insert into public.businesses (name) values ('Pro two'), ('Pro three')$$,
  'pro user can have more than one active business');
select is((select count(*)::int from public.businesses where archived_at is null), 3, 'three active businesses for pro');
select lives_ok($$update public.financial_models set forecast_months = 36$$, 'pro user can forecast 36 months');
select throws_ok($$update public.financial_models set forecast_months = 37$$, 'P0001', 'forecast_limit_exceeded',
  'pro user cannot exceed 36 months (trigger; CHECK 1..36 is the backstop)');

-- other users cannot see the upgrade
select tests.clear_authentication();
select tests.authenticate_as('bbbbbbbb-0000-4000-8000-000000000002');
select is(public.current_tier('aaaaaaaa-0000-4000-8000-000000000001'), 'free', 'another user cannot read A''s tier');

-- ---------------------------------------------------------------------------
-- Expiry / cancellation -> back to free limits
-- ---------------------------------------------------------------------------
select tests.clear_authentication();
update public.subscription_entitlements set current_period_end = now() - interval '1 day'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(public.current_tier('aaaaaaaa-0000-4000-8000-000000000001'), 'free', 'pro past current_period_end is free');
update public.subscription_entitlements set current_period_end = null, status = 'canceled'
where user_id = 'aaaaaaaa-0000-4000-8000-000000000001';
select is(public.current_tier('aaaaaaaa-0000-4000-8000-000000000001'), 'free', 'canceled pro is free');

select tests.authenticate_as('aaaaaaaa-0000-4000-8000-000000000001');
select throws_ok($$insert into public.businesses (name) values ('Over limit')$$, 'P0001', 'business_limit_reached',
  'after downgrade no new business can be created');
select lives_ok($$update public.financial_models set forecast_months = 24$$,
  'after downgrade an existing longer horizon may be shortened');
select throws_ok($$update public.financial_models set forecast_months = 30$$, 'P0001', 'forecast_limit_exceeded',
  'after downgrade the horizon cannot be extended');

select * from finish();
rollback;
