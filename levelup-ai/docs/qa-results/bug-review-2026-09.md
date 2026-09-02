# Bug review and hardening pass — September 2026

Full read of the server services, the API router and every screen, followed by fixes,
regression tests and a manual pass against a production build.

Baseline before the pass: `build`, `typecheck`, `lint`, 70 service tests and 8 E2E specs
all green. Every defect below was found by reading the code, not by a failing check.

## Correctness

| # | Defect | Where | Effect |
|---|--------|-------|--------|
| 1 | `state()` resolved every enrollment through `pathById()`, which throws `PATH_NOT_FOUND` for a soft-deleted path | `server/store.ts` | `GET /api/state` returned 500 and **the whole account stopped rendering** once any enrolled path was retired. `account/delete` already soft-deletes private paths, so a shared path could strand other learners. Now a retired path is reported as `unavailable` and the rest of the account still loads. |
| 2 | `getDaily()` and `coach()` resolved the active enrollment path the same way | `server/games.ts`, `server/coach.ts` | Daily quest and coach both 500'd for the same accounts. Both now fall back to the starter path. |
| 3 | `startGame()` compared the attempt cohort against the raw enrollment path | `server/games.ts` | After fix 2 the cohort check would have rejected the fallback quest with `GAME_COHORT_MISMATCH`. The check now resolves the cohort exactly as `getDaily` does. |
| 4 | `finishGame()` reached for `pathById(row.path_id)` while building the weak-topic review | `server/games.ts` | Finishing a quest on a retired path threw instead of saving the result. |
| 5 | Generated creator sequence questions always carried `answer: 0` with unshuffled options | `server/community.ts` | Every auto-written question in a published creator path was answerable without reading it. Options are now rotated per task and the answer index follows. |
| 6 | Progress was `completed / total * 100` with no guard | `server/store.ts`, all path screens | A path with no tasks produced `NaN`, rendered as `width: NaN%` and `NaN%` text. |
| 7 | `/api/notifications/read` existed but no client ever called it | `components/levelup-app.tsx` | The unread badge on the bell never cleared. Opening the panel now marks the unread items read. |
| 8 | Marketplace read `?q=` once, in a mount-only effect | `components/screens/learning.tsx` | Searching from the top bar **did nothing when already on the marketplace**, because the screen does not remount on a same-path navigation. Now driven by `useSearchParams` behind a `Suspense` boundary. |
| 9 | The coach replaced saved history with the session's local messages | `components/screens/learning.tsx` | Earlier conversation vanished from the panel after the first message. Server history is now the source of truth, with the in-flight turn shown optimistically; the view also scrolls to the newest message. |
| 10 | The payment screen hid the upload form for `rejected` orders | `components/screens/account.tsx` | The server accepts a corrected proof after a rejection, but the UI offered no way to send one — a dead end after every rejection. |
| 11 | `Auth`'s field setter spread a stale `form` | `components/screens/entry.tsx` | Two fields changed in one handler could clobber each other. Now a functional update. |
| 12 | Onboarding had no step-0 gate and restored its draft unvalidated | `components/screens/entry.tsx` | Clearing the skill box cleared `pathId` too, so the wizard let the learner reach step 6 and fail with a generic validation error. A draft from an older build could also crash the wizard. Both steps are now guarded, with a specific hint per blocked step. |
| 13 | Sign-out awaited the API with no error path | `levelup-app.tsx`, `screens/management.tsx` | A failed request left the UI signed in with no feedback. One shared `logout` now always clears local state and reports the failure. |
| 14 | The skip link was labelled with the `next` string | `levelup-app.tsx` | Screen-reader users heard "next" instead of a skip target. New `skipToContent` string in both locales. |
| 15 | Demo mail links used `next/link` for absolute URLs, and `Modal` let the native `cancel` default race React | `screens/entry.tsx`, `components/ui.tsx` | Minor; both corrected. |

## Performance

- `dayFor()` built a fresh `Intl.DateTimeFormat` **and read the profile row** on every call.
  It sat inside per-row loops in `weekly()`, `coachAllowance()` and `gameAvailability()`.
  Split into `timezoneFor()` (one profile read) and `dayIn()` (per-zone cached formatter).
- `nextMidnight()` binary-searched 30 times, each iteration doing a profile `SELECT`.
  `customGames()` calls `gameAvailability()` per game, so a full library could issue
  **3,000+ redundant queries in one request**. It now takes a resolved zone and touches
  the database zero times.
- `weekly()` was O(days × events) with a query per event; it is now a single pass over a map.

## Robustness and security

- An unknown or retired IANA zone stored in a profile threw out of `Intl.DateTimeFormat`
  and took down every read for that account. `dayIn()` now falls back to the default zone.
- Expired `sessions`, `auth_tokens`, `rate_limits` and `demo_mail` rows accumulated forever.
  `pruneExpired()` sweeps them at most once an hour; only already-expired rows are touched.
- An upload whose ownership re-check failed inside the transaction left an unreferenced file
  in private storage. The file is now removed before the error propagates.
- `saveSettings` and the avatar upload wrote `displayName` and `birthYear` into the
  preferences JSON, where they went stale beside their real columns and reached data export.
- Added `Content-Security-Policy` (same-origin only, `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`),
  `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy`.
  Scripts still need `'unsafe-inline'` for Next's inline bootstrap; `'unsafe-eval'` is
  development-only. Moving to nonces is the remaining step before public deployment.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — clean.
- `pnpm test` — **74 passed** (70 pre-existing plus 4 new suites covering the retired-path
  degradation, proof re-upload after rejection, generated creator answers, expired-row
  pruning and the timezone fallback). Each new suite was confirmed to fail against the
  unfixed code before being kept.
- `pnpm test:e2e` — 8 passed.
- Manual pass over a production build in Chromium: landing, demo sign-in, dashboard,
  notifications, marketplace search, coach, quest (WebGL renders under the new CSP),
  pricing, settings, onboarding gate, and the full order → proof → reject → re-upload loop.
  No console errors beyond the expected pre-login 401 on `/api/state`.

## Known gaps left open

- The CSP still allows inline scripts; nonce-based script hashing is the follow-up.
- `catalog()` issues four queries per published path. Harmless at the current catalogue
  size and left alone rather than optimised speculatively.
- A learner can open several concurrent orders for the same plan. `approveOrder` blocks
  double-granting, so this is an admin-inbox annoyance rather than a payment defect, and
  changing it would alter documented behaviour.
