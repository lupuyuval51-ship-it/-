# Device mode: the server inside the app

In device mode LUPU-FIT needs no server and no database service. The existing backend
(`server/src/app.ts` with all routers, services and validation) runs unchanged inside the app, in a
Web Worker, on PGlite (real PostgreSQL compiled to WebAssembly, stored in IndexedDB). The hosted
server mode is unchanged and stays in the codebase.

This folder is the part of the app that makes that possible. The server code stays as it is: the
bundler replaces what it imports (see `aliases.ts`). The only server changes for device mode are that
the migration runner also accepts a list of files (`migrate(log, files)`) and the `config.deviceMode`
flag (`DEVICE_MODE=true`), to be read only where behaviour must differ.

| File | Replaces | What it does |
| --- | --- | --- |
| `shims/pg.ts` | `pg` | One PGlite database per data directory (`idb://lupufit-device` on the phone, `memory://` in tests), node-postgres result shapes, `types.setTypeParser`, pg-shaped errors, transactions through PGlite's transaction API (one storage flush per COMMIT), a strictly increasing `clock_timestamp()` (PGlite's clock has millisecond resolution), shared/exclusive lease modes for the single connection. |
| `shims/express.ts` | `express` | Express 5 subset the server uses: routing with `:params`, mounting, error middleware, async errors, `express.json`, req/res, cookies, `'finish'`/`'close'` events. `dispatch()` / `createDispatcher()` run requests in-process, one at a time. |
| `shims/crypto.ts` | `node:crypto` | SHA-256 and scrypt from `@noble/hashes`, random bytes and UUIDs from Web Crypto, `timingSafeEqual`. Same output as Node byte for byte. |
| `buffer.ts` | `Buffer` | The Buffer subset the server uses (utf8/hex/base64/base64url/latin1). |
| `shims/fs.ts`, `path.ts`, `url.ts`, `util.ts`, `http.ts` | Node built-ins | No file system (`existsSync` is false), POSIX paths, `fileURLToPath`, `promisify`, no HTTP server. |
| `stubs/helmet.ts`, `web-push.ts`, `anthropic.ts` | npm packages | Pass-through / not available: no security headers needed for in-app responses, no Web Push, no AI (no API key in an app). |
| `env.ts` | `.env` | `process.env` of device mode (production, `DEVICE_MODE=true`, rate limits off, scrypt N=1024, AI and push off, Open Food Facts on, 365-day session). |
| `globals.ts`, `install-globals.ts` | — | `process` and `Buffer` globals for the worker (import `install-globals` first). |
| `migrations.ts` | reading `migrations/` | The SQL migrations bundled as text; same names and checksums as on disk. |
| `database.ts` | `index.ts` start-up | `prepareDeviceDatabase()`: migrations, content seed, exercise catalog cache. |

## One connection, one request at a time

A PGlite database is a single Postgres backend. In the app the shim runs in **shared** mode and the
worker sends requests one at a time (`createDispatcher`), so whatever runs while a transaction is open
belongs to that request. The Node harness runs in **exclusive** mode (a pool of size one, callers wait in
turn): a database call made by code that already holds a transaction would wait forever there, so the
green server suite shows that no path it covers does that, and for those paths shared mode behaves
exactly like PostgreSQL. The exercise catalog cache is filled at start-up for that reason (the server
loads it lazily through the pool, which the first workout or reward transaction would otherwise do).
A request that never ends would hold up the ones after it; the server's handlers always answer or fail.

## The device worker (`worker/`) and the page side (`features/device/`)

