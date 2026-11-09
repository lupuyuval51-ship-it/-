# LEVEL UP AI — Shared engineering contracts

This file is the agreement between the three development agents. If code and this file disagree, fix one of
them in the same commit. Additive changes are free; removing or renaming a field needs the lead (Agent 1).

Window: 2026-11-09T20:24:31Z → 2026-11-10T04:24:31Z. Founder decisions: `docs/PRODUCT_DECISIONS.md`.

## 1. Team and file ownership

| Agent | Role | Owns (only this agent edits) |
|---|---|---|
| 1 (lead) | architecture, backend, AI workflow, security, plans/ads policy, media pipeline engine, integration | `server.js`, `src/*.js`, `src/platform/**`, `scripts/**`, `tools/media/**`, `tests/core.test.js`, `tests/ai-path.test.js`, `tests/platform-*.test.js`, `docs/**` except the two files below, `package.json`, `.env.example`, `AGENTS.md`, `README.md` |
| 2 | game runtime, narrative, curriculum, educational mechanics, content, gameplay tests | `public/shared/**`, `public/play/**`, `src/games/**`, `content/**`, `tests/game-*.test.js`, `tests/play/**`, `docs/GAME_DESIGN.md` |
| 3 | UI/UX, mobile, accessibility, player integration, visual checks | `public/index.html`, `public/app.js`, `public/app/**`, `public/styles.css`, `public/sw.js`, `public/manifest.webmanifest`, `public/icons/**`, `public/fonts/**`, `tests/ui/**`, `docs/DESIGN_SYSTEM.md` |

Rules for every agent:

- Work in your own git worktree on your own branch. Commit small and often with clear messages. Never run
  `git add -A` outside your owned paths, never rewrite history, never touch another agent's files. If you need a
  change in a file you do not own, write the request into your handoff notes; do not make the edit.
- `public/vendor/three/three.module.min.js` (three.js r170, MIT) is vendored and read-only.
- No `npm install`, no CDN, no new runtime dependency. Dev-only tools may be run with `npx` but must not be
  required to run the app or the tests. Playwright is pre-installed globally (`require('playwright')` works,
  `chromium.launch()` needs no options) — never run `playwright install`.
- Never fake a result. No invented counts, testimonials, ratings, loading percentages or "AI" labels on
  rule-based code. Anything not verified is reported as not verified.
- No `eval`, `new Function`, inline `<script>`, or inline event-handler attributes: the CSP is `script-src 'self'`.
- Run before you hand off: `npm run typecheck && npm run lint && npm test`. Do not weaken or delete an existing
  test to get green; if a founder decision changes expected behavior, change the test and say so in the commit.
- Existing project rules in `AGENTS.md` still apply (central plan matrix, server-side scoring, private proofs,
  private-by-default minors, Hebrew default + working English).

## 2. Conventions

- **Language.** UI strings exist in English and Hebrew. Curated content is English first. A localized string in
  content/API payloads is an object `{ "en": "...", "he": "..." }` (`he` optional). Helper rule: show
  `value[locale] ?? value.en`. RTL must work for Hebrew; never hard-code left/right, use logical CSS properties.
- **IDs.** Lowercase kebab-case, no dots. Topic `programming-logic-basics`; game `<topicId>-g1..g4`;
  lesson `<gameId>-l1..`; mission `m01..`.
- **Levels.** Topic level `C` (beginner), `B` (intermediate), `A` (advanced).
- **Stages.** A topic has exactly four games: `discover`, `practice`, `apply`, `master`.
- **Content status.** `PLANNED`, `DRAFT`, `TECHNICALLY_VALIDATED`, `EDUCATIONALLY_REVIEWED`, `PLAYTESTED`,
  `APPROVED`, `PUBLISHED`. Nothing produced in this window may be marked above `TECHNICALLY_VALIDATED`
  (no human review or human playtest exists). Playtime evidence is `AWAITING_VALIDATION` until real people play.
- **API envelope.** Success `{ "ok": true, ... }`; failure `{ "ok": false, "error": { "code", "message", "details" } }`.
  Clients localize by `error.code` and fall back to `error.message`. Mutations need the `x-csrf-token` header
  (value from `/api/auth/me`), cookies are HttpOnly.
