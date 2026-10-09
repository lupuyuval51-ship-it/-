# FITAI — AI Fitness & Nutrition

FITAI is a full-stack, bilingual (Hebrew 🇮🇱 RTL by default, English LTR) fitness and nutrition application: personalized workout plans, a live workout tracker with rest timers, a searchable exercise library, nutrition logging with a food database, an AI coach, progress analytics, and a motivation system — backed by PostgreSQL and a server-side LLM integration.

> FITAI provides general fitness and nutrition guidance, not medical advice.

---

## Contents
1. [Features](#features)
2. [Quick start](#quick-start)
3. [Configuration](#configuration)
4. [AI integration](#ai-integration)
5. [Architecture](#architecture)
6. [Data model & migrations](#data-model--migrations)
7. [Security & privacy](#security--privacy)
8. [Testing](#testing)
9. [Production deployment](#production-deployment)
10. [External services & remaining configuration](#external-services--remaining-configuration)
11. [Known limitations](#known-limitations)

---

## Features

| Area | What you get |
|---|---|
| **Accounts** | Email + password registration/login (scrypt hashes, HttpOnly session cookies, CSRF tokens, lockout, rate limits), password change, password reset flow, log out everywhere, data export, account deletion. |
| **Onboarding** | Guided questionnaire: age, sex, height, weight, experience & ability benchmarks, goal, location, equipment, schedule, preferences, injuries, diet type, allergies, restrictions, activity & lifestyle. Draft survives refresh. |
| **AI workout generator** | Explainable training engine that builds a weekly split from the profile (equipment, experience, goal, time, injuries, minors' safety rules), with prescriptions (sets, reps, rest, RPE, target weight), weekly-volume balance and progression. Free-text preferences are interpreted by the LLM into constrained options. |
| **Plans & editing** | Generate, edit, save/activate, duplicate, archive, delete plans; edit sets/reps/rest/RPE/weight; add, remove, reorder and replace exercises (easier/harder/similar alternatives that fit your equipment); regenerate a day. |
| **Exercise library** | 119 exercises with bilingual descriptions, step-by-step instructions, common mistakes, safety notes, muscles, equipment, difficulty, category, contraindications and alternatives. Search (EN/HE) & filters. No video is claimed where none exists. |
| **Workout sessions** | Start/pause/resume/finish, timestamp-based rest timer (start/pause/reset/±15 s), set completion with weight/reps/time inputs, previous performance, exercise navigation, total duration, completion summary with personal records; progress survives navigation, refresh and brief offline periods. |
| **Nutrition** | Daily calorie & macro targets (Mifflin-St Jeor, safe floors, no deficits for minors), food database (~190 foods, EN/HE), search, portions in grams or servings, breakfast/lunch/dinner/snacks, corrections, quick add, custom foods, saved meals, recent/frequent foods, daily & weekly summaries, allergy/diet-aware meal suggestions and alternatives, barcode lookup (Open Food Facts) and AI meal-photo analysis with review before logging. |
| **AI coach** | Chat with context from your profile, plan, workouts, records and nutrition; safety screening; daily limits; built-in data-grounded mode when no LLM is configured. |
| **Progress** | 7/30/90-day analytics: workout frequency, volume, consistency, streaks, muscle-group balance, strength progression charts, personal records, body-weight history, nutrition adherence, insights from real data only. |
| **Motivation** | XP & levels, achievements, weekly goals, streaks, milestone notifications, optional reminders — rewarding consistency, not excess. |

---

## Quick start

Requirements: **Node.js 20.12+** (tested on 22), **PostgreSQL 14+** (tested on 16).

```bash
cd fitai
npm ci
cp .env.example .env            # edit DATABASE_URL / SESSION_SECRET / AI_API_KEY

# create the database (example for a local PostgreSQL)
createuser -P fitai             # password: fitai_dev_password (matches .env.example)
createdb -O fitai fitai

npm run db:setup                # migrations + built-in content (exercises, foods, meal templates)
npm run dev                     # API on :3000, web app on http://localhost:5173
```

Production build: `npm run build && npm start` (serves the web app and API on `PORT`).

Useful scripts:

| Command | Purpose |
|---|---|
| `npm run dev` | API (tsx watch) + Vite dev server with `/api` proxy |
| `npm run db:migrate` / `db:seed` / `db:setup` / `db:status` | Schema migrations and content seeding |
| `npm run typecheck` | Strict TypeScript for server, client and shared code |
| `npm run lint` | Release/security scan (no `eval`, no secrets in client, no SQL interpolation, …) |
| `npm run validate:content` | Validates the exercise/food/meal datasets (enums, cross-references, Atwater energy consistency, Hebrew coverage) |
| `npm test` | Server (real PostgreSQL) + client unit tests |
| `npm run test:e2e` | Playwright browser tests (requires `npm run build`) |
| `npm run verify` | Everything except E2E |

---

## Configuration

All configuration is environment-based (`.env` is loaded automatically; see `.env.example`). Secrets are read **only on the server** and never sent to the browser.

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | local dev DB | **Required in production** |
| `SESSION_SECRET` | dev value | **Required in production** (≥ 32 random chars) |
| `COOKIE_SECURE` | `true` in production | Use HTTPS in production |
| `APP_URL` | `http://localhost:3000` | Used for reset links and Origin checks |
| `AI_API_KEY` | – | Anthropic API key; enables the LLM coach, preference parsing and photo analysis |
| `AI_MODEL` | `claude-opus-5-5` | Any Messages-API model id |
| `AI_EFFORT` | `medium` | `low` / `medium` / `high` |
| `COACH_DAILY_MESSAGE_LIMIT` | 50 | Per user per day |
| `PHOTO_ANALYSIS_DAILY_LIMIT` | 20 | Per user per day |
| `OPENFOODFACTS_ENABLED` | `true` | Barcode lookups against the public Open Food Facts API |
| `DB_AUTO_MIGRATE` | `true` outside production | Migrate + seed on startup |
| `TRUST_PROXY` | `false` | Set behind a reverse proxy so rate limits see client IPs |

---

## AI integration

`server/src/ai/llm.ts` is the single gateway to the model (official `@anthropic-ai/sdk`, server-side only):

- **Model & settings**: `AI_MODEL` (default `claude-opus-5-5`), explicit `output_config.effort`, adaptive thinking (model default), timeouts and retries from config.
- **Refusal fallback**: requests opt into the server-side fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`); disable with `AI_REFUSAL_FALLBACK=false`.
- **Structured outputs**: JSON features (meal-photo analysis, free-text workout preferences) use `output_config.format` with a JSON schema **and** re-validate the result with zod. Model output never sets rewards, ids, permissions or nutrition data without user review.
- **Typed failures**: `not_configured`, `auth`, `rate_limited`, `timeout`, `unavailable`, `invalid_request`, `refused`, `bad_response` → each feature degrades gracefully (built-in coach answers from real data and the exercise library, keyword preference parser, manual food entry).
- **Limits**: per-minute rate limits and per-day quotas per user.

**To enable AI**: set `AI_API_KEY` (an Anthropic API key) and restart. Check `GET /api/health` → `ai.configured: true`. Without a key everything else works; the coach shows "built-in mode".

---

## Architecture

```
fitai/
├─ shared/            # TypeScript shared by server & client (no I/O)
│  ├─ constants.ts    # enums (goals, equipment, muscles, allergens, …) and limits
│  ├─ types/          # API DTO contracts per module
│  ├─ schemas/        # zod request schemas (server validation + client forms)
│  └─ nutrition.ts, training.ts, timer.ts, dates.ts, gamification.ts   # pure, unit-tested logic
├─ server/
│  ├─ src/app.ts      # middleware pipeline + router mounting
│  ├─ src/db/         # pg pool, migration runner, seeder, migrations/*.sql
│  ├─ src/middleware/ # auth sessions, CSRF, origin/content-type guard, rate limits, idempotency, errors
│  ├─ src/ai/llm.ts   # LLM adapter
│  ├─ src/modules/    # auth, profile, exercises, workouts, sessions, nutrition, progress, gamification, dashboard, coach
│  ├─ src/data/       # built-in bilingual datasets (exercises, foods, meal templates)
│  └─ tests/          # Vitest integration tests against PostgreSQL (+ fake LLM / fake Open Food Facts)
├─ client/
│  └─ src/            # React 19 + React Router + TanStack Query; pages/, features/, components/ui, i18n/, styles/
├─ e2e/               # Playwright specs, fake LLM server, E2E DB reset
└─ scripts/           # dev runner, server bundler, lint, content validator
```

Request pipeline: request id → security headers (CSP, frame/sniff protection) → rate limit → Origin & JSON content-type guard → body size limits → session → CSRF → idempotency → zod validation → user-scoped service → typed error responses `{ error: { code, message, details, requestId } }`.

---

## Data model & migrations

PostgreSQL schema (`server/src/db/migrations/0001_init.sql` and later files): users, auth sessions, password-reset tokens, idempotency keys, profiles, body weight, exercises, workout plans / plan workouts / plan exercises, workout sessions / session exercises / sets, personal records, foods, food log entries (nutrient snapshots), saved meals, meal templates, coach threads/messages, XP events, achievements, notifications.

- Migrations are forward-only SQL files `NNNN_description.sql`, applied in order inside transactions, recorded with checksums in `schema_migrations`; editing an applied migration aborts startup. A Postgres advisory lock prevents concurrent runners.
- `npm run db:migrate` (or `node dist/server/db-cli.js migrate` in production) applies pending migrations; `db:status` lists them.
- Content seeding is idempotent (upserts keyed by slug, skipped when the dataset hash is unchanged) and never touches user data.

---

## Security & privacy

- Passwords: scrypt (N=32768) with per-user salt; generic login errors; account lockout after repeated failures; per-IP and per-account rate limits.
- Sessions: random 256-bit tokens in `HttpOnly; SameSite=Lax` (`Secure` in production, `__Host-` prefix) cookies; only SHA-256 hashes stored; sliding expiry; capped sessions per user; logout everywhere; password change/reset revokes other sessions.
- CSRF: per-session token header on every mutation + Origin check + JSON-only bodies.
- Authorization: every query is scoped to the authenticated user; other users' resources return 404.
- Validation: zod on every input + database constraints; parameterized SQL only.
- Duplicate submissions: `Idempotency-Key` support on mutations + disabled buttons while pending.
- Privacy: no third-party trackers; logs contain no request bodies or secrets; meal photos are never stored; data export and full account deletion.
- Minors (13–17): no calorie deficits, conservative training prescriptions, no 1RM-based loading.

---

## Testing

- **Server**: Vitest integration tests run the real Express app against a real PostgreSQL test database (`TEST_DATABASE_URL`, default `fitai_test`), including auth, authorization isolation, validation, calculations, LLM paths (local fake Anthropic server) and Open Food Facts lookups (local fake server).
- **Client**: Vitest + jsdom for i18n completeness and pure UI logic.
- **E2E**: Playwright drives the production build in Chromium (desktop & mobile viewports) against an isolated database and a fake LLM: `npm run build && npm run test:e2e`.

---

## Production deployment

1. Provision PostgreSQL and create a database/user.
2. Set environment variables (`NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, optional `AI_API_KEY`, `TRUST_PROXY=true` behind a proxy).
3. `npm ci && npm run build`
4. `node dist/server/db-cli.js setup` (or set `DB_AUTO_MIGRATE=true` once).
5. `NODE_ENV=production node dist/server/index.js` behind HTTPS (reverse proxy or platform TLS).
6. Health check: `GET /api/health`.

The app is stateless apart from PostgreSQL and in-memory rate-limit counters; for multiple instances use a shared rate limiter (gateway/WAF/Redis).

---

## External services & remaining configuration

| Service | Status | What to do |
|---|---|---|
| Anthropic API (LLM) | Integrated; requires a key | Set `AI_API_KEY`. Without it: built-in coach, keyword preference parser, photo analysis disabled with an explanation. |
| Open Food Facts (barcodes) | Integrated (public API, no key) | Optionally set a contact in `OPENFOODFACTS_USER_AGENT`; outbound HTTPS must be allowed. |
| Transactional email | Not bundled | Password-reset emails are logged in development. Plug a provider into `server/src/lib/mailer.ts` (`setMailTransport`). |
| Push notifications | Not included | Reminders and milestone notifications appear in-app (and as browser notifications while the app is open). |
| Exercise videos/animations | No licensed assets | `exercises.media_url/media_type` columns are ready; the UI shows media only when present. |

---

## Known limitations
- Rate limiting is in-memory (per instance).
- Barcode camera scanning uses the browser `BarcodeDetector` API where available (Chromium on Android/desktop); elsewhere barcodes can be typed in.
- Nutrition values are typical reference values (USDA FoodData Central / Israeli labels) and can be corrected per entry or via custom foods.
