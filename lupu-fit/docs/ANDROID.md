# LUPU-FIT for Android (Capacitor, Device Mode)

The Android app is a Capacitor 7 shell around the standalone **Device Mode** web build (`VITE_RUN_MODE=device`, `npm run build:device` -> `client/dist-device`). PGlite runs in a Web Worker over IndexedDB (`idb://lupu-fit-pgdata`); **no server is needed** (version 10 is server-free, D22) and every screen works in airplane mode.

**What needs the internet, and nothing else** (D22): (1) the optional barcode lookup, a direct HTTPS GET from the worker to `https://world.openfoodfacts.org/api/v2/product/<number>.json` (the number is the only thing sent); (2) the optional AI proxy, only if you build with `VITE_AI_PROXY_URL` (the shipped AAB does not). Everything else (fonts, icons, manifest, 244 clips, dish photos, the database, reminders) is inside the app. With no proxy the UI has no AI at all: the coach is the rules coach, the "AI estimate" photo tile and the "more languages" machine-translation entry are hidden, and the privacy policy/terms are the device versions (no account, no operator, no cloud).

| | |
|---|---|
| applicationId | `app.lupufit` |
| versionCode / versionName | see `android/app/build.gradle` (8 / 0.8.0 when this was written); bump `versionCode` for every Play upload; `package.json` version names the output AAB |
| minSdk / targetSdk / compileSdk | 24 / 35 / 35 |
| Capacitor | 7.6.x (`@capacitor/core`, `cli`, `android` as root devDependencies); plugins `local-notifications` 7.0.7, `filesystem` 7.1.9, `share` 7.0.4 |
| Android Gradle Plugin / Gradle | 8.7.2 / wrapper 8.11.1 |
| Web origin inside the app | `https://localhost` (`androidScheme: 'https'`) |

## Build

```bash
scripts/android-setup.sh          # once: installs the Android SDK into /opt/android-sdk (or ~/android-sdk)
scripts/android-build.sh          # build:device + icons + cap sync + signed bundleRelease
scripts/android-build.sh --debug-apk   # additionally builds a debug APK
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`, copied to `store-assets/LUPU-FIT-<package.json version>.aab` (git-ignored). Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

Rebuild after any code change: `scripts/android-build.sh`. Needs JDK 21 (Capacitor 7 compiles with Java 21) and Node 22. The script retries Gradle when the Maven mirrors answer 429.

### Optional: AI coach proxy (not for a public release yet)
Device Mode has no server. Without a proxy the coach is the deterministic rules coach. If you set the build-time variable `VITE_AI_PROXY_URL` (read in `client/src/device/deviceWorker.ts`), the worker forwards `POST {url}/ai/complete` and `POST {url}/ai/describe-image` through the egress guard (`makeGuardedFetch`) to that proxy, which holds the real provider keys. Use an `https://` URL (cleartext is blocked by the network security config). If you enable it, the Play data-safety answers below and `store-assets/play-listing.md` must be updated (user prompts/photos leave the device).