| File | Runs in | What it does |
| --- | --- | --- |
| `worker/entry.ts` | worker | Waits for `init`, takes the Web Lock `lupufit-device-db` for its whole life (one open copy of the database per device; a second tab shows "open in another tab" and continues by itself when the first closes), then loads `runtime.ts` as a separate chunk. Reports boot states. |
| `worker/runtime.ts` | worker | `install-globals` first, then: PGlite (`idb://lupufit-device`), migrations, content seed, exercise catalog, the hourly maintenance deletes of `server/src/index.ts` (once per start), `createApp({ serveClient: false })`, the device account. Requests are handled **one at a time**, with a macrotask between two requests (the idempotency record a handler writes after answering lands first). |
| `worker/session.ts` | worker | The hidden device account: created through the server's own register route on first launch (random `device-<uuid>@device.lupufit` and password), session cookie and CSRF token attached to every request, `Set-Cookie` absorbed (the page never sees the cookie), one re-sign-in and retry when the session is gone. Login/register/password routes answer `not_available_on_device`; sign-out is a no-op; account deletion gets the password added here and is followed by a fresh account. |
| `worker/account-store.ts` | worker | The credentials: one row in `device.account` inside the PGlite database (IndexedDB), never localStorage. Not a migration: the hosted server never has this table. |
| `worker/snapshot.ts` | worker | Full backup and restore of the device database: `GET /api/device/snapshot` (every row of the device account's user tables, as stored, plus the shared foods they point to) and `POST /api/device/restore` (replaces the phone's data with a snapshot in ONE transaction: all or nothing). Answered by `runtime.ts` itself, not by the server code (the hosted server has no such routes). Only known tables and existing columns are written; the account keeps its id, e-mail and password; built-in foods are matched by slug, Open Food Facts products by barcode. `NOT_IN_SNAPSHOT` lists what is left out and why (sessions, reset tokens, idempotency records, Web Push). |
| `worker/storage.ts` | worker | The database's IndexedDB storage (`/pglite/lupufit-device`): deleted by "Erase all data on this phone" while the worker holds the lock and the database is closed. |
| `worker/summary.ts` | both | What a snapshot holds (plans, finished workouts, food entries, weigh-ins, coach conversations). Pure. |
| `worker/protocol.ts` | both | Message types (no runtime code apart from constants, so the page bundle never pulls in server code). `erase` / `erased` messages; `init.erase` asks the next start to delete the database first when an erase could not finish. |
| `features/device/connection.ts` | page | fetch-shaped `transport` for `api/client.ts` (returns real `Response`s, honours `AbortSignal`) and the boot-state store. |
| `features/device/DeviceGate.tsx` | page | Start-up screen: booting (with the first-launch note), locked by another tab, failed (reason, retry, technical detail). Renders the app once ready; there is no login screen. |
| `features/device/start.ts` | page | Starts the worker, installs the transport, asks once for persistent storage (`navigator.storage.persist()`), applies the last theme (so the start-up screen matches the app), marks `lupufit:device-ready` (boot timings). |
| `features/device/control.ts` | page | `eraseThisPhone()` (the worker deletes the database, then every `fitai.*` key goes, then the app restarts as a first launch; if the worker could not delete it, `fitai.device.eraseOnStart` makes the next start do it before opening it), `reloadAfterRestore()`, the welcome flag (`fitai.device.welcomed` = device account id) and the last backup time. In every build (tiny); the device start module plugs the worker in. |
| `features/device/backup.ts`, `DeviceRestore.tsx` | page | The backup file (the website's format: readable account export + `device.snapshot`, the hidden account's e-mail left out), saved with `platform.saveFile`; reading one and restoring it (confirmation lists what it holds and, in the settings, that it replaces what is on the phone). A website backup (no snapshot) is refused with an explanation. |
| `pages/device/WelcomePage.tsx` | page | First run: asks only for a name (and takes the language chosen on the screen), then the questionnaire; or restore a backup file. `/onboarding` redirects here until it is done (`RequireWelcome`). |
| `pages/settings/DeviceDataSection.tsx` | page | Settings in device mode: "Your data on this phone" (what that means, backup file, restore, erase with two confirmations) instead of the account, security and privacy cards; privacy/terms links and the questionnaire re-run in their own card. |

Durability and speed: PGlite flushes its in-memory files to IndexedDB after every statement and waits for
it. In Chromium that made reads 90–500 ms and writes 200–300 ms per request. The app runs the pg shim in
'manual' flush mode: PGlite's own flushes do nothing, and the worker calls `flushDeviceDatabase()` after every
write request (POST/PUT/PATCH/DELETE), waiting for it before the page gets the answer: a change the app
confirms is stored. The flush runs in PGlite's query queue, so it is one consistent snapshot (one IndexedDB
transaction) that PostgreSQL recovers from like a crash snapshot. Reads take 5–50 ms; a write about 200 ms.
(PGlite's `relaxedDurability` is not used: its background flushes run beside later statements and can
store files from different moments.)

Boot states: `booting` (`database` → `migrating` (first launch or upgrade) → `content` → `account`), `locked`,
`ready`, `failed` (`unsupported`, `storage_full`, `storage`, `migration`, `account`, `unknown`).

## Build (`npm run build:device` → `dist/device`)

