# UX & visual quality guide (second pass)

Goal: a product that feels fast, obvious and trustworthy on a phone, one-handed, in a gym, in Hebrew RTL and English LTR.
Read `docs/CLIENT_GUIDE.md` first (hard rules still apply: tokens, logical CSS, i18n, one primary button, lint/tests).
Shared building blocks (use them, extend them additively): `ui/kit.tsx`, `ui/patterns.tsx` (PageHeader, Skeleton*, StatTile, StickyAction, StepDots, Disclosure), `styles/base.css` (.hero-card, .grid-stats, .list-link, .stat-row, .sticky-cta).

## Principles (each one is checkable in review)
1. **First viewport answers "what do I do now?"** Home leads with ONE hero card (today's workout / resume / log a meal) and its single orange button; secondary info below. No screen opens with a wall of equal-weight cards.
2. **Taps budget**: start today's workout ≤ 2 taps from Home; log a recent food ≤ 3 taps; log a set = 1 tap (inputs prefilled from the plan/last session); weigh-in ≤ 2 taps.
3. **Sensible defaults, never empty forms**: prefill from profile/history, remember last choices (filters, sport, meal slot, grams).
4. **Progressive disclosure**: advanced options live in `Disclosure`/`Sheet`; lists show 5–7 items + "see all"; long text collapses.
5. **Loading**: skeletons shaped like the content (`SkeletonCard/List`), never a bare spinner for page content; optimistic updates for toggles, log entries, set completion.
6. **Feedback for every action**: toast with **Undo** for reversible actions; visible success state (check, count-up) for sets/meals/PRs; `navigator.vibrate(10)` (guarded) on set completion; never silent failure.
7. **Errors**: inline, plain, actionable ("אין חיבור. הסט נשמר ויסונכרן"), keep the user's input, offer retry. Never show codes.
8. **Empty states** explain why and give ONE next action (button/link), in the user's language, no sarcasm, no fake data.
9. **Forms**: right `inputMode`/`autocomplete`, steppers for numbers, validate on blur + on submit, focus the first invalid field, Enter submits, sticky submit on phones (`StickyAction`).
10. **Navigation**: every deep page has a back affordance (`PageHeader back`), filters/tabs/ranges live in the URL, scroll position and entered data survive back/forward.
11. **Hierarchy**: one H1 per screen (`PageHeader`), cards titled with H2 (18px), numbers in `.num`/`StatTile`, muted text only for secondary info; max ~7 distinct text styles per screen; consistent spacing scale (0.25/0.5/0.75/1/1.5/2 rem via `.stack*`).
12. **Data viz tells the story first**: a one-line takeaway above each chart, built only from real data ("3 אימונים השבוע, יעד 4"); otherwise the honest empty state. No decorative charts.
13. **Gym ergonomics (Live workout)**: giant tap targets, current set visually dominant, thumb-zone controls, rest timer is a focused takeover showing next set/exercise, no accidental destructive taps (confirm Discard), screen never sleeps.
14. **Trust & safety UX**: allergen/health disclaimers visible but compact; safety substitutions explained in one sentence ("הוחלף בגלל כאב בברך"); estimates always labelled as estimates.
15. **Microcopy**: short verb-first Hebrew infinitives ("להתחיל אימון"), motivational but honest; no guilt streak pressure; no exclamation spam.
16. **Motion**: ≤ 200 ms, purposeful, disabled by `prefers-reduced-motion`.
17. **Accessibility**: 44 px targets, visible focus, labelled controls, `aria-live` for toasts/timers, contrast per tokens, RTL mirroring of directional icons.

## Visual polish rules
Industrial athletic look: black surfaces, orange only for the one primary action and active states, 1 px crisp borders, 8 px radius max, no gradients/shadows/blur. Use `hero-card` (inline-start orange bar) for the key card, `grid-stats` + `StatTile` for KPI rows, `list-link` rows for navigable lists, thumbnails (`ExerciseVideoThumb`) on every exercise row.

## How you work
1. Run `npm run dev:pglite` style build for screenshots: `npm run build:hosted` then `PORT=8090 PBKDF2_ITERATIONS=1000 STATIC_DIR=client/dist npx tsx server/src/devServer.ts &` and use Playwright (`/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, `--no-sandbox`) to screenshot your screens at 390×844 (mobile) and 1280×800 (desktop) in BOTH languages with a seeded account (register with `{username, password}`, e.g. `{username: "shot_user", password: "correct-horse-battery"}`, + PUT /api/profile through `ctx.request`). LOOK at the screenshots (Read the PNG) and iterate until each screen passes the principles above.
2. Keep all existing behaviour and tests green; add tests for new behaviour (undo, skeleton → content, sticky CTA presence, defaults).
3. Run the verification commands from CLIENT_GUIDE. Report what you changed per screen and what you could not fix.
