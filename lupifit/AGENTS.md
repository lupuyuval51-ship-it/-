# LUPU-FIT engineering notes

LUPU-FIT is a bilingual (Hebrew default / RTL, English / LTR) AI fitness & nutrition app.
Stack: React 19 + TypeScript (Vite) · Node.js 22.13+ / Express 5 (TypeScript) · PostgreSQL 16 · zod · Anthropic Claude (server-side only) · Vitest · Playwright.

## Layout
- `shared/` — code used by both server and client: enums (`constants.ts`), API DTO types (`types/<module>.ts`), zod request schemas (`schemas/<module>.ts`), pure math (`nutrition.ts`, `training.ts`, `timer.ts`, `dates.ts`, `gamification.ts`). Pure functions only, no I/O.
- `server/src/` — `app.ts` (middleware + router mounting), `config.ts`, `db/` (pool, migrations runner, seeder, `migrations/NNNN_*.sql`), `middleware/`, `lib/`, `ai/llm.ts` (the only LLM entry point), `modules/<module>/{routes,service,...}.ts`, `data/` (built-in exercise/food/meal datasets).
- `client/src/` — `api/` (fetch client + query keys), `auth/`, `i18n/` (`locales/{en,he}/<module>.ts`), `components/ui` (shared UI kit), `components/charts`, `layout/`, `pages/<module>/`, `features/<module>/` (module components & API helpers), `hooks/`, `lib/`, `styles/` (`global.css` + `<module>.css`).
- `e2e/` — Playwright specs (`tests/*.spec.ts`), fake LLM server, E2E DB reset.

