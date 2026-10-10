# LEVEL UP

Turn a learning goal into a playable 3D educational game. A learner describes what they want to learn; the
platform produces a validated game specification (areas, missions, challenges, explanations), a shared runtime
turns it into a 3D world, and every answer, score and result is computed **on the server** from validated events.

* **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4**
* **Three.js via React Three Fiber** — one data-driven runtime for every game (no arbitrary code is ever executed)
* **PostgreSQL + Prisma 7** · **Zod 4** validation everywhere · **Stripe** for recurring billing (with a labelled simulator for development)
* Hebrew / RTL is the default language, English / LTR is fully supported

> **Honest status.** Everything described below is implemented and was exercised by the test suites in this repo
> (see [Testing](#testing)). Two integrations could **not** be exercised against the real third-party services
> from the build environment because no credentials exist there: live AI generation and live Stripe billing.
> They are implemented against the vendors' official SDKs, covered by mock-based tests, and listed precisely in
> [What needs your credentials](#what-needs-your-credentials). Until you configure them the app runs in clearly
> labelled **demo mode** and **payments disabled/simulated** mode — it never pretends otherwise.

---

## Contents

1. [Quick start](#quick-start)
2. [Configuration](#configuration)
3. [Plans, allowances and graphics tiers](#plans-allowances-and-graphics-tiers)
4. [AI generation](#ai-generation)
5. [Payments](#payments)
6. [Game model and gameplay](#game-model-and-gameplay)
7. [Security](#security)
8. [Architecture](#architecture)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [What needs your credentials](#what-needs-your-credentials)
12. [Known limitations](#known-limitations)

---

## Quick start

Requirements: **Node.js ≥ 20.9** and **PostgreSQL 14+**.

```bash
npm install                     # also runs `prisma generate`
cp .env.example .env            # defaults work for local development
npm run db:up                   # PostgreSQL via Docker (docker compose up -d db) …
#   … or, without Docker, an isolated local cluster:  bash scripts/pg-local.sh start
npm run db:migrate              # apply the migrations
npm run dev                     # http://localhost:3000
```

Open the app, register, and create a game. With no AI key configured you get the **demo provider**: hand-written
templates (programming, maths, science, ancient history, Spanish) in Hebrew and English. Every game made from them is
labelled **“Demo template”** and the create screen says so before you press the button.

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run build` / `npm start` | development server / production build / production server |
| `npm run typecheck` · `npm run lint` | `tsc --noEmit` · ESLint (including React-compiler rules) |
| `npm test` | Vitest: unit + integration (integration needs PostgreSQL) |
| `npm run test:e2e` | Playwright end-to-end suite in a real Chromium |
| `npm run check` | typecheck + lint + vitest |
| `npm run db:migrate` · `npm run db:migrate:dev` | `prisma migrate deploy` · `prisma migrate dev` |

---

## Configuration

All configuration is server-side environment variables, validated at first use (`src/server/env.ts`). There are
deliberately **no `NEXT_PUBLIC_*` variables**: nothing secret can reach the browser. Copy `.env.example`; `.env` is git-ignored.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_ENV` | `local` | `local` · `test` · `production`. Production turns on hard safety guards (below). |
| `APP_URL` | `http://localhost:3000` | Public base URL: CSRF origin allow-list, Stripe return URLs. Must be `https://` in production. |
| `DATABASE_URL` | local compose DB | PostgreSQL connection string. |
| `TRUST_PROXY` | `false` | Set `true` **only** behind a proxy you control that overwrites `X-Forwarded-For` (Vercel, Cloudflare, nginx). Otherwise rate limiting uses a shared bucket. |
| `AI_PROVIDER` | `auto` | `auto` (real provider if a key is set, else demo) · `anthropic` · `openai` · `demo`. |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_REFUSAL_FALLBACK` | – / `claude-opus-5-5` / `true` | Anthropic Messages API. |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` | – / OpenAI / `gpt-4.1` | Any OpenAI-compatible chat-completions endpoint. |
| `AI_CALL_TIMEOUT_MS`, `AI_JOB_DEADLINE_MS` | `240000`, `600000` | Per-call timeout and whole-job deadline. |
| `PAYMENTS_MODE` | `disabled` | `disabled` · `stripe` · `dev` (simulator). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | – | Required for `PAYMENTS_MODE=stripe`. |
| `CRON_SECRET` | – | Bearer secret for the optional `POST /api/internal/reap` cron. |
| `ENABLE_TEST_HOOKS` | `false` | Exposes `window.__LEVELUP_TEST__` in the play screen for browser tests only. |

**Production guards** (the process refuses to start its configuration if violated): `PAYMENTS_MODE=dev` and
`ENABLE_TEST_HOOKS=true` are rejected when `APP_ENV=production`, and `APP_URL` must be `https://`.

---

## Plans, allowances and graphics tiers

Single source of truth: [`src/config/plans.ts`](src/config/plans.ts). Every price, limit and tier permission is read
from there — the UI never hard-codes them and nothing is gated by price in the UI.

| Plan | Price | Generated games | Period | Graphics |
| --- | --- | --- | --- | --- |
| **Free** | $0 | **1** | each UTC calendar month | Tier B / C |
| **Plus** | **$10 / month**, or exactly **₪30 / month** for accounts whose region is Israel | **1** | the subscription's billing period | Tier A (also B / C) |
| **Pro** | **$40 / month** (USD everywhere; no shekel price is invented) | **5** | the subscription's billing period | Tier A — **identical** to Plus |

Allowance rules, all enforced in the database rather than in UI code:

* A credit is **reserved** when a job starts and **committed** only when a validated game is saved. Failure, timeout or a
  crashed worker **releases** it — a failed generation never costs the user anything.
* `UPDATE … WHERE used + reserved < limit` makes over-allocation impossible even with parallel requests; a partial unique index
  allows one in-flight generation per user; `(userId, idempotencyKey)` is unique, so retries and double clicks reuse the same job.
* Jobs carry a deadline and are reaped (on read and via the optional cron endpoint) so a hung worker cannot hold a credit forever.
* Upgrading keeps credits already used in the period; unused credits do not roll over.
* Entitlement exists only while a subscription is `ACTIVE`/`TRIALING` (48 h grace after the period end for webhook delay).
  A failed payment, cancellation (at period end), unpaid state, or a **fully refunded invoice** (for that period only) falls back to Free.

**Graphics tiers** are chosen by the server from the persisted plan and sent to the client as a numeric render profile.
A forged request for Tier A on a Free account is refused (`403 TIER_NOT_ALLOWED`) and a stale stored preference is clamped.
The tiers differ in what is actually rendered — measured in the browser tests: shadow type and map size, materials/normal maps,
texture size, accent lights, scenery density, particles, glow, tone mapping and pixel ratio. In the E2E run the same scene produced
~7.0k / 14.8k / 24.8k triangles and 55 / 89 / 95 draw calls for Tier C / B / A, and Plus and Pro were pixel-identical to within noise.

---

## AI generation

Provider-neutral and server-side only; the browser never sees a key or a prompt.

```
POST /api/generations  →  reserve credit  →  background job  →  provider (stages)  →  validate  →  save game + commit credit
                                                   │
                                  Fast Game:   1 call   (compact spec)
                                  Full:        2 calls  (blueprint → challenges)
                                  Extend:      1 call   (additive extension merged into the saved game)
```

* **Providers:** `anthropic` (official `@anthropic-ai/sdk`; streaming; `output_config.effort`; cached system prompt) and any
  **OpenAI-compatible** endpoint. `demo` is the offline template provider. With `AI_PROVIDER=anthropic|openai` and a missing key the app
  *refuses* up front instead of silently falling back to demo.
* **Structured output without trusting the model:** the schema is described in the prompt, the reply is parsed and validated with Zod,
  then cross-checked (references, mission dependency cycles, reachable areas, solvable puzzles, program solutions, physics targets) and
  sanitised (control / bidi characters stripped, unknown keys dropped). Findings are fed back for up to two repair rounds. Nothing in a spec
  is executable — the robot “program” challenge is a tiny block language run by our own interpreter.
* **Prompt-injection hygiene:** user text is wrapped in `<user_request>` (tags stripped) and treated as data; a hostile subject cannot add
  fields, mechanics or code because only the validated schema reaches the runtime.
* **Modes really differ:** Fast = one focused area; Full = a two-stage plan then content, several areas, missions and an assessment;
  Extend = an additive pass that preserves every existing id, remaps collisions and links the last old area to the new one.
  After generation a game can also be edited without AI (rename, time of day, optional mechanics) with a version history.
* **Honest labelling:** every game stores `generatorKind` (`ai` | `demo`), provider and model; the library, details page and play screen show it.
  When no demo template matches a subject the game says so instead of pretending to be about it.

Enable a provider by setting its key in `.env` (e.g. `ANTHROPIC_API_KEY=sk-ant-…`) and restart. `GET /api/ai/status` reports what is active
(never the key).

---

## Payments

`PAYMENTS_MODE` selects the behaviour:

| Mode | Behaviour |
| --- | --- |
| `disabled` (default) | Plans are shown, checkout is unavailable and the pricing page says so. |
| `stripe` | Real recurring billing through Stripe Checkout + signed webhooks. |
| `dev` | A **labelled simulator** for development. No money moves. Refused when `APP_ENV=production`. |

### Real Stripe billing

1. Create a Stripe account and copy the secret key (test mode first): `STRIPE_SECRET_KEY=sk_test_…`, `PAYMENTS_MODE=stripe`.
2. Add a webhook endpoint `https://<your-domain>/api/webhooks/stripe` subscribed to:
   `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`,
   `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`, `charge.refunded`. Copy its signing secret to `STRIPE_WEBHOOK_SECRET=whsec_…`.
   Locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` prints a `whsec_…` for `.env`.
3. In the Stripe Dashboard → Settings → Billing → Customer portal, save a configuration (payment methods and invoices; cancellation is also handled in-app).

**You do not create Prices in Stripe.** Checkout sends the amount and currency straight from `src/config/plans.ts`
(`unit_amount` 1000 USD / 3000 ILS for Plus, 4000 USD for Pro, monthly), keyed by the account's saved region. The webhook handler **fails closed**:
a subscription whose charged amount/currency does not equal the configured price for its plan is rejected and grants nothing.

What the webhook pipeline guarantees (`src/server/billing`, covered by integration tests that send real Stripe-signed requests):

* **Signature verification** with Stripe's own verifier over the *raw* body (HMAC-SHA256, 5-minute tolerance); anything else gets `400`.
* **Idempotency:** each event id is stored; a redelivery — even 6 simultaneous ones — is a no-op. Events are applied under a per-user advisory lock.
* **Ordering:** an older event never overwrites newer state; a deleted/cancelled subscription is terminal; `invoice.paid` arriving before its
  subscription is answered `5xx` so Stripe retries, and the invoice itself advances the billing period if the subscription update is late.
* **Effects:** renewal → new billing period → fresh allowance; failed payment → `PAST_DUE` → Free until a payment succeeds; cancel at period end keeps
  the plan until then; full refund of the latest paid invoice suspends paid features for **that period only**; partial refunds change nothing.
* The success page never grants anything: it polls the server, which reads the Checkout Session back from Stripe with the secret key.

### Development simulator

`PAYMENTS_MODE=dev` adds a fake checkout page and, on the account page, buttons for *renew / payment failed / full refund*. These emit the same
Stripe-shaped events through the **same ingest pipeline** as real webhooks, tagged `provider=DEV`; the UI marks such subscriptions as simulated.
Plan, currency and amount come from a server-side checkout row created from the plan config — never from the browser. It cannot be enabled in production.

---

## Game model and gameplay

* A **game spec** (`src/lib/game/spec`) is plain JSON: theme, areas (layout, stations, NPCs, collectibles, portal), missions with objectives
  (`talk` / `solve` / `collect` / `visit`), challenges (`choice`, `numeric`, `sequence`, `match`, `program`, `simulation` with projectile and lever),
  learning goals and a conclusion.
* **Game type changes the world:** exploration → open plaza; puzzle → locked rooms with gates; platformer → floating terraces with gaps, moving platforms
  and hazards whose geometry is derived from the physics constants (reachability is tested); simulation → laboratory; adventure → multi-area with portals.
* **Server-authoritative:** the public spec contains no challenge content. A station is `open`ed to receive one challenge (redacted: no answer, hint,
  explanation or feedback); answers are graded on the server; hints cost points; after three wrong attempts the solution and explanation are revealed.
  Score, stars, achievements, adaptive easier/harder variants and completion are derived by an event-sourced reducer under a row lock, so parallel or
  forged events cannot double-count or finish a game early.
* **Education:** objectives, specific feedback for common mistakes, explanations, adaptive difficulty, learning results with per-objective mastery,
  concepts to review, achievements and a conclusion; progress is saved on every device and resumes where you left off.
* **Controls:** WASD / arrows, Space (jump), E (interact), Esc (pause), drag to look; touch joystick and buttons on phones. Audio is synthesised with WebAudio (no assets).

---

## Security

Implemented and tested:

* Passwords hashed with **scrypt** (per-password salt, constant-time compare, dummy hash on unknown email to equalise timing); login sessions are random
  256-bit tokens, only their **SHA-256** is stored; cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production; password change signs out other devices.
* **CSRF:** every mutating API request must come from the app's own origin (on top of SameSite). Webhooks are exempt and authenticate by signature instead.
* **Rate limits** (database-backed fixed windows; per IP and per user) on registration, login, generation, game events, checkout, account actions.
* **Authorisation by ownership** on every game, session, job and billing route (404 for other users' resources); no IDOR in the browser tests.
* **Validation** with Zod on every input, request-size limits, uniform non-leaky errors (details are logged server-side only).
* Security headers and a strict **CSP** (`next.config.ts`); no `dangerouslySetInnerHTML`, no `eval`; no secrets in the client bundle (checked).
* Minor-safe defaults: profiles are private; there is no open chat and no precise location — the region is a user-chosen billing region only.
* `npm audit` (production dependencies) reports 4 *high* advisories, all transitive dependencies of the **Prisma CLI** (`deepmerge-ts` used when
  loading `prisma.config.ts`, `mysql2` used by the CLI's local dev server). They are not in the request path (runtime uses `@prisma/client` + `pg`), and no stable
  Prisma release fixes them yet (the only newer line is `8.0.0-rc`). Re-check on each Prisma upgrade.

---

## Architecture

```
prisma/                 schema + migrations (hand-written partial unique indexes and CHECK constraints)
src/config/             plans.ts (single source of truth), graphics.ts (tier render profiles), limits.ts
src/lib/game/           spec · challenges (grading, simulations) · state (reducer) · world (layouts) · engine (physics) · demo templates
src/lib/i18n/           typed he/en dictionaries (key parity enforced at compile time)
src/server/             env · db · auth · allowance (ledger) · generation (jobs, pipeline) · ai (providers) · billing · games · http
src/app/                routes: pages and /api handlers (thin; logic lives in src/server)
src/components/         UI, forms, and the R3F game (scene/, hud/)
tests/                  unit · integration (real PostgreSQL) · e2e (Playwright)
legacy-demo/            archived earlier prototype (not used; delete when no longer needed)
```

---

## Testing

```bash
npm run db:up            # PostgreSQL for the integration tests (test DB `levelup_test` is used, never your dev DB)
npm run check            # typecheck + lint + vitest (unit + integration)
npm run test:e2e         # builds, starts the app against the test DB and drives Chromium
```

The E2E config runs Chromium with software WebGL (SwiftShader) so it works without a GPU; set `PW_CHROMIUM_PATH` to use a different browser binary.

Results of the final verification run are recorded in [Verification record](#verification-record).

What is covered: plan/entitlement logic, security primitives, env guards, spec validation (every template × language × mode × game type), server grading of
every challenge, the reducer (scoring, attempts, adaptive variants, completion, anti-cheat), world generation and reachability (every layout, size and template,
including platformer physics), allowance concurrency and failure fairness, generation jobs (idempotency, reaper, extend), play-session API, the whole
billing pipeline (real signature verification, idempotency, ordering, price tampering, refunds), AI adapters against mock servers, and the browser flows:
auth and access control, creation, play (keyboard movement, dialogue, answering, resume, completion, results), tier enforcement and measured rendering
differences, billing through the simulator, library/account management, responsive layouts in Hebrew and English at 360–1280 px and touch controls.
Every browser test also fails on any uncaught page error or console error.

### Verification record

Run on 2026-10-10 in the build environment (Linux container, Node 22.22, PostgreSQL 16, Chromium via Playwright 1.64 with software WebGL), on a fresh production build:

| Check | Result |
| --- | --- |
| `npm run typecheck` | passed (0 errors) |
| `npm run lint` | passed (0 errors, 0 warnings) |
| Vitest **unit** (9 files) | **303 passed** |
| Vitest **integration** against PostgreSQL (6 files) | **89 passed** |
| Playwright **E2E** (desktop + Pixel 7 projects, 39 scheduled) | **38 passed, 1 skipped** — the skipped one is the touch-device test, which by design runs only in the mobile project (where it passed) |
| `npm run build` | passed |

Not run (and therefore not claimed): anything against a real AI provider or the real Stripe API; GitHub Actions (`.github/workflows/ci.yml` was written but never executed);
Firefox/WebKit; a Docker image build; a load test.

---

## Deployment

* **Build & run:** `npm ci && npm run build && npx prisma migrate deploy && npm start` (Node ≥ 20.9). `GET /api/ai/status` is a cheap health check.
* **Database:** managed PostgreSQL 14+; run `prisma migrate deploy` on every release. The app uses `@prisma/adapter-pg` (a normal connection pool;
  with PgBouncer in transaction mode keep the pool small, and note advisory locks are transaction-scoped so they are compatible).
* **Background work:** generation runs after the HTTP response using Next.js `after()`. Run the app on a **long-lived Node server** (or a platform whose
  functions may live ≥ `AI_JOB_DEADLINE_MS`; `/api/generations` sets `maxDuration = 800`). If a function is killed early the job passes its deadline,
  is marked `TIMEOUT` and the credit is released. Optionally call `POST /api/internal/reap` with `Authorization: Bearer $CRON_SECRET` every few minutes.
* **Reverse proxy / HTTPS:** terminate TLS in front, set `APP_URL=https://…`, `APP_ENV=production`, and `TRUST_PROXY=true` only if the proxy overwrites `X-Forwarded-For`.
* **Stripe:** point the webhook at `https://<domain>/api/webhooks/stripe` (see [Payments](#payments)). Keep `PAYMENTS_MODE=stripe`; never `dev` in production.
* **Secrets:** inject through your platform's secret store. Nothing in this repo contains a real credential; `.env` is ignored by git.
* Not provided: a Dockerfile / IaC (a Docker image build could not be verified in the build environment) and a CI definition beyond `.github/workflows/ci.yml`.

---

## What needs your credentials

| Capability | Needs | Verified how, here |
| --- | --- | --- |
| Live AI generation (Anthropic or OpenAI-compatible) | an API key | Adapters, error mapping, timeouts, repair loop and validation are tested against mock servers. **No real model was called**, so output quality, the exact prompt tuning, and the optional refusal-fallback beta header were never exercised against the live API. |
| Live Stripe billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | The webhook pipeline is tested with genuinely Stripe-signed payloads (the SDK's own signer/verifier) and checkout/portal/cancel calls against a fake client asserting the exact parameters. **No request ever reached Stripe**; field shapes follow the installed SDK's types (API `2026-09-30`), so test in Stripe test mode before going live (use `stripe trigger`/Checkout with test cards). |
| Production database, domain, TLS | your infrastructure | – |

## Known limitations

* One subscription per user; changing plan means cancelling (access continues to period end) and subscribing again. In-place upgrade is not implemented
  (it also cannot cross currencies, e.g. Plus in ILS → Pro in USD).
* Partial refunds and disputes/chargebacks do not change entitlements. Taxes (Stripe Tax) are not configured.
* Demo mode only has templates for programming, maths, science, ancient Egypt and Spanish, in Hebrew and English; other subjects get the closest template with a visible notice.
* Challenge content for AI games is validated structurally and for solvability, but factual correctness of model output cannot be checked automatically.
* Game audio is synthesised (no recorded assets); 3D art is procedural (no imported models or textures).
* Playwright runs in Chromium only.
