# Handover: LEVEL UP on one page

For a new maintainer. It summarises what `AGENTS.md` (the binding rules), `README.md` (configuration, operations, details) and `docs/play-release.md`
(Google Play) already say; where a fact lives is named so you can check it. Nothing here is new policy.

## What it is

A learner types a goal or pastes study notes; the product produces a **validated game spec** (plain JSON: areas, stations, missions, challenges, bosses), and one shared
**React Three Fiber runtime** plays every game. Nothing in a spec is executable. Two front ends share the game code in `src/lib/game`:

* the **website** (Next.js 16, PostgreSQL, Stripe, optional AI provider), where the **server** grades answers and computes score, rewards, hints and completion;
* the **offline Android app** (`mobile/` + `android/`, Capacitor), which runs the *same reducer* on the device, with no server (a documented exception to the server-authority rule).

## Architecture

```
 Browser (Next.js pages, R3F scene, HUD)                       Android app (Vite bundle in Capacitor WebView)
        │  fetch /api/*  (same origin, Zod-validated)                  │  src/lib/offline/store.ts (reducer, answer keys, scoring on device)
        ▼                                                              │  optional Supabase backup (owner-only RLS) ── supabase/
 src/proxy.ts (cookie present?) → src/app/api/**/route.ts ── apiRoute(): auth, CSRF origin check, body schema, rate limit
        │                                                              ▲ same code: src/lib/game/**, src/lib/offline/**, src/config/plans.ts
        ▼
 src/server/*  ── auth · allowance (ledger) · generation (jobs, pipeline) · ai (providers, eval) · billing · games · http ── Prisma/pg ──► PostgreSQL
        │                                   │                       │
        │                                   │                       └─ Stripe (checkout, webhook → ingest pipeline; dev simulator uses the same pipeline)
        │                                   └─ AI provider (Anthropic or OpenAI-compatible) or the labelled demo / study-engine builders
        ▼
 src/lib/game/spec  ── validateGameSpec (schema, cross-checks, solvability, sanitising) ── clampToFeatureTier ── stored game
```

Request paths worth knowing:

* **Generate:** `POST /api/generations` → reserve one allowance credit (conditional `UPDATE`, one job in flight per user, idempotency key) → job runs after the response (`after()`) → provider stages →
  `validateGameSpec` + `clampToFeatureTier` → save the game and commit the credit in one transaction. Failure, timeout or a dead worker releases the credit (the reaper, on read or via `POST /api/internal/reap`).
  Code: `src/server/generation/*`, `src/server/allowance/*`.
* **Edit with words (Plus/Pro):** `src/server/games/ai-edit.ts` reserves an `AiEdit` row, the model answers with allow-listed operations (`src/lib/game/spec/edit.ts`), the result passes `validateGameSpec`,
  and the new version and the quota are committed together; `versions.ts` lists and restores versions.
* **Play:** `POST /api/games/[id]/session`, `POST /api/play/[sessionId]/events` → `src/server/games/play.ts` → `processEvent` (`src/lib/game/state/events.ts`) under a row lock. The client only ever sees redacted challenges;
  answer keys, explanations and solutions are released by the server after an attempt.
* **Pay:** `POST /api/billing/checkout` (amount and currency come from `plans.ts`) → Stripe → `POST /api/webhooks/stripe` → signature check over the raw body → idempotent, ordered ingest (`src/server/billing/ingest.ts`) →
  `Subscription` row → `resolveEntitlement` (`src/server/allowance/entitlement.ts`, 48 h grace after the period end).
* **Topic library (no AI):** a request with `topicId` is built from curated content in `src/lib/game/topics/` (one lazily imported module per topic,
  `loaders.ts`) by `runTopicLibrary` in `src/server/generation/pipeline.ts` — before any backend is touched, so no model is called — and on the phone by
  `generateOfflineWithProgress`. Same validation, tier clamp, phone fit and allowance; label `catalog` / “Topic library”. Tests: `tests/unit/topics.test.ts`,
  `tests/integration/topic-library.test.ts`, the topic part of `tests/unit/bundle-boundary.test.ts`.
