# BUSINESS AI — Architecture & Engineering Contract

This document is the shared contract for everyone working on the codebase. If code and this
document disagree, fix one of them in the same change.

## 1. Product in one paragraph

BUSINESS AI turns a business idea into an editable, provenance-labelled business plan, a 30/60/90
roadmap of real tasks, a deterministic financial model, and a contextual AI advisor — and keeps
working after launch (actual revenue/expenses, goals, new priorities). Hebrew (RTL) is the default
language; English (LTR) is fully supported. Calm, editorial, restrained design (see §7).

## 2. Stack

| Layer | Choice |
|---|---|
| App | Expo SDK 58, React Native 0.88, React 19.3, TypeScript (strict), Expo Router (routes in `src/app/`) |
| Forms | react-hook-form + zod (`@hookform/resolvers/zod`) |
| Server state | TanStack Query v5 with AsyncStorage persistence (offline reads) |
| Client state | zustand (only for UI/session-local state: active business id, onboarding draft) |
| Backend | Supabase: Postgres + RLS, Auth (email/password), Edge Functions (Deno 2) |
| AI | Anthropic Claude via official `@anthropic-ai/sdk` inside Edge Functions only (keys never reach the app) |
| Tests | jest-expo (app + domain), Deno test (functions), pgTAP via `supabase test db` (RLS & SQL), Playwright (web E2E) |

No other runtime dependencies without a strong reason. Never `npm install` inside feature work —
dependencies are managed centrally (`npx expo install <pkg>`).

## 3. Repository layout (`business-ai/`)

