# BUSINESS AI — Data model

Source of truth: `supabase/migrations/*.sql` (this document summarises them; ARCHITECTURE.md §4 is the contract).
Generated TS types: `supabase/functions/_shared/database.types.ts` (`npm run db:types`, imported in the app as `@db`).

| Migration | Contents |
|---|---|
| `20261105000001_core.sql` | default privileges, `set_updated_at`, `prevent_business_id_change`, `tier_limits`, `current_tier`, `owns_business`, `assert_business_access`, `businesses`, `subscription_entitlements`, `profiles`, `onboarding_responses`, signup trigger, business-limit trigger |
| `20261105000002_plans.sql` | `business_plans`, `plan_versions`, `plan_sections`, content validator, version guards, `ensure_business_plan`, `save_plan_section`, `restore_plan_version` |
| `20261105000003_roadmap.sql` | `roadmap_phases`, `milestones`, `tasks`, `task_dependencies`, `completed_at` + dependency triggers, `replace_ai_roadmap` |
| `20261105000004_finance.sql` | `financial_models`, `startup_costs`, `recurring_expenses`, `revenue_streams`, `transactions`, `business_goals`, forecast cap trigger, `ensure_financial_model` |
| `20261105000005_ai.sql` | `ai_conversations`, `ai_messages`, `ai_usage_records`, `reserve_ai_usage`, `finalize_ai_usage`, `ai_usage_summary` |
| `20261105000006_workspace.sql` | `marketing_assets`, `launch_checklist_items`, final anon/PUBLIC revoke sweep |

## Conventions

- `id uuid` PK (`gen_random_uuid()`), `created_at`/`updated_at timestamptz` (trigger `set_updated_at`). Exceptions:
  `profiles.id` = `auth.users.id`; `subscription_entitlements.user_id` PK; `financial_models.business_id` PK;
  `task_dependencies` PK `(task_id, depends_on_task_id)` with `created_at` only (rows are immutable).
- Enumerations are `text` + named CHECK constraints. Value lists equal the TS constants in `_shared/domain`
  (asserted by `supabase/tests/domain-parity.test.ts`).
- Money: `bigint` minor units, suffix `_minor`, range 0…1e13 (exact as JS numbers, also when summed over 36 months).
- Text: titles 1–200 chars and not blank; labels 1–120; business name 1–120; optional free text is
  `not null default ''` (empty = none) except metadata (`display_name`, `model`, `error_code`, `change_note`, `source_*`, `template_key`) which are nullable.
- `business_id` is immutable on every business-scoped table (trigger → `immutable_column`).

## Tables

