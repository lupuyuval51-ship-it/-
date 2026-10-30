# LUPU-FIT on Android

There are two Android projects. Both use the package id `com.lupufit.app`, so only one of them can be the
Google Play listing at a time (publishing the device app as an update of the same listing replaces the TWA;
to publish both, give the TWA its own package id in `android-twa/twa.properties`).

| | **Device mode** — `android/` (recommended) | **Hosted mode** — `android-twa/` |
| --- | --- | --- |
| What it is | Capacitor 8 app: the whole app, its server and its PostgreSQL database (PGlite) run inside the app | Trusted Web Activity: opens the LUPU-FIT website full screen |
| Server / database to host and pay for | **None** | Yes (see `deploy-oracle.md` / `deploy-render.md`) |
| Works offline | Everything except the barcode lookup | Only what the web app caches |
| Data | Only on this phone | On the server, shared by the person's devices |
| AI coach, meal-photo AI | Not available (the built-in coach works) | When the server has an AI key |
| Reminders | Local notifications scheduled on the phone | Web Push from the server |
| Build | `android/build-release.sh` → signed `.aab` + `.apk` | `android-twa/build-aab.sh --host <domain>` → signed `.aab` |

## Device-mode app (`android/`)

The app is the device build of the web app (`npm run build:device` → `dist/device`, see
`client/src/device/README.md`) packaged with Capacitor 8 (`capacitor.config.ts`: appId `com.lupufit.app`,
appName `LUPU-FIT`, webDir `dist/device`, served from `https://localhost` inside the app). Hebrew (RTL) is the
default language and English works too; the app name is the same in both, so there is no separate Hebrew label.

### What the person should know (the app should say this too)
- **The data lives only on this phone.** It is lost when the app is uninstalled or the phone is lost, unless a
  backup file was saved (Settings → Backup → share sheet → Files / Drive / e-mail). Android's own backup may
  also keep a copy (next section). There is **no sync** between devices.
- The **AI coach and the meal-photo analysis are not available** (they need a server-side key); the built-in
  coach works.
- The **barcode lookup needs internet**; it sends only the barcode number to Open Food Facts. Everything else
  works in airplane mode.

### Android backup of the app's data
`AndroidManifest.xml` keeps `android:allowBackup="true"` and limits what Android may copy to the app's data:

- `res/xml/data_extraction_rules.xml` (Android 12+) and `res/xml/backup_rules.xml` (Android 11 and lower)
  include only the WebView's `IndexedDB` (the PGlite database: profile, plans, workouts, food log, weight and
  the hidden device account) and `Local Storage` (language, theme, drafts, workout settings) under
  `app_webview/Default/` (and `app_webview/` for older WebView versions). Caches, the reminder schedule and the
  cookie are not copied (the app rebuilds them).
- **Google account backup** (cloud): Android does it by itself about once a day when the phone is idle,
  charging and on Wi‑Fi, if the person turned on backup in Android settings. It is limited to **25 MB per app**:
  above that Android skips the cloud backup until the data is smaller again. A fresh database is about 16 MB, so
  there is room, but a large history can exceed it. The rules allow the cloud copy only when it can be
  end-to-end encrypted (a screen lock is set; `disableIfNoEncryptionCapabilities`, `requireFlags`). Android stops
  the app while it copies its files, so the copy is consistent.
- **Phone-to-phone transfer** (setting up a new phone from the old one): the same files, without the 25 MB limit.
- Restore happens when the app is installed again on a phone signed in to the same Google account, before the
  app first opens.
- **Not verified here:** no backup or restore was run (no Android device or emulator was available: the build
  machine has no `/dev/kvm`). The paths are where Chromium's Android WebView keeps its storage today. To check on
  a phone with USB debugging: `adb shell bmgr backupnow com.lupufit.app`, uninstall, reinstall from Play
  (or `adb shell bmgr restore`), open the app and look for the data. The backup file stays the reliable way.

### Reminders (local notifications)
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

