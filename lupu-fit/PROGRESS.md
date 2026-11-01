# LUPU-FIT — Progress (honest status)

## Verified by command (exit 0)
- `npx tsc --noEmit` for `shared` and `scripts`; `npm run lint` (4 linters); `npm run test:shared` (130 tests);
  `npm run test:tools` (274 tests: linters + 244 technique-clip geometry checks); `npm run verify:videos` (244 clips, ffprobe + own validator).

## Done
| Area | State |
|---|---|
| Shared engines (age, training, nutrition, menu, gamification, coachRules, readyWorkouts) | done, property-tested |
| Exercises | **244** authored + independently reviewed; validator 0 errors; swap coverage 95% |
| Foods | **198** authored + reviewed; validator 0 errors |
| Ready workouts | **376** generated (≥250 required), validator 0 errors, <60% Jaccard overlap within a focus; personalised at runtime (age, goal, level, injuries, equipment, readiness, time); 130 tests incl. every workout × 180 profiles |
| Technique videos | 244 schematic procedural clips + posters (not filmed, not human-reviewed — see DECISIONS D10) |
| Design tokens + linters | done; contrast fixes in DECISIONS D2 |

## In progress (content workflow still running when this was written)
- 300 dishes (macros are *derived* from foods), 36 meal templates, 39 sport finishers. `npm run validate:content` is
  expected to fail on these counts until they land; do not treat it as green before then.

## NOT started
Phases 3–9 of the original plan: PG/PGlite DB + migrations + auth/security hardening, Express API, React client
(shell, ExerciseVideo, onboarding, workouts UI, live session, nutrition UI, coach UI), Device Mode worker, Capacitor/TWA
shells, deployment configs, E2E. `schemas.ts` and `i18n` are still seed-level. No claim is made about any of these.
