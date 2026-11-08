# PLOT TWIST engineering notes

These notes apply to everything under `plot-twist/` (the repository root
`AGENTS.md` describes the separate LEVELUP AI project).

- Stack: React 19 + TypeScript + Tailwind CSS 4 (Vite) for the app; a
  dependency-light Node server (`server/`, run directly with Node ≥ 22.18 type
  stripping) for the AI Director API and production static hosting.
- The interface is English / LTR by product decision. Keep user-facing copy in
  components easy to extract; prefer logical CSS properties.
- One content model for every episode (`shared/types.ts`). Curated episodes and
  AI-generated episodes must both pass `validateAdventure` — never bypass it.
- Hard constraints (time, budget, setting, company) are enforced by
  `fitsPrefs`; mood and weirdness only rank. Never show an episode that breaks
  a hard constraint.
- Provider credentials exist only on the server (`server/config.ts`). The
  browser talks to `/api/*` only. Do not read `ANTHROPIC_BASE_URL`; use
  `PLOT_TWIST_ANTHROPIC_BASE_URL` for test overrides.
- The AI Director status shown in the UI must reflect a verified connection,
  not merely the presence of a key.
- Completion is user-reported. Paused time never counts toward an episode.
- All browser storage access is wrapped (private mode, quota). Persisted
  adventures are re-validated on load.
- Imports use explicit `.ts` extensions; only erasable TypeScript (no enums,
  namespaces or parameter properties) so the server runs without a build step.
- Safety rules for content are in `docs/CONTENT_GUIDE.md` and enforced for AI
  output by `server/safety.ts` + the system prompt.
- Before handing off: `npm run typecheck`, `npm test`, `npm run validate:content`,
  and `npm run e2e` (production build + real browser).