- **Design tokens** (CSS custom properties on `:root`, owned by Agent 3, used by everyone):
  `--bg #071611`, `--bg-2 #102A20`, `--surface #17372A`, `--gold #D9B45F`, `--gold-hi #F2D38A`,
  `--cream #F7F1E4`, `--white #FFFFFF`, `--muted #A8B9AE`, `--border #315344`, `--success #61C9A0`,
  `--warning #E9BA62`, `--error #E67C73`, plus spacing `--s1..--s16`, radius `--r-sm/--r-card/--r-modal`,
  `--speed`. Game CSS (`public/play/play.css`) must use these variables and define no colors of its own except
  3D material colors.

## 3. Game runtime contract (Agent 2 provides)

### 3.1 Shared, isomorphic modules — `public/shared/`

Pure ES modules. No DOM, no Node built-ins, no `Date.now()`/`Math.random()`; the server imports them by relative
path and the browser loads them from `/shared/...`.

```js
// public/shared/gamespec.js
export const SPEC_VERSION = 1;
export const CAPABILITIES;                    // registry: kinds, blocks, sensors, entity types, goal types, limits
export function validateGameSpec(spec);       // -> { ok: boolean, errors: [{ path, code, message }] }
export function toPublicSpec(spec);           // strips every server-only field (reference solutions, answer keys)

// public/shared/robot-sim.js   (capability kind "robot-program")
export const LIMITS;                          // { maxBlocks, maxDepth, maxSteps, maxGrid }
export function validateProgram(program, mission);   // -> { ok, errors: [{ path, code, message }] }
export function runProgram(mission, program);        // deterministic -> RunResult (below)
```

```ts
type Program   = { blocks: Block[] }
type Block     = { op: 'forward'|'left'|'right'|'pick'|'drop'|'use' }
               | { op: 'repeat', times: number, body: Block[] }
               | { op: 'if', cond: Cond, then: Block[], else?: Block[] }
               | { op: 'while', cond: Cond, body: Block[] }
type Cond      = { sensor: string, negate?: boolean }          // sensors come from CAPABILITIES
type RunResult = { status: 'success'|'failed'|'invalid',
                   reason: { code: string, text: {en: string, he?: string}, step?: number } | null,
                   goals: [{ id: string, met: boolean }],
                   stats: { blocks: number, steps: number },
                   stars: 0|1|2|3,
                   trace: Step[] }                              // per-step state for animation; client only
```

Agent 2 may add ops/sensors/entity types, but every one must be listed in `CAPABILITIES` and enforced by the
validators. Unknown identifiers are rejected, never ignored.

### 3.2 Server-side engine — `src/games/engine.js`

```js
export function listGameIds();                       // ids that have a spec on disk
export function loadGame(gameId);                    // -> { spec, meta } | null   (cached; spec validated on load)
export function publicSpec(gameId);                  // -> PublicGameSpec | null   (safe to send to any client)
export function evaluateRun(specOrGameId, missionId, program);  // -> RunResult without `trace`
export function getHint(specOrGameId, missionId, tier);         // tier 1..3 -> { text: {en, he?} } | null
export function referenceSolution(gameId, missionId);           // server/tests only, never sent to clients
```

`evaluateRun` must be deterministic and bounded (`LIMITS.maxSteps`), and must return `invalid` (not throw) for
any malformed program. Agent 1's routes call these and never trust a client verdict.

### 3.3 Content on disk — `content/`

```
content/taxonomy/domains.json          [{ id, title:{en,he}, description:{en,he} }]
content/taxonomy/topics/<domain>.json  [Topic]
content/games/<gameId>/spec.json       GameSpec v1 (public part)
content/games/<gameId>/solutions.json  { [missionId]: Program }      server-only
content/games/<gameId>/video/full.json     narration script + storyboard for the 30-minute video
content/games/<gameId>/video/recaps/<lessonId>.json   one recap script per lesson
```

```ts
type Topic = { id, domain, level: 'C'|'B'|'A', status,
               title: L, description: L, objectives: L[], prerequisites: string[], tags: string[],
               games: [{ id, stage, title: L, premise?: L, status }] }     // exactly 4, in stage order
type GameSpec = { specVersion: 1, id, topicId, stage, contentVersion: number, kind: 'robot-program',
                  title: L, summary: L, estimatedMinutes: number, learnerProfile: L,
                  story: { setting: L, role: L, problem: L, stakes: L, resolution: L },
                  lessons: [{ id, title: L, objective: L, explanation: L, example: L, keyTakeaways: L[] }],
                  missions: [Mission], completion: { requiredMissionIds: string[] } }
type Mission  = { id, lessonId, title: L, brief: L, ... }   // layout, entities, goals, allowed ops, maxBlocks,
                                                            // star thresholds, optional starter program, hints
```