* **Tiers:** the plan decides the *feature tier* (C 40 %, B 70 %, A 100 % of `GAME_FEATURES`) and the *graphics tier*; both are resolved on the server from the persisted plan, never from the client
  (`assertRequestAllowed` in `src/server/generation/service.ts`, `clampToFeatureTier` in `src/lib/game/spec/tier.ts`).

## Where the rules are enforced and tested

| Rule (AGENTS.md) | Code | Tests |
| --- | --- | --- |
| Prices, allowances, tiers only in `plans.ts` | `src/config/plans.ts` | `tests/unit/plans.test.ts`, `tier.test.ts`, `tier-property.test.ts`, `tests/integration/feature-tier.test.ts` |
| A failed generation or edit never costs a credit | `src/server/allowance`, `generation`, `games/ai-edit.ts` | `tests/integration/allowance.test.ts`, `generation.test.ts`, `ai-edit.test.ts` |
| Payments only through the verified pipeline | `src/server/billing` | `tests/unit/billing.test.ts`, `billing-fuzz.test.ts`, `tests/integration/billing-stripe.test.ts`, `billing-dev.test.ts` |
| Score, hints, attempts, completion computed server-side | `src/lib/game/state`, `src/server/games/play.ts` | `tests/unit/gameplay.test.ts`, `reducer-fuzz.test.ts`, `boss.test.ts`, `tests/integration/play.test.ts` |
| AI output is untrusted (`validateGameSpec`) | `src/lib/game/spec/validate.ts` | `tests/unit/spec.test.ts`, `edit.test.ts`, `ai-eval.test.ts`, `adapters.test.ts` |
| Hebrew/RTL default, English works, logical Tailwind classes | `src/lib/i18n`, components | `tests/unit/i18n-parity.test.ts`, `source-hygiene.test.ts`, `tests/e2e/responsive.spec.ts` |
| No secrets or `NEXT_PUBLIC_*` in the client | `src/server/env.ts` | `tests/unit/source-hygiene.test.ts`, `env.test.ts`, `security.test.ts` |
| Offline app: no server code, no network while signed out, Play settings | `src/lib/offline`, `mobile/`, `android/` | `tests/unit/offline*.test.ts`, `backup*.test.ts`, `sync*.test.ts`, `android-shell.test.ts`, `tests/e2e-mobile` |
| Demo templates are never shown as AI output (`generatorKind`) | `src/lib/game/demo`, `material` | `tests/unit/examples.test.ts`, `material*.test.ts` |

Working agreement: run `npm run check` before calling work done, `npm run test:e2e` for UI/gameplay/billing, `npm run test:e2e:mobile` for the offline app. Database changes go through a Prisma
migration (partial indexes and CHECKs are hand-written SQL). Integration tests use `levelup_test` only.

## Data

PostgreSQL via Prisma (`prisma/schema.prisma`): `User`, `UserProfile`, `Session` (token hash only), `RateLimitBucket`, `Subscription`, `AllowancePeriod`, `UsageRecord`, `WebhookEvent`, `DevCheckoutSession`,
`GenerationJob`, `Game`, `GameRevision`, `GameProgress`, `PlaySession`, `AiEdit`. The app writes no files. Operations (variables, key rotation, `eval:ai`, backups): README → *Operating the app*.

## Known limitations

Taken from the README, `AGENTS.md`, `docs/play-release.md` and `mobile/README.md`; the first block is "never exercised for real".

