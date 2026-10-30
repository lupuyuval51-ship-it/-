# Device mode: LUPU-FIT with no server and no database service

LUPU-FIT runs in two ways from the same code:

| | **Device mode** (the Android app) | Hosted mode (website) |
| --- | --- | --- |
| Where the server code runs | Inside the app, in a Web Worker | On a server (Node.js) |
| Database | PGlite (PostgreSQL compiled to WebAssembly), stored on the phone in IndexedDB | PostgreSQL on a server |
| Something to host or pay for | **Nothing** (Google Play's one-time developer fee aside) | A server, a database, a domain |
| Account | None for the person (a hidden one inside the app) | E-mail and password |
| Data | Only on this phone; backup file to move or keep it | On the server, on every device that signs in |
| Internet | Only for the barcode lookup (Open Food Facts) | Always |
| AI coach, meal-photo analysis | Not available (built-in coach) | When the server has an AI key |
| Reminders | Local notifications scheduled on the phone | Web Push from the server |
| Build | `npm run build:device` → `dist/device`, Android: `android/build-release.sh` | `npm run build` |

The hosted mode stays in the codebase unchanged (for a future sync or AI service). The Android app ships in
device mode. Owner's guide in Hebrew: [device-mode-he.md](device-mode-he.md). Android build, signing and
release: [android.md](android.md). Detailed file map of the device runtime: `client/src/device/README.md`.

## Architecture

```
Android app (Capacitor 8 WebView, origin https://localhost)
│
├─ page: the React app (same screens; device-only branches use isDeviceMode and device.* texts)
│    api/client.ts ──transport (fetch-shaped)──┐
│    platform/native: notifications, files+share, back button, resume (Capacitor plugins)
│                                              │ postMessage {method, url, headers, body}
└─ device worker (Web Worker, one per phone)   ▼
     session.ts   hidden device account: adds the session cookie + CSRF token, absorbs Set-Cookie,
                  signs in again once on a 401
     server/src/app.ts  the server's own Express app, routers, services and zod validation, unchanged,
                  on the Express shim, one request at a time
     pg shim → PGlite (one connection) → IndexedDB "/pglite/lupufit-device"
     fetch → https://world.openfoodfacts.org   (barcode lookup: the only network request)
```

- The server code is not rewritten: at build time the bundler replaces what it imports (`pg`, `express`, Node
  built-ins, `helmet`, `web-push`, `@anthropic-ai/sdk`) with small shims and stubs (`client/src/device/aliases.ts`).
  The shims are tested against the real libraries (`npm run test:server:device`).
- `process.env` is fixed at build time (`client/src/device/env.ts`): production, `DEVICE_MODE=true`, rate limits
  off (one person), scrypt cost 1024 (the hidden password is random), AI and Web Push off, Open Food Facts on,
  365-day session. `config.deviceMode` is read only where behaviour must differ.
- **One database connection, one request at a time.** The worker answers requests in order, so a transaction
  never interleaves with another request. Server code must pass `tx` down inside `db.tx` and never call the pool
  there.
- **One open copy per device.** The worker holds the Web Lock `lupufit-device-db` for its whole life; a second
  tab shows "open in another tab". The page asks once for persistent storage (`navigator.storage.persist()`).
- **Durability.** After every write request the worker flushes the database to IndexedDB before the page gets the
  answer: a change the app confirms is stored. If that store fails (phone storage full, IndexedDB error), the
  request is answered `503 storage_full` / `storage_failed` (never a network error, so nothing says "saved,
  will sync"), the start-up screen replaces the app ("Your latest changes aren't stored yet … free up space, then
  Try again; keep the app open"), later writes are refused before they run and reads keep working. "Try again"
  and the app coming back to the foreground store again; once that works the app returns.
- **Write-ahead log.** PGlite runs Postgres in single-user mode, which never checkpoints by itself, and Postgres
  keeps old 16 MB WAL segments for reuse: memory and IndexedDB grew by several 16 MB files with use. The device
  database starts with `wal_recycle=off` (and `min_wal_size=32MB`), and the worker runs `CHECKPOINT` after
  start-up and before a flush once the log has grown by 8 MB (`checkpointDeviceDatabase` in
  `client/src/device/shims/pg.ts`), so `pg_wal` stays at one or two segments (tested in `pg.test.ts`).
- **Security headers.** There is no server to send them: the page carries its CSP as a meta tag
  (`client/vite.config.ts`, `DEVICE_CSP`), the hosted policy plus `'wasm-unsafe-eval'` for WebAssembly, with
  `connect-src 'self' https://world.openfoodfacts.org`. A meta CSP does not cover the device worker (a dedicated
  worker loaded from its own URL; the Android app's local server sends no CSP header), and the worker is where the
  server code and the barcode lookup run. The worker therefore enforces the same rule itself
  (`client/src/device/network-guard.ts`, installed before any server module loads): `fetch` reaches only the
  app's own origin and Open Food Facts, anything else is refused before a request is made, and XMLHttpRequest,
  WebSocket, EventSource and importScripts are removed. A test checks that this list and the CSP's connect-src
  match. It does not stop a dynamic `import()` of a remote module (nothing in the worker does that). Adding a
  host means the privacy texts and the Data safety answers change too.

## Where the data lives

| What | Where | Notes |
| --- | --- | --- |
| Everything the person records (profile, plans, workouts, sets, records, food log, custom foods, saved meals, weigh-ins, coach conversations, points, achievements, reminder settings) | PGlite database in IndexedDB (`/pglite/lupufit-device`) of the origin `https://localhost`; on Android under the app's private folder `app_webview/…/IndexedDB` | The same tables as the hosted server (same migrations) |
| Hidden device account (`device-<uuid>@device.lupufit` + random password) | One row in `device.account`, in the same database | Never in localStorage, never in a backup file, never shown |
| Session cookie | In the worker's memory and in that row | The page never sees it |
| Small settings: language, theme, drafts (3 days), workout settings, last backup time, welcome flag | `localStorage` keys `fitai.*` | Same keys as the website |
| Scheduled reminders | Android's notification schedule (14 days ahead) | Rebuilt by the app; cancelled when a reminder is no longer needed |
| Last backup file handed to the share sheet | App's private cache folder (`cache/share/`) | Replaced by the next one; deleted by "Erase all data"; Android may clear it |

What leaves the phone: **only the barcode lookup**. The worker requests
`https://world.openfoodfacts.org/api/v2/product/<barcode>.json?fields=…` directly from the phone; Open Food Facts
sees the barcode, the phone's IP address and the WebView's standard request headers. Nothing else is sent
anywhere by the app (no analytics, no crash reporting, no AI). The found product is stored in the phone's food
table like any food.

### Backups, erase, uninstall
- **Backup file** (Settings → Your data on this phone → Save backup file): the website's backup format (readable
  account export, hidden e-mail left out) plus `device.snapshot`, every row of the person's tables as stored
  (`client/src/device/worker/snapshot.ts`). It is plain, unencrypted JSON (the settings say so next to the
  button); the person chooses where it goes through the share sheet. It is written without indentation and the
  phone reads backup files up to 200 MB (`MAX_DEVICE_BACKUP_BYTES`; the website's own limit is 25 MB): about 0.5 KB
  per diary entry or set in each of the two copies, so years of heavy daily use stay far below it (a test saves
  five years of synthetic history and reads it back). Saving checks the size: a file above the limit is reported
  ("larger than this version can restore") and not counted as a backup. On Android the share sheet cannot tell
  whether the receiving app kept the file, so the settings then say "sent to another app … check that it arrived"
  instead of "saved". **Restore** (same section, or on the first-run welcome) replaces everything on the
  phone in one transaction (all or nothing). A backup made by a newer app version is refused ("update the app").
  A backup made by the website cannot be restored on the phone (no snapshot).
- **Android backup** (`allowBackup` with `res/xml/data_extraction_rules.xml` and `backup_rules.xml`): only the
  WebView's IndexedDB and Local Storage. Cloud copies in the Google account: end-to-end encrypted only on
  Android 9 and newer (on Android 7–8 Android ignores the encryption requirement), skipped above 25 MB, not
  guaranteed. Phone-to-phone transfer: same files. Details: [android.md](android.md#android-backup-of-the-apps-data).
  Not verified on a phone.
- **Erase all data** (two confirmations): the worker deletes the database while it holds the lock, then every
  `fitai.*` key goes, the Android app deletes the last backup file it prepared (`cache/share/`,
  `platform.clearSavedFiles`), and the app starts again as a first launch (scheduled reminders are cancelled
  then). If the database could not be deleted, the next start does it first. Backup files saved elsewhere and a
  copy in Android's own backup are not deleted (the confirmation says so).
- **Uninstall**: Android deletes the app's whole private storage (database, settings, cache, scheduled reminders).
  Backup files the person saved elsewhere and a copy in their Google backup stay.

## App updates: migrations and data

An update from Google Play (or an APK signed with the same key, higher `versionCode`) replaces the app and keeps
its data: the database belongs to the origin `https://localhost`, which never changes (never change `appId`,
`androidScheme` or `hostname` in `capacitor.config.ts`: a different origin is an empty database).

On the first start after an update:
1. The worker opens the existing database (start-up screen "Opening your data on this phone…").
2. `migrate()` runs the SQL migrations bundled into the app (`server/src/db/migrations/*.sql` via `import.meta.glob`
   `?raw`, same names and SHA-256 checksums as on disk; line endings are normalized to LF before hashing) that this database has not applied yet, each in its own
   transaction, recorded in `schema_migrations`. The start-up screen says "Updating your data for the new
   version… Your data is kept."
3. `seedContent()` updates the built-in exercises, foods and dishes (skipped when the content hash is unchanged;
   it never touches the person's data).
4. The app opens.

If a migration fails, its transaction is rolled back, the start-up screen shows "Updating your data … failed.
Your data is kept; try again", and nothing is deleted; a fixed app update can then migrate it.

Rules for every change that ships to phones:
- **Never edit an applied migration.** A changed checksum stops the start-up on every phone that ran it (there is
  no operator who could repair it by hand). Add a new `NNNN_*.sql` instead, and add its checksum to
  `server/src/db/migration-checksums.json`: `client/src/device/migrations.test.ts` fails when a shipped
  migration's checksum changes or a new one is missing there. `.gitattributes` pins `*.sql` to LF.
- **Restoring older backups.** A restore writes the snapshot's rows straight into the current tables
  (`worker/snapshot.ts`); later migrations are not replayed on those rows. That is right only for migrations that
  add tables, or add columns whose default is the correct value for old rows. A migration that rewrites existing
  rows (backfills, unit or format changes) or adds a NOT NULL column without a default must also change the
  restore (convert older snapshots the same way, or refuse them with a clear message), with a test that restores a
  snapshot from before it.
- Migrations must run on PGlite: `npm run test:server:device` runs the whole server suite, migrations included,
  on PGlite. Keep them quick: they run on phones, while the person waits on the start-up screen.
- A new per-user table goes into `SNAPSHOT_TABLES` (backup file) or `NOT_IN_SNAPSHOT` with a reason (a test checks
  the coverage). Backups from older versions restore into the new schema (missing columns get their defaults,
  which is correct only under the rule above).
- Raise `versionCode` in `android/version.properties` for every Play upload. People cannot go back to an older
  version from Play; Android refuses an APK with a lower `versionCode` over the installed one.
- Upgrading `@electric-sql/pglite`: read its release notes for changes to the stored data format (like a
  PostgreSQL major upgrade). Before shipping, open a database created by the previous app version with the new one
  (install the old APK, add data, install the new APK over it).

## Limits (said in the app, the legal pages and the store listing)
- The data lives **only on this phone**. It is lost when the app is uninstalled or the phone is lost, reset or
  broken, unless a backup file was saved (or Android's own backup happened to keep a copy: not guaranteed).
- **No sync** between devices, no website access to the same data.
- **No AI**: the AI coach and meal-photo analysis need a server-side key. The built-in coach answers from the
  person's data and the exercise library; free-text plan preferences are matched with keywords.
- The **barcode lookup needs internet** and sends the barcode number to Open Food Facts.
- **Reminders** are local notifications, inexact (a few minutes late is possible), scheduled 14 days ahead; if the
  app is not opened for 14 days they stop until it is opened again. If the phone was switched off while reminders
  were due, Android shows the missed ones together shortly after it starts again (also ones already done that
  day: the app has not run yet to cancel them). The live workout's "Rest over" is a local notification too
  (inexact, so it can come a little late on a dozing phone; shown only when notifications are allowed). In a browser (device build without the
  Android app) reminders show only while the app is open.
- **No camera permission** in the Android app: the barcode tab offers no camera scan there and asks for the number
  (see android.md "Known gaps").
- Anyone who can use the unlocked phone can open the app: there is no app lock.

## Build and test

```
npm run build:device            # dist/device: the app with the server inside (no server needed)
npx vite preview --config client/vite.config.ts --mode device --port 4620   # try it in a browser
npm run test:server:device      # server suite on PGlite + shims + worker flows (no PostgreSQL needed)
npm run test:client             # includes the legal-page and platform tests
npm run test:e2e:device         # after build:device: Playwright on dist/device at Pixel 7 size (port 4620)
DEVICE_SHOTS=<dir> npm run test:e2e:device   # also saves Hebrew screenshots of the main screens
./android/build-release.sh --out <dir>       # signed AAB + APK (see android.md for signing variables)
```

Server mode must stay green as well (`npm run typecheck && npm run lint && npm run validate:content &&
npm run test:client && npm run build`, `npm run test:server` against your own PostgreSQL database).

## Legal pages and the store listing

- The in-app pages `/privacy`, `/terms` and `/account-deletion` show the device-mode texts in the device build and
  the hosted-service texts in the server build (`client/src/features/legal/documents.ts`; texts in
  `client/src/i18n/locales/{he,en}/legal.ts`, device part under `device`). A test lists every hosted-service
  text the device pages reuse; anything about accounts, servers, AI, Web Push or e-mail needs a device version.
- Google Play needs a **public** privacy-policy URL even though the app has no server. `npm run legal:static`
  writes the device-mode pages as static HTML (Hebrew at the top level, English in `en/`) to `dist/legal/`. Upload
  that folder to any free static host (for example GitHub Pages, Netlify Drop or Cloudflare Pages) and use
  `<address>/privacy.html` in Play Console. Fill the `[placeholders]` and have a lawyer review the texts first.
- Store texts and forms: `docs/play-store/` (`data-safety.md` has the device-mode answers).
