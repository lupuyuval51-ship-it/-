# DiscCoach – HTTP API & environment

All routes live under `/api` (Next.js App Router route handlers, Node runtime). Requests and responses are JSON.
Domain shapes come from `src/lib/types.ts`; request/response envelopes from `src/lib/serverTypes.ts`.
The client never talks to Claude directly – every coach call goes through `/api/claude/*`.

**Everything is free for users.** Rate limits, caching and logging are silent cost protection and are never
presented as credits, quotas, premium or upgrades.

## Conventions

| Topic | Rule |
|---|---|
| Errors | `{ ok: false, code, message, retryAfterSeconds?, issues? }`. `message` is Hebrew by default (English when the request carries `x-dc-locale: en` or the coach context locale is `en`). The client maps `code` through `auth.error.<code>` / `api.error.<code>` in `src/i18n/messages/auth.ts` and falls back to the server text. Never a stack trace. |
| CSRF | Every mutation (POST/PUT/DELETE) requires the header `x-dc-client: 1`. Combined with the `SameSite=Lax` cookie this blocks cross-site form posts and fetches. Missing header → `403 csrf`. |
| Auth cookie | `dc_session` – HttpOnly, SameSite=Lax, Path=/, Secure in production, 30-day expiry. The cookie holds a random 32-byte token; only its SHA-256 hash is stored (`auth_sessions.token_hash`). |
| Guests | Coach routes accept guests identified by `x-dc-guest: <guestId>` (a random id kept in the store – never personal). Sync and account routes need a session. |
| Locale | `x-dc-locale: he|en` selects the error language; coach routes use `context.locale`. |
| Body size | Bounded per route (auth 20 KB, coach 60–300 KB, sync 8 MB). `413 payload_too_large` beyond that. |
| Validation | Zod, strict shapes with length caps; unknown keys are stripped. Failures → `400 validation` with `issues: [{ path, message }]`. |
| Rate limits | Auth routes: 20 attempts / 15 min per IP (`AUTH_RATE_LIMIT_PER_15M`). Coach routes: per subject (`user:<id>` / `guest:<id>` / `ip:<ip>`) per hour and per day + a per-IP window (4× the hourly limit) + admin blocks. Limited → `429 rate_limited` with `retryAfterSeconds` and a calm Hebrew message. |

Error codes: `invalid_credentials`, `email_taken`, `invalid_email`, `weak_password`, `unauthorized`, `forbidden`,
`rate_limited`, `csrf`, `validation`, `payload_too_large`, `not_found`, `internal`, `session_expired`, `maintenance`,
`ai_unavailable`, `bad_json`, `exercise_exists`, `workout_exists`.

## Health

| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `{ ok: true, db: "pglite" \| "postgres" \| "error", claudeConfigured, version, time }` (503 when the DB cannot open) |

## Auth

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password (≥ 8), name? }` | `201 { ok, user }` + cookie |
| POST | `/api/auth/login` | `{ email, password }` | `{ ok, user }` + cookie |
| POST | `/api/auth/logout` | – | `{ ok }` (cookie cleared, session row deleted) |
| GET | `/api/auth/me` | – | `{ ok, user \| null }` (null for guests – never an error) |
| POST | `/api/auth/delete-account` | – (session) | `{ ok }` – deletes **every** row owned by the user, then the user |
| GET | `/api/auth/export` | – (session) | `{ ok, exportedAt, user, profile, settings, activeSession, collections }` as an attachment |

`user` = `{ id, email, name, role: "user" | "admin", createdAt }`.

**Admin role.** Granted at registration when the email is listed in `ADMIN_EMAILS` (comma-separated, case-insensitive).
First-run rule: when `ADMIN_EMAILS` is empty **and** the users table is empty, the very first account becomes admin so a
fresh deployment always has an administrator. Later accounts are plain users.

## Sync (account users)

Local-first: the client keeps everything in IndexedDB and syncs in the background (`src/store/sync.ts`).

| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/sync/push` | `{ records: SyncRecord[] }` (≤ 500) | `{ ok, accepted: "collection:id"[], conflicts: SyncRecord[], rejected: [{ key, reason }], serverTime }` |
| GET | `/api/sync/pull?since=ISO&cursor=&limit=` | – | `{ ok, records: SyncRecord[], nextCursor, serverTime }` (page ≤ 1000, all collections + singletons, `updated_at > since`) |

`SyncRecord = { collection, id, updatedAt, deletedAt?, data }` where `collection` is a `SyncedCollection` or
`SyncedSingleton` from `types.ts` (`profile`, `settings`, `activeSession` use their name as id; `aiConversations`
has the single id `coach`).

Rules: newest `updatedAt` wins (equal timestamps are accepted, so retries are idempotent); an older incoming record is
kept server-side and returned in `conflicts`; deletions are soft (`deletedAt`) and server rows are never removed by sync.
Pushing a `profile` refreshes `role_preferences` / `goals` / `equipment`; a `workouts` record refreshes
`workout_phases` / `workout_exercises`; a `completedSessions` record recomputes `progress_metrics`.

