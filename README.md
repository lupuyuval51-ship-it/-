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
> labelled **no-AI mode** (topic library and your own material only) and **payments disabled/simulated** mode — it never pretends otherwise.

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
11. [Operating the app](#operating-the-app)
12. [What needs your credentials](#what-needs-your-credentials)
13. [Known limitations](#known-limitations)

Also: [Design system](#design-system) · one-page architecture and open decisions for a new maintainer: [`docs/handover.md`](docs/handover.md) ·
Google Play release: [`docs/play-release.md`](docs/play-release.md) · game balance report: [`docs/balance.md`](docs/balance.md).

---

## Quick start

Requirements: **Node.js ≥ 20.9** and **PostgreSQL 14+**.

```bash
npm install                     # also runs `prisma generate`
cp .env.example .env            # defaults work for local development
npm run db:up                   # an isolated local PostgreSQL cluster on 127.0.0.1:54329 (scripts/pg-local.sh; creates the
                                #   `levelup` and `levelup_test` databases and the `levelup` role; no Docker needed)
#   … or with Docker:  docker compose up -d db   (creates only `levelup`; for the integration tests also run once:
#                                                 docker compose exec db createdb -U levelup levelup_test)
npm run db:migrate              # apply the migrations to the dev database (DATABASE_URL from .env)
npm run dev                     # http://localhost:3000
```

Open the app, register, and create a game. With no AI key configured, games come from the **topic library** (470 curated topics, three levels each) or from **your own material** (the study engine); a subject alone builds nothing, and the create screen says so before you press the button.

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run build` / `npm start` | development server / production build / production server |
| `npm run typecheck` · `npm run lint` | `tsc --noEmit` · ESLint (including React-compiler rules) |
| `npm test` | Vitest: unit + integration (integration needs PostgreSQL) |
| `npm run test:unit` · `npm run test:integration` | only the `unit` project (no database) · only the `integration` project (test database `levelup_test`, files run one after another) |
| `npm run test:e2e` | Playwright end-to-end suite for the website in a real Chromium (builds the app and serves it on port `E2E_PORT`, default 3100) |
| `npm run test:e2e:mobile` | Playwright for the offline Android app's web bundle (Pixel 7 viewport, network blocked) |
| `npm run check` | typecheck + lint + vitest |
| `npm run db:up` · `npm run db:down` | start / stop the local PostgreSQL cluster (`scripts/pg-local.sh`) |
| `npm run db:migrate` · `npm run db:migrate:dev` · `npm run db:generate` | `prisma migrate deploy` · `prisma migrate dev` · `prisma generate` |
| `npm run eval:ai` | measure an AI model on the fixed 100-case set (see [Measuring a model](#measuring-a-model-npm-run-evalai)); spends money unless `--dry` |
| `npm run balance` | print the game-balance simulation (deterministic, ~10 s; see [`docs/balance.md`](docs/balance.md)) |
| `npm run mobile:dev` · `npm run mobile:build` · `npm run mobile:preview` | Vite dev server / production bundle (`mobile/dist`) / preview of the offline Android app's web part |
| `npm run unity:build` | optional Unity WebGL renderer build (needs the Unity CLI; never run against a real Editor, see [Optional Unity renderer](#optional-unity-renderer-tier-a)) |

---

## Configuration

All configuration is server-side environment variables, validated at first use (`src/server/env.ts`). There are
deliberately **no `NEXT_PUBLIC_*` variables**: nothing secret can reach the browser. Copy `.env.example`; `.env` is git-ignored.

| Variable | Default | Purpose |
| --- | --- | --- |
| `APP_ENV` | `local` | `local` · `test` · `production`. Production turns on hard safety guards (below). |
| `APP_URL` | `http://localhost:3000` | Public base URL: CSRF origin allow-list, Stripe return URLs. Must be `https://` in production. |
| `DATABASE_URL` | local compose DB | PostgreSQL connection string. |
| `TRUST_PROXY` | `false` | Set `true` **only** behind a proxy you control. Then the client IP is read from `X-Forwarded-For` (or `X-Real-IP`). Otherwise rate limiting uses one shared bucket. |
| `TRUSTED_PROXY_HOPS` | `1` | How many proxies sit in front of the app (Cloudflare + nginx = 2). Every proxy **appends** the address it saw, so the client IP is the entry this many places from the **right**; the left end is attacker-controlled. A proxy that overwrites the header (Vercel) is 1. |
| `ANSWER_SEED_SECRET` | derived from `DATABASE_URL` | At least 16 characters. Secret behind the opaque answer ids players see in match / sequence / choice questions, so the ids do not give the answer away. Keep it stable (changing it only affects questions currently open). |
| `AI_PROVIDER` | `auto` | `auto` (real provider if a key is set, else no AI) · `anthropic` · `openai` · `none`. |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_REFUSAL_FALLBACK` | – / `claude-opus-5-5` / `true` | Anthropic Messages API. |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` | – / OpenAI / `gpt-4.1` | Any OpenAI-compatible chat-completions endpoint. |
| `AI_CALL_TIMEOUT_MS`, `AI_JOB_DEADLINE_MS` | `240000`, `600000` | Per-call timeout (1 000 – 600 000 ms) and whole-job deadline (5 000 – 1 800 000 ms). |
| `PLANS_ENABLED` | `false` | `true` shows Free/Plus/Pro, the pricing page and checkout. `false` (the launch setting): no plan is shown, checkout and `/pricing` are gone, everybody gets the full product with Pro's quotas per level and calendar month as fair use. The plan code stays in place. |
| `PLANS_SHOWN` | `true` | With `PLANS_ENABLED=false`: show the plans and prices (pricing page, landing teaser, nav link) as information only, with no checkout button and no payment banner. `false` hides them completely. |
| `GAME_EDITING` | `false` | Display switch: `true` shows the editing tools on the game page (rename, time of day, mechanics, the AI edit robot, version history). Off by default because they do not help a learner learn; the API and the plan quotas stay in place. |
| `PAYMENTS_MODE` | `disabled` | `disabled` · `stripe` · `dev` (simulator). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | – | Required for `PAYMENTS_MODE=stripe`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | – | Optional "Continue with Google" on the website. Both or neither: the button and `/api/auth/google/*` exist only when both are set. Setup: [`docs/google-signin.md`](docs/google-signin.md). |
| `CRON_SECRET` | – | Bearer secret (at least 16 characters) for the optional `POST /api/internal/reap` cron; without it the endpoint always answers 403. |
| `ENABLE_TEST_HOOKS` | `false` | Exposes `window.__LEVELUP_TEST__` in the play screen for browser tests only. |
| `TEST_DATABASE_URL` | local `levelup_test` | Used only by the tests and Playwright (never by the app). The integration suite refuses a database whose name does not contain `test`. |

An invalid value stops the first request that needs the configuration with an error naming the variable, so a typo shows up at the first request, not as odd behaviour later.
The variables are read once per process: change them and restart.

**Production guards** (the process refuses to start its configuration if violated): `PAYMENTS_MODE=dev` and
`ENABLE_TEST_HOOKS=true` are rejected when `APP_ENV=production`, and `APP_URL` must be `https://`.

---

## Plans, allowances and graphics tiers

Single source of truth: [`src/config/plans.ts`](src/config/plans.ts). Every price, limit and tier permission is read
from there — the UI never hard-codes them and nothing is gated by price in the UI.

| Plan | Price | Level A / period | Level B / period | Level C / period | Period | Graphics |
| --- | --- | --- | --- | --- | --- | --- |
| **Free** | ₪0 | not available | **1** | **5** | each UTC calendar month | Tier B / C |
| **Plus** | **₪5 / month** (shekels everywhere) | **5** | **10** | unlimited | the subscription's billing period | Tier A (also B / C) |
| **Pro** | **₪20 / month** (shekels everywhere) | **20** | **40** | unlimited | the subscription's billing period | Tier A — **identical** to Plus |

The allowance is a **separate quota of games per level** per period (`PLANS[plan].allowance = { A?, B?, C? }`, `UNLIMITED` for no
count): each game ("topic") uses one game of its own **level** (the feature tier below), and using one level never reduces
another. A level missing from the allowance cannot be made on that plan (Free can never make A; A is for paying plans). It is read
only through the helpers (`levelsAllowed`, `quotaOf`, `planOffer`, `defaultLevel`); the pricing, dashboard, header and sign-up copy
("1 topic at level B and 5 at level C") is generated from these numbers by `planOffer(plan)` — never typed into the UI. With plans
switched off everybody gets Pro's quotas per calendar month.

Allowance rules, all enforced in the database rather than in UI code:

* The request carries an optional `level` wish (C/B/A). The server checks it against the plan (`levelsAllowed`, else
  `403 FEATURE_TIER_LOCKED` naming the cheapest plan that offers it) and against that level's games left (`402 ALLOWANCE_EXHAUSTED`
  with the level, what is left at it and `resetsAt`); without a wish it picks the highest level that fits the request (mode, game type)
  and still has a game left (`defaultLevel`). Extending a game keeps the game's own level and uses one game of that level on the current plan.
* One game of the job's level (`GenerationJob.featureTier`) is **reserved** in that level's counter (`AllowanceQuota`) when the job starts and
  **committed** only when a validated game is saved. Failure, timeout or a crashed worker **releases** it — a failed generation never costs
  the user anything. The job settles exactly the level it reserved, even if the plan changed meanwhile.
* `UPDATE … WHERE used + reserved + 1 <= limit` for that level makes over-allocation impossible even with parallel requests; an unlimited
  level (`limit` NULL) is never refused by the count (its use is counted all the same). A partial unique index allows one in-flight
  generation per user; `(userId, idempotencyKey)` is unique, so retries and double clicks reuse the same job; a job settles once.
* Jobs carry a deadline and are reaped (on read and via the optional cron endpoint) so a hung worker cannot hold a game forever.
* An upgrade or downgrade inside a period refreshes every level's limit from the config and keeps what was already used at each level;
  unused games do not roll over.
* Entitlement exists only while a subscription is `ACTIVE`/`TRIALING` (48 h grace after the period end for webhook delay).
  A failed payment, cancellation (at period end), unpaid state, or a **fully refunded invoice** (for that period only) falls back to Free.

**Game feature tiers = levels** (separate from the graphics tiers, same letters): every game is built at one level, chosen per game
within the plan — **C = 40 % of the game features, B = 70 %, A = 100 %** (Free: C or B; Plus and Pro: C, B or A). The 20 features (`GAME_FEATURES` in `plans.ts`) are 4 game types, 6 question
types and 10 systems; the shares are computed from the lists, so they cannot drift from the promise (a unit test pins 40 / 70 / 100).

| | C | B adds | A adds |
| --- | --- | --- | --- |
| Game types | exploration, puzzle | platformer, multi-area adventures (≤ 2 areas) | simulation labs (adventures up to 4 areas) |
| Questions | choice, numbers, ordering | matching pairs | robot-program puzzles, physics simulations |
| Systems | collectibles, characters, checkpoints | hazards, timed bonus, side missions | adaptive difficulty, boss battles, characters that react |

Enforcement is on the server and on the saved game, never in the UI: a request for a feature outside the tier is refused with `403 FEATURE_TIER_LOCKED`
(naming the level, and the plan, that unlock it) before anything is reserved; the level is stored on the generation job when it starts; the delivered game is run
through `clampToFeatureTier` (`src/lib/game/spec/tier.ts`), which removes what the tier does not have and repairs everything that pointed at it
(stations, missions, requirements, portals, boss phases) and re-validates — so a model, a template or an edit cannot smuggle features in; the model is
also told its tier so it does not waste its answer. Extending a game keeps its own level (a plan that cannot make that level cannot
extend it); AI and manual edits stay within the game's own level; games from before tiers count as A. The offline Android app applies the same tiers on the device (`src/lib/offline/entitlement.ts`): it refuses what the
tier lacks (`TIER_LOCKED`) and clamps the rest, but stays at full tier A until Google Play Billing supplies a purchased plan.

**Plan features and quotas** live next to the prices in `plans.ts` (`features`): the personal AI robot level (`none` / B / A), AI edits per
period, and whether saved versions can be listed and restored. They are read by the server only; the UI just shows what the server reports and
explains which plan unlocks a locked feature.

| Plan | AI robot | AI edits / period | Version history |
| --- | --- | --- | --- |
| **Free** | — (manual edits only) | 0 | not available (3 versions kept internally) |
| **Plus** | level B: guided edits (≤ 15 operations per request) | 40 | list and restore, 20 versions kept |
| **Pro** | level A: larger multi-part changes (≤ 40 operations per request, higher reasoning effort) | 200 | list and restore, 100 versions kept |

**Graphics tiers** are chosen by the server from the persisted plan and sent to the client as a numeric render profile.
A forged request for Tier A on a Free account is refused (`403 TIER_NOT_ALLOWED`) and a stale stored preference is clamped.
The tiers differ in what is actually rendered — measured in the browser tests: shadow type and map size, materials/normal maps,
texture size, accent lights, scenery density, particles, glow, tone mapping and pixel ratio. In the E2E run the same scene produced
~7.0k / 14.8k / 24.8k triangles and 55 / 89 / 95 draw calls for Tier C / B / A, and Plus and Pro were pixel-identical to within noise.

---

## AI generation

Provider-neutral and server-side only; the browser never sees a key or a prompt.

```
POST /api/generations  →  reserve one game of its level  →  background job  →  provider (stages)  →  validate  →  save game + commit it
                                                   │
                                  Fast Game:   1 call   (compact spec)
                                  Full:        2 calls  (blueprint → challenges)
                                  Extend:      1 call   (additive extension merged into the saved game)
```

* **Providers:** `anthropic` (official `@anthropic-ai/sdk`; streaming; `output_config.effort`; cached system prompt) and any
  **OpenAI-compatible** endpoint. `none` means no AI (topic library and study engine only). With `AI_PROVIDER=anthropic|openai` and a missing key the app
  *refuses* up front instead of silently falling back to no AI.
* **Structured output without trusting the model:** the schema is described in the prompt, the reply is parsed and validated with Zod,
  then cross-checked (references, mission dependency cycles, reachable areas, solvable puzzles, program solutions, physics targets) and
  sanitised (control / bidi characters stripped, unknown keys dropped). Findings are fed back for up to two repair rounds. Nothing in a spec
  is executable — the robot “program” challenge is a tiny block language run by our own interpreter.
* **Prompt-injection hygiene:** user text is wrapped in `<user_request>` (tags stripped) and treated as data; a hostile subject cannot add
  fields, mechanics or code because only the validated schema reaches the runtime.
* **Modes really differ:** Fast = one focused area; Full = a two-stage plan then content, several areas, missions and an assessment;
  Extend = an additive pass that preserves every existing id, remaps collisions and links the last old area to the new one.
  After generation a game can also be edited without AI (rename, time of day, optional mechanics) with a version history.
* **Edit a game with words (Plus / Pro):** `POST /api/games/[id]/edit` takes a natural-language instruction. The model never writes code and never
  rewrites the game: it answers with a few allow-listed JSON-Patch style operations (`src/lib/game/spec/edit.ts`) that are applied to a copy and the
  whole result goes through `validateGameSpec` (schema, cross-references, solvability, sanitising) before it can be saved; the subject, type,
  difficulty and language are locked, and validation errors are fed back to the model (max 2 repairs). One quota slot is reserved by a `PENDING`
  `AiEdit` row (one in flight per user — partial unique index, advisory lock for the check) and committed with the new version in one transaction;
  a failed, rejected or timed-out edit releases it and changes nothing. Only AI-made games can be edited by the robot (engine and topic-library games are never
  passed off as AI output). `GET /api/games/[id]/revisions` and `POST …/revisions/[n]/restore` list and restore versions; a restore is never
  destructive (the old content becomes a new latest version).
* **Boss battles, side missions, characters that react:** a spec may contain `bosses` — a boss is fought through 2–5 of its area's own challenge
  stations ("phases"), which open one after another; every phase solved wounds it (a health bar in the scene and the HUD), the last one defeats it
  (+150 points, `boss_slayer`). There is no extra grading path: each phase is an ordinary server-graded challenge. A mission can have the objective
  `defeat`; `optional: true` makes a side mission that pays its bonus but never blocks finishing (portals do not wait for it); an NPC's `reactions`
  change what it says once a mission is done. The validator plays the game with the real rules to prove a boss cannot make it unfinishable. Full
  Adventures built without a model (the study engine, the topic library, the offline app) end with a quiz boss made of the area's quickest questions
  (`src/lib/game/spec/boss.ts`); AI games may design their own, and the edit robot can add or change bosses.
* **Honest labelling:** every game stores `generatorKind` (`ai` | `engine` | `catalog`; `demo` only on older saved games), provider and model; the library, details page and play screen show it.

### Study engine: a game made from *your* material (works without any AI)

The topic library covers its catalogue only, so there is also a rule-based engine that builds a game from whatever the learner pastes in
(`src/lib/game/material`). In the create form the **Study material** box accepts notes, a chapter, “term: meaning” lines or numbered steps (up to 8000
characters, Hebrew, English or any script); with no AI provider configured the engine turns it into a complete game, and with an AI provider the same
text is passed to the model as *data it must stick to* (`<study_material>`, tag break-outs stripped), so every question is about what was pasted.

* **What it extracts (deterministically, nothing invented):** a title (first line or Markdown heading), `term: meaning` / `term - meaning` / `term = meaning`
  lines, table rows (Markdown `| term | meaning |` or columns pasted from a spreadsheet; a two-column table of numbers becomes facts such as
  “Mars – Moons: 2”), “X is …” sentences, questions the learner already wrote with their answers (`Q:`/`A:`, `ש:`/`ת:`, a question line followed by its
  answer, `question? answer`, or a numbered quiz with lettered options and an “Answer: B” line, whose own wrong options are kept), numbered lists (steps),
  sentences with exactly one number, and plain statements. A first line that names the notes (“שאלות לחזרה – …”, “Ecosystems – key ideas”, the line
  above a bulleted list) is their title, not a term. From those it builds seven kinds of challenge: *answer the learner's own question* (numeric when the answer is a number),
  *match the terms*, *name the term from its description*, *fill the gap* (wrong options are other words of the material that look like the right one),
  *put the steps in order*, *which step comes first / right after this one* (from a list of four or more different steps, so a recipe
  or a procedure alone makes a game), *find the missing number*, and *true or false* (only as a last resort for very short material). Hints, explanations and
  per-option feedback quote the learner's own sentences, and the concept tag shown in the challenge panel never names the answer.
* **Adaptive:** multiple-choice questions get an easier two-option version that the server serves after two misses in a row (`adaptive_difficulty`).
* **Live preview and files:** under the material box the create form runs the same parser and builder in the browser and says what it found
  ("Terms: 5 · Questions: 3 · …") and whether it is enough for a game, before any game of the allowance is used; a `.txt`/`.md` file can be loaded into the box.
* **A full game, not a quiz:** the world, guide character, stations, lore note, collectibles, missions and portal(s) are composed for the chosen game type
  and mode (Fast = one area, Full = two areas when there is enough material); the environment follows the subject (ocean, space, Egypt, castle, lab, forest…).
  The same text always gives the same game. Extending such a game with *more material* adds a new area, keeps every old id and reuses the
  game's learning objectives; when the game is already at its size limit the extension is refused with a clear message (no charge).
* **Honest by construction:** the game is stored as `generatorKind: "engine"` and shown everywhere as “From your material (study engine, not AI)”. If the
  material is too short or has too little to ask about, the job fails with a precise message in Hebrew or English and the held game is released.
* **Same safety path as everything else:** the output goes through the normal spec validation (references, solvability, limits, sanitising), control and
  bidi characters are stripped from the material, and nothing in a spec is executable.
* **Limits (by design):** it can only ask about what the learner wrote — it cannot teach a subject from a bare topic name. For that, configure an AI provider.

### Topic library: ready topics, no AI

The create form (website and Android app) has a second way to build a game: **pick a topic from the topic library** and a level. The library
currently holds **470 topics** in ten categories — maths, science, history and civics, geography, languages, computing,
money and economy, health and safety, arts and literature, thinking and study skills: the original library of 210 (9 of them the chapters of a course,
below; about a third of every category is not free) and the **Plus and Pro collection** of 260 (20 to 30 per category, none free: half need Plus or Pro,
half, the more advanced ones, need Pro: Free opens 146 topics, Plus 320, Pro all 470; with plans off everybody plays everything, and the Android app follows the plan Google Play Billing reports: Free until the learner subscribes). Each topic is curated, fact-checked content written natively
in Hebrew and English for **three levels**: beginner (key terms and simple facts), intermediate (connections, examples and numbers) and advanced
(reasoning and multi-step questions). The game is built deterministically from that level's content only — **no model is ever called**, even when an
AI provider is configured — and adapts while playing (an easier two-option version after two misses, a harder version with more options after a streak).

* **Code:** `src/lib/game/topics/` — `catalog.ts` and `catalog-plus-pro.ts` (the catalogue the picker shows: id, he/en title and description,
  category, ages; kept out of the app's first chunk), `premium.ts` (which tier each topic is: free, Plus or Pro),
  `loaders.ts` (one literal dynamic `import()` per topic, so every topic is its own chunk and only the picked one is loaded),
  `content/<id>.ts` (the content), `build.ts` (content → raw game spec), `types.ts` (the compact content format).
* **Request:** `topicId` in the generation request (`src/lib/schemas/generation.ts`) — only a key into the catalogue, never a path; not allowed
  together with `material` or for an extension. The server (`runTopicLibrary` in `src/server/generation/pipeline.ts`) and the offline app
  (`generateOffline` / `generateOfflineWithProgress` in `src/lib/offline/generate.ts`) build, validate (`validateGameSpec`), add the final boss in a
  Full Adventure, clamp to the feature tier and fit the game to a phone exactly as for every other game; on the website it costs one game of the
  allowance with the same reservation and idempotency rules.
* **Label:** stored as `generatorKind: "catalog"`, provider `topic-library` (the topic id in `templateId`) and shown everywhere as
  **“Topic library”** / **״ספריית נושאים״** with the explanation “curated, fact-checked content — not AI”. Topic-library games cannot be extended
  (create a new game at the next level instead).
* **Adding a topic:** write `src/lib/game/topics/content/<id>.ts` in the format documented in `types.ts` (per level: `t` terms as
  [en term, en meaning, he term, he meaning] whose meaning never names the term, `q` questions with 1–4 wrong options and an explanation, optional
  `n` numeric items and `s` orderings), check it with `npx tsx --tsconfig tsconfig.json scripts/check-topics.ts <id>` (with `--plan <file>` for
  a topic not yet in the catalogue: the stricter bar of the collection, and every level × language built and played as a game), add one row to
  `catalog.ts` (or `catalog-plus-pro.ts`, with its tier in `premium.ts`) and one line to `TOPIC_LOADERS` in `loaders.ts`, raise
  `EXPECTED_TOPICS` in `tests/unit/topics.test.ts` and run it. The test builds every topic × level × language (FAST, and FULL alternating languages)
  through the real offline path and checks validation, finishability, unique and placed ids, the tier-B/C clamp, content hygiene (Hebrew is
  Hebrew, no answer among the wrong options, no repeated questions, numeric answers present in their explanations) and runs the balance bots on a
  sample. Every fact must be checked before it is written; when in doubt, leave the item out.

### Learning path: a course for one audience

`src/lib/game/topics/courses.ts` strings library topics into a course taught in order. Today there is one: **“Fractions, decimals and
percentages”** for grades 5–6 (ages 10–12), nine chapters — what a fraction is, equivalent fractions, comparing, adding and subtracting,
multiplying, dividing by a fraction, decimals and place value, calculating with decimals, percentages. Every chapter is an ordinary
topic-library topic with a **lesson** (`TopicContent.l`): one or two paragraphs in clear Hebrew (and English), a worked example and a hands-on
task to try at home. The game teaches first: the lesson boards stand in the first area and the mission that reads them (`m-1-0`) opens the
questions; the task waits at the end. Each level has 10–11 exercises with answers and explanations; `tests/unit/course-content.test.ts`
holds them to a stricter bar than the rest of the library. Chapters are free on every plan. In the Android app the home screen opens with the
path card; `#/course/<id>` lists the chapters, the progress (read from the games on the phone, so a restored backup keeps it) and starts the
next chapter on the phone. On the website the chapters are in the topic picker under maths.

Maths in a Hebrew line is drawn left to right (`src/lib/i18n/bidi.ts`, `MathText`): an equation, a mixed number or a blank `x/9` keeps its
textbook order instead of being mirrored by the right-to-left line.

Enable a provider by setting its key in `.env` (e.g. `ANTHROPIC_API_KEY=sk-ant-…`) and restart. `GET /api/ai/status` reports what is active
(never the key).

---

### Optional Unity renderer (Tier A)

Unity can draw the world instead of Three.js. It is a **display layer only**: the browser still runs input, physics and guidance, and the server still
grades, scores and releases hints, so Unity never sees answer keys.

* `GET /api/games/:id/unity?area=` returns a versioned scene description (geometry, placements, theme, and the **scene director's** output). Access is
  Tier A only (Plus/Pro), decided on the server from the persisted plan (`403 TIER_REQUIRED` otherwise).
* The **scene director** (`src/lib/game/unity/director.ts`) builds themed scenery, station signage and mood from the learner's own material (subject, area
  names, station labels, lore titles — never challenge text). Deterministic and render-only (no colliders).
* The page talks to a WebGL build through `src/lib/game/unity/bridge.ts`: scene once, then ~20 Hz frames. Unity may only answer `ready` / `error` / `stats`, strictly
  validated. With `?renderer=unity` and a build in `public/unity/levelup/Build/`, Three.js stops drawing (`headless`) and Unity renders; otherwise the built-in
  renderer stays and the page says so.
* The Unity project skeleton is in [`unity/`](unity/README.md). **The C# has never run in Unity** (only compiled against hand-written API stubs; no Unity Editor in the build environment); the TypeScript side
  is tested with a stand-in loader (`tests/e2e/unity.spec.ts`), so real Unity behaviour is unverified.

### Offline Android app (Google Play)

`mobile/` is a server-free Android app built from the same game code: 3D runtime, challenges, study engine, topic library
and the server's own game reducer, running on the device (`src/lib/offline`). No AI keys and no Stripe in the app; Plus and Pro are sold as monthly subscriptions through **Google Play Billing** (₪5 and ₪20; `mobile/src/billing/play.ts`, setup in `docs/play-release.md`), with library topics per half-year counted on the phone (Free 1, Plus 4, Pro 7; `src/lib/offline/tracks.ts`). Games and progress stay on the phone, with two opt-in ways to move them: a backup **file**
(Settings → Backup, `src/lib/offline/backup.ts`) and an optional **LUPU ID (account) with cloud backup** through Supabase (`mobile/src/cloud`,
`src/lib/offline/sync.ts`, `supabase/`): only the project URL and the *publishable* key are in the app, every table is owner-only (row level
security; `supabase/tests/rls_checks.sql` is a script you run by hand in the SQL editor, not part of `npm test` or CI), and **signed out the app makes no network request** (tested). Answer keys live on the
device there, so it is a self-practice app (this is the one deliberate exception to the server-authority rules). Capacitor wraps the Vite
bundle (`android/`). Build, signing and Play Console steps: [mobile/README.md](mobile/README.md) and [docs/play-release.md](docs/play-release.md).


### Measuring a model (`npm run eval:ai`)

A fixed, deterministic set of 100 requests (70 generations and 30 natural-language edits; Hebrew and English; tiers A/B/C; FAST and FULL; all game types each tier allows) is run through the **real** generation pipeline and edit engine, so any model can be compared with any other on the same terms. It reports success rate (accepted by `validateGameSpec` and re-checked for game type, language and feature tier), the share that needed no repair round, repairs and calls per case, p50/p95 latency, tokens, and cost per successful result when `--price-in` / `--price-out` (USD per million tokens) are given.

```
npm run eval:ai -- --dry                          # list the cases; no model call, no cost
npm run eval:ai -- --yes --label deepseek --price-in 0.3 --price-out 1.2
npm run eval:ai -- --compare eval-a.json eval-b.json
```

A real run **spends money** at the provider, so it needs `--yes`. It uses the backend configured by `AI_PROVIDER` and the provider variables, and never touches the database. The code is in `src/server/ai/eval/` (tested with a fake backend in `tests/unit/ai-eval.test.ts`).

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
(`unit_amount` 500 USD / 500 ILS for Plus, 2000 USD / 2000 ILS for Pro, monthly), always charged in ILS (shekels), whatever the account's region. The webhook handler **fails closed**:
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
  (`talk` / `solve` / `collect` / `visit` / `defeat`), challenges (`choice`, `numeric`, `sequence`, `match`, `program`, `simulation` with projectile and lever),
  learning goals and a conclusion.
* **Game type changes the world:** exploration → open plaza; puzzle → locked rooms with gates; platformer → floating terraces with gaps, moving platforms
  and hazards whose geometry is derived from the physics constants (reachability is tested); simulation → laboratory; adventure → multi-area with portals.
* **Server-authoritative:** the public spec contains no challenge content. A station is `open`ed to receive one challenge (redacted: no answer, hint,
  explanation or feedback); answers are graded on the server; hints cost points; after three wrong attempts the solution and explanation are revealed.
  Score, stars, achievements, adaptive easier/harder variants and completion are derived by an event-sourced reducer under a row lock, so parallel or
  forged events cannot double-count or finish a game early.
* **Review your mistakes:** from the results page, a review screen (`/games/<id>/results/<session>/review`) lists every question that took more than one try or needed the answer revealed, with the question, the right answer in words and the explanation. Only challenges already resolved are included, so an open question's answer is never released early; only the session's owner can open it.
* **Practise only these:** the review screen has a button that asks just the missed questions again (`/games/<id>/results/<session>/practice`), one by one, graded by the server (`/api/practice/<session>`), with free hints and a short summary at the end. It is unscored and stores nothing, and the API only accepts questions that are part of that session's review.
* **Education:** objectives, specific feedback for common mistakes, explanations, adaptive difficulty, learning results with per-objective mastery,
  concepts to review, achievements and a conclusion; progress is saved on every device and resumes where you left off.
* **Controls:** WASD / arrows, Space (jump), E (interact), Esc (pause), drag to look, number keys pick an answer in multiple-choice challenges; touch joystick and
  buttons on phones. Audio is synthesised with WebAudio (no assets).
* **Guidance (nobody gets lost):** a pure function (`src/lib/game/state/guidance.ts`, unit-tested) turns the missions and the player's progress into "what next"
  targets using only public information. The scene shows a light beam, a pulsing ground ring and a bobbing chevron over each objective, a companion drone that
  leads the way, and an on-screen marker with the name and distance (an edge-pinned arrow when the target is off-screen); the HUD adds a round camera-aligned
  minimap (desktop), a collectible counter, a first-run hint card and an area title card. The pause menu can switch all of it off.
* **A world that feels alive:** every environment has a far horizon (skyline, pyramids, mountains, floating islands…), a Nile or a lake where it fits, drifting
  clouds on the Tier A sky, ambient life (birds, hover-cars, fish, drones, balloons) scaled by the graphics tier, and props composed from primitives. Characters
  (robots, people, creatures, orbs) turn to face you and wave; the player robot has a walk/run cycle, squash and stretch, and a jetpack. Stations are holograms
  that show locked / ready / done and play a shockwave when completed; pick-ups have their own shapes, lean toward you and burst when collected; portals swirl;
  gates announce themselves when they open.
* **Game feel:** coyote time and jump buffering (unit-tested), landing dust, a camera dip on landing and a wider view while sprinting, footsteps, pick-up combos
  that climb the scale, a generative music loop per environment (tempo, key, chords and instrument change), a confetti burst on a correct answer and a shake on a
  wrong one, an animated cannon and a springy lever in the physics challenges. Animation respects `prefers-reduced-motion`.
* **Accessibility:** the 3D canvas is one labelled image, so the scene is exposed through `SceneAnnouncer`: a polite live region announces the area, anything you
  walk up to (with the right key or the Use button) and objective/mission progress, and the **Describe surroundings** button (or `H`) reads the nearest
  stations, characters and portal with distance and direction relative to the camera, plus the way to the next objective (`src/lib/game/a11y/scene.ts`, unit-tested).
  Dialogs (challenge, dialogue, lore, pause, completion) are modal: focus enters, Tab is trapped and focus returns afterwards. Choices are a real radio group
  (arrow keys, one tab stop); sequence/match/program controls announce what changed and keep focus; the robot grid and simulations have text alternatives. The HUD
  is a single flow with wrapping text and scrolling dialogs so a 200% system font does not overlap; the Android app allows pinch zoom. Check on a device with
  TalkBack and Settings > Display > Font size = largest.

---

## Security

Implemented and tested:

* Passwords hashed with **scrypt** (per-password salt, constant-time compare, dummy hash on unknown email to equalise timing); login sessions are random
  256-bit tokens, only their **SHA-256** is stored; cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production; password change signs out other devices.
* **CSRF:** every mutating API request must come from the app's own origin (on top of SameSite). Webhooks are exempt and authenticate by signature instead.
* **Rate limits** (database-backed fixed windows; per IP and per user; values in `src/config/limits.ts`): login 8 per 10 min per account and 30 per 10 min per IP, registration 5 per hour,
  generation and AI edits 6 per 10 min (per user, each), game events and practice answers 240 per minute, billing actions 10 per 10 min, account actions 30 per 10 min, password change 8 per 10 min. Only the routes
  that declare a limit are limited (the `general` entry in `limits.ts` is not used by any route). Behind a proxy the IP comes from `X-Forwarded-For` only when `TRUST_PROXY=true`.
* **Authorisation by ownership** on every game, session, job and billing route (404 for other users' resources); no IDOR in the browser tests.
* **Validation** with Zod on every input, request-size limits, uniform non-leaky errors (details are logged server-side only).
* Security headers and a restrictive **CSP** (`next.config.ts`: same-origin only, no framing, no plugins, forms only to ourselves; `script-src` still needs `'unsafe-inline'` because Next.js injects inline bootstrap scripts and a nonce policy would make every page dynamic);
  no `dangerouslySetInnerHTML`, no `eval`; no secrets in the client bundle (checked by `tests/unit/source-hygiene.test.ts`).
* Minor-safe defaults: profiles are private; there is no open chat and no precise location — the region is a user-chosen billing region only.
* `npm audit` (production dependencies) reports 4 *high* advisories, all transitive dependencies of the **Prisma CLI** (`deepmerge-ts` used when
  loading `prisma.config.ts`, `mysql2` used by the CLI's local dev server). They are not in the request path (runtime uses `@prisma/client` + `pg`), and no stable
  Prisma release fixes them yet (the only newer line is `8.0.0-rc`). Re-check on each Prisma upgrade.

---

## Architecture

```
prisma/                 schema + migrations (hand-written partial unique indexes and CHECK constraints)
src/config/             plans.ts (single source of truth), graphics.ts (tier render profiles), limits.ts
src/lib/game/           spec · challenges (grading, simulations) · state (reducer) · world (layouts) · engine (physics) · topic library ·
                        material (study engine) · unity (optional renderer bridge) · sim-balance (bot playthroughs) · a11y
src/lib/offline/        the server-free game store for the Android app: store, backup, sync, deck, entitlement, offline generation
src/lib/i18n/           typed he/en dictionaries (key parity enforced at compile time and by tests/unit/i18n-parity.test.ts)
src/server/             env · db · auth · allowance (ledger) · generation (jobs, pipeline) · ai (providers, eval) · billing · games · http
src/app/                routes: pages and /api handlers (thin; logic lives in src/server)
src/components/         UI, forms, and the R3F game (scene/, hud/)
mobile/                 the offline Android app's web part (Vite + React): screens, cloud backup client, native bridges, store listing text
android/                the Capacitor Android project (Gradle, manifest, MainActivity)
supabase/               migrations, the delete-account edge function and RLS checks for the app's optional cloud backup
unity/                  optional Unity WebGL renderer project (C# never run in a real Editor)
scripts/                pg-local.sh (local PostgreSQL), eval-ai.ts, balance-report.ts, build-unity.sh
docs/                   handover.md (architecture on one page, open decisions) · play-release.md · balance.md
tests/                  unit (no database) · integration (real PostgreSQL, `levelup_test`) · e2e (Playwright, website) · e2e-mobile (Playwright, offline app)
```

New here? Read [`docs/handover.md`](docs/handover.md) first; the binding engineering rules are in [`AGENTS.md`](AGENTS.md).

---

## Design system

One design system for the website and the Android app (`mobile/` imports the same `src/app/globals.css`):

* **Tokens** live in `src/app/globals.css` (`@theme`): surfaces `ink-950…600`, `line`, `text`, `muted`, accents `neon/violet/lime/amber/rose`
  (+ `violet-soft` for violet text), elevation `shadow-e1/e2/e3/glow`, a fluid type scale (`text-xs…5xl` are `clamp()` values with
  Hebrew-friendly line heights) and the font. They are CSS variables, so every Tailwind utility follows the active theme. No hex
  values in components (3D scene colours aside).
* **Themes:** dark (default), light, or "match device" (`prefers-color-scheme`). The header switch / app setting stores
  `lu-theme`; the server renders `data-theme` on `<html>` so there is no flash. The 3D play screen always uses `.theme-dark`.
* **Look:** a chalkboard (dark, default) or a notebook page (light): warm green-black or cream surfaces, a faint squared-paper
  grid behind the pages, chalk-yellow (dark) or ink-green (light) for the main action. Primary buttons stand on a solid ledge and
  sink into it when pressed (`shadow-glow`); no glows, no glass blur, no gradients. Icons are drawn (lucide), never emoji.
* **Brand:** the mark is a ball hopping up three steps with softly rounded corners (`src/components/ui/Brand.tsx`: a yellow tile with a
  highlight on its top edge and a solid ledge under it, the mark cut out in the page colour, and a heavy rounded wordmark). `node mobile/brand-assets.mjs`
  regenerates the launcher icons, splash screens and web icon from the same drawing, and cuts the Play Store icon and feature graphic
  from the artwork kept in `mobile/store/brand-source/`.
* **Type:** Rubik (variable, bundled with `@fontsource-variable/rubik`, so the offline app has it too) for Hebrew, Latin and Spanish.
* **Components** (`src/components/ui`): `Button` (44 px touch target, fluid padding, hover/pressed/disabled), `Card`
  (`flat`/`raised`/`floating` elevation, `interactive` hover-lift + focus), `Field` (wires `id`, `aria-invalid`,
  `aria-describedby`; error / success / hint states), `StateView` (illustrated empty / error / 404 with recovery actions),
  SVG icons from `lucide-react` (`GameTypeIcon`, `NpcIcon`) — no emoji in the UI.
* **Motion:** short page-enter transition on every route; all animation is disabled under `prefers-reduced-motion`.
* **Checks:** axe audits run on public and signed-in pages in both themes; `tests/e2e/visual.spec.ts` keeps pixel baselines of
  the public pages (he/en × dark/light). Change them deliberately with `--update-snapshots`.

## Testing

```bash
npm run db:up            # PostgreSQL for the integration tests (test DB `levelup_test` is used, never your dev DB)
npm run check            # typecheck + lint + vitest (unit + integration)
npm run test:e2e         # builds, starts the app against the test DB and drives Chromium
npm run test:e2e:mobile  # when you touch mobile/, src/lib/offline or anything the Android app imports
```

The E2E config runs Chromium with software WebGL (SwiftShader) so it works without a GPU; set `PW_CHROMIUM_PATH` to use a different browser binary.

Two Vitest projects (`vitest.config.mts`): **unit** (`tests/unit`, no database, 30 s timeout) and **integration** (`tests/integration`, PostgreSQL `levelup_test`, files run
one at a time because they share the database; global setup applies the real migrations and refuses a database whose name has no "test" in it). Integration suites run at feature tier A
(`setFeatureTierForTests` in `tests/integration/setup.ts`); `feature-tier.test.ts` uses the real tiers. Single files: `npx vitest run --project unit tests/unit/billing.test.ts`.
Repository rules that are enforced as tests: i18n key and placeholder parity, logical (RTL-safe) Tailwind classes, no `NEXT_PUBLIC_*` and no secret-shaped literals, no server code in
client bundles, no `eval` (`tests/unit/i18n-parity.test.ts`, `tests/unit/source-hygiene.test.ts`); the Android shell settings (`tests/unit/android-shell.test.ts`).
Randomised tests use fixed seeds (`rng(seed)` in `tests/unit/random-play.ts`), so a failure prints the seed that reproduces it. CI (`.github/workflows/ci.yml`) runs typecheck, lint, `npm test`
and the website E2E; it does **not** run `test:e2e:mobile`, the Supabase RLS checks or an Android build.

A snapshot of one full verification run is recorded in [Verification record](#verification-record) (it is a dated record, not a live number: the suites have grown since).

What is covered: plan/entitlement logic, security primitives, env guards, spec validation (every template × language × mode × game type), server grading of
every challenge, the reducer (scoring, attempts, adaptive variants, completion, anti-cheat), world generation and reachability (every layout, size and template,
including platformer physics), allowance concurrency and failure fairness, generation jobs (idempotency, reaper, extend), play-session API, the whole
billing pipeline (real signature verification, idempotency, ordering, price tampering, refunds), AI adapters against mock servers, and the browser flows:
auth and access control, creation, play (keyboard movement, dialogue, answering, resume, completion, results), tier enforcement and measured rendering
differences, billing through the simulator, library/account management, responsive layouts in Hebrew and English at 360–1280 px and touch controls.
Every browser test also fails on any uncaught page error or console error.

### Verification record

Snapshot from 2026-10-10 (after the UI overhaul: themes, design tokens, icons, states); the file counts and totals below are **from that date** and have grown since (more unit suites, the offline app's cloud backup, feature tiers, AI editing) — re-run `npm run check` and the E2E commands for current numbers. Run in the build environment (Linux container, Node 22.22, PostgreSQL 16, Chromium via Playwright 1.64 with software WebGL), on a fresh production build:

| Check | Result |
| --- | --- |
| `npm run typecheck` | passed (0 errors) |
| `npm run lint` | passed (0 errors, 0 warnings) |
| Vitest unit + integration against PostgreSQL (22 files) | **566 passed** |
| Playwright **E2E** website incl. axe audits in both themes and visual-regression baselines (desktop + Pixel 7 projects, 63 scheduled) | **62 passed, 1 skipped** — the skipped one is the touch-device test, which by design runs only in the mobile project (where it passed) |
| Playwright **E2E** offline app bundle (`npm run test:e2e:mobile`, Pixel 7, network blocked) | **3 passed** |
| `npm run build` | passed |
| Android `./gradlew bundleRelease assembleRelease` (target SDK 36) | signed AAB + APK built; `apksigner verify` / `jarsigner -verify` passed |

The Android app was **not run on a phone or emulator** (no KVM in the build environment); its web bundle was tested in Chromium at phone size.
The Unity C# has never run in Unity (compiled only against hand-written API stubs).

Not run (and therefore not claimed): anything against a real AI provider or the real Stripe API; GitHub Actions (`.github/workflows/ci.yml` was written but never executed);
Firefox/WebKit; a Docker image build; a load test. The study engine's question quality was checked by reading its output for English, Hebrew, Spanish and Arabic sample texts and by validity/solvability tests, not by learners.

---

## Deployment

* **Build & run:** `npm ci && npm run build && npx prisma migrate deploy && npm start` (Node ≥ 20.9). `GET /api/ai/status` is a cheap health check.
* **Database:** managed PostgreSQL 14+; run `prisma migrate deploy` on every release. The app uses `@prisma/adapter-pg` (a normal connection pool;
  with PgBouncer in transaction mode keep the pool small, and note advisory locks are transaction-scoped so they are compatible).
* **Background work:** generation runs after the HTTP response using Next.js `after()`. Run the app on a **long-lived Node server** (or a platform whose
  functions may live ≥ `AI_JOB_DEADLINE_MS`; `/api/generations` sets `maxDuration = 800`). If a function is killed early the job passes its deadline,
  is marked `TIMEOUT` and its held game is released. Optionally call `POST /api/internal/reap` with `Authorization: Bearer $CRON_SECRET` every few minutes.
* **Reverse proxy / HTTPS:** terminate TLS in front, set `APP_URL=https://…`, `APP_ENV=production`, and `TRUST_PROXY=true` (and `TRUSTED_PROXY_HOPS` if more than one proxy is in front).
* **Stripe:** point the webhook at `https://<domain>/api/webhooks/stripe` (see [Payments](#payments)). Keep `PAYMENTS_MODE=stripe`; never `dev` in production.
* **Secrets:** inject through your platform's secret store. Nothing in this repo contains a real credential; `.env` is ignored by git.
* Not provided: a Dockerfile / IaC (a Docker image build could not be verified in the build environment) and a CI definition beyond `.github/workflows/ci.yml`.

---

## Operating the app

Everything the running service needs is an environment variable (table in [Configuration](#configuration)) plus one PostgreSQL database. There is no session
secret to configure (login tokens are random and only their SHA-256 is stored), no object storage and no queue: background work runs inside the Node process.

### What the server needs

| For | Variables |
| --- | --- |
| **Always** | `DATABASE_URL`; in production `APP_ENV=production` and `APP_URL=https://…` (the process refuses `http://`, `PAYMENTS_MODE=dev` and `ENABLE_TEST_HOOKS=true` when `APP_ENV=production`); `TRUST_PROXY=true` behind a proxy (set `TRUSTED_PROXY_HOPS` when there is more than one) |
| **Real AI** | `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` (optionally `ANTHROPIC_MODEL`), or `AI_PROVIDER=openai` + `OPENAI_API_KEY` (+ `OPENAI_BASE_URL`, `OPENAI_MODEL` for any OpenAI-compatible endpoint). With `auto`, an Anthropic key wins over an OpenAI key, and no key means no AI (topic library and your own material only). With `anthropic`/`openai` and a missing key generation is refused up front, never silently no-AI. |
| **Real payments** | `PAYMENTS_MODE=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the webhook endpoint described in [Payments](#payments). Prices are not configured in Stripe, only in `src/config/plans.ts`. |
| **Stuck-job cleanup** (optional) | `CRON_SECRET` (≥ 16 characters) and a scheduler calling `POST /api/internal/reap` with `Authorization: Bearer $CRON_SECRET` every few minutes. Without it stuck jobs are still released when they are read. |

Run `npx prisma migrate deploy` on every release (it is idempotent). `GET /api/ai/status` answers without secrets and tells you which AI backend is active (`none`, `ai` or `unavailable` with the reason); it does not check the database.

### Rotating keys

The configuration is parsed once per process, so **every rotation ends with a restart** (or redeploy) of the app.

| Secret | How |
| --- | --- |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Create the new key at the provider, set the variable, restart, check `GET /api/ai/status`, then revoke the old key. Jobs that were running when the process stopped are released by the reaper after their deadline (the credit returns). |
| `STRIPE_SECRET_KEY` | Create or roll the key in the Stripe Dashboard, set the variable, restart, then revoke the old key. The key is used for checkout, the customer portal, cancellation and reading a Checkout Session back. |
| `STRIPE_WEBHOOK_SECRET` | The app verifies each webhook against **one** secret. Roll the endpoint's signing secret in the Dashboard and update the variable and restart straight away: deliveries signed with the other secret are refused with `400` and Stripe retries them later (they are idempotent by event id, so a retry is safe). |
| `CRON_SECRET` | Change the variable and the scheduler's header together; the endpoint answers `403` for anything else. |
| `DATABASE_URL` | Change the password or host at the database, update the variable, restart. The pool is 10 connections per process (`src/server/db.ts`). |
| Login sessions | Nothing to rotate. To sign everybody out, delete the rows of the `Session` table (`DELETE FROM "Session"`); a password change already signs out that user's other devices. |
| Android app (Supabase) | Only the project URL and the *publishable* key are in the app (`mobile/src/cloud/config.ts`); changing them needs a new app version. The service-role key exists only inside Supabase for the `delete-account` edge function and is never in this repository. |

### Running the AI evaluation (`npm run eval:ai`)

Use it before switching model or provider, and after changing prompts or the edit engine. It needs no database. Configure the backend with the same variables as the app
(`AI_PROVIDER` and the provider's key/model), then:

```bash
npm run eval:ai -- --dry                                    # list the 100 cases (70 generations, 30 edits); no model call, no cost
npm run eval:ai -- --yes --label my-model --price-in 3 --price-out 15   # real run: spends money at the provider; --yes is required
npm run eval:ai -- --compare eval-a.json eval-b.json        # compare two saved reports
```

Options: `--generate N` / `--edit N` (cases per kind), `--concurrency N` (default 2), `--deadline-ms N` (per case, default 600000), `--call-timeout-ms N` (per model call, default 240000), `--out file.json`
(default `eval-<label>.json`), `--price-in` / `--price-out` (USD per million tokens, for the cost columns). It refuses to run against the no-AI backend. Read the success rate first (accepted by `validateGameSpec`
and re-checked for game type, language and feature tier), then "needed no repair", p95 latency and cost per successful result. The report is written to the current directory and `.gitignore` does not cover `eval-*.json`, so pass `--out` with a path outside the repository or do not commit it.

### Backups and restore

* **PostgreSQL holds all server state:** users and profiles, login sessions, games and their saved versions, play sessions and progress, generation jobs, AI edits, subscriptions, allowance periods and usage, billing webhook events, rate-limit
  buckets. The app writes no files, so a database backup is a full backup. Use your host's automated snapshots / point-in-time recovery, or `pg_dump`, and keep at least one copy outside the database host.
* **Restoring:** restore into a database at the same migration level, then run `npx prisma migrate deploy`. If the snapshot is older than the last Stripe events, resend the missing events from the Stripe Dashboard: webhook handling is idempotent by event id and
  ordered, so already-applied events are no-ops. A restore has **not been rehearsed** in this repository; do one on a staging database before you need it.
* **Never** point tests at real data: the integration suite uses `levelup_test` and refuses names without "test".
* **Android app:** nothing is backed up by Android itself (Auto Backup is off on purpose). Users export a backup file (Settings → Backup) or sign in for the optional Supabase cloud backup; that project's own backups and settings are managed in the Supabase dashboard (see [`supabase/README.md`](supabase/README.md)).

---

## What needs your credentials

| Capability | Needs | Verified how, here |
| --- | --- | --- |
| Live AI generation (Anthropic or OpenAI-compatible) | an API key | Adapters, error mapping, timeouts, repair loop and validation are tested against mock servers. **No real model was called**, so output quality, the exact prompt tuning, and the optional refusal-fallback beta header were never exercised against the live API. |
| Live Stripe billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | The webhook pipeline is tested with genuinely Stripe-signed payloads (the SDK's own signer/verifier) and checkout/portal/cancel calls against a fake client asserting the exact parameters. **No request ever reached Stripe**; field shapes follow the installed SDK's types (API `2026-09-30`), so test in Stripe test mode before going live (use `stripe trigger`/Checkout with test cards). |
| Production database, domain, TLS | your infrastructure | – |

## Known limitations

* One subscription per user; changing plan means cancelling (access continues to period end) and subscribing again. In-place upgrade is not implemented
  (it also cannot cross currencies, e.g. a USD subscription into an ILS one).
* Partial refunds and disputes/chargebacks do not change entitlements. Taxes (Stripe Tax) are not configured.
* Without an AI provider a game needs your own material (the study engine only asks about what you wrote) or a topic from the library; a subject alone builds nothing.
* Challenge content for AI games is validated structurally and for solvability, but factual correctness of model output cannot be checked automatically.
* Game audio is synthesised (no recorded assets); 3D art is procedural (no imported models or textures).
* Playwright runs in Chromium only.
* The Unity renderer is untested against a real Unity build (see above); gameplay input is not handled inside Unity.
