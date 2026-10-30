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

## Tests (`npm run test:server:device`, no PostgreSQL needed)

- **server-on-pglite**: the whole existing server suite (`server/tests`) with `pg` aliased to the shim.
  Only the tests in `testing/pglite-skips.ts` are skipped, each with its reason (they need a second,
  concurrent database connection).
- **device-units**: the shims against Node (`node:crypto`, `Buffer`, `node:path`, `node:url`), against
  real Express 5 (same app, same requests, same responses) and against node-postgres' result shapes.
- **device-flows** (`api.flow.test.ts`): API flows through the Express shim without HTTP, with every
  alias and the device environment, the way the worker will call the app.

## Limits of device mode (to surface in the UI and docs)

- The data lives only on this phone. It is lost when the app is uninstalled or the phone is lost,
  unless a backup file was saved. There is no sync between devices.
- The AI coach and meal-photo analysis need a server-side API key and are not available; the built-in
  coach works.
- Barcode lookup needs internet; it sends only the barcode to Open Food Facts.
- Web Push needs a server; reminders use the phone's local notifications instead.
