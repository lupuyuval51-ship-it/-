# LUPU-FIT for Android (Capacitor, Device Mode)

The Android app is a Capacitor 7 shell around the standalone **Device Mode** web build (`VITE_RUN_MODE=device`, `npm run build:device` -> `client/dist-device`). PGlite runs in a Web Worker over IndexedDB (`idb://lupu-fit-pgdata`); no server is needed, and it works offline.

| | |
|---|---|
| applicationId | `app.lupufit` |
| versionCode / versionName | see `android/app/build.gradle` (8 / 0.8.0 when this was written); bump `versionCode` for every Play upload; `package.json` version names the output AAB |
| minSdk / targetSdk / compileSdk | 24 / 35 / 35 |
| Capacitor | 7.6.x (`@capacitor/core`, `cli`, `android` as root devDependencies) |
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
- Manifest: `allowBackup=false` (+ data-extraction rules excluding everything), `usesCleartextTraffic=false`, network security config (system CAs only), permissions `INTERNET`, `CAMERA` and the reminder permissions listed under "Local reminders" below. No foreground service is used. `CAMERA` is for the optional barcode scanner (`BarcodePanel.tsx` uses `getUserMedia` + `BarcodeDetector`); `uses-feature camera/autofocus required=false` so phones without a camera can install. No location or storage permissions.
- Theme: dark status/navigation bars (`#0B0B0D`), splash background `#0B0B0D` with the brand mark, edge-to-edge handled by `adjustMarginsForEdgeToEdge: 'auto'` (targetSdk 35).
- Icons: adaptive icon (background `#0B0B0D`, foreground and monochrome from `client/public/icons/adaptive-*.png`) plus legacy icons, generated by `scripts/android-icons.mjs`.
- Locales: `en` and `he` (`values-iw`); orientation is not locked (rotation allowed).
- Service worker: the client registers `/sw.js` only in PROD builds; under `https://localhost` this is a secure context so it registers and works. IndexedDB, Web Workers and `navigator.locks` are standard in the Android System WebView (Chrome 110+).

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
- Local reminders were built and the AAB passes `bundletool validate`, but no notification was ever delivered on a device or emulator: permission prompt on Android 13+, channel creation, inexact alarm timing under Doze/battery optimisation, re-arming after reboot, the monochrome icon, and notification-tap deep links (including cold start) are all untested. Some OEMs (Xiaomi, Huawei, Samsung power saving) kill background alarms regardless.
- The app has NOT been run on a device or emulator (none available in the build environment). Nothing about runtime behaviour in the Android WebView (PGlite worker startup, IndexedDB persistence, service worker registration, camera permission prompt, Hebrew/RTL rendering, safe-area insets, back button) has been tested.
- The AAB was not uploaded to Play; Play Console policy answers above are suggestions to check against the final privacy policy.
- The bundle contains the full `client/public/media` folder: exercise clips about 45 MB and dish photos about 24 MB, so the AAB is about 75 MB (measured in `LUPU-FIT-0.8.0.aab`). This is below Play's limits; rebuild after media changes.