## Non-negotiable rules
- **Authorization**: every query on user data filters by `user_id = $userId` from `req.auth` (use `userId(req)`). Another user's resource returns **404** (never reveal existence). Never trust ids from the client without an ownership check.
- **Validation**: every request body/query/param goes through zod (`parseBody/parseQuery/parseParams`) with schemas in `shared/schemas`. Database CHECK constraints are the last line of defence, not the first.
- **SQL**: parameterized queries only (`$1…`). Multi-step writes in `db.tx(async (tx) => …)`; pass `tx` down to helpers.
- **Errors**: throw `HttpError` helpers (`lib/errors.ts`) with stable snake_case `code`s. Client shows `errorMessage(err, i18n, '<module>')` → `<module>.errors.<code>` → `errors.<code>` → generic.
- **Never fabricate**: stats, records, insights, nutrition numbers and coach answers come only from stored data or the built-in datasets. Show empty states when there is no data. Never claim a video exists unless `media` is set; built-in animations come from `shared/animation` (`hasAnimation`).
- **AI**: only through `server/src/ai/llm.ts` (`generateText`, `generateJson`). The API key never leaves the server. Model output is validated (zod) before use and never sets rewards, ids or permissions. Every AI feature has a non-AI fallback or a clear "not configured" state.
- **Health & safety**: minors (13–17) never get calorie deficits or max-effort work; adults never get targets below the computed safe minimum; reward consistency, not excess (XP caps in `shared/gamification.ts`). Provide safety guidance, not medical diagnosis.
- **Duplicate submissions**: create/finish actions use `useIdempotentMutation` (sends `Idempotency-Key`) and disable buttons while pending.
- **i18n**: no hard-coded user-visible strings. Add keys to `client/src/i18n/locales/en/<module>.ts` and the same keys to `he/<module>.ts` (type-checked). Hebrew must be natural; prefer gender-neutral phrasing.
- **RTL**: CSS uses logical properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`…). Direction-dependent icons use the `icon-dir` class.
- **Accessibility**: labelled controls, keyboard-operable, focus-visible, `aria-live` for async results, icon-only buttons need `label`.
- **Migrations**: forward-only, never edit an applied migration; add `server/src/db/migrations/NNNN_description.sql`.

## Commands (run from `lupifit/`)
```
npm run dev            # API (tsx watch, :3000) + Vite (:5173, proxies /api)
npm run db:setup       # migrate + seed content
npm run typecheck && npm run lint && npm run validate:content   # lint = security scan + design ratchet + e2e copy lock
npm run animation:qa   # exercise animation QA (ROM, IK reach, pops, penetration, uniqueness) -> reports/animation-coverage.md
npm run test:server    # Vitest + real PostgreSQL (TEST_DATABASE_URL, default fitai_test)
npm run test:client    # Vitest + jsdom
npm run build          # dist/client + dist/server
npm run test:e2e       # Playwright (builds must exist; uses fitai_e2e DB + fake LLM)
```

## Brand vs. persistent identifiers
The product is **LUPU-FIT** (it grew out of FITAI). User-visible text says LUPU-FIT, but these identifiers intentionally still say `fitai` because renaming them would log users out or drop unsynced offline sets: the session cookie (`fitai_session`), localStorage keys (`fitai.*`), the service-worker cache prefix (`fitai-shell-`), database names (`fitai`, `fitai_test`, `fitai_e2e`) and applied migrations. Rename them only in a dedicated change with a client-side migration.

## Design system (orange × black — see `docs/PLAN.md` §4)
- Tokens live only in `client/src/styles/global.css` (`:root` + `[data-theme]` blocks). Module CSS uses tokens, never raw hex or px font sizes.
- Black creates the atmosphere, orange creates the focus: one filled orange action per screen (`.btn-primary` or the current set's `.set-check`); orange as text/icon uses `--primary-text`; thin indicators (active tab bar, current tally mark, progress) use `--accent-line`. Text on orange is black (`--primary-contrast`); white on orange fails WCAG.
- No gradients, glows, glass/blur, decorative shadows, pills or radii above 8px. Shadows are for overlays only (`--shadow-overlay`). Only switches, status dots, radio indicators and spinners are round (mark the line `design-lint-ignore: <reason>`).
- Numbers use `.num` (tabular) and `--font-num` (Barlow Condensed) for display figures; UI text is Heebo. Fonts are self-hosted (`@fontsource`, OFL).
- Progress is shown with `<Tally>` (signature tick marks) rather than new rings.
- Guards: `scripts/design-lint.mjs` (counts may only go down; `--update` after an improvement), `client/src/styles/tokens.test.ts` (WCAG contrast for every token pair in both themes), `scripts/e2e-strings.mjs` (every string an e2e spec looks up must still exist; `--update` only together with a spec change).

## Data kept on the device (offline-first rules)
- **Outbox** (`client/src/features/offline`): only *creates* (food log, quick add, weigh-in) are queued, with the same `Idempotency-Key` as the original attempt (the server remembers keys for 24 h; older entries are flagged). Mutations that use `sendOrQueue` must set `networkMode: 'always'` — TanStack Query otherwise pauses them while offline. Entries the server rejects stay visible as "Rejected" until discarded; they are never dropped silently. Edits and deletes stay online-only. Entries are sent strictly oldest first (a later one waits while an earlier one backs off). Stored per user under `fitai.outbox.<userId>` (the old single `fitai.outbox` key moves to its owner's key on their next sign-in); every write re-reads the stored list and other tabs follow via the `storage` event. **Logout keeps** a user's unsynced entries under their own key (only their session loads them; they sync on their next sign-in); account deletion removes them.
- **Drafts** (`useDraft`): unfinished forms, per user, 3-day TTL, emptied on submit and wiped on logout. Never store secrets or anything that must be reliable.
- **Workout settings** are local-first and synced to `users.workout_prefs`; the account copy is adopted unless this device has an unsynced change by the same account (`lib/prefsDirty.ts`). The device's settings belong to one account at a time (claimed on sign-in): on a shared device another account's settings and unsynced change are replaced, never uploaded. Settings from before they had an owner are treated the same way (adopt the account copy, or the defaults when it has none).
- **Backup file** (`features/backup`): account export + device state. Restore only re-creates things through the normal validated create endpoints and only what is missing (idempotent); plans/history/records/coach chats are archive-only.
- Keys use the `fitai.*` prefix (see "Brand vs. persistent identifiers"). New per-user device data must be scoped by user id and cleaned up on logout when it holds health data.

## Daily menu and ready dishes
- The 300 dishes (`shared/dishes/data.ts`) and their photos (`client/public/dishes/`) were imported from the NINJA app; **photo source/licence is unknown** (see `docs/dishes-source.md`). Never describe them as licensed. Nutrition values are estimates and must be labelled so.
- The dishes have **no allergen data**. `shared/dishes/safety.ts` hides dishes by broad keyword rules on names and ingredients and errs toward hiding. It is not an allergen guarantee: the menu page must keep its "check the ingredients yourself" notice (stronger when the user listed allergies). When adding a keyword, add it for English and Hebrew and extend `shared/menu.test.ts`.
- `shared/menu.ts` is pure and deterministic (seed = date); the menu is rebuilt from the profile each time and only swaps / "logged" marks are stored on the device (draft key `menu.<date>`). Logging a dish is a quick add through `sendOrQueue` (works offline).
- Dish photos are not precached by the service worker (8 MB); they are cached on first view. `npm run docs:dishes` regenerates `docs/menu-foods.md`.

## Age-based training
- `shared/age.ts` defines the bands: under 18 (own minor rules in the generator), 18–49 (unchanged), 50–64 (RPE cap 8, +15 s rest), 65+ (RPE cap 7.5, +30 s rest, at most 4 sets, 8+ reps on externally loaded exercises only (`isExternallyLoaded`: weights, machines, cables and resistance bands), no advanced exercises, no jumping or other high-impact exercises (`isHighImpact`: plyometrics plus burpees, jumping jacks, jump rope, high knees, sprints) in plans or as progression variations, one-increment progression). Rules only ever make a plan easier: `intensity: harder` cannot lift past the cap, and bodyweight/calisthenics rep targets (e.g. from a push-up/pull-up benchmark) are never raised. They are general conservative defaults, not medical advice, and every plan that uses them says so in a generation note (`age_mature`, `age_senior`).

## Phone notifications (Web Push)
- Server: `server/src/modules/push` (`web-push`, VAPID from `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`). Without valid keys push is off: `GET /api/push/public-key` says `enabled: false`, the settings hide the option and the reminder job does not start. Never crash on bad keys and never log keys, endpoints or `p256dh`/`auth` (log the push-service host and row id).
- Endpoints come from browsers, so the server only delivers to known push-service hosts (`PUSH_ENDPOINT_HOSTS`). 404/410 from a push service deletes the subscription.
- Reminder job (`scheduler.ts`): `dueReminders` is pure; `runReminderTick` claims each slot in `push_deliveries` (user, kind, local date, slot) before sending, so a reminder goes out at most once, from its time until 10 minutes later. The server entry starts it outside tests; tests call `runReminderTick` with a fixed time and mock `web-push`.
- Texts follow `users.locale`; the tag matches the in-app reminders (`fitai-workout`, `fitai-meal:HH:MM`) so they replace each other. `public/sw.js` only opens the paths in its `PUSH_PATHS` list.
- Client: `features/push`. Permission is requested only from the user's tap. A subscription belongs to the browser, so `fitai.pushOwner` (a user id) records which account turned it on; only that account re-registers the device automatically, logout unregisters it on the server.


## Device mode (no server, no database service)
- `npm run build:device` builds the app with the server inside it: `server/src` runs unchanged in a Web Worker on PGlite (PostgreSQL in WebAssembly, IndexedDB). Details and file map: `client/src/device/README.md`. The hosted server mode is unchanged.
- `isDeviceMode` / `isNativeApp()` / `platform` (saveFile, reminders) come from `client/src/platform`; features never check Capacitor or the build mode any other way. Device-only code is loaded through `features/device/start` (server builds stub it out). Decide "offline → queue or wait" with `apiOffline()`, never `navigator.onLine`: in device mode the API is inside the app and always reachable (only the barcode lookup needs the internet).
- One database connection, one request at a time: never call `db.*` (pool) inside a `db.tx` callback; pass `tx` down. `npm run test:server:device` (server suite on PGlite + shims + worker flows) must stay green; skips only with a written reason in `client/src/device/testing/pglite-skips.ts`.
- The device account is hidden: no login/register/password screens in device mode (guards redirect; the worker answers those routes `not_available_on_device`). Never store its credentials anywhere but the worker's `device.account` row.
- Screens in device mode say only what is true there (`client/src/device/README.md`, "Screens in device mode"): first run is the welcome (name only, `/welcome`, `RequireWelcome`) then the questionnaire; no login/password/e-mail/sign-out controls; settings start with "Your data on this phone" (backup file, restore, erase all with two confirmations); no Web Push UI (reminders go through `platform.reminders`); no AI-only features or "configure a provider" text (coach is "Coach", no photo tab); the barcode lookup says it needs internet. Branch on `isDeviceMode` with `device.*` i18n keys rather than changing server-mode copy.
- Device backup = the website's backup file plus `device.snapshot` (exact database rows, `worker/snapshot.ts`); restore replaces everything in one transaction. A new per-user table must be added to `SNAPSHOT_TABLES` or `NOT_IN_SNAPSHOT` (a test checks the coverage). Never put the hidden account's e-mail/password/cookie in a file.
- Every file the app saves goes through `platform.saveFile` (`downloadJson` uses it).
- `npm run test:e2e:device` (after `build:device`): static `dist/device`, Pixel 7, port 4620 (`E2E_DEVICE_PORT`); `DEVICE_SHOTS=<dir>` saves the Hebrew screenshot pass.
- **Nothing leaves the phone except the barcode lookup** (Open Food Facts, `DEVICE_CSP` in `client/vite.config.ts`). A new remote host, permission, SDK or kind of stored data is a privacy change: update the device legal texts (`legal.device` in `locales/{he,en}/legal.ts`), `docs/play-store/data-safety.md` (Part 1) and the listing in the same change. Never add analytics, crash-reporting or ad SDKs.
- **Legal pages follow the build**: `features/legal/documents.ts` picks the hosted or device texts; a hosted text shown in device mode must be true there (the `SHARED` list in `features/legal/legal.test.ts`). Keep the visible draft notice and `[placeholders]` until a lawyer approves. `npm run legal:static` writes the device texts as static HTML (`dist/legal/`) for the public Play URL. Docs: `docs/device-mode.md` (English), `docs/device-mode-he.md` (owner, Hebrew).
- **Never edit an applied migration**: on phones a changed checksum stops the app at start-up and nobody can repair it remotely. Migrations run on every phone at the first start after an update (`migrate(log, DEVICE_MIGRATIONS)`), so keep them quick and PGlite-compatible.

## Android app (device mode, Capacitor: `android/`)
- `capacitor.config.ts` (appId `com.lupufit.app`, webDir `dist/device`, `https://localhost`: never change the scheme or host, the IndexedDB database belongs to that origin). `android/build-release.sh` = device build + `cap sync` + signed `.aab` and `.apk` + signature/manifest checks; signing only from `LUPUFIT_KEYSTORE*` env vars. Version only in `android/version.properties` (raise `versionCode` for every Play upload). Docs: `docs/android.md`. The Trusted Web Activity for hosted mode lives in `android-twa/` (`docs/android-twa.md`; same package id: only one can be the Play listing).
- Native code is `client/src/platform/native/` only, loaded with a dynamic import from `features/device/start` when `isNativeApp()`; features use `platform` (`saveFile`, `reminders`, `onResume`), never `@capacitor/*` directly. Web and server builds must work without any Capacitor plugin.
- Reminders: one-off local notifications for 14 days, ids from day + slot, synced by `PhoneReminderSync` (start, resume, settings, after any successful mutation). **Inexact only**: never add `USE_EXACT_ALARM`; the manifest removes `SCHEDULE_EXACT_ALARM` and the build fails if one appears. Notification permission is requested only from a tap (`PhoneRemindersControl`); `sync` never schedules without permission (the plugin would ask by itself).
- Android backup rules (`res/xml/data_extraction_rules.xml`, `backup_rules.xml`) include only the WebView's IndexedDB and Local Storage, encrypted cloud copies only on Android 9+ (Android 7–8 ignore `requireFlags`, so cloud copies there are not end-to-end encrypted; the privacy policy says so). Keep both files and the legal texts in step.
- Page layout under the system bars: use `--safe-top` / `--topbar-h` (it includes the status bar) and `env(safe-area-inset-bottom)`; full-screen layouts need both.
- Icons: `node scripts/make-android-icons.mjs` (from `client/public/favicon.svg`).

## Deployment kit (one VM)
- `deploy/oracle/`: Docker Compose for one Ubuntu/Debian VM (db + app + Caddy HTTPS, amd64 + arm64). `setup.sh` (idempotent, `--dry-run`, never overwrites `.env`), `update.sh`, `backup.sh`; guides `docs/deploy-oracle.md` and `docs/deploy-render.md` (Hebrew). Never commit `.env`.
- Caddy adds no security headers (the app sends its own CSP/HSTS); the db is never published; NODE_IMAGE/POSTGRES_IMAGE/CADDY_IMAGE in `.env` override the multi-arch image tags. Check changes with `shellcheck -x deploy/oracle/*.sh` and `docker compose config`.
