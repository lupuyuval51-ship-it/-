# FITAI engineering notes

FITAI is a bilingual (Hebrew default / RTL, English / LTR) AI fitness & nutrition app.
Stack: React 19 + TypeScript (Vite) · Node.js 20+ / Express 5 (TypeScript) · PostgreSQL 16 · zod · Anthropic Claude (server-side only) · Vitest · Playwright.

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
- **Never fabricate**: stats, records, insights, nutrition numbers and coach answers come only from stored data or the built-in datasets. Show empty states when there is no data. Never claim a video/animation exists unless `media` is set.
- **AI**: only through `server/src/ai/llm.ts` (`generateText`, `generateJson`). The API key never leaves the server. Model output is validated (zod) before use and never sets rewards, ids or permissions. Every AI feature has a non-AI fallback or a clear "not configured" state.
- **Health & safety**: minors (13–17) never get calorie deficits or max-effort work; adults never get targets below the computed safe minimum; reward consistency, not excess (XP caps in `shared/gamification.ts`). Provide safety guidance, not medical diagnosis.
- **Duplicate submissions**: create/finish actions use `useIdempotentMutation` (sends `Idempotency-Key`) and disable buttons while pending.
- **i18n**: no hard-coded user-visible strings. Add keys to `client/src/i18n/locales/en/<module>.ts` and the same keys to `he/<module>.ts` (type-checked). Hebrew must be natural; prefer gender-neutral phrasing.
- **RTL**: CSS uses logical properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`…). Direction-dependent icons use the `icon-dir` class.
- **Accessibility**: labelled controls, keyboard-operable, focus-visible, `aria-live` for async results, icon-only buttons need `label`.
- **Migrations**: forward-only, never edit an applied migration; add `server/src/db/migrations/NNNN_description.sql`.

## Commands (run from `fitai/`)
```
npm run dev            # API (tsx watch, :3000) + Vite (:5173, proxies /api)
npm run db:setup       # migrate + seed content
npm run typecheck && npm run lint && npm run validate:content
npm run test:server    # Vitest + real PostgreSQL (TEST_DATABASE_URL, default fitai_test)
npm run test:client    # Vitest + jsdom
npm run build          # dist/client + dist/server
npm run test:e2e       # Playwright (builds must exist; uses fitai_e2e DB + fake LLM)
```
