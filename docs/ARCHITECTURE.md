# DiscCoach – architecture & conventions

DiscCoach is a Hebrew-first (RTL) PWA: a personal Frisbee / Ultimate Frisbee coach with 90–120 minute
workouts, role-specific training, an exercise library, statistics, challenges and a Claude-powered coach.
**Everything is free. There is no paywall, subscription, credits or ads anywhere in the product.**

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 with runtime CSS variables (`src/app/globals.css`), logical properties for RTL/LTR |
| Icons | `lucide-react` |
| Client state | Zustand store persisted to IndexedDB (`src/store/appStore.ts`) – **local-first** |
| Validation | Zod |
| Database | Drizzle ORM. `DATABASE_URL` → PostgreSQL/Supabase; empty → embedded PGlite under `PGLITE_DATA_DIR` |
| AI | `@anthropic-ai/sdk`, server-side only, model from `CLAUDE_MODEL` (default `claude-opus-5`) |
| Charts | Recharts |
| Tests | Vitest (unit), Playwright (E2E, pinned Chromium) |

## Folder map

```
src/app/                Next.js routes (app router). (app)/ group = authenticated-or-guest shell with bottom nav.
src/app/api/            Route handlers (auth, sync, claude/*, admin/*, health)
src/components/ui/      Design-system kit (Button, Card, Input, Select, Chip, Sheet, Toast, Skeleton, EmptyState, …)
src/components/         Feature components (FieldDiagram, ExerciseCard, WorkoutCard, charts, …)
src/content/            Static content: exercise catalog (exercises/*.ts), workout library (workouts.ts), challenges, achievements
src/engine/             Pure TypeScript engines: workout generator, plan generator, stats, readiness, xp, streaks, replacement
src/i18n/               translate()/useT(); dictionaries per feature under messages/
src/lib/                types.ts (domain contract), dates, ids, format, localized, cn
src/server/             Server-only code: db (schema, client, migrate), auth, ai (claude client, prompts, validators, cache, rate limit), sync
src/store/              Zustand store + sync engine + selectors/hooks
scripts/                migrate.ts, generate-icons.ts, validate-content.ts, e2e-server.mjs
tests/unit, tests/e2e   Vitest + Playwright
public/                 manifest.webmanifest, sw.js, icons/, fonts/
```

## Domain contract

`src/lib/types.ts` is the single source of truth for domain types. Do not redefine domain shapes elsewhere.
Every user-facing string stored in data is `Localized = { he, en }`; UI strings go through `useT()`.

## Local-first data flow

* The UI always reads/writes the Zustand store (`useAppStore`). Guest and account users share the same code paths.
* Records live in `collections.<name>[id]`. Use `upsert(collection, record)` / `remove(collection, id)` (soft delete).
  Singletons: `profile`, `settings`, `activeSession` via `setProfile`, `updateSettings`, `setActiveSession`.
* Every write stamps `updatedAt` and enqueues the record in `syncQueue`. The sync engine (`src/store/sync.ts`) pushes
  the queue to `/api/sync/push` and pulls `/api/sync/pull?since=` for account users. Conflicts: newest `updatedAt` wins,
  ids are client-generated UUIDs so retries never duplicate. Local data is never deleted by sync.
* Guest → account: on register/login the client calls `markAllDirty()` then syncs, so local history moves to the account.
* Components must wait for `hydrated === true` (show `<Skeleton>`), never render placeholder data.

## Workouts

* `Workout` (types.ts) is the shared shape for library workouts, engine-generated, Claude-generated and custom.
* **Invariant:** `sum(phase.durationMinutes) === totalDurationMinutes` and inside each phase
  `sum(exercise.durationMinutes) === phase.durationMinutes`. `src/engine/workoutEngine.ts` exports `validateWorkout()`.
* Phase order for 90/105/120 min: checkin → warmup → throwing → movement → role → game → challenge → cooldown with the
  minute splits from the product spec (90: 3/12/20/15/20/10/5/5, 105: 3/12/25/15/25/15/5/5, 120: 5/15/30/15/30/15/5/5).
* The engine must never schedule a pair/group-only drill for a solo user; it swaps in `soloAlternativeId` or a
  drill with the same primary skill. Same rule for equipment and field size.

## Claude

* All calls go through `src/server/ai/claude.ts` from `/api/claude/*` route handlers. The browser never sees the key.
* The client sends a compact, privacy-filtered `CoachContext` (types.ts) built by `src/store/coachContext.ts`,
  validated on the server with Zod. The server owns the system prompt; the client cannot supply one.
* Structured outputs use `client.messages.parse` + `zodOutputFormat`. Generated workouts are validated with
  `validateWorkout()` and repaired/rejected before they reach the client. Raw JSON is never shown to users.
* Failure → local engine fallback + the Hebrew message from the spec (`coach.fallback.notice`).
* Cost protection: cache table keyed by request hash, in-memory + DB rate limits, bounded context, bounded max_tokens,
  request logs without content. None of this is ever presented as credits or paywall.

## UI conventions

* Mobile-first, one-hand use, 44px+ tap targets, bottom navigation (`בית / אימונים / מאמן AI / התקדמות / פרופיל`),
  sidebar on ≥ md screens.
* Use logical Tailwind utilities (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `start-0`) – never `ml/mr/left/right`.
* Colours only via tokens (`bg-surface`, `text-muted`, `bg-primary`, `text-accent`, …). No gradients on cards, no glassmorphism.
* Every screen: loading skeleton, empty state with a real action, error state with retry. No lorem ipsum, no fake numbers.
* i18n: add keys to the matching `src/i18n/messages/<feature>.ts` in **both** `he` and `en`. Hebrew must read naturally.

## Testing gates

`npm run typecheck && npm run lint && npm test && npm run build` must pass. E2E: `npm run test:e2e`.