| Table | Key columns (beyond id/timestamps) | Authenticated may | Notes |
|---|---|---|---|
| `profiles` | `display_name` (1–100, null), `locale` he\|en, `theme` system\|light\|dark, `active_business_id` | select own; update `display_name, locale, theme, active_business_id` | created at signup; `active_business_id` must be owned |
| `subscription_entitlements` | `user_id`, `tier` free\|pro, `status` active\|expired\|canceled, `source` default\|manual\|store, `current_period_end` | select own | writes: service role only |
| `businesses` | `owner_id` (default `auth.uid()`, immutable), `name`, `idea` (≤4000, default ''), `stage`, `country_code` ISO-2, `currency` ISO-4217 (default ILS), `onboarding_completed_at`, `archived_at` | CRUD own | tier limit on insert/unarchive |
| `onboarding_responses` | `business_id`, `question_key` (ONBOARDING_KEYS), `value jsonb`, `skipped` | CRUD own | unique `(business_id, question_key)`; `value` required unless skipped |
| `business_plans` | `business_id` (unique), `current_version_id` | select/insert/delete own; update `current_version_id` | current must be a `ready` version of this plan |
| `plan_versions` | `plan_id`, `version_number` (trigger), `origin`, `status`, `error_code`, `model`, `change_note`, `finance_proposal jsonb`, `based_on_version_id`, `created_by` | select/insert own; update `status, error_code, model, change_note, finance_proposal` | see lifecycle below; no delete |
| `plan_sections` | `plan_version_id`, `section_key` (PLAN_SECTION_KEYS), `content` (PlanSectionContent, validated), `origin` ai\|user | select/insert own; update `content, origin` (+ key columns for upserts) | writable only while version is `generating`; no delete |
| `roadmap_phases` | `business_id`, `phase` (ROADMAP_PHASES), `objective` (≤1000), `starts_on` (default today) | CRUD own | unique `(business_id, phase)` |
| `milestones` | `business_id`, `phase`, `title`, `target_date`, `achieved_at`, `source` ai\|user\|advisor, `sort_order` | CRUD own | |
| `tasks` | `business_id`, `phase` (null), `milestone_id` (null), `title`, `description` (≤2000), `priority`, `status`, `due_date`, `completed_at` (trigger), `source`, `sort_order` | CRUD own | milestone must be in the same business (composite FK; deleting it nulls only `milestone_id`) |
| `task_dependencies` | `task_id` depends on `depends_on_task_id` | select/insert/delete own | no self, same business, no cycles |
| `financial_models` | `business_id` PK, `starting_capital_minor`, `forecast_months` 1–36, six scenario `%` ints (70/100/110/130/100/95) | CRUD own | forecast cap by tier |
| `startup_costs` | `label`, `amount_minor`, `category` (≤60), `basis` (BASIS_VALUES), `sort_order` | CRUD own | |
| `recurring_expenses` | `label`, `monthly_amount_minor`, `category`, `basis`, `sort_order` | CRUD own | |
| `revenue_streams` | `label`, `unit_price_minor`, `unit_variable_cost_minor`, `monthly_units numeric(12,2)` ≥0, `monthly_growth_pct numeric(6,2)` −100…1000, `basis`, `sort_order` | CRUD own | |
| `transactions` | `kind` income\|expense, `amount_minor` >0, `occurred_on`, `category`, `note` (≤500) | CRUD own | |
| `business_goals` | `title`, `metric` revenue\|customers\|profit\|custom, `target_value numeric(20,2)` ≥0, `current_value`, `unit` (≤20), `due_date`, `status` | CRUD own | revenue/profit targets are minor units |
| `ai_conversations` | `business_id`, `user_id` (default `auth.uid()`), `title` (≤200), `last_message_at` (trigger) | select/insert/delete own; update `title` | user must own the business |
| `ai_messages` | `conversation_id`, `role`, `content`, `actions jsonb[]`, `follow_ups jsonb[]`, `applied_action_ids text[]`, `status`, `model`, `input_tokens`, `output_tokens` | select own; update `applied_action_ids` | inserts: service role only; `applied_action_ids` ⊆ `actions[].id` |
| `ai_usage_records` | `user_id`, `business_id` (null, **set null** on delete), `feature` (AI_FEATURES), `model`, tokens, `cost_usd_micros`, `status` reserved\|success\|error, `error_code` | select own | writes: service role RPCs only; deleting a business never resets quota |
| `marketing_assets` | `kind` (MARKETING_KINDS), `title`, `content` (MarketingContent, validated, default empty), `origin` | CRUD own | |
| `launch_checklist_items` | `template_key` (null, `[a-z0-9][a-z0-9_.-]*`), `category`, `title`, `description`, `source_name`, `source_url` (http/https), `status` todo\|done\|not_applicable, `notes`, `sort_order` | CRUD own | unique `(business_id, template_key)` (NULLs distinct) |

## RLS & privileges

- RLS enabled on every table; every policy targets `authenticated` only. `anon` and `PUBLIC` hold no table,
  column or function privileges in `public` (default privileges revoked; final revoke sweep).
- Business-scoped policies: `using/with check ((select public.owns_business(business_id)))`.
  Child tables use security-definer helpers: `owns_plan(plan_id)`, `owns_plan_version(plan_version_id)`,
  `owns_task(task_id)`, `owns_conversation(conversation_id)`.
- Column-level grants restrict updates where the contract demands it (profiles, business_plans, plan_versions,
  plan_sections, ai_conversations, ai_messages). Trying a non-granted column fails with `42501`.
- Triggers that must not leak another tenant's state (business limit, forecast cap) defer to RLS for non-owners.
- `service_role` bypasses RLS but **not** triggers: version immutability, dependency rules, limits apply to it too.

## Plan versions (immutability design)

1. Insert a version → trigger forces `status = 'generating'`, assigns `version_number = max+1` (plan row locked
   `FOR UPDATE`), stamps `created_by = auth.uid()`. Any supplied number is ignored.
2. Write sections (insert or upsert on `plan_version_id,section_key`) — allowed only while `generating`
   (the version row is locked `FOR SHARE`, so a concurrent flip cannot interleave).
3. Flip to `ready` (requires ≥1 section; clears `error_code`) or `failed` (+ `error_code`). Terminal: no further
   status/metadata change; sections of a non-generating version cannot be inserted, updated or deleted by anyone
   (cascades from deleting the plan/business/account are allowed). Only `finance_proposal` may still change on `ready`.
4. Point `business_plans.current_version_id` at the ready version.

`save_plan_section` and `restore_plan_version` perform 1–4 atomically under the caller's RLS.

## RPCs