**Do not set `VITE_AI_PROXY_URL` for a public (Play) release until a proxy that meets all of the requirements below exists.** No proxy is implemented in this repository. The URL is a plain string inside the APK, and the request carries no credential: the client sends the whole provider input (`{system, messages, maxTokens, json}` and `{system, prompt, jpegBase64}`). The coach and translate quotas (D16), the 600-token cap, the minors clause and the safety shield all run in the worker on the phone, so anyone who unpacks the APK can call the proxy directly with any prompt and token count and spend the provider keys. A proxy is acceptable only if it:
1. enforces its own per-install and global rate and budget limits (it cannot rely on the app's quotas);
2. ignores client-supplied `system` and `maxTokens` and uses fixed server-side prompts and token caps per route (`/ai/complete` coach, translate, `/ai/describe-image`);
3. caps input size (message count and length) and photo size, and rejects anything larger;
4. verifies a Play Integrity token on every request. The client does not send one yet: `client/src/device/proxyAi.ts` must be changed to send it and to use `redirect: 'error'` before such a build.

Use it only for private test builds against a proxy you control (example: `VITE_AI_PROXY_URL=https://ai.example.com scripts/android-build.sh`).

## Signing and keystore
`android/keystore/lupufit-upload.jks` (alias `lupufit-upload`, RSA 4096, PKCS12, valid 10000 days) and `android/keystore/keystore.properties` (store/key passwords) are generated locally and git-ignored. `android/app/build.gradle` signs `release` only when `keystore.properties` exists; otherwise the AAB is unsigned (the build script warns).

**BACK UP the `android/keystore/` folder (and the passwords) to a password manager / encrypted storage now.** With Play App Signing the key is only an *upload* key: if it is lost you can request an upload-key reset from Play support, but it is slow and painful. Never commit it. To regenerate on a new machine you need the same file; a new key requires that reset.

Print the certificate fingerprint: `keytool -list -v -keystore android/keystore/lupufit-upload.jks -alias lupufit-upload` (asks for the password in `keystore.properties`).

## What is configured
- Manifest: `allowBackup=false` (+ data-extraction rules excluding everything), `usesCleartextTraffic=false`, network security config (system CAs only), permissions `INTERNET`, `CAMERA` and the reminder permissions listed under "Local reminders" below. No foreground service is used. `CAMERA` is for the optional barcode scanner (`BarcodePanel.tsx` uses `getUserMedia` + `BarcodeDetector`); `uses-feature camera/autofocus required=false` so phones without a camera can install. No location or storage permissions (backups use the share sheet and, on Android 11+, a permission-free copy in Documents, see "Backup and restore").
- Theme: dark status/navigation bars (`#0B0B0D`), splash background `#0B0B0D` with the brand mark, edge-to-edge handled by `adjustMarginsForEdgeToEdge: 'auto'` (targetSdk 35).
- Icons: adaptive icon (background `#0B0B0D`, foreground and monochrome from `client/public/icons/adaptive-*.png`) plus legacy icons, generated by `scripts/android-icons.mjs`.
- Locales: `en` and `he` (`values-iw`); orientation is not locked (rotation allowed).
- Service worker: **not registered inside the Android app** (`client/src/lib/serviceWorker.ts`, `Capacitor.isNativePlatform()`): every file is already packaged, so a worker would only copy up to 300 MB of clips into the Cache API and could serve stale files after an app update. On start the app also unregisters any worker and deletes the `lupu-*` caches that builds 0.8/0.9 may have left in the WebView. In a plain browser (the device build opened as a web page, the e2e suite) `/sw.js` is still registered. The web manifest is ignored by the WebView and harmless. IndexedDB, Web Workers and `navigator.locks` are standard in the Android System WebView (Chrome 110+).
- Airplane mode: `navigator.onLine` is ignored in Device Mode (`useOnline`), and the TanStack Query client uses `networkMode: 'always'`; otherwise every query and mutation pauses offline (blank screens, workout cannot finish). Covered by `e2e/device/b-workout.spec.ts` and `client/src/standalone.test.tsx`.

## Backup and restore (the only way to recover data)
The Android app has no cloud copy and `allowBackup=false`, so the exported file is the only way to move to a new phone or recover after "Delete all data" / cleared app data (D23, D24).

**What the file holds (backup format 2, D23)**: profile, workouts (sets, finishers, plan links, records, XP, achievements), food log, weight entries, readiness check-ins, training plans, saved meals, your own foods, coach chats and notifications, plus a separate block with the settings of this device (theme, language, reminder settings, remembered sport, menu choices). It never holds a password or session (there are none), the hidden local username, or the AI quota counters. The file is plain JSON: it is not encrypted. Limits: 200 MB per file in the app; a workout still in progress is not restored; unknown exercises (other app version) are skipped and counted. The export route allows 3 exports per minute (so cancelling and retrying the share sheet more than three times in a minute shows "Too many requests").

### How export works on Android (D24)
A WebView does not honour `<a download>` for a blob URL (it needs a `DownloadListener` that Capacitor does not install) and does not reliably offer the Web Share API for files, so the app does not use them there. `client/src/lib/nativeFile.ts` (used when `Capacitor.isNativePlatform()`):
1. **Profile > Backup and restore > Export data** writes `cache/backups/lupu-fit-backup-YYYY-MM-DD.json` with `@capacitor/filesystem` (`Directory.Cache`, utf8, `recursive`) and then calls `Share.share({ title, dialogTitle, files: [uri] })` from `@capacitor/share`. The system share sheet opens: Drive, Files ("Save to"), WhatsApp, Gmail, Bluetooth... Closing the sheet is silent (the plugin rejects with "Share canceled"). A real failure shows a plain sentence with the reason (could not create the file / could not open the share sheet).
2. **Save to Documents** (second, explicit button) writes `Documents/LUPU-FIT/lupu-fit-backup-YYYY-MM-DD-HHMM.json` (`Directory.Documents`, the public folder, visible in the Files app) and says where it went. It is offered only when `Filesystem.checkPermissions()` reports `publicStorage: granted`, which the plugin does on Android 11+ without any prompt (plugin source: `isStoragePermissionGranted` is true on API 33+, and on 30-32 for a path inside a named directory). On Android 7-10 it would need `WRITE_EXTERNAL_STORAGE`, which the app deliberately does not declare, so there the button is hidden and the panel says that saving straight to Documents is not available and to use Export. It never prompts.
3. File names are built in code and sanitised (`safeFilename`: last path segment only, `[A-Za-z0-9._-]`, no `..`, always `.json`, max 64 characters), so no caller can pick a directory.
4. Older `lupu-fit-backup*.json` copies in `cache/backups/` are deleted on the next export (never the new one: the receiving app may still be reading it). The OS can also clear the cache at any time; the file only has to live until the person has put it somewhere.
5. **FileProvider** (`android/app/src/main/res/xml/file_paths.xml`, authority `app.lupufit.fileprovider`): the Capacitor template exposed all of shared storage (`external-path "."`) and the whole cache (`cache-path "."`). Now only `cache/backups/` and `Android/data/app.lupufit/files/Pictures/` (the optional meal-photo capture of the WebView file chooser) are mapped. The Share plugin grants read access to the one `content://` uri of the one file it shares (`FLAG_GRANT_READ_URI_PERMISSION`), never to a directory.
6. In a browser the behaviour is unchanged: Export = `<a download>` of `lupu-fit-export.json`, plus a Share row when `navigator.share` exists.

### Restore
- **Restore from file** (Profile) and **I already have a backup** (Welcome, below) use the same code (`components/profile/backupRestore.tsx`): pick, validate by content, confirmation sheet listing what will be REPLACED, result summary, specific errors.
- **New phone**: install, open the app, on the first screen tap **I already have a backup** (secondary button under the orange Start), pick the file. If it holds a profile the app goes straight to Home (no onboarding); a format 1 file without a profile continues to onboarding. Device Mode only; the hosted build's Welcome is unchanged. Reminders are re-armed from the restored settings the next time the app starts.
- **File picker**: an `<input type=file>` works in the Capacitor WebView: `BridgeWebChromeClient.onShowFileChooser` (Capacitor Android 7.6) launches `ACTION_GET_CONTENT` from the input's `accept` list; the result is a `content://` URI the WebView reads itself, so no storage permission is needed and nothing had to be added to `android/`. Android pickers often label a `.json` file `text/plain` or `application/octet-stream`, so the input accepts `application/json,.json,text/plain,application/octet-stream` (MIME types first: Capacitor's chooser mishandles a list that starts with an extension) and the file is accepted or refused by its CONTENT (`parseBackupText`), never by MIME type or name.
- Files from older versions (format 1) restore profile, workouts, food log and weights and leave everything else as it is.

