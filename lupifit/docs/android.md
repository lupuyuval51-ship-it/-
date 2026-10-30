# LUPU-FIT on Android (device mode, `android/`)

The Android app is **LUPU-FIT in device mode**: the whole app, its server code and its PostgreSQL database
(PGlite) run inside the app on the phone. There is **no server and no database service** to host or pay for.
How device mode works, where the data lives and how app updates migrate it: [device-mode.md](device-mode.md).
Owner's guide in Hebrew (install the APK, upload to Google Play, limits): [device-mode-he.md](device-mode-he.md).

The app is the device build of the web app (`npm run build:device` → `dist/device`, see
`client/src/device/README.md`) packaged with Capacitor 8 (`capacitor.config.ts`: appId `com.lupufit.app`,
appName `LUPU-FIT`, webDir `dist/device`, served from `https://localhost` inside the app). Hebrew (RTL) is the
default language and English works too; the app name is the same in both, so there is no separate Hebrew label.

> The older **hosted-mode** Android project (a Trusted Web Activity that opens the website, which needs the
> server) is in `android-twa/`, documented in [android-twa.md](android-twa.md). Both use the package id
> `com.lupufit.app`, so only one of them can be the Google Play listing.

| | **Device mode** (`android/`, this page) | Hosted mode (`android-twa/`) |
| --- | --- | --- |
| Server / database to host and pay for | **None** | Yes (`deploy-oracle.md` / `deploy-render.md`) |
| Works offline | Everything except the barcode lookup | Only what the web app caches |
| Data | Only on this phone | On the server, shared by the person's devices |
| Account | None (a hidden one inside the app) | E-mail and password |
| AI coach, meal-photo AI | Not available (the built-in coach works) | When the server has an AI key |
| Reminders | Local notifications scheduled on the phone | Web Push from the server |
| Build | `android/build-release.sh` → signed `.aab` + `.apk` | `android-twa/build-aab.sh --host <domain>` → signed `.aab` |

## What the person should know (the app says this too)
- **The data lives only on this phone.** It is lost when the app is uninstalled or the phone is lost, unless a
  backup file was saved (Settings → Your data on this phone → Save backup file → share sheet → Files / Drive /
  e-mail). The same section restores a backup file (also offered on the first-run welcome) and erases
  everything. Android's own backup may also keep a copy (next section). There is **no sync** between devices.
- The **AI coach and the meal-photo analysis are not available** (they need a server-side key); the built-in
  coach works.
- The **barcode lookup needs internet**; it sends only the barcode number to Open Food Facts. Everything else
  works in airplane mode.

## Android backup of the app's data
`AndroidManifest.xml` keeps `android:allowBackup="true"` and limits what Android may copy to the app's data:

- `res/xml/data_extraction_rules.xml` (Android 12+) and `res/xml/backup_rules.xml` (Android 11 and lower)
  include only the WebView's `IndexedDB` (the PGlite database: profile, plans, workouts, food log, weight and
  the hidden device account) and `Local Storage` (language, theme, drafts, workout settings) under
  `app_webview/Default/` (and `app_webview/` for older WebView versions). Caches, the reminder schedule and the
  cookie are not copied (the app rebuilds them).
- **Google account backup** (cloud): Android does it by itself about once a day when the phone is idle,
  charging and on Wi‑Fi, if the person turned on backup in Android settings. It is limited to **25 MB per app**:
  above that Android skips the cloud backup until the data is smaller again. A fresh database is about 16 MB, so
  there is room, but a large history can exceed it. Android stops the app while it copies its files, so the
  copy is consistent.
- **Encryption of the cloud copy, by Android version** (exactly what the two rule files do):
  - Android 12 and newer: `data_extraction_rules.xml`, `<cloud-backup disableIfNoEncryptionCapabilities="true">`:
    no cloud copy unless it can be end-to-end encrypted (a screen lock is set).
  - Android 9–11: `backup_rules.xml`, cloud rules with `requireFlags="clientSideEncryption"`: same result.
  - **Android 7–8.1** (API 24–27, which `minSdk 24` allows): these versions do not know `requireFlags` and
    ignore it, so every `<include>` applies. If the person turned on Google backup, the app's data is copied to
    their Google account **without end-to-end encryption** (Android 7–8 has none for backups; Google encrypts it
    on its side). The privacy policy says so. To avoid it, the app would have to turn backup off below API 28
    (e.g. `android:allowBackup="@bool/allow_backup"` with `false` in `values/` and `true` in `values-v28/`),
    which also ends phone-to-phone transfer there. Not changed here; a decision for the owner.