```
src/
  app/                       Expo Router routes ONLY (thin: compose feature components)
    _layout.tsx              Providers + auth/onboarding guards (Stack.Protected)
    (auth)/                  sign-in, sign-up, forgot-password, reset-password
    onboarding/              8-step onboarding
    (app)/                   Authenticated stack
      (tabs)/                index (Home), plan, advisor, finance, workspace
      plan/ roadmap/ advisor/ finance/ marketing/ launch/ manage/ businesses/ settings/
  features/<feature>/        api.ts (queries/mutations), components/, hooks, pure helpers
    auth business onboarding plan roadmap advisor finance marketing launch manage settings home
  components/ui/             Design-system primitives (see §7.3) — no feature logic
  theme/                     tokens.ts, ThemeProvider, useTheme
  i18n/                      i18n runtime, locales/{he,en}/<namespace>.ts, format helpers
  lib/                       supabase client, query client, functions client, sse, errors, net
  stores/                    zustand stores
supabase/
  config.toml
  migrations/                SQL migrations (timestamped)
  tests/                     pgTAP tests (RLS isolation, triggers, RPCs)
  seed.sql                   local-only seed (no secrets, no fake business data)
  functions/
    deno.json                import map (zod, supabase-js, anthropic sdk)
    _shared/
      domain/                ENVIRONMENT-NEUTRAL contracts shared with the app (`@domain/*`)
      database.types.ts      generated: `npm run db:types` (imported in app as `@db`)
      ...                    Deno-only helpers (ai client, auth, http, usage, prompts)
    ai/index.ts              JSON AI actions
    advisor/index.ts         SSE advisor chat
e2e/                         Playwright web E2E + fake Anthropic server for tests
docs/                        this file, DATA_MODEL.md (generated from migrations), TESTING.md
```

Path aliases: `@/*` → `src/*`, `@domain/*` → `supabase/functions/_shared/domain/*`, `@db` → generated DB types.
Files in `_shared/domain/` may import only `zod` and sibling domain files **with explicit `.ts` extensions**
(Deno requires them; Metro and tsc are configured to accept them).

## 4. Data model (Postgres, schema `public`)

Conventions: `id uuid primary key default gen_random_uuid()`, `created_at/updated_at timestamptz not null default now()`
(+ `updated_at` trigger), text + CHECK constraints instead of enums, money as **`bigint` minor units**
(agorot/cents) suffixed `_minor`, every business-scoped table has `business_id uuid not null references businesses(id) on delete cascade`
and an index on it. RLS is enabled on every table. `anon` has no privileges on any table.

Helper: `public.owns_business(b uuid) returns boolean` — `security definer`, `stable`, `set search_path = ''`,
true iff `businesses.owner_id = auth.uid()`. Business-scoped policies: `using ((select public.owns_business(business_id)))`
with the same `with check`.

| Table | Key columns | Notes / RLS |
|---|---|---|
| `profiles` | `id` (= auth.users.id), `display_name`, `locale` ('he'\|'en', default 'he'), `theme` ('system'\|'light'\|'dark'), `active_business_id` (nullable FK businesses, set null) | Created by trigger on `auth.users` insert. Own row select/update only. |
| `subscription_entitlements` | `user_id` PK, `tier` ('free'\|'pro'), `status` ('active'\|'expired'\|'canceled'), `source` ('default'\|'manual'\|'store'), `current_period_end` | Created by the same trigger (free/active/default). Users: **select own only**. Writes: service role only. |
| `businesses` | `owner_id` (default auth.uid()), `name` (1–120), `idea` (≤4000), `stage` ('idea'\|'planning'\|'launching'\|'operating'\|'growing'), `country_code` (ISO-2, nullable), `currency` (ISO-4217, default 'ILS'), `onboarding_completed_at`, `archived_at` | Owner CRUD. Trigger enforces `tier_limits(tier).max_businesses` on insert/unarchive. |
| `onboarding_responses` | `business_id`, `question_key` (CHECK in onboarding keys), `value jsonb`, `skipped bool` | unique(business_id, question_key). Upsert. |
| `business_plans` | `business_id` UNIQUE, `current_version_id` (FK plan_versions, nullable) | One plan per business. |
| `plan_versions` | `plan_id`, `version_number` (unique per plan), `origin` ('ai_generated'\|'user_edit'\|'ai_section'\|'restored'), `status` ('generating'\|'ready'\|'failed'), `error_code`, `model`, `change_note`, `finance_proposal jsonb`, `created_by` | Immutable once ready (only status/error/finance_proposal updatable, by the function). |
| `plan_sections` | `plan_version_id`, `section_key` (CHECK in PLAN_SECTION_KEYS), `content jsonb` (PlanSectionContent), `origin` ('ai'\|'user') | unique(plan_version_id, section_key). |
| `roadmap_phases` | `business_id`, `phase` ('days_30'\|'days_60'\|'days_90'), `objective`, `starts_on date` | unique(business_id, phase). |
| `milestones` | `business_id`, `phase`, `title`, `target_date`, `achieved_at`, `source` ('ai'\|'user'\|'advisor'), `sort_order` | |
| `tasks` | `business_id`, `phase` (nullable), `milestone_id` (nullable, set null), `title` (1–200), `description` (≤2000), `priority` ('high'\|'medium'\|'low'), `status` ('todo'\|'in_progress'\|'done'), `due_date`, `completed_at` (trigger-maintained), `source` ('ai'\|'user'\|'advisor'), `sort_order` | |
| `task_dependencies` | `task_id`, `depends_on_task_id` (PK both) | No self-dependency; both tasks must belong to the same business (trigger). |
| `financial_models` | `business_id` PK, `starting_capital_minor`, `forecast_months` (1–36; trigger caps by tier), scenario percentages: `conservative_volume_pct` (70), `conservative_price_pct` (100), `conservative_cost_pct` (110), `optimistic_volume_pct` (130), `optimistic_price_pct` (100), `optimistic_cost_pct` (95) | Currency comes from `businesses.currency`. |
| `startup_costs` | `label`, `amount_minor` ≥0, `category`, `basis` (BASIS_VALUES), `sort_order` | One-off, month 0. |
| `recurring_expenses` | `label`, `monthly_amount_minor` ≥0, `category`, `basis`, `sort_order` | Fixed monthly costs. |
| `revenue_streams` | `label`, `unit_price_minor`, `unit_variable_cost_minor`, `monthly_units numeric(12,2)`, `monthly_growth_pct numeric(6,2)` (−100…1000), `basis`, `sort_order` | |
| `transactions` | `kind` ('income'\|'expense'), `amount_minor` >0, `occurred_on date`, `category`, `note` | Actuals after launch. |
| `business_goals` | `title`, `metric` ('revenue'\|'customers'\|'profit'\|'custom'), `target_value numeric`, `current_value numeric` (manual metrics), `unit`, `due_date`, `status` ('active'\|'achieved'\|'dropped') | revenue/profit progress is computed from transactions in-app. |
| `ai_conversations` | `business_id`, `user_id` (default auth.uid()), `title`, `last_message_at` | Owner select/insert/update(title)/delete. |
| `ai_messages` | `conversation_id`, `role` ('user'\|'assistant'), `content`, `actions jsonb` (AdvisorAction[]), `follow_ups jsonb`, `applied_action_ids text[]`, `status` ('complete'\|'error'), `model`, `input_tokens`, `output_tokens` | Users: select via conversation ownership; **UPDATE only column `applied_action_ids`** (column grant); no insert/delete (service role writes). |
| `ai_usage_records` | `user_id`, `business_id`, `feature` (AI_FEATURES), `model`, `input_tokens`, `output_tokens`, `cost_usd_micros`, `status` ('reserved'\|'success'\|'error'), `error_code` | Users: select own. Writes via service role / security-definer RPCs only. |
| `marketing_assets` | `kind` (MARKETING_KINDS), `title`, `content jsonb` (MarketingContent), `origin` ('ai'\|'user') | Owner CRUD. |
| `launch_checklist_items` | `template_key` (nullable), `category` ('registration'\|'tax'\|'licensing'\|'privacy'\|'insurance'\|'banking'\|'other'), `title`, `description`, `source_name`, `source_url`, `status` ('todo'\|'done'\|'not_applicable'), `notes`, `sort_order` | unique(business_id, template_key) where not null. |

### RPCs (SQL functions, `security invoker` unless noted)

- `save_plan_section(p_business_id uuid, p_section_key text, p_content jsonb, p_origin text default 'user', p_note text default null) returns uuid`
  Copy-on-write: locks the plan row, creates version N+1 (`origin` = 'user_edit' for user, 'ai_section' when `p_origin='ai'`),
  copies every section of the current version, replaces `p_section_key`, points `current_version_id` at it, returns the new version id.
  Validates content shape (`summary` string, `blocks` non-empty array). Fails if the current version is not 'ready'.
- `restore_plan_version(p_version_id uuid) returns uuid` — creates a new version (origin 'restored') copying the given ready version.
- `tier_limits(p_tier text) returns table(max_businesses int, max_forecast_months int)` — mirrors `domain/entitlements.ts`.
- `current_tier(p_user uuid default auth.uid()) returns text` — 'pro' only if entitlement active and not past `current_period_end`.
- `reserve_ai_usage(p_user uuid, p_business uuid, p_feature text, p_monthly_limit int, p_cost_cap_micros bigint, p_model text) returns uuid`
  — **security definer, executable by service_role only.** Takes `pg_advisory_xact_lock(hashtext(p_user::text))`, counts this
  calendar month's (UTC) `reserved`+`success` rows for the feature and sums `cost_usd_micros`; raises `quota_exceeded` /
  `cost_cap_reached` (SQLSTATE 'P0001', message = code) or inserts a `reserved` row and returns its id.
- `finalize_ai_usage(p_id uuid, p_status text, p_input int, p_output int, p_cost bigint, p_error text)` — service_role only.
- `ai_usage_summary() returns table(feature text, used int)` — security invoker; current user's usage this month (for UI).
- `apply_advisor_action(p_message_id uuid, p_action_id text, p_today date default null) returns jsonb` — applies one advisor
  proposal **atomically and exactly once**: the row (built from the stored proposal) and the `applied_action_ids` marker are
  written in the same transaction under a row lock; repeats return `already_applied`.
- `set_task_dependencies(p_task_id uuid, p_depends_on uuid[])` — replaces a task's dependency set in one transaction.
- `persist_ai_roadmap(p_business_id uuid, p_mode text, p_payload jsonb) returns jsonb` — the `ai` function writes a generated
  roadmap in one transaction (all or nothing; create-mode conflict check inside the transaction).

**Rule:** any user action that writes more than one row, or turns a proposal into data, goes through a single transaction
(an RPC) or an idempotency key (`source_ref`) — never two independent requests.

## 5. Edge Functions

Both functions: CORS for web, `verify_jwt` on, read the user from the JWT (`supabase.auth.getUser()`),
create a **user-scoped** supabase client (RLS applies) for business reads/writes and a **service-role**
client only for `reserve/finalize_ai_usage` and inserting assistant/user `ai_messages`.

Request/response contracts: `supabase/functions/_shared/domain/ai-api.ts` (zod-validated on the server).
Errors: HTTP status + `AiErrorBody` (`{ error: { code, message } }`), codes in `AI_ERROR_CODES`.

AI integration layer (`_shared/ai/`): provider interface with an Anthropic implementation using the official
SDK (`npm:@anthropic-ai/sdk`). Configuration via env:

| Env | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — (required) | Server-side secret. Missing → `not_configured` (503). |
| `AI_MODEL` | `claude-opus-5-5` | Model id for all features. |
| `AI_API_BASE_URL` | `https://api.anthropic.com` | Override only for tests (fake server). Explicit so the SDK never picks an ambient `ANTHROPIC_BASE_URL`. |
| `AI_MAX_RETRIES` | `2` | SDK retries for 408/409/429/5xx/connection errors. |
| `AI_TIMEOUT_MS` | `120000` | Per request. |

Rules: structured outputs (`output_config.format`) validated again with zod; `stop_reason` checked
(`refusal` → `ai_refused`, `max_tokens` → `ai_invalid_output`); refusal fallbacks enabled
(`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`); token usage + cost recorded for every call
(success or failure); per-feature monthly quotas and a monthly cost cap enforced **before** calling the model;
input size limits; prompt-injection hardening (user content is wrapped in tagged blocks and declared untrusted
data, the model can only *propose* actions, outputs are schema-validated, no secrets in prompts).

`plan.generate` runs in the background (`EdgeRuntime.waitUntil`): it creates a `plan_versions` row with
status 'generating', returns 202, then generates `PLAN_GENERATION_GROUPS` in parallel, writes sections, marks
the version 'ready' (or 'failed' with `error_code`), sets `current_version_id`, and — if the business has no
AI roadmap yet — generates the roadmap. The app polls the version status.

## 6. App conventions

- **Routes are thin.** Screens live in `src/app/**`, compose components/hooks from `src/features/**`.
- **Query keys:** business-scoped keys start with `['b', businessId, <resource>, ...]` so a business switch or
  delete can invalidate everything with `['b', businessId]`. User-scoped: `['me', <resource>]`.
- **Mutations** use optimistic updates only where trivial (task toggle); otherwise invalidate.
- **Errors:** map Supabase/PostgREST/function errors through `src/lib/errors.ts` → `AppError { code, message }`;
  UI shows translated messages, never raw SQL.
- **Every screen** renders explicit loading, empty, error (with retry) and offline states. Mutations show
  pending state on the triggering control and a quiet confirmation on success.
- **No dead UI.** Every button does something real. Features that are not available (e.g. purchases) are
  labelled as unavailable — never faked.
- **Money:** always integer minor units in state and DB. Format with `formatMoney(minor, currency, locale)`
  from `src/i18n/format.ts` (wraps in Unicode isolates for correct bidi rendering). Parse inputs with
  `parseMoneyInput`.
- **Dates:** ISO strings at the boundary; format with `formatDate` (locale-aware). Dates in RTL text are isolated too.
- **Financial arithmetic** lives only in `supabase/functions/_shared/domain/finance.ts` (pure, tested). The UI
  never re-implements formulas.

## 7. Design system

### 7.1 Principles
Calm, editorial, trustworthy. Typography and spacing carry hierarchy — not color, shadows, or cards. One primary
action per screen. Green (`accent`) only for primary actions, active state, and meaningful progress.
Forbidden: gradients, glow, glassmorphism, 3D illustrations, mascots, sparkles/rockets, emoji in UI, heavy shadows,
decorative charts, fake stats, excessive animation, nested cards, icon clutter.

### 7.2 Tokens (`src/theme/tokens.ts`)
Light: background `#FAFAF7`, backgroundAlt `#F1F2ED`, surface `#FFFFFF`, text `#181B18`, textSecondary `#737970`,
accent `#176B49`, accentSoft `#E6F2E9`, border `#E5E7E1`. Dark mode mirrors these with WCAG AA contrast
(e.g. background `#111311`, surface `#181B18`, text `#ECEEE8`, textSecondary `#9EA59B`, accent `#5DB487`,
accentSoft `#1B2C22`, border `#2A2E29`). Plus semantic: `danger`, `warning`, `onAccent`.
Spacing: 8-pt scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64); page gutter 20; max content width 640.
Radii: 6 (controls), 10 (sheets/surfaces) — nothing rounder. Hairline borders (`StyleSheet.hairlineWidth` or 1px).
Type scale (size/line-height, weight): display 28/34 600 · title 22/28 600 · heading 17/24 600 · body 16/24 400 ·
bodyStrong 16/24 500 · callout 15/22 400 · caption 13/18 400 · overline 12/16 500 (letter-spacing 0.4, not uppercase in Hebrew).
Fonts: Heebo (400/500/600) for Hebrew UI, Inter (400/500/600) for English UI. Numbers use tabular figures where supported.

### 7.3 Primitives (`src/components/ui/`)
`Screen` (safe area, scroll, gutter, max width, pull-to-refresh), `Text` (variant/tone), `Button` (primary | secondary | quiet | destructive;
loading; disabled), `IconButton`, `TextField` (label, hint, error, multiline, money/number modes), `ChoiceList` (single-select list rows),
`SegmentedControl`, `ListRow` (title, subtitle, value, chevron mirrored in RTL), `Section` (heading + optional action, no card),
`Divider`, `Surface` (rare), `ProgressBar` (thin, accent), `Checkbox`, `BasisTag` (provenance label), `EmptyState`, `ErrorState`,
`LoadingState` (quiet skeleton), `OfflineBanner`, `InlineNotice` (info/success/warning/error), `ConfirmDialog` (works on web — never
rely on `Alert.alert` for confirmations on web), `Sheet` (modal bottom sheet), `Icon` (Feather subset; directional icons mirrored in RTL).
Touch targets ≥ 44pt. Every interactive element has an accessibility role and label. Respect reduced motion.

### 7.4 Direction & language
`I18nManager` drives layout direction on native (Hebrew → RTL). Changing language persists to profile + AsyncStorage
and, on native, calls `I18nManager.forceRTL` then `reloadAppAsync()` (from `expo`). On web, `document.documentElement.dir/lang`
are set and the tree re-renders. Use logical styles (`marginStart`, `paddingEnd`, `start`/`end`, `textAlign: 'auto'` where
possible) — never hard-code left/right for layout.

## 8. Security & privacy checklist
- Secrets only in Edge Function env. The app ships only `EXPO_PUBLIC_SUPABASE_URL` and the publishable/anon key.
- RLS on every table; `anon` revoked; per-user isolation tested with pgTAP for every table.
- Entitlements/usage only writable by service role. Assistant messages cannot be forged by clients.
- AI never writes user data without an explicit user action, except: plan generation the user requested
  (new plan version), first roadmap creation after the user's first plan, and marketing assets the user requested.
- No financial projections presented as guarantees; every AI number is labelled as an estimate.
- Launch Center guidance is educational, cites official sources, and is never invented.
