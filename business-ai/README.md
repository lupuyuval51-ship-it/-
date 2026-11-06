# BUSINESS AI

BUSINESS AI turns a business idea into an actionable plan and then helps run the business. The app is built with Expo/React Native, Supabase and Claude. Hebrew (RTL) is the default language, and English (LTR) is fully supported.

You can:

- **Onboard:** answer 8 short, skippable questions. Each answer is saved as you go.
- **Get a business plan from Claude:** 15 sections. Every statement in the plan is labelled with where it came from:
  - **Your input**
  - **Assumption**
  - **AI estimate**
  - **Verified** (needs a source)
- **Edit the plan:**
  - Edit any section yourself, or have Claude rewrite a single section. A rewrite is a preview that you accept or reject.
  - Every save creates a new version, so earlier versions can be restored.
  - Export the plan to PDF.
- **Follow a 30/60/90-day roadmap:**
  - phases with objectives
  - milestones, tasks, priorities and due dates
  - dependencies between tasks (cycles are blocked in the database)
  - rescheduling, custom tasks
  - AI suggestions for next steps
- **Model the finances deterministically:**
  - starting capital, startup costs, recurring expenses and revenue streams
  - pricing calculator, gross margin, break-even and runway
  - month-by-month cash flow under conservative, expected and optimistic scenarios
  - all arithmetic is done in code with integer minor units, never by the AI
- **Ask the AI advisor:**
  - It sees the plan, roadmap, finances, goals and actual results, and streams its answers.
  - It only *proposes* actions such as adding a task or an expense. Nothing is written until you tap to approve.
  - Conversations are saved per business.
- **Use the dashboard:** it answers "what should I do next?" — next step, today's tasks, roadmap progress, budget and upcoming milestones.
- **Manage the business after launch:**
  - record actual income and expenses
  - track goals and compare plan vs actual
  - update the business stage
  - ask the advisor for new priorities or a growth strategy
- **Marketing Studio:** 9 tools (positioning, name ideas, taglines, personas, social strategy, content calendar, launch campaign, copy, acquisition experiments). Everything generated can be edited and saved.
- **Launch Center:** a country-specific checklist that links to **official sources** (Israel, US, UK). It is clearly marked as educational guidance, not legal or tax advice.
- **Multiple businesses per account**, with **Free/Pro limits enforced on the server**.

> Status and honesty notes are in **[Known limitations](#known-limitations)**. Please read them before deploying.

---

## Architecture

| Layer | Implementation |
|---|---|
| App | Expo SDK 58, React Native 0.88, React 19, TypeScript (strict), Expo Router, React Hook Form + Zod, TanStack Query (cache persisted for offline reads), Zustand |
| Backend | Supabase Postgres with RLS on **every** table, triggers and RPCs (`supabase/migrations`), Supabase Auth (email/password) |
| AI | Two Edge Functions (`supabase/functions/ai`, `supabase/functions/advisor`) using the official `@anthropic-ai/sdk`, details below |
| Shared domain | `supabase/functions/_shared/domain/*`: Zod contracts and the finance engine, shared by the app (`@domain/*`) and the Deno functions |

How the AI layer works:

- **Default model:** `claude-opus-5-5`, configurable with `AI_MODEL`.
- **Structured outputs** are validated again with Zod.
- **Monthly limits:** per-feature quotas and a monthly cost ceiling, reserved atomically in SQL.
- **Usage tracking:** token usage and cost are recorded for every call.
- **Resilience:** retries and timeouts, refusal fallbacks, SSE streaming for the advisor.
- **Prompt-injection hardening:** user data goes into the prompt as tagged, untrusted data; the model can only propose actions; outputs are validated.

More detail is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md), [`docs/AI.md`](docs/AI.md) and [`docs/FEATURE_CONTRACTS.md`](docs/FEATURE_CONTRACTS.md).

```
src/app/            routes only (Expo Router): (auth), onboarding, (app)/(tabs) Home·Plan·Advisor·Finance·Workspace, detail screens
src/features/       onboarding, plan, roadmap, finance, advisor, home, workspace, manage, marketing, launch, business, settings, auth
src/components/ui/  design-system primitives (Screen, Text, Button, TextField, ListRow, Section, BasisTag, Sheet, ConfirmDialog, …)
src/theme/          tokens (light/dark), fonts (Heebo for Hebrew, Inter for English)
src/i18n/           he/en dictionaries, RTL handling, bidi-safe money/date formatting
supabase/           config, migrations, pgTAP tests, Edge Functions (+ shared domain)
e2e/                Playwright definition-of-done flow, fake Anthropic endpoint for tests, static web server
```

---

## Setup