### Client sync engine

`startSync()` (idempotent) is meant to be mounted once from the client root (`useSyncEngine()` in
`src/store/useSync.ts`). It only acts while `auth.mode === "account"` and runs a push+pull cycle:
immediately on start / hydration, 1.5 s after any local write (debounced), on `online`, on window focus /
tab visible, and every 60 s. `syncNow()` runs a cycle on demand, `stopSync()` tears the engine down.
`syncStatus` in the store is `idle | syncing | offline | error | disabled` with the pending count; a 401 sets
`error: "session_expired"` and pauses automatic syncs until the user signs in again.
Account actions live in `src/store/auth.ts` (`register`, `login`, `logout`, `me`, `deleteAccount`, `exportData`):
signing in calls `markAllDirty()` so guest history moves to the account, then `syncNow()`.

## Claude coach (`/api/claude/*`, POST, guests allowed)

Every route: CSRF header → Zod body → subject (account / guest / ip) → maintenance & key check → free answers
(templates, cache) → rate limit → Claude or rule-based fallback → one `ai_request_logs` row (no content, hashed ip/guest).
`context` is the compact `CoachContext` built by `src/store/coachContext.ts` (name ≤ 40 chars, notes ≤ 160,
≤ 5 recent sessions, arrays capped). Structured outputs use `client.messages.parse` + `zodOutputFormat`.

| Path | Request | Response |
|---|---|---|
| `/api/claude/chat` | `{ message (≤ 1500), summary? (≤ 1200), recent?: {role, content}[] (≤ 8), context }` | `{ ok, reply, source: "claude" \| "template" \| "cache", actions: ChatAction[], summaryUpdate? }` |
| `/api/claude/generate-workout` | `{ request: WorkoutRequest, context }` | `{ ok, workout: Workout, source: "claude" \| "cache" \| "engine", notice? }` |
| `/api/claude/analyze-session` | `{ session: CompletedSession, results: ExerciseResult[] (≤ 60), previous?, context }` | `{ ok, summary (≤ 700), nextFocus: string[], source: "claude" \| "fallback" }` |
| `/api/claude/generate-plan` | `{ weeksCount (1–16), context, baselineSummary? }` | `{ ok, source, weekThemes: [{ index, theme, goal, focusSkills }], coachMessage }` |
| `/api/claude/weekly-review` | `{ weekSessions: CompletedSession[] (≤ 7), context }` | `{ ok, review, adjustments: [{ kind: intensity \| rest \| focus \| volume, note }], source }` |
| `/api/claude/replace-exercise` | `{ exercise: WorkoutExercise, reason, context, candidates: [{ id, name, skills }] (≤ 8) }` | `{ ok, choiceId?, custom?: WorkoutExercise, rationale, source }` |

Behaviour per route:

* **chat** – `src/server/ai/templates.ts` answers ~28 basic questions locally (≥ 2 keyword hits incl. one specific
  keyword, message ≤ 120 chars) with `source: "template"`; template-eligible questions are cached across users;
  otherwise Claude answers with a rolling `summaryUpdate` (≤ 400 chars) the client stores instead of full history.
  `actions` are derived heuristically (workout → `generate_workout`, drill → `replace_exercise`, plan → `add_to_plan`,
  always `ask_more`).
* **generate-workout** – Claude receives the exact phase minute template and a ≤ 60-line eligible catalog; the JSON is
  converted (`convert.ts`), repaired when durations drift ≤ 10 %, validated with `validateWorkout()`. Any failure
  (no key, error, timeout, refusal, invalid JSON, validation) → local `generateWorkout()` with
  `source: "engine"` and the notice “המאמן החכם אינו זמין כרגע, לכן הכנו לך אימון מתאים מתוך ספריית האימונים. כל ההתקדמות שלך תמשיך להישמר.”
  (English for `context.locale === "en"`). Cached by request + context essentials; Claude-authored workouts of account
  users are stored in `ai_generated_workouts`.
* **analyze-session / weekly-review** – never cached; rule-based text from the supplied numbers when Claude is unavailable.
* **generate-plan** – cached; fallback `source: "engine"` with empty `weekThemes` (the local plan engine builds the sessions).
* **replace-exercise** – cached; fallback is the first candidate.
* Rate limited → `429 { ok: false, code: "rate_limited", retryAfterSeconds, message }` with
  “המאמן החכם עמוס כרגע, נסו שוב בעוד כמה דקות. האימון שלכם ממשיך כרגיל.”
* Maintenance notice set by an admin → `503 maintenance` with the notice text; missing key → `503 ai_unavailable`
  (routes with a rule-based fallback answer 200 instead).

## Catalog

| Method | Path | Response |
|---|---|---|
| GET | `/api/catalog/overrides` | `{ ok, enabled: Exercise[] (admin additions + edited builtin drills), disabledIds: string[], updatedAt }` – server-cached 5 min, `Cache-Control: public, max-age=300` |