### Permission diff (D24)
**None.** The merged release manifest (`bundletool dump manifest`) still declares exactly `INTERNET`, `CAMERA`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` (+ androidx's `app.lupufit.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). The Filesystem and Share plugins declare none; `READ/WRITE_EXTERNAL_STORAGE` and `MANAGE_EXTERNAL_STORAGE` are NOT added. New build-time pieces: `@capacitor/filesystem` 7.1.9 (brings the Kotlin Gradle plugin 1.9.24, `kotlinx-coroutines` and `io.ionic.libs:ionfilesystem-android` 1.1.1) and `@capacitor/share` 7.0.4. Play data safety is unchanged (the file only goes where the person sends it).

### Manual test on a device or emulator (adb)
Not yet done by anyone (no device was available when this was written). With a debug APK (`scripts/android-build.sh --debug-apk`) on Android 11+ and on an older emulator (API 29/30):
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n app.lupufit/.MainActivity
adb logcat -s Capacitor Capacitor/Plugin AndroidRuntime chromium | head -200   # keep running while testing
```
1. Onboard, log a meal, open Profile > Backup and restore > **Export data**. The share sheet must open. Pick **Files / Save to** (or Drive) and save; `adb shell ls /sdcard/Download /sdcard/Documents` (or the Files app) must show `lupu-fit-backup-<today>.json`; `adb pull` it and `python3 -m json.tool` must parse it, and `backup.version` must be 2.
2. Open **Export data** again and close the sheet with Back: no message, no red banner.
3. Tap **Save to Documents**: the toast shows `Documents/LUPU-FIT/lupu-fit-backup-<date>-<time>.json`; `adb shell ls -l /sdcard/Documents/LUPU-FIT/`; `adb pull` it. On API 29 or lower the button must be absent and the line about Documents must be shown.
4. Check only the backup is shared: `adb shell run-as app.lupufit ls cache/backups` lists only `lupu-fit-backup-*.json` (older copies disappear after the next export), and sharing from a third-party app never offers any other file of LUPU-FIT.
5. Fresh phone: `adb shell pm clear app.lupufit` (or uninstall/install), start the app: Welcome shows the orange **Set up my profile** button and the secondary **I already have a backup**. Push the file (`adb push lupu-fit-backup.json /sdcard/Download/`), tap the secondary button, choose it in the picker (also try it from Drive and from "Recent": providers label it `text/plain` or `application/octet-stream`), confirm. Expected: the confirmation sheet, then Home with the data and no onboarding. Repeat with a hand-made format 1 file (continues to onboarding) and with a text file (refused: "not a LUPU-FIT backup file", nothing changes).
6. Same restore from Profile after onboarding, Hebrew and English, rotation while the sheet is open, and a 100+ MB file if you have one (the write goes through the JS bridge as one string).
Report any `logcat` line from `Capacitor/Plugin` or `FileProvider` ("Failed to find configured root") together with the step.

## Local reminders (`@capacitor/local-notifications` 7.0.7)
Opt-in reminders in Settings > Reminders and automations (`client/src/components/profile/AutomationCard.tsx`, logic in `client/src/automation/`). All local: no server, no push service, no account, no analytics.
- **Permissions added** (merged manifest, release): `POST_NOTIFICATIONS` (Android 13+ runtime prompt, requested only when the user turns the first reminder on, never at start-up), `RECEIVE_BOOT_COMPLETED` (the plugin re-arms its alarms after a reboot), `WAKE_LOCK` (used by the plugin's alarm receiver). Unchanged: `INTERNET`, `CAMERA`.
- **Exact alarms are NOT used**: `SCHEDULE_EXACT_ALARM` and `USE_EXACT_ALARM` are removed in the manifest (`tools:node="remove"`). On Android 12+ without that permission the plugin falls back to inexact alarms (`setAndAllowWhileIdle`), so a reminder can arrive a few minutes late; the UI says so. No Play "exact alarm" declaration is needed.
- **Channel** `reminders` (importance default, private on the lock screen) is created in JS before the first schedule. Small status-bar icon: `res/drawable/ic_stat_reminder.xml` (monochrome dumbbell), tint `#FF6A00` via `capacitor.config.ts` `plugins.LocalNotifications`.
- **Deep links**: a tap carries `extra.route` (`/workouts`, `/nutrition` or `/progress`; anything else is ignored) and the router navigates there.
- **Scheduling model**: weekly/daily repeating `on` rules for workout days, meals, weigh-in and rest-day tips; one-shot `at` rules (next 7 days) for the "streak at risk" nudge, which is dropped for today when a workout is finished or in progress. The whole pending set is replaced (cancel + schedule) on app start, foreground, settings/profile/language change, workout finished/started and every 30 minutes while open; everything is cancelled on logout. Stable ids = kind code x 10 + weekday + 1 (0 = daily).
- **Web/PWA**: the Notification API is used only while the app is open (timers for the next 24 h); the UI states that it cannot fire when the app is closed. Browsers without `Notification`: scheduling toggles are hidden with a note.
- **Rest timer**: `restTimer.ts` now uses the same module (`notifyNow`) instead of a dynamic import that could never resolve inside the WebView; it only notifies when permission was already granted.
- **Play data safety**: unchanged: no data collected or shared. Reminder settings live in WebView `localStorage` on the device and notification text is generated on the device.

