# LUPU-FIT — Progress (honest status)

Last verified: `npm run gates` → exit 0 (typecheck, 4 linters, 123 shared tests, 28 tooling tests).

## Phase 1 — Monorepo, shared core math, CI linters: PARTIAL

Done and verified by `npm run gates`:
- npm workspaces monorepo (`shared`, `server`, `client` scaffolds), strict TS (`noUncheckedIndexedAccess`).
- `shared`: `enums`, `age`, `training` (Epley, plates, readiness, progression, swap engine, deterministic plan
  generator with time budget), `nutrition` (Mifflin-St Jeor, floors, carb floor, BMI>30 protein, trend ±150),
  `menu` (morphological he+en allergen filter, daily menu, shopping list), `gamification`, `coachRules`
  (pre-LLM classifier + data-driven rules coach), seed `i18n` (he/en).
- `tokens.css` + self-hosted Heebo and Barlow Condensed (OFL).
- Linters: `design-lint`, `contrast-check`, `security-scan`, `copy-lock` — each self-tested against violating fixtures.
- Exhaustive monotonicity matrix, nutrition grid (>5000 cases), allergen, coach table tests.

NOT done in Phase 1:
- `schemas.ts` covers auth, profile, set input, generator query, food log and backup only — not every API body.
- `i18n` is a seed dictionary (~60 keys), not the full UI string set.
- Property tests use a 33-exercise fixture catalog; the real 244-exercise catalog arrives in Phase 2.

## Phases 2–9: NOT STARTED
Content (244/213/39/198/36/300), PG/PGlite DB + auth, Express API, React client, training/nutrition UI,
Device Mode worker, Android shells, E2E. No claim is made about any of them.
