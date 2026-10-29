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
- **Outbox** (`client/src/features/offline`): only *creates* (food log, quick add, weigh-in) are queued, with the same `Idempotency-Key` as the original attempt (the server remembers keys for 24 h; older entries are flagged). Mutations that use `sendOrQueue` must set `networkMode: 'always'` — TanStack Query otherwise pauses them while offline. Entries the server rejects stay visible as "Rejected" until discarded; they are never dropped silently. Edits and deletes stay online-only.
- **Drafts** (`useDraft`): unfinished forms, per user, 3-day TTL, emptied on submit and wiped on logout. Never store secrets or anything that must be reliable.
- **Workout settings** are local-first and synced to `users.workout_prefs`; the account copy is adopted unless this device has an unsynced change (`lib/prefsDirty.ts`).
- **Backup file** (`features/backup`): account export + device state. Restore only re-creates things through the normal validated create endpoints and only what is missing (idempotent); plans/history/records/coach chats are archive-only.
- Keys use the `fitai.*` prefix (see "Brand vs. persistent identifiers"). New per-user device data must be scoped by user id and cleaned up on logout when it holds health data.

## Daily menu and ready dishes
- The 300 dishes (`shared/dishes/data.ts`) and their photos (`client/public/dishes/`) were imported from the NINJA app; **photo source/licence is unknown** (see `docs/dishes-source.md`). Never describe them as licensed. Nutrition values are estimates and must be labelled so.
- The dishes have **no allergen data**. `shared/dishes/safety.ts` hides dishes by broad keyword rules on names and ingredients and errs toward hiding. It is not an allergen guarantee: the menu page must keep its "check the ingredients yourself" notice (stronger when the user listed allergies). When adding a keyword, add it for English and Hebrew and extend `shared/menu.test.ts`.
- `shared/menu.ts` is pure and deterministic (seed = date); the menu is rebuilt from the profile each time and only swaps / "logged" marks are stored on the device (draft key `menu.<date>`). Logging a dish is a quick add through `sendOrQueue` (works offline).
- Dish photos are not precached by the service worker (8 MB); they are cached on first view. `npm run docs:dishes` regenerates `docs/menu-foods.md`.

## Age-based training
- `shared/age.ts` defines the bands: under 18 (own minor rules in the generator), 18–49 (unchanged), 50–64 (RPE cap 8, +15 s rest), 65+ (RPE cap 7.5, +30 s rest, at most 4 sets, 8+ reps on externally loaded lifts only, no advanced exercises, no jumping or other high-impact exercises (`isHighImpact`: plyometrics plus burpees, jumping jacks, jump rope, high knees, sprints) in plans or as progression variations, one-increment progression). Rules only ever make a plan easier: `intensity: harder` cannot lift past the cap, and bodyweight rep targets (e.g. from a push-up/pull-up benchmark) are never raised. They are general conservative defaults, not medical advice, and every plan that uses them says so in a generation note (`age_mature`, `age_senior`).