- **Phone-to-phone transfer** (setting up a new phone from the old one): the same files, without the 25 MB limit.
- Restore happens when the app is installed again on a phone signed in to the same Google account, before the
  app first opens.
- **Not verified here:** no backup or restore was run (no Android device or emulator was available: the build
  machine has no `/dev/kvm`). The paths are where Chromium's Android WebView keeps its storage today. To check on
  a phone with USB debugging: `adb shell bmgr backupnow com.lupufit.app`, uninstall, reinstall from Play
  (or `adb shell bmgr restore`), open the app and look for the data. The backup file stays the reliable way.

## Reminders (local notifications)
- `client/src/platform/native/reminders.ts`: one-off notifications for the next **14 days** from the reminder
  settings (same rules as the in-app reminders), with fixed ids per day and slot, so each sync replaces them.
  They are synced when the app starts or comes back to the foreground, when the settings change, and a moment
  after any change in the app (a finished workout, logged food), so a reminder that is already satisfied is
  cancelled (and removed from the notification shade if it already showed).
- **Inexact alarms only** (`isExactNotification: false`): a reminder may arrive a few minutes late. The manifest
  removes `SCHEDULE_EXACT_ALARM` (which the plugin declares) and never declares `USE_EXACT_ALARM`.
- Android 13+ asks for the notification permission only when the person taps **Allow notifications** in
  Settings → Reminders. Without permission nothing is scheduled.
- Scheduled reminders survive a restart of the phone (`RECEIVE_BOOT_COMPLETED`). If the app is "force
  stopped", Android drops its alarms; the next time the app opens they are scheduled again. If the app is not
  opened for 14 days, reminders stop until it is opened again.
- Notification texts follow the app language (`notifications.reminders.*`), channel "Reminders" / "תזכורות".