The directory `content/` is never served statically. `L` = localized string object.

### 3.4 Browser runtime — `public/play/index.js`

```js
export async function mountGame(container, {
  spec,                 // PublicGameSpec
  save,                 // PlayerSave | null
  locale, dir,          // 'en'|'he', 'ltr'|'rtl'
  quality,              // 'auto'|'low'|'medium'|'high'  (never tied to the payment plan)
  reducedMotion,        // boolean
  api: {
    submitRun(missionId, program),   // -> Promise<{ verdict, progress, rewards }>   (server-authoritative)
    saveDraft(missionId, program),   // -> Promise<void>   (debounced by the runtime)
    requestHint(missionId, tier),    // -> Promise<{ text }>
    reportActivity(activeMs),        // -> Promise<void>   (runtime sends at most once per 30 s while active)
  },
  onEvent(evt),         // { type: 'mission_complete'|'game_complete'|'lesson_complete'|'exit'|'error', ... }
});                     // -> { destroy(), pause(), resume(), setQuality(q) }
```

The runtime owns everything inside `container`: 3D view, program editor, mission brief, hints, feedback. It
loads `/play/play.css` itself. Requirements: touch + mouse + keyboard; primary touch targets ≥ 44×44 CSS px; works
from 320 px wide in portrait; pauses rendering when hidden; releases GPU resources in `destroy()`; handles WebGL
context loss and falls back to a 2D board when WebGL is unavailable. The local simulation is only for animation:
progress and rewards come solely from `api.submitRun`.

`PlayerSave = { gameId, contentVersion, currentMissionId, missions: { [id]: { status, bestStars, bestBlocks,
attempts, lastProgram, completedAt } }, startedAt, updatedAt, completedAt, activeMs }`

## 4. HTTP API (Agent 1 provides)

Existing endpoints keep working unchanged. New endpoints (auth = signed-in user; CSRF on mutations):

| Method and path | Auth | Purpose and response |
|---|---|---|
| `GET /api/auth/me` | optional | existing, plus `entitlements`, `consent`, `ageBand` (see below) |
| `GET /api/topics?q=&domain=&level=&playable=&page=&pageSize=` | optional | `{ items: TopicCard[], total, page, pageSize, facets: { domains: [{id,title,count}], levels: {C,B,A} } }`; `pageSize` ≤ 48 |
| `GET /api/topics/:topicId` | optional | `{ topic: Topic, access: Access }` |
| `GET /api/free-access` | yes | `{ freeAccess: { mode: null|'C12'|'B1', topicIds: [], limits: { C: 12, B: 1 }, remaining: number } }` |
| `POST /api/free-access/select` `{ topicId, confirm: true }` | yes | uses the Free allowance; `409 free_mode_conflict` / `409 free_limit_reached` |
| `GET /api/games/:gameId` | yes | `{ game: PublicGameSpec, save: PlayerSave|null, access: Access, media: MediaItem[] }`; `403 locked` when not entitled |
| `POST /api/games/:gameId/missions/:missionId/run` `{ program }` | yes | `{ verdict, progress: { completedMissionIds, gameCompleted }, rewards: { xp, coins, achievements } | null }` |
| `PUT /api/games/:gameId/save` `{ missionId, program }` | yes | `{ saved: true }` |
| `POST /api/games/:gameId/hints` `{ missionId, tier }` | yes | `{ hint: { text } }` |
| `POST /api/games/:gameId/activity` `{ activeMs }` | yes | `{ activeMs }` (server caps each sample) |
| `POST /api/games/:gameId/restart` | yes | clears progress for that game, never revokes or re-grants rewards |
| `GET /api/progress` | yes | `{ xp, level, streak, achievements, games: [{ gameId, title, completed, total, completedAt }] }` |
| `GET /api/media/:mediaId/stream` | yes | video bytes with HTTP Range; never contains ads |
| `GET /api/media/:mediaId/captions.vtt`, `/transcript` | yes | WebVTT, plain text |
| `PUT /api/media/:mediaId/progress` `{ positionSec }` | yes | resume position |
| `GET /api/consent`, `POST /api/consent` `{ type: 'ads', granted }` | yes | consent record, can be withdrawn |
| `GET /api/projects`, `POST /api/projects` `{ prompt, options }` | yes | Studio projects; create returns `{ project, job }` |
| `GET /api/projects/:id`, `POST /api/projects/:id/edit|rollback|duplicate|publish|unpublish`, `DELETE /api/projects/:id` | yes | versions are immutable; rollback creates a new head |
| `GET /api/projects/:id/play`, `POST /api/projects/:id/missions/:missionId/run` | yes | same shapes as the game endpoints |
| `GET /api/jobs/:jobId` | yes | `{ job: { id, type, state, stage, stages: [{ id, state, startedAt, finishedAt, message }], error } }` |
| `GET /api/admin/overview`, `POST /api/admin/switches`, `GET /api/admin/jobs`, `GET /api/admin/content`, `POST /api/admin/content/status` | admin | control center |