## Play Console steps
1. Create app (name LUPU-FIT, default language Hebrew or English, App, Free). Create a Play developer account first if needed.
2. Enable **Play App Signing** (default for new apps) when uploading the first bundle; the generated key is your *upload* key.
3. Test track first: Internal testing -> Create release -> upload the newest `store-assets/LUPU-FIT-<version>.aab`. New personal developer accounts must run a closed test (testers/days) before production; check current Play rules.
4. Store listing: title, short and full description (he + en) in `store-assets/play-listing.md`; icon `store-assets/play-icon-512.png`, feature graphic `store-assets/feature-graphic-1024x500.png`, screenshots in `store-assets/screenshots`.
5. App content: privacy policy URL (required), target audience (the app handles minors' profiles privately; pick age groups consistently with the in-app policy), content rating questionnaire, ads = none, health apps declaration (fitness/nutrition, not medical).
6. Data safety (Device Mode, no AI proxy): no data collected and no data shared, because everything is stored on the device only; no e-mail is requested and the username is local to the device and never sent anywhere; camera is optional (barcode scan) and frames are processed on device; a scanned or typed barcode number is sent to Open Food Facts (`world.openfoodfacts.org`) for the product lookup, with no user identifiers in the request (same wording as the in-app privacy policy, `legal.privacy.s6.p2`); it is a direct HTTPS request from the WebView, so Open Food Facts also sees the device IP address and the WebView User-Agent, like any web request; reminders are scheduled and shown locally (no push tokens, no notification server). Data encrypted in transit: n/a / yes only if a proxy is configured. If `VITE_AI_PROXY_URL` is set, declare the user content sent to it (text prompts, meal photos) as collected and shared with the proxy operator.
7. Roll out the release for review.

## Not verified
- **Backup export and restore picker (D24)**: written against the plugin sources and run in desktop Chromium with a fake native bridge (`e2e/device/m-native-export.spec.ts`: the app calls `Filesystem.writeFile` then `Share.share` with the returned uri), and the debug APK / AAB compile and pass `bundletool validate`; but the Kotlin plugins, the FileProvider grant, the system share sheet, writing to the public Documents folder on Android 11-14 (plain `File` API, no MediaStore) and the WebView file chooser have never run on a device. Test with the adb steps above before relying on it.
- Version 10's server-free claim is proven in desktop Chromium with the network cut (`npm run e2e:device`, docs/E2E.md) and by scanning the built files for http(s) references; it has NOT been run in the Android System WebView. Open Food Facts' CORS answer from `https://localhost` and `getUserMedia`/`BarcodeDetector` on real phones are untested.
- Local reminders were built and the AAB passes `bundletool validate`, but no notification was ever delivered on a device or emulator: permission prompt on Android 13+, channel creation, inexact alarm timing under Doze/battery optimisation, re-arming after reboot, the monochrome icon, and notification-tap deep links (including cold start) are all untested. Some OEMs (Xiaomi, Huawei, Samsung power saving) kill background alarms regardless.
- The app has NOT been run on a device or emulator (none available in the build environment). Nothing about runtime behaviour in the Android WebView (PGlite worker startup, IndexedDB persistence, service worker registration, camera permission prompt, Hebrew/RTL rendering, safe-area insets, back button) has been tested.
- The AAB was not uploaded to Play; Play Console policy answers above are suggestions to check against the final privacy policy.
- The bundle contains the full `client/public/media` folder: exercise clips about 45 MB and dish photos about 24 MB, so the AAB is about 75 MB (measured in `LUPU-FIT-0.8.0.aab`). This is below Play's limits; rebuild after media changes.