## Other native behaviour
- **Back button / gesture**: closes an open dialog first, otherwise goes back in the app; at the start page
  (`/`, the first-run welcome, onboarding) it leaves the app to the home screen (the app stays ready in the background, like Android's
  own back at an app's start). Opened directly on an inner page (e.g. from a reminder), back goes to the start page.
- **Edge-to-edge**: the app draws behind the status and navigation bars and keeps its content clear of them with
  `env(safe-area-inset-*)` (Capacitor's SystemBars plugin). The bar icons follow the app's light/dark theme.
- **Keyboard**: the page is resized above the keyboard (`adjustResize` + the SystemBars IME inset).
- **Saving files** (backup, export): written to the app's private cache folder and handed to Android's share
  sheet; only the latest file is kept there.
- **Splash**: the logo on `#0b0b0d` until the WebView draws (Android 12+ system splash and the compat one).
- Icons: `node scripts/make-android-icons.mjs` regenerates the launcher, adaptive, themed (monochrome) and
  notification icons from `client/public/favicon.svg`.
- Portrait only on phones (Android 16 ignores this on tablets and foldables, where the app's wide layout is used).

## Permissions in the merged manifest
| Permission | From | Why |
| --- | --- | --- |
| `INTERNET` | app | Barcode lookup (Open Food Facts) |
| `POST_NOTIFICATIONS` | local-notifications | Reminders (Android 13+ asks from the tap only) |
| `RECEIVE_BOOT_COMPLETED` | local-notifications | Keep scheduled reminders after a restart |
| `WAKE_LOCK` | local-notifications | Show a reminder while the phone sleeps |
| `com.lupufit.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | AndroidX | Internal (not a user permission) |

## Build and sign
Needs Node 22.13+ (`npm ci` in `lupifit/`), JDK 21 and an Android SDK with platform 36 and build-tools 36
(`--fetch-sdk` downloads them). From `lupifit/`:

```
LUPUFIT_KEYSTORE=~/lupufit-upload.jks LUPUFIT_KEYSTORE_PASSWORD_FILE=~/lupufit-keystore-password.txt \
  ./android/build-release.sh --out ~/lupufit-release
```

It runs `npm run build:device`, `npx cap sync android`, then Gradle `bundleRelease` + `assembleRelease`, checks
both signatures against the upload key (`apksigner`, `jarsigner`), prints the merged manifest (package, version,
SDK levels, permissions) and fails if an exact-alarm permission slipped in. Outputs:
`android/app/build/outputs/bundle/release/app-release.aab` (Google Play) and
`android/app/build/outputs/apk/release/app-release.apk` (direct install), copied to `--out` as
`LUPU-FIT-device.aab` / `LUPU-FIT-device.apk` (about 18 MB each: PostgreSQL in WebAssembly is most of it,
the dish photos 8.7 MB). The APK is signed with APK Signature Scheme v2 (enough from Android 7.0, the minimum).

- Signing comes only from the environment: `LUPUFIT_KEYSTORE`, the password in `LUPUFIT_KEYSTORE_PASSWORD` or in
  the file named by `LUPUFIT_KEYSTORE_PASSWORD_FILE`, optional `LUPUFIT_KEY_ALIAS` (default `upload`) and
  `LUPUFIT_KEY_PASSWORD`. The same upload key signs both Android projects. Keys and passwords are never in the repo.
- Version: `android/version.properties` (`versionCode`, `versionName`) is the only place it is set. Raise
  `versionCode` for every upload to Play, or pass `--version-code N --version-name X.Y.Z` for one build.
  It starts at 2 because the TWA build was versionCode 1 with the same package id.
- Gradle uses Google's mirror of Maven Central first (Maven Central itself may answer 429 on busy machines).
- To open `android/` in Android Studio, run `npm run build:device && npx cap sync android` first: the web files
  (`app/src/main/assets/public`) and `capacitor-cordova-android-plugins/` are generated, not committed.
- SDK levels: compile and target SDK 36 (Google Play requires target 36 for new apps and updates since
  31 Aug 2026), min SDK 24 (Android 7.0), Capacitor 8's default.

## Releasing a new version (every upload to Google Play)
1. Raise `versionCode` in `android/version.properties` by at least 1 (Play refuses a versionCode it has seen
   before, including from the `android-twa/` project with the same package id). Change `versionName` (`1.0.1`,
   `1.1.0` …) when people should see a new version number.
2. If the release adds a database migration: it must never edit an applied one (every phone that already ran it
   would fail to start), and `npm run test:server:device` must pass (the whole server suite on PGlite). Check
   the upgrade of an existing database: install the previous APK, add data, install the new APK over it (see
   [device-mode.md](device-mode.md#app-updates-migrations-and-data)).
3. Build: `./android/build-release.sh --out <folder>` (above). Commit the version change.
4. Upload `LUPU-FIT-device.aab` in Play Console (Test and release → a testing track first, then Production).
5. If the release changes what the app stores or sends anywhere, update the legal texts
   (`client/src/i18n/locales/*/legal.ts`, `device` part), republish the static legal pages
   (`npm run legal:static`) and update `docs/play-store/data-safety.md` and the Play Console form.

## Installing the APK directly (without Google Play)
Copy `LUPU-FIT-device.apk` to the phone, open it, and allow "Install unknown apps" for the app that opened it
(Files, Chrome, Drive). Updates must be signed with the same key; Android refuses an APK signed with a different
key over an installed app (uninstall first, which deletes the app's data unless a backup file was saved).

- **Play-installed and directly installed copies do not mix.** With Play App Signing, the copy people get from
  Google Play is signed with Google's app signing key, while `LUPU-FIT-device.apk` is signed with the upload key.
  Android therefore refuses to install one over the other. To move a test phone from the APK to the Play version
  (or back): save a backup file, uninstall, install the other one, restore the backup file on the welcome screen.
- For testers, Play's internal testing track (or internal app sharing) avoids this: they install from Play.

## Testing on a real phone before a release
Nothing here was run on a phone or an emulator (the build machine has no `/dev/kvm`). Before the first public
release, on at least one real phone (ideally Android 13+ and one older version):
- First launch (start-up screen, welcome, questionnaire), a whole workout, food log, weigh-in, coach, progress.
- Airplane mode: everything except the barcode lookup keeps working; barcode lookup works again online.
- Close the app from the recent-apps screen and reopen: the data is still there. Restart the phone: same.
- Reminders: allow notifications from Settings → Reminders, set a time a few minutes ahead, close the app, wait.
  Finish a workout before a workout reminder: it must not arrive.
- Backup file: save it to Drive or Files, erase all data, restore it on the welcome screen.
- Update: install the current APK, add data, build a higher `versionCode` and install it over the first: the data
  stays (and, when the release has a migration, the start-up screen shows "Updating your data…" once).
- Android backup (optional, with USB debugging): `adb shell bmgr backupnow com.lupufit.app`, uninstall, reinstall
  from Play, check the data came back.

## Known gaps
- **Camera barcode scanning**: the app has no `CAMERA` permission. If the phone's WebView offers `BarcodeDetector`
  (not checked on a phone), the barcode tab shows the scan button and the camera request is then refused (the
  person can still type the number).
  Either add the camera permission (and update the privacy texts and Data safety) or hide the button in the
  native app.
- Android 7–8 cloud backups are not end-to-end encrypted (see "Android backup of the app's data").