`vite build --mode device` (same `client/vite.config.ts`): the worker bundle gets the aliases of `aliases.ts`
(only for imports from `server/`, `shared/` and this folder) and `process.env` is read at run time from the
`process` global (Vite would otherwise inline an empty object). The page gets a CSP meta tag (the hosted app's
policy plus `'wasm-unsafe-eval'`). PGlite's `pglite.wasm`, `pglite.data`, `initdb.wasm` and the `pg_trgm`
bundle are emitted as assets; `scripts/build-sw-assets.mjs dist/device` lists them for the service worker
precache (the Android app does not register the service worker). Server code is only in the
`device-runtime-*.js` chunk; server-mode builds resolve the device start module to an empty module.
`npm run test:e2e:device` serves `dist/device` as static files (no app server, no PostgreSQL) and runs
`e2e/device/` at Pixel 7 size.

## Tests (`npm run test:server:device`, no PostgreSQL needed)

- **server-on-pglite**: the whole existing server suite (`server/tests`) with `pg` aliased to the shim.
  Only the tests in `testing/pglite-skips.ts` are skipped, each with its reason (they need a second,
  concurrent database connection).
- **device-units**: the shims against Node (`node:crypto`, `Buffer`, `node:path`, `node:url`), against
  real Express 5 (same app, same requests, same responses) and against node-postgres' result shapes.
- **device-flows** (`api.flow.test.ts`): API flows through the Express shim without HTTP, with every
  alias and the device environment, the way the worker will call the app. `worker/session.flow.test.ts`:
  the worker runtime (boot steps, device account created / reused / recovered / re-signed-in / deleted,
  one request at a time).

## Screens in device mode (what differs from the website)

- **First run**: start-up screen (steps as tally marks; "first launch takes a little longer"; "updating
  your data" after an app update), then the welcome (name only), then the questionnaire. "Open in another
  tab" and start-up failures explain what to do; nothing is deleted when the app fails to start.
- **No account**: no login, register, password, "log out of all devices", e-mail or sign-out anywhere
  (sidebar and questionnaire included).
- **Settings**: "Your data on this phone" comes first: the data is only here, what loses it, Android's own
  backup is not guaranteed, the backup file (with the last time one was saved), restore, erase all.
  "Download my data" is not offered separately: the backup file is the readable export.
- **Reminders**: `platform.reminders` (the Android app's local notifications: permission asked only from a
  tap, how to allow them when blocked) where supported, otherwise the in-app reminders as on the website.
  `PhoneReminderSync` (AppShell) re-syncs the phone's schedule on start, on resume, when the settings change
  and when today's data changes (finished workout, logged meal). No Web Push UI or calls.
- **Coach**: "Coach", not "AI coach"; one line says the answers come from the person's data and the
  exercise library and that AI conversations are not part of this version; no daily message counter (the
  built-in coach costs nothing; `COACH_DAILY_MESSAGE_LIMIT` is 10000 in the device env).
- **Food log**: no meal-photo tab. The barcode tab says it needs internet and sends only the barcode to
  Open Food Facts, and says so clearly when the phone is offline (`useNetworkOnline`).
- **Errors**: a network error means the app itself failed (`device.errors.network`), never "check your
  connection".
- Every file the app saves goes through `platform.saveFile` (backup, website export).

## Limits of device mode (surfaced in the UI; docs follow)

- The data lives only on this phone. It is lost when the app is uninstalled or the phone is lost,
  unless a backup file was saved. There is no sync between devices. Android's own backup may restore app
  data on a new phone, but that depends on the phone's settings and on the data's size (the Android stage
  decides `allowBackup` / data extraction rules); the UI says it is not guaranteed.
- The AI coach and meal-photo analysis need a server-side API key and are not available; the built-in
  coach works.
- Barcode lookup needs internet; it sends only the barcode to Open Food Facts.
- Web Push needs a server; reminders use the phone's local notifications instead.

## E2E (`npm run test:e2e:device`)

`e2e/device/device.spec.ts` (start-up, reload, airplane mode, second tab, restart, erase all) and
`e2e/device/ux.spec.ts` (welcome → questionnaire → plan → today's workout logged and finished, daily menu,
food log without photo tab, barcode offline, weigh-in, progress, coach, settings, all at 390 px with no
sideways scroll; backup file → erase → restore round trip; Hebrew first launch). With
`DEVICE_SHOTS=<dir>` they save Hebrew (RTL) screenshots of the main screens.
