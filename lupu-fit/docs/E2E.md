# End-to-end tests

Real-browser suite in `e2e/` (Playwright `@playwright/test` 1.64 + the preinstalled Chromium).

```
npm run e2e              # builds the hosted client into /tmp/e2e-dist, starts the dev server on :8101, runs everything, tears down (~2 min)
npm run e2e:typecheck    # tsc for the e2e project
E2E_SKIP_BUILD=1 E2E_PORT=8102 npx playwright test -c e2e/playwright.config.ts d-food   # reuse the last build, one spec, other port
```
Env knobs: `E2E_PORT` (8101), `E2E_DIST` (/tmp/e2e-dist), `E2E_WORKERS` (3), `E2E_CHROME` (chromium path), `E2E_SKIP_BUILD`.
It never writes to `client/dist` or `dist-device`. Failure screenshots go to `/tmp/e2e-results`.
Not part of `npm run gates` (about 2 minutes); run it before a release.

## Shape
- Projects: `he-mobile` (RTL, Pixel 7, 412x915), `en-mobile` (LTR), `en-desktop` (1280x800). Every spec runs in all three.
- Server: `server/src/devServer.ts` (in-memory PGlite, no AI configured, so the coach uses the rules reply). `TRUST_PROXY=1` lets each test send its own `X-Forwarded-For`, because registration is rate limited per IP (10/hour) and the suite registers ~40 users.
- Users are seeded with `seed()` (`POST /api/auth/register` then `PUT /api/profile` with the CSRF header). Copy comes from the app's own dictionaries via `t(key)` (`e2e/copy.ts`), so tests do not hard-code UI text.
- The `app` fixture fails a test on any browser `console.error`/warning or page error. Expected noise is declared per test with `allowConsole(regex)` or, for app-wide probes, in `IGNORED` in `e2e/fixtures.ts` (each entry is explained).

## Specs
a register -> onboarding -> Home hero · b ready workouts wizard -> live -> finish -> XP -> history week summary · c daily menu photos + log whole day · d food search thumbnails, quick add, delete + Undo · e coach rules reply and crisis safety card (never AI) · f language switch persistence, `html lang/dir`, more-languages sheet without AI · g offline reload with the service worker (profile-based Home) · h login "keep me signed in" cookie lifetime · i a11y smoke (360 px overflow, named controls, focus in `<main>`) · j profile choice cards · k shared device: logout and "keep me signed in" off leave no offline identity copy (D21).

11 spec files, 14 tests, each run in the 3 projects (42 runs).

## Not covered
Device Mode (PGlite worker), Android shell and native plugins, the AI paths with a real provider, admin/payment flows, camera/barcode, wake lock/vibration, CI wiring.