Prerequisites: Node 20+, Docker, [Supabase CLI](https://supabase.com/docs/guides/cli) ≥ 2, and Deno 2 (only needed to run the function tests).

1. Install dependencies:

```bash
cd business-ai
npm install
```

2. Start the local backend and apply the migrations:

```bash
supabase start
```

```bash
supabase db reset
```

3. Configure the app. Copy `.env.example` to `.env` and fill it in from the `supabase status -o json` output (`API_URL` and `ANON_KEY`/`PUBLISHABLE_KEY`):

```bash
cp .env.example .env
```

4. Configure the Edge Functions. Copy `supabase/functions/.env.example` to `supabase/functions/.env` and set `ANTHROPIC_API_KEY`:

```bash
cp supabase/functions/.env.example supabase/functions/.env
```

5. Serve the functions:

```bash
supabase functions serve --env-file supabase/functions/.env
```

6. Start the app:

```bash
npx expo start
```

Press `a` for an Android emulator, or `w` for web.

### Environment variables

| Where | Variable | Required | Notes |
|---|---|---|---|
| App (`.env`) | `EXPO_PUBLIC_SUPABASE_URL` | yes | Local: `http://127.0.0.1:54321`. Android emulator: `http://10.0.2.2:54321` |
| App (`.env`) | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | yes | Publishable/anon key; RLS protects all data |
| Functions | `ANTHROPIC_API_KEY` | yes | Server-side only. If it is missing, AI requests return `503 not_configured` and the UI says so |
| Functions | `AI_MODEL` | no | Default `claude-opus-5-5` |
| Functions | `AI_API_BASE_URL` | no | Default `https://api.anthropic.com`. Override only for tests |
| Functions | `AI_MAX_RETRIES`, `AI_TIMEOUT_MS` | no | Defaults `2`, `120000` |
| Functions | `CORS_ALLOWED_ORIGINS` | no | Comma-separated list of web origins |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected into the functions by Supabase. Never put the service-role key or the Anthropic key in the app.

### Deploying the backend

```bash
supabase link --project-ref <ref>
```

```bash
supabase db push
```

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

```bash
supabase functions deploy ai advisor
```

In the Supabase dashboard:

- Add `businessai://**` to Auth → URL Configuration → Redirect URLs.
- Enable email confirmations if you want them; the app handles the "confirm your email" state.

### Granting Pro

There is no payment integration yet (see the limitations). To grant Pro to a user, run this as the service role:

```sql
update public.subscription_entitlements set tier = 'pro', source = 'manual', status = 'active' where user_id = '<uuid>';
```

---

## Android build

The project uses Continuous Native Generation, so you never edit `android/` by hand.

**Cloud build (Expo build service)**

1. Install the CLI and log in:

```bash
npm i -g eas-cli
```

```bash
eas login
```

2. Create `eas.json` once:

```bash
eas build:configure
```

3. Set the public env vars for the build profile in `eas.json` or as EAS environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

4. Build an installable APK for testing:

```bash
eas build -p android --profile preview
```

5. Build an AAB for Google Play:

```bash
eas build -p android --profile production
```

**Local build** (needs Android Studio/SDK and JDK 17):

```bash
npx expo prebuild -p android
```

```bash
npx expo run:android --variant release
```

The Android package id is `com.businessai.app` (set in `app.json`). Changing the language between Hebrew and English switches the layout direction and restarts the app (`I18nManager` + `reloadAppAsync`).

---

## Tests and verification

| Command | What it checks |
|---|---|
| `npm run typecheck` | `tsc --noEmit` over the whole app, strict |
| `npm test` | Jest: finance engine, i18n parity, formatting, design tokens/contrast, every feature's pure logic, component smoke tests |
| `npm run test:db` | pgTAP: RLS isolation for every table, privileges, triggers, RPCs, quota/cost-cap reservation |
| `npm run check:functions` / `npm run test:functions` | `deno check`, plus Deno unit and integration tests for the AI layer, run against the fake Anthropic server and the local stack |
| `npm run test:race` | Concurrency/all-or-nothing checks against the local stack (parallel advisor approvals, parallel finance "Accept all", failing batch saves nothing) |
| `npm run verify:all` | Runs **every** check above and keeps the raw logs in `docs/verification/latest/` |
| `bash e2e/run-e2e.sh` | Full stack: Supabase, the real Edge Functions (with `AI_API_BASE_URL` pointed at `e2e/fake-anthropic`), the web export and the Playwright definition-of-done flow |

The latest results are in [`docs/TESTING.md`](docs/TESTING.md). The raw output of the last full run (logs, E2E `results.json`, screenshots) is committed in [`docs/verification/latest/`](docs/verification/latest/).

---

## Known limitations

- **No live Claude call has been run in this build environment.** No Anthropic API key was available. The AI layer uses the official SDK and was tested end-to-end against a local fake of the Messages API (`e2e/fake-anthropic`), which emits schema-valid responses and SSE streams. Run one real smoke test with your key before shipping.
- **Payments are not integrated.** Free/Pro limits are enforced on the server (quotas, cost cap, business count, forecast horizon), but the Subscription screen says honestly that purchases are not available. Pro is granted manually (SQL above). Before selling, integrate Google Play Billing or RevenueCat, with webhook verification writing `subscription_entitlements`.
- **Native builds were not run here.** No Android SDK or emulator was available. The JS bundle for Android exports successfully, and the UI was verified in the web build with Playwright. Test on a real device (RTL switching, keyboard behaviour, PDF sharing) before release.
- **Some Launch Center sources were not opened directly.** Three gov.il pages are behind Cloudflare and could not be opened from the build environment. They were verified through official cross-links and search results (`il.tax_file`, `il.deductions_file`, `il.business_license`). Verify them manually. Countries other than IL, US and UK get generic research topics, not invented requirements.
- **Offline is read-only.** Cached data is readable offline; writes are disabled until the device is back online (no offline write queue).
- **Some device-local state is not synced across devices:** accepted/skipped finance-proposal items and the onboarding draft.
- **Advisor "Stop":** a reply stopped by the user is shown as "not completed".
- **Onboarding typing race:** text typed into the first onboarding field within about a second of opening the screen can be reset when the saved draft finishes loading. E2E found it; it is not fixed yet.