All functions `set search_path = ''`. Errors use SQLSTATE `P0001`, `message` = code, `details` = context.

| Function | Security | Callable by | Returns / behaviour |
|---|---|---|---|
| `owns_business(b uuid)` | definer | authenticated, service_role | `boolean` |
| `tier_limits(p_tier text)` | invoker, immutable | authenticated, service_role | `table(max_businesses int, max_forecast_months int)`; free 1/12, pro 10/36, unknown → free |
| `current_tier(p_user uuid default auth.uid())` | invoker | authenticated, service_role | `'pro'` iff tier pro, status active, period not ended; else `'free'` (other users → `'free'`) |
| `ensure_business_plan(p_business_id uuid)` | invoker | authenticated, service_role | `business_plans` row (created if missing) |
| `save_plan_section(p_business_id uuid, p_section_key text, p_content jsonb, p_origin text default 'user', p_note text default null)` | invoker | authenticated, service_role | `uuid` of the new current version (origin `user_edit` / `ai_section` for `p_origin='ai'`); copies all other sections and `finance_proposal`; `not_found`, `invalid_request`, `precondition_failed` |
| `restore_plan_version(p_version_id uuid)` | invoker | authenticated, service_role | `uuid` of a new `restored` version copying a ready version; `not_found`, `precondition_failed` |
| `replace_ai_roadmap(p_business_id uuid)` | invoker | authenticated, service_role | `void`; deletes AI tasks with status ≠ done and AI milestones with `achieved_at is null` |
| `ensure_financial_model(p_business_id uuid)` | invoker | authenticated, service_role | `financial_models` row (default row inserted if missing) |
| `reserve_ai_usage(p_user uuid, p_business uuid, p_feature text, p_monthly_limit int, p_cost_cap_micros bigint, p_model text)` | definer | **service_role only** | `uuid` of a `reserved` row; per-user advisory xact lock; counts this UTC month's reserved+success rows of the feature, sums all cost; `quota_exceeded`, `cost_cap_reached`, `forbidden` (business not owned by p_user), `invalid_request` |
| `finalize_ai_usage(p_id uuid, p_status text, p_input int, p_output int, p_cost bigint, p_error text default null)` | definer | **service_role only** | `void`; `p_status` success\|error; once per reservation (`conflict`), `not_found` |
| `ai_usage_summary()` | invoker | authenticated, service_role | `table(feature text, used int)` — all 7 features in AI_FEATURES order, this UTC month, reserved+success |

Internal helpers also visible in the types (no need to call them): `assert_business_access`, `owns_plan`,
`owns_plan_version`, `owns_task`, `owns_conversation`, `ai_usage_month_start`, `advisor_action_ids`,
`is_valid_plan_section_content`, `is_valid_marketing_content`.

## Error codes (message text)

`not_found`, `forbidden`, `invalid_request`, `precondition_failed`, `conflict`, `immutable_column`,
`plan_version_immutable`, `business_limit_reached`, `forecast_limit_exceeded`, `dependency_self`,
`dependency_cross_business`, `dependency_cycle`, `quota_exceeded`, `cost_cap_reached`.
Postgres codes the app should also map: `42501` (permission/RLS), `23514` (check), `23505` (unique), `23503` (FK).

## PostgREST notes

- Two FKs link `business_plans` and `plan_versions`; embed with a hint:
  `business_plans?select=*,current:plan_versions!business_plans_current_version_id_fkey(*,plan_sections(*))`,
  history: `plan_versions!plan_versions_plan_id_fkey(...)`.
- `task_dependencies` → `tasks` twice: `task_dependencies!task_dependencies_task_id_fkey(depends_on_task_id)`.
- Upsert targets: `onboarding_responses` `business_id,question_key`; `roadmap_phases` `business_id,phase`;
  `plan_sections` `plan_version_id,section_key`; `launch_checklist_items` `business_id,template_key`;
  `business_plans`: use `ensure_business_plan` (or `ignoreDuplicates`; `business_id` is not updatable).

## Tests

```bash
cd business-ai
supabase db reset            # re-apply migrations to the local stack
npm run test:db              # pgTAP: supabase/tests/*.test.sql (helpers in _helpers.psql)
npx jest supabase/tests      # TS ↔ SQL parity (domain-parity.test.ts; also part of `npm test`)
npm run db:types             # regenerate database.types.ts after any migration change
```

pgTAP files: `01_schema_privileges` (RLS coverage, anon surface, grants, FK indexes, search_path),
`02_rls_isolation` (user B vs user A on every table, anon on every table), `03_entitlements_limits`,
`04_plans`, `05_roadmap`, `06_ai`, `07_workspace_finance`.
