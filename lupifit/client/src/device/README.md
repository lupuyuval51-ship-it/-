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
| `worker/protocol.ts` | both | Message types (no runtime code, so the page bundle never pulls in server code). |
| `features/device/connection.ts` | page | fetch-shaped `transport` for `api/client.ts` (returns real `Response`s, honours `AbortSignal`) and the boot-state store. |
| `features/device/DeviceGate.tsx` | page | Start-up screen: booting (with the first-launch note), locked by another tab, failed (reason, retry, technical detail). Renders the app once ready; there is no login screen. |
| `features/device/start.ts` | page | Starts the worker, installs the transport, asks once for persistent storage (`navigator.storage.persist()`), marks `lupufit:device-ready` (boot timings). |

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

## Limits of device mode (to surface in the UI and docs)

- The data lives only on this phone. It is lost when the app is uninstalled or the phone is lost,
  unless a backup file was saved. There is no sync between devices.
- The AI coach and meal-photo analysis need a server-side API key and are not available; the built-in
  coach works.
- Barcode lookup needs internet; it sends only the barcode to Open Food Facts.
- Web Push needs a server; reminders use the phone's local notifications instead.