### Other native behaviour
- **Back button / gesture**: closes an open dialog first, otherwise goes back in the app; at the start page
  (`/`, onboarding) it leaves the app to the home screen (the app stays ready in the background, like Android's
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

### Permissions in the merged manifest
| Permission | From | Why |
| --- | --- | --- |
| `INTERNET` | app | Barcode lookup (Open Food Facts) |
| `POST_NOTIFICATIONS` | local-notifications | Reminders (Android 13+ asks from the tap only) |
| `RECEIVE_BOOT_COMPLETED` | local-notifications | Keep scheduled reminders after a restart |
| `WAKE_LOCK` | local-notifications | Show a reminder while the phone sleeps |
| `com.lupufit.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | AndroidX | Internal (not a user permission) |

### Build and sign
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

### Installing the APK directly (without Google Play)
Copy `LUPU-FIT-device.apk` to the phone, open it, and allow "Install unknown apps" for the app that opened it
(Files, Chrome, Drive). Updates must be signed with the same key; Android refuses an APK signed with a different
key over an installed app (uninstall first, which deletes the app's data unless a backup file was saved).

## Hosted-mode app (`android-twa/`, Trusted Web Activity)

A small native shell that opens the LUPU-FIT website full screen in the phone's browser engine. All features,
updates and data live on the website, so the site must be deployed on a public HTTPS domain first.

### What is in `android-twa/`
- `twa.properties`: domain (`host`), start path, package id (`com.lupufit.app`), name, version.
  The committed host `lupu-fit.example` is a **placeholder** (the `.example` domain can never exist).
- `app/src/main/AndroidManifest.xml`: launcher, links to the site open in the app (verified),
  splash screen (black with the logo), notification delegation (web push from the site appears as
  LUPU-FIT notifications; Android 13+ asks for permission), portrait, Custom Tab fallback.
- Icons are generated from `client/public/icon-*.png` (adaptive icon, round icon, white notification icon).
- `build-aab.sh`: builds a signed `.aab`. Gradle wrapper included (Gradle 8.14.3, AGP 8.13.2,
  compile/target SDK 36, min SDK 24).

### Steps to publish
1. Deploy the web app (server + PostgreSQL) on your domain over HTTPS, e.g. `app.your-domain.com`.
   Step-by-step guides (Hebrew): [deploy-oracle.md](deploy-oracle.md) (one free VM with Docker Compose, Caddy and automatic
   HTTPS; `deploy/oracle/setup.sh`) or [deploy-render.md](deploy-render.md) (Render + Neon). The host is baked into the app,
   so prefer a domain you own over a free `…sslip.io` / `…onrender.com` name before publishing to Google Play.
2. Create the upload key once and keep it forever (losing it means asking Google to reset it):
   `LUPUFIT_KEYSTORE_PASSWORD=... ./android-twa/build-aab.sh --create-keystore ~/lupufit-upload.jks`
3. Build: `LUPUFIT_KEYSTORE=~/lupufit-upload.jks LUPUFIT_KEYSTORE_PASSWORD=... ./android-twa/build-aab.sh --host app.your-domain.com --fetch-sdk`
   (raise `--version-code` for every upload; it must be higher than any device-mode build already on Play).
4. Upload `android-twa/app/build/outputs/bundle/release/app-release.aab` to Play Console (internal testing first),
   with Play App Signing enabled.
5. On the server set `ANDROID_APP_PACKAGE=com.lupufit.app` and `ANDROID_CERT_SHA256=<upload key SHA-256>,<app signing key SHA-256>`
   (the second one is in Play Console > Test and release > App integrity). Check
   `https://app.your-domain.com/.well-known/assetlinks.json` returns both. Without it the app shows an address bar.
   With the Oracle kit, put Play's fingerprint in `deploy/oracle/.env` as `ANDROID_PLAY_CERT_SHA256` and run `docker compose up -d`
   (the upload key's fingerprint is already in `ANDROID_CERT_SHA256`); on Render add `ANDROID_PLAY_CERT_SHA256` in the Dashboard.

### Not verified here
The bundle was built and its signature and merged manifest were checked in a Linux container. It was not
installed on a phone or emulator, and it cannot open a real site until step 1 is done.

## בעברית: התקנת האפליקציה בלי שרת

- **מה זה:** אפליקציית LUPU-FIT שעובדת כולה בתוך הטלפון. אין שרת, אין מסד נתונים לשלם עליו ואין חשבון להירשם אליו.
- **התקנה ישירה (בלי Google Play):** מעבירים את הקובץ `LUPU-FIT-device.apk` לטלפון, פותחים אותו ומאשרים
  „התקנה ממקורות לא ידועים” לאפליקציה שפתחה אותו (קבצים, Chrome או Drive).
- **Google Play:** מעלים את `LUPU-FIT-device.aab` ל-Play Console. בכל העלאה צריך להעלות את `versionCode`
  בקובץ `android/version.properties`.
- **חשוב לדעת:**
  - הנתונים נשמרים רק בטלפון הזה. אם מוחקים את האפליקציה או שהטלפון אובד, הם נמחקים, אלא אם נשמר קובץ גיבוי
    (הגדרות ← גיבוי). אנדרואיד עשוי לשמור עותק גם בגיבוי של חשבון Google (עד 25MB, כשהגיבוי מופעל בטלפון) –
    זה לא נבדק כאן על טלפון אמיתי.
  - אין סנכרון בין מכשירים.
  - מאמן ה-AI וניתוח תמונות הארוחות לא זמינים (המאמן המובנה כן עובד).
  - חיפוש לפי ברקוד צריך אינטרנט ושולח ל-Open Food Facts רק את מספר הברקוד. כל השאר עובד גם במצב טיסה.
  - התזכורות מגיעות כהתראות בטלפון גם כשהאפליקציה סגורה, אחרי אישור ההתראות בהגדרות. הן יכולות להגיע באיחור של כמה דקות.