```ts
type TopicCard = { id, domain, level, status, title: L, description: L, tags: string[],
                   playableGames: number, totalGames: 4, access: Access }
type Access    = { state: 'open'|'needs_login'|'needs_free_selection'|'needs_upgrade'|'not_available',
                   reason: string, requiredPlan?: 'plus'|'pro', preview: boolean }
type MediaItem = { id, kind: 'full'|'recap', gameId, lessonId?: string, locale, title: L, durationSec,
                   narrated: boolean, status, streamUrl, captionsUrl, transcriptUrl, posterUrl, resumeSec }
// GET /api/auth/me additions
entitlements: { planId, features, legacyPlan: boolean,
                ads: { enabled: boolean, reason: string, provider: 'none'|'test'|string, placements: string[],
                       frequency: { minSecondsBetween: number, maxPerSession: number } },
                freeAccess: {...}, studio: { monthlyGenerations, usedThisMonth, savedProjects, usedProjects,
                                             canPublish: boolean } }
consent:      { ads: 'unknown'|'granted'|'denied', updatedAt: string|null }
ageBand:      '13-15'|'16-17'|'adult'|'unknown'
```

Ad placements that may ever appear: `dashboard_inline`, `catalog_between_sections`, `game_complete`.
The client renders an ad slot only when `entitlements.ads.enabled === true` and only for a placement listed in
`entitlements.ads.placements`; it must not load any ad code otherwise. No ad slot may exist on the player,
video, lesson, Studio, checkout, coach or admin screens.

## 5. Screens and routes (Agent 3 provides)

Primary navigation: **Learn, Create, My Worlds, Progress, Profile**. Admin is separate and role-gated.

| Route | Screen |
|---|---|
| `/` | landing (signed out); signed-in users go to `/dashboard` |
| `/dashboard` | Continue Learning first, then shortcuts |
| `/learn` | topic catalog: search, domain and level filters, server pagination; tabs for existing guided paths, community marketplace and the Daily 3D Quest |
| `/learn/topic/:topicId` | topic details, four games in stage order, access state |
| `/play/:gameId` | game player (mounts Agent 2's runtime), lesson list, recap and full-video entry points |
| `/watch/:mediaId` | video player: play/pause, seek, captions, transcript, speed, fullscreen, resume, retry |
| `/create`, `/create/:projectId` | Creator Studio (desktop three-pane; mobile Chat / Preview / Edit / Activity views) |
| `/worlds` | saved projects |
| `/progress` | XP, level, achievements, per-game progress |
| `/profile`, `/profile/plan`, `/profile/privacy` | account, plan management, consent, export, deletion, support |
| `/admin` | existing admin plus control center |
| existing | `/onboarding`, `/path/:slug`, `/task/:id`, `/game`, `/marketplace`, `/pricing`, `/settings`, `/terms`, `/privacy` keep working |

Widths that must work: 320, 360, 375, 390, 414, 430, 600, 768, 1024, 1280, 1440. Safe-area insets, no global
zoom lock, visible focus, reduced motion, text scaling, touch targets ≥ 44 px, no horizontal scroll.

## 6. Handoff notes

Each agent ends a work session by writing `docs/handoff/agent-<n>.md` (its own file): what is done and
verified (with the command that proves it), what is partial or broken, requests to other agents, and the exact
next step. Keep it short and true.