## Admin (`requireAdmin` – 401 for guests, 403 for users)

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/admin/overview` | – | `{ ok, windows: [{ window: 24h \| 7d \| 30d, calls, byStatus, actions: [{ action, calls, byStatus, avgLatencyMs, p95LatencyMs, inputTokens, outputTokens, cacheHitRate, jsonInvalid }], avgLatencyMs, p95LatencyMs, jsonInvalid, cacheHitRate, errorCodes (top 10) }], mostReplacedExercises, activeUsers7d, usersTotal, claudeConfigured, model, generatedAt }` |
| GET | `/api/admin/logs?limit&cursor&action&status` | – | `{ ok, logs: AdminLogRow[], nextCursor }` (newest first, ≤ 200 per page) |
| GET / PUT | `/api/admin/settings` | PUT `{ claude_model?, ai_rate_limit_per_hour?, ai_rate_limit_per_day?, maintenance_notice? }` (null clears) | `{ ok, settings, effective: { model, perHour, perDay, maintenanceNotice } }` – settings override env at runtime (30 s cache) |
| GET | `/api/admin/exercises` | – | `{ ok, exercises: [{ exercise, source: builtin \| admin, enabled, modified, updatedAt }] }` – builtin drills are seeded into `exercise_catalog` on first listing |
| POST | `/api/admin/exercises` | `Exercise` | `201 { ok, exercise }` (409 `exercise_exists`) |
| PUT | `/api/admin/exercises` | `{ id, exercise?, enabled? }` | `{ ok, exercise }` (builtin drills get an override row) |
| DELETE | `/api/admin/exercises?id=` | – | `{ ok, deleted, disabled }` – admin drills are removed, builtin drills are disabled |
| GET / POST / PUT / DELETE | `/api/admin/workouts` | POST `Workout` · PUT `{ id, workout }` · DELETE `?id=` | `{ ok, workouts }` / `{ ok, workout }` – library additions stored in `workouts` with `user_id = "library"`, validated with `validateWorkout()`, soft-deleted |
| GET / POST / DELETE | `/api/admin/blocks` | POST `{ subject: user:… \| guest:… \| ip:…, reason?, hours }` · DELETE `?subject=` | `{ ok, blocks: [{ subject, reason, createdAt, until }] }` |
| GET | `/api/admin/users` | – | `{ ok, count, users: [{ id, emailMasked (a***@b***.com), role, createdAt, lastLoginAt, sessionsCount }] }` |

## Database

Drizzle (pg-core) schema in `src/server/db/schema.ts`; migrations under `drizzle/` (`npm run db:generate` after schema
changes, `npm run db:migrate` to apply – `getDb()` also migrates automatically on first use).
`DATABASE_URL` set → PostgreSQL / Supabase via `pg`; empty → embedded PGlite under `PGLITE_DATA_DIR`.
`COLLECTION_TABLES` maps every synced collection / singleton to its table.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | – | Claude access (server only). Unset → every coach route uses templates / cache / local fallbacks. |
| `CLAUDE_MODEL` | `claude-opus-5` | Model id (overridden at runtime by the admin setting `claude_model`). |
| `CLAUDE_EFFORT` | `medium` | `output_config.effort`: low \| medium \| high \| xhigh \| max. |
| `CLAUDE_MAX_OUTPUT_TOKENS` | `6000` | Cap on output tokens per call (chat uses ≤ 1200). |
| `AI_REQUEST_TIMEOUT_MS` | `90000` | SDK timeout; a hard AbortController guard fires 5 s later. |
| `AI_RATE_LIMIT_PER_HOUR` / `AI_RATE_LIMIT_PER_DAY` | `40` / `150` | Coach calls per subject (admin settings override). |
| `AI_CACHE_TTL_HOURS` | `24` | Coach response cache TTL. |
| `AUTH_RATE_LIMIT_PER_15M` | `20` | Auth attempts per IP per 15 minutes. |
| `DATABASE_URL` | – | PostgreSQL connection string; empty → PGlite. `DATABASE_SSL=1` forces SSL. |
| `PGLITE_DATA_DIR` | `./data/pglite` | PGlite directory (`memory://` for in-memory). |
| `DRIZZLE_MIGRATIONS_DIR` | `./drizzle` | Migrations folder (tests / packaging). |
| `SESSION_SECRET` | – | HMAC key for hashed ips / guest ids in logs. Set a long random string. |
| `ADMIN_EMAILS` | – | Comma-separated emails that become admin on registration (see first-run rule). |
| `APP_URL`, `PORT` | `http://localhost:3000`, `3000` | App URL / port. |

## Scripts

* `npm run db:migrate` – `scripts/migrate.ts`, applies migrations to `DATABASE_URL` or the PGlite directory.
* `node scripts/e2e-server.mjs` – builds when `.next` is missing (or `E2E_FRESH_BUILD=1`), wipes `PGLITE_DATA_DIR`,
  starts `next start -p $PORT` and forwards signals (used by `playwright.config.ts`).
