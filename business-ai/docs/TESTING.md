# Testing & verification results

These results come from the build environment on 2026-11-05: Linux, Node 22, Deno 2.9, the Supabase CLI 3 local stack (Postgres 17, GoTrue, PostgREST, edge-runtime 1.77) and Chromium via Playwright.

| Suite | Command | Result |
|---|---|---|
| TypeScript (strict, whole app) | `npm run typecheck` | **0 errors** |
| ESLint (eslint-config-expo) | `npm run lint` | **0 errors, 0 warnings** |
| Jest (app + shared domain) | `npm test` | **39 suites, 625 tests passed** |
| pgTAP (RLS, privileges, triggers, RPCs) | `npm run test:db` | **7 files, 373 assertions passed** |
| Deno (Edge Functions) | `npm run check:functions` and `npm run test:functions` | **type check OK; 39 tests passed (one integration test with 22 steps, against the real local stack and the fake Anthropic server)** |
| Web export | `npx expo export --platform web` | builds |
| Android JS bundle | `npx expo export --platform android` | builds (Hermes bytecode) |
| E2E (Playwright, web build + local stack + real functions + fake Anthropic) | `bash e2e/run-e2e.sh` | see below |

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

**Results so far** (2026-11-05, several runs while the test script's selectors were being fixed). The app itself was not changed during these runs.

| Step | Status | Evidence |
|---|---|---|
| Sign up | passed | runs 6–8 |
| Onboarding (8 steps, skipping allowed, autosave, review) | passed | runs 6 and 7 |
| AI plan generation (real Edge Functions, fake Anthropic) | passed | Run 6 UI. Run 7: DB shows status `ready` and 9 roadmap tasks created automatically |
| Edit a section and save it as a new version | passed | run 7 |
| Roadmap: complete an item | passed | run 7 |
| Advisor chat (streaming, proposed actions, follow-ups) | passed | runs 6 and 7 |
| Reload keeps the data | passed | run 6 |
| Dark-mode screenshots | passed | run 6 |
| Switch language to Hebrew (RTL) | switch works | Run 6 screenshot shows the Settings screen fully RTL. The test waited for a restart dialog that only appears on native; fixed |
| Finance: add a revenue stream and see break-even | form works | Run 6 screenshot shows the form filled with ₪ prefixes. The test pressed "Save" where the button is labelled "Add"; fixed |

The final single-pass run after these selector fixes is `e2e-run8` (see `e2e/artifacts-final/results.json` when re-run locally).

**Known UI race found by E2E:** text typed into the first onboarding field during the first second after the screen opens can be cleared when the saved draft and answers finish loading. Real users are unlikely to hit it. It is listed under Known limitations.

## Not verified here

- No live call to `api.anthropic.com`, because no API key was available.
- No native Android or iOS build or device run, because no SDK or emulator was available.
- No real payment flow; purchases are intentionally disabled.
