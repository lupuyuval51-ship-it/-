# Testing & verification results

**Don't take this page on trust: the raw output is committed.** [`docs/verification/latest/`](verification/latest/)
contains one log per check, `summary.txt` (exit code of every check), the E2E `results.json` and all screenshots. Run
`bash scripts/verify-all.sh` (or `npm run verify:all`) to reproduce everything; `WITH_E2E=0` skips the browser run.

Latest run: **commit `e1cce0b`, 2026-11-06 09:11 UTC.** Linux, Node 22, Deno 2.9, Supabase CLI 3 local stack (Postgres 17,
GoTrue, PostgREST, edge-runtime 1.77), Chromium via Playwright.

> `summary.txt` shows `dirty: 1`. That count is a false positive: the only uncommitted path at the time was the
> verification output folder itself (git listed it as the untracked directory `docs/verification/`, which the
> script's filter did not exclude; fixed in `scripts/verify-all.sh`). The code under test is exactly commit `e1cce0b`.

| Check | Command | Result (raw log) |
|---|---|---|
| TypeScript (strict, whole app) | `npm run typecheck` | **0 errors** — [`typecheck.log`](verification/latest/typecheck.log) |
| ESLint (eslint-config-expo) | `npm run lint` | **0 errors, 0 warnings** — [`lint.log`](verification/latest/lint.log) |
| Jest (app + shared domain) | `npm test` | **39 suites, 627 tests passed** — [`jest.log`](verification/latest/jest.log) |
| pgTAP (RLS, privileges, triggers, RPCs) | `npm run test:db` | **9 files, 426 assertions passed** — [`pgtap.log`](verification/latest/pgtap.log) |
| Deno (Edge Functions) | `npm run check:functions`, `npm run test:functions` | **type check OK; 43 tests passed (incl. one 22-step integration test against the real local stack)** — [`deno-check.log`](verification/latest/deno-check.log), [`deno-test.log`](verification/latest/deno-test.log) |
| Race checks (parallel approvals) | `npm run test:race` | **pass** — [`race.log`](verification/latest/race.log) |
| E2E (Playwright, web build + local stack + real Edge Functions + fake Anthropic) | `bash e2e/run-e2e.sh` | **10/10 steps passed** — [`e2e.log`](verification/latest/e2e.log), [`e2e/results.json`](verification/latest/e2e/results.json), screenshots in [`e2e/`](verification/latest/e2e/) |
| Web export / Android JS bundle | `npx expo export --platform web\|android` | both build (the web build is the one E2E runs) |

## What each suite covers

**Jest** covers:

- The finance engine: hand-computed cases, cash identities, scenario ordering and edge cases.
- i18n: he/en key parity, interpolation and plurals.
- Bidi-safe money and date formatting, and money parsing.
- Design-token contrast.
- Error mapping.
- Each feature's pure logic: onboarding steps and country search, plan provenance, diffs and PDF HTML, roadmap dates and dependencies, the next-action engine, management aggregates, the advisor's SSE parser, markdown and actions, launch templates (official https sources only) and marketing logic.
- Component smoke tests.

**pgTAP** covers:

- For every table: one user cannot select, insert, update or delete another user's rows.
- `anon` has no access at all.
- Entitlements and usage can only be written by the service role.
- Assistant messages cannot be forged by clients, and only `applied_action_ids` can be updated.
- Free/Pro business limit and forecast-horizon caps.
- Plan versions: copy-on-write, restore and immutability.
- Task dependencies: no self-dependencies, no cross-business links, no cycles.
- AI quota and cost-cap reservation.
- Account deletion cascades.
- Exactly-once proposal application (`08_atomic_writes`): applying the same advisor action twice or after a lost "applied" marker creates one row; a failed apply records nothing; another user gets `not_found`; dependency replacement and AI roadmap writes are all-or-nothing.

**Deno** covers:

- Pricing and cost math, mapping of Anthropic SDK errors, prompt-injection escaping, and schema validation of every AI output.
- SSE encoding.
- One full integration run:
  - plan generation, including the roadmap and the finance proposal;
  - section regeneration that saves nothing;
  - cross-user access denied;
  - free quota exhausted, then `quota_exceeded`;
  - the advisor SSE stream with its persisted messages;
  - a missing API key returns `not_configured`.

## Concurrency and all-or-nothing checks (`e2e/race-checks.mjs`, raw output in `race.log`)

These run against the local stack. In the latest run:

- **Advisor:** 20 parallel `apply_advisor_action` calls → 2 `applied` and 18 `already_applied`; the database ends with exactly 1 expense and 1 task.
- **Finance "Accept all":** 10 parallel `accept_finance_proposal` calls with the same 3 lines plus the starting capital → 3 rows inserted in total (each line once); the starting capital is applied.
- **All-or-nothing:** a batch whose last line is invalid fails and saves **nothing**, with no startup cost and no capital change.
- **Mock database (Deno):** invalid AI roadmap output is rejected **before any database call**, and a valid roadmap is written by exactly **one** transactional RPC (`tests/roadmap_payload_test.ts`).

## Earlier concurrency check (exactly-once proposals)

`apply_advisor_action` was called **20 times in parallel** (10× for an expense proposal, 10× for a task proposal) by the same user against the local stack:

- 2 calls returned `applied` and 18 returned `already_applied`.
- The database ended with exactly **1 expense** and **1 task**.
- `applied_action_ids` = `["r1","t1"]`.

The previous two-request flow (insert, then a separate "mark applied" update) could create duplicates under the same conditions.

## E2E (definition of done)

`e2e/dod-flow.mjs` runs the full flow in a 390×844 browser:

1. sign up
2. 8-step onboarding (skipping is allowed)
3. AI plan generation, with real Edge Functions and the fake Anthropic endpoint
4. edit a section and save it as a new version
5. roadmap: complete a task
6. advisor chat (streaming)
7. add a finance revenue stream and see break-even
8. reload: data persists
9. switch to Hebrew: RTL screenshots
10. dark-mode screenshots

Results are written to `e2e/artifacts/results.json`, with screenshots in the same folder.

**Final result: all 10 steps passed in one run.** Run 8 passed, and run 9 passed again after the atomic-writes change, using a fresh database reset and a fresh web export. In run 9 the roadmap is written through `persist_ai_roadmap`.

Sign-up → onboarding → AI plan generation (real Edge Functions + fake Anthropic) → section edit saved as a new version → roadmap item completed → streaming advisor chat with proposed actions → finance revenue stream with break-even → reload keeps the data → switch to Hebrew (document `dir=rtl`, RTL screenshots of Home, Plan, Roadmap, Finance, Advisor and Workspace) → dark-mode screenshots.

Earlier runs failed only because of test-script selectors: Unicode-isolated numbers, the button labelled "Add" rather than "Save", and the restart dialog that only appears on native. The app code was not changed to make the run pass.

**Known UI race found by E2E:** text typed into the first onboarding field during the first second after the screen opens can be cleared when the saved draft and answers finish loading. Real users are unlikely to hit it. It is listed under Known limitations.

## Not verified here

- No live call to `api.anthropic.com`, because no API key was available.
- No native Android or iOS build or device run, because no SDK or emulator was available.
- No real payment flow; purchases are intentionally disabled.