**Never run for real**
* No real AI provider call has been made (adapters, repair loop and validation are tested against mock servers); output quality and the refusal-fallback beta header are untested live. `npm run eval:ai` is the way to measure a model.
* No request has reached the real Stripe API (webhooks are tested with genuinely signed payloads and a fake client); try Stripe test mode before going live.
* The Unity C# has never run in a Unity Editor; the TypeScript bridge is tested with a stand-in loader.
* The Android app was built and its web bundle tested in Chromium, but never run on a phone or emulator.
* `.github/workflows/ci.yml` has never run on GitHub Actions. It runs typecheck, lint, `npm test` and the website E2E; it does not run `test:e2e:mobile`, the Supabase RLS checks or an Android build.
* A database restore has not been rehearsed. No Dockerfile or infrastructure-as-code is provided; no load test.

**Product behaviour**
* One subscription per user; changing plan means cancel (access to period end) and subscribe again. In-place upgrade does not exist (it cannot cross currencies: Plus in ILS to Pro in USD).
* Partial refunds, disputes and chargebacks do not change entitlements; Stripe Tax is not configured.
* Demo mode has templates for five topics only (programming, maths, science, ancient Egypt, Spanish); other subjects get the closest template with a visible notice. The study engine only asks about what the learner pasted. The topic library (no AI) covers only the topics in its catalogue (84 of the planned 200), each at three levels; topic-library games cannot be extended.
* Factual correctness of AI-made challenge content cannot be checked automatically (structure and solvability can).
* Audio is synthesised and 3D art is procedural; Playwright runs in Chromium only.
* The Android app: scores are self-practice (answer keys on the device); no paid features until Google Play Billing exists (the device tier stays A meanwhile); Auto Backup is off on purpose, so a new phone needs the backup file or the optional account;
  password reset is not built into the account flow.

**Security notes**
* The CSP keeps `script-src 'unsafe-inline'` (Next.js bootstrap scripts; a nonce policy would make every page dynamic). Capacitor's native HTTP plugins are registered unconditionally, so in the app the CSP is not a hard network boundary; "no request while signed out" is held by app code and tests.
* `npm audit` reported four high advisories, all transitive dependencies of the Prisma CLI (not in the request path); re-check on each Prisma upgrade.

## Open decisions (owner)

* **Target audience for Google Play** (13+ or all ages). If under-13s are a target, Play's Families policy and COPPA/GDPR apply, and the optional account collects an e-mail address (`docs/play-release.md` section 5).
* **Google Play Billing:** how paid plans map to `PLANS[plan].featureTier` on the device (`src/lib/offline/entitlement.ts` is the single place to change).
* **Plan numbers to confirm.** They are pinned as "exact product rules" in `tests/unit/plans.test.ts`: Free 2 games per calendar month; Plus 1 game per billing period (fewer than Free's 2, with higher feature and graphics tiers); Pro 5;
  Plus and Pro have identical graphics. Change them in `plans.ts` and the tests together.
* **Play Console owner tasks:** upload key and Play App Signing, public privacy-policy and account-deletion URLs with a support address, reviewer test account, content rating, Data safety form, closed-test requirement for new personal accounts
  (`docs/play-release.md` section 6). The package name `app.levelup.learn3d` can never change after the first upload.
* **Supabase dashboard settings** that cannot be done from the repository: confirm-email, site URL, own SMTP before many sign-ups (`mobile/store/release-checklist.md`).
* **Stripe:** whether to enable Stripe Tax and how to treat disputes; which events your account should subscribe the webhook to is listed in README → Payments.

## Found while preparing this page (test sprint, 2026-10-13)

Facts verified in the code; check whether each is still open before relying on it.

* `safeNext` (`src/lib/safe-redirect.ts`) lets `/\t/evil.example` through (the URL parser deletes tab, LF and CR, so the browser reads `//evil.example`): an open redirect after sign-in. A test marked `it.fails` in `tests/unit/safe-redirect.test.ts` documents it; remove the marker when fixed.
* `docker-compose.yml` creates only the `levelup` database, so the integration tests need `levelup_test` created once (`npm run db:up` creates both).
* `RATE_LIMITS.general` in `src/config/limits.ts` is not used by any route; only routes that declare a limit are limited.
* `.gitignore` does not cover the `eval-*.json` reports `npm run eval:ai` writes into the current directory.
