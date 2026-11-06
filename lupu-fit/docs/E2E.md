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
The Android shell and native plugins (a real WebView), the AI paths with a real provider, admin/payment flows, the camera barcode scanner, wake lock/vibration, CI wiring.

## Device Mode suite (`npm run e2e:device`, version 10 is server-free)
```
npm run e2e:device                 # builds the device client into /tmp/e2e-device-dist, serves it on :8121 (no API server at all), runs everything (~4 min)
E2E_SKIP_BUILD=1 E2E_DEVICE_PORT=8122 npx playwright test -c e2e/playwright.device.config.ts f-profile   # reuse the build, one spec, other port
```
Env knobs: `E2E_DEVICE_PORT` (8121), `E2E_DEVICE_DIST` (/tmp/e2e-device-dist), `E2E_WORKERS` (3), `E2E_CHROME`, `E2E_SKIP_BUILD`. It never writes to `client/dist-device`. Hosted e2e uses 8101+, device e2e 8121+. Not part of `npm run gates` (about 4 minutes).

- **Server**: `e2e/staticServer.ts`, a plain Node file server like Capacitor's asset loader: SPA fallback for page navigations only (a missing file is a 404), Range support for the clips, `/api/*` answers 404 and is counted. The page runs PGlite in a Web Worker over IndexedDB and provisions its hidden device account by itself.
- **Network cut, three layers**: Chromium is started with `--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE localhost"` (nothing but localhost resolves, even for workers and the service worker), `context.route` aborts and records every http(s) request that is not the static origin, and the context listener records any `/api` request. `finish()` fails the test if anything left the origin, if `/api` was requested, if a request failed, or on any console error/warning/page error. Only the barcode spec declares the Open Food Facts URL as an expected (blocked) attempt.
- **Projects**: `he-mobile` (RTL, 412x915) and `en-mobile` (LTR). `t(key)` reads the app's dictionaries with Device Mode overrides (`dev.<key>`), like the app.
- **Specs** (`e2e/device/`): a first launch (welcome -> onboarding -> home, no login/registration UI ever, fonts/icons from the origin) · b ready-workout wizard -> live -> sets -> finish -> summary -> history with `navigator.onLine=false` (airplane mode) · c nutrition: search thumbnails, undo, saved meal, daily menu, log whole day · d rules coach, threads (rename/delete), crisis -> safety card, no AI noise · e plan generator + save, exercise video autoplay/pause/play from packaged media (200/206) · f profile edit persists across reload, one of every kind of data (profile, food, saved meal, own food, plan, coach chat) -> export download (backup format 2) -> change data -> restore (confirmation lists what is replaced, result summary, restoring twice changes nothing) -> wrong/broken/newer/damaged files refused -> delete all data -> clean slate -> re-provision -> restore brings everything back · g real relaunch with a persistent profile directory (IndexedDB survives), page torn down right after a write · h reminders without permission (denied state, nothing switched on), with permission, weekly check-in banner and monthly backup banner (snooze, export clears it) · i he<->en persists, no translation sheet without an AI service · j honesty scan of welcome, every onboarding step and every route: account/server/sign-in/sync words only in sentences that say there are none · k login/register/forgot redirect, unknown route, barcode offline/failed calm with manual add working, no AI photo tile, and a scan of the built files for any http(s) reference other than Open Food Facts · l new phone: a backup exported in one browser profile is restored from Welcome in a brand new profile (no IndexedDB, no localStorage): wrong file refused, confirmation, straight to Home with the profile, food entry and no onboarding at any point, survives a reload, Welcome is no longer reachable; a format 1 file without a profile continues to onboarding and the data is kept · m Android export with a FAKE native bridge (`window.androidBridge` + `Capacitor.PluginHeaders` + a recording `nativePromise`): Export calls `Filesystem.writeFile` (cache/backups, utf8) and then `Share.share` with that uri only, older copies are deleted, a cancelled sheet is silent, share and write failures are explained, "Save to Documents" is explicit and hidden when the plugin does not report permission-free storage (about 1.3 min: it waits out the export rate limit of 3 per minute).
- **Bugs this suite found** (all fixed, see D22): airplane mode paused every query (blank summary after finishing a workout) and blocked "Finish workout"; the exercise video Play button did nothing when the clip list arrived after the first render.
- **Helper**: `freshContext(browser, info, lang, init?)` in `e2e/device/fixtures.ts` opens a second, empty browser profile (a "new phone") with the same network cut and watchers; `init` runs before any page script.
- **Limits**: desktop Chromium, not the Android System WebView; spec m fakes only the JS/native boundary, the Kotlin plugins, FileProvider and the share sheet are not run (docs/ANDROID.md has the adb steps); the service worker is exercised as in a browser (the Android app does not register one, unit-tested); a "kill" is a page teardown, not an OS process kill.
