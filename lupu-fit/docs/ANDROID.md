# LUPU-FIT for Android (Capacitor, Device Mode)

The Android app is a Capacitor 7 shell around the standalone **Device Mode** web build (`VITE_RUN_MODE=device`, `npm run build:device` -> `client/dist-device`). PGlite runs in a Web Worker over IndexedDB (`idb://lupu-fit-pgdata`); no server is needed, and it works offline.

| | |
|---|---|
| applicationId | `app.lupufit` |
| versionCode / versionName | `2` / `0.2.0` (`android/app/build.gradle`; bump `versionCode` for every Play upload; `package.json` version names the output AAB) |
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

Rebuild after any code change: `scripts/android-build.sh`. Needs JDK 21 (Capacitor 7 compiles with Java 21) and Node 22. The app module now also applies the Kotlin Gradle plugin (2.4.0, `android/build.gradle`) because the on-device AI plugin is Kotlin. The script retries Gradle when the Maven mirrors answer 429.

### Optional: AI coach proxy
Device Mode has no server. Without a proxy the coach is the deterministic rules coach. If you set the build-time variable `VITE_AI_PROXY_URL` (read in `client/src/env.ts` and `client/src/device/deviceWorker.ts`), the worker forwards `POST {url}/ai/complete` and `POST {url}/ai/describe-image` through the egress guard (`makeGuardedFetch`) to that proxy, which must hold the real provider keys. Use an `https://` URL (cleartext is blocked by the network security config). Example: `VITE_AI_PROXY_URL=https://ai.example.com scripts/android-build.sh`. If you enable it, the Play data-safety answers below must be updated (user prompts/photos leave the device).

## Optional on-device AI (Gemma 4, LiteRT-LM) - versionCode 2 / 0.2.0
The cloud AI stays the default. Profile -> AI lets the user choose **Auto / Cloud only / On-device only** (`localStorage` key `ai.mode`) and, in the Android app only, download Gemma 4 E2B to run the coach on the phone. The model is **never bundled**: the AAB only carries the runtime; the 2.6 GB file is downloaded after install, on an explicit tap.

**Runtime choice.** LiteRT-LM (`com.google.ai.edge.litertlm:litertlm-android:0.19.0` from Google Maven, Apache-2.0, Kotlin API, minSdk 24, JNI libs for `arm64-v8a` and `x86_64`). It is the runtime Google's Gemma 4 model card ships for `.litertlm` files. The model card describes the MediaPipe route (`.task`, web build) as in maintenance mode. The card also calls Android AICore (Gemini Nano) the recommended production path on supported devices; it was not used because availability depends on the device and it gives no control over the model version, whereas this feature needs one known, offline, downloadable file. AICore could be added later as another provider behind the same policy.

**Model file.** `litert-community/gemma-4-E2B-it-litert-lm`, file `gemma-4-E2B-it.litertlm` (CPU/GPU build), 2,588,147,712 bytes, SHA-256 `181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c`, pinned to repo commit `1caa527c1e88b55f046fcd8d2b4265606680663d`. On 2026-11-02 the repo was **not gated** (`gated: false`, license `apache-2.0` on the card, anonymous download works), so the default URL is built in and **no license acceptance or token is needed to download it**. If Google later gates the repo or you want to host the file yourself, override at build time (no token is ever embedded; the plugin cannot send credentials):

```bash
VITE_LOCAL_MODEL_URL=https://your.host/gemma-4-E2B-it.litertlm \
VITE_LOCAL_MODEL_SHA256=<64 hex chars> VITE_LOCAL_MODEL_SIZE=<bytes> [VITE_LOCAL_MODEL_ID=name] \
scripts/android-build.sh
```
All three of URL (https), SHA-256 and size must be valid, otherwise the built-in default is used (`client/src/ai/local/modelConfig.ts`). The licence link shown in the UI is https://ai.google.dev/gemma/apache_2 (Gemma 4); you are responsible for complying with the licence of whatever file you point the build at.

**How it works.**
- Native plugin `LocalAi` (`android/app/src/main/java/app/lupufit/LocalAiPlugin.kt`, registered in `MainActivity` before `super.onCreate`): `status`, `download` (HTTP Range resume into `filesDir/localai/model.litertlm.part`, up to 5 manual https redirects, free space >= 1.2 x remaining size, Wi-Fi-only via `isActiveNetworkMetered`, 3 automatic resume attempts, `downloadProgress` events), `cancelDownload`, `delete`, `generate` (single background thread, optional `token` events, hard token cap), `abort`. The file is renamed to `model.litertlm` and marked installed **only after** size and SHA-256 match; a mismatch deletes it.
- Inference: CPU backend (a native crash on a bad GPU driver cannot be caught from Kotlin, so GPU is not used), context 4096 tokens, lazy engine creation, released on `onTrimMemory >= RUNNING_LOW`, `onLowMemory`, 3 minutes idle, delete and destroy. Supported only on arm64 with >= ~5.5 GB reported RAM (a "6 GB" phone); otherwise `supported=false` with a reason.
- JS: `client/src/ai/local/` (plugin wrapper + web stub, settings, `chooseProvider` policy, download state machine, generation with a 30 s first-token budget). In Device Mode the worker has no Capacitor, so `LocalFirstAiProvider` (worker) posts `localai.req` to the main thread (`attachLocalAiBridge`, one line in `main.tsx`), which applies the policy, runs the plugin and answers `localai.res`. The provider implements the same `AiProvider` interface, so `server/src/routes/coach.ts` is untouched: the deterministic safety shield runs **before** any model call, quotas, the anonymised numbers-only snapshot, the minors caps, the identical system prompt (150-word rule) and the rules-coach fallback all apply to the local path. Output is also clamped to 150 words client-side.
- Policy: `auto` = local only when installed + supported + the user downloaded it, falling back to the proxy/cloud on error or timeout (and to the rules coach when there is no proxy); `cloud` = never local; `local` = never contacts the cloud (a failure ends in the rules coach). Translation uses the model only if the separate toggle is on (default off) or mode is On-device only; prompts that do not fit the 4096-token window fall back to the cloud.

**Size impact.** The runtime adds the two JNI libraries (22.7 MB arm64 + 26.8 MB x86_64 uncompressed). ABIs are **not** restricted: Play delivers per-ABI splits, so a phone only receives its own library; a 32-bit-only phone installs fine and simply reports "unsupported". See the build report below for the measured AAB size before/after.

**Testing on a real phone (not done in the build environment).**
```bash
scripts/android-build.sh --debug-apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb logcat -s LocalAi:V chromium:I        # plugin tag is LocalAi
```
Open Profile -> AI. Expected: status "Not installed", Download (2.6 GB) enabled on an arm64 phone with enough RAM/space. Tap it on Wi-Fi: logcat shows no per-chunk spam; the card shows progress, then "Verifying the file", then `model installed (... sha256 verified)` and "Installed". Ask the coach a question: `engine ready in N ms (cpu)` then `generated N chars, first token N ms`. Turn on airplane mode: the coach should still answer (Auto or On-device only). Kill the app mid-download and reopen: "Download paused at N%" and Resume continues from the partial file. Check `adb shell run-as app.lupufit ls -l files/localai` (debug build) and that deleting in the UI removes it. To simulate a weak phone use a phone/emulator with < 6 GB RAM (reason shown) or an x86_64 emulator (arm64 only: "not 64-bit ARM").

**Not verified.** None of the following was run on a device or emulator: the real download over the network from this plugin, resume after a kill, engine initialisation and generation with the real model, the exact streaming granularity of `MessageCallback.onMessage` (treated as deltas), GPU, memory pressure behaviour, speed on mid-range phones, battery. The native code compiles (debug and release) and the JS logic is unit tested with a mocked plugin.

**Limits.** The download blocks nothing but needs the app in the foreground (no foreground service; Android may freeze a backgrounded app, resumability covers that). Local translation of large batches is slow and usually falls back to the cloud because of the 4096-token window. No JSON-constrained decoding: JSON is requested in the prompt and validated by the server translate service. The model may answer worse than the cloud models.


## Signing and keystore
`android/keystore/lupufit-upload.jks` (alias `lupufit-upload`, RSA 4096, PKCS12, valid 10000 days) and `android/keystore/keystore.properties` (store/key passwords) are generated locally and git-ignored. `android/app/build.gradle` signs `release` only when `keystore.properties` exists; otherwise the AAB is unsigned (the build script warns).

**BACK UP the `android/keystore/` folder (and the passwords) to a password manager / encrypted storage now.** With Play App Signing the key is only an *upload* key: if it is lost you can request an upload-key reset from Play support, but it is slow and painful. Never commit it. To regenerate on a new machine you need the same file; a new key requires that reset.

Print the certificate fingerprint: `keytool -list -v -keystore android/keystore/lupufit-upload.jks -alias lupufit-upload` (asks for the password in `keystore.properties`).

## What is configured
- Manifest: `allowBackup=false` (+ data-extraction rules excluding everything), `usesCleartextTraffic=false`, network security config (system CAs only), permissions `INTERNET`, `ACCESS_NETWORK_STATE` (normal, install-time; only used to honour "download on Wi-Fi only") and `CAMERA`. No dangerous permission was added for local AI and no foreground service is used. `CAMERA` is for the optional barcode scanner (`BarcodePanel.tsx` uses `getUserMedia` + `BarcodeDetector`); `uses-feature camera/autofocus required=false` so phones without a camera can install. No location, storage, or notification permissions.
- Theme: dark status/navigation bars (`#0B0B0D`), splash background `#0B0B0D` with the brand mark, edge-to-edge handled by `adjustMarginsForEdgeToEdge: 'auto'` (targetSdk 35).
- Icons: adaptive icon (background `#0B0B0D`, foreground and monochrome from `client/public/icons/adaptive-*.png`) plus legacy icons, generated by `scripts/android-icons.mjs`.
- Locales: `en` and `he` (`values-iw`); orientation is not locked (rotation allowed).
- Service worker: the client registers `/sw.js` only in PROD builds; under `https://localhost` this is a secure context so it registers and works. IndexedDB, Web Workers and `navigator.locks` are standard in the Android System WebView (Chrome 110+).

## Play Console steps
1. Create app (name LUPU-FIT, default language Hebrew or English, App, Free). Create a Play developer account first if needed.
2. Enable **Play App Signing** (default for new apps) when uploading the first bundle; the generated key is your *upload* key.
3. Test track first: Internal testing -> Create release -> upload `LUPU-FIT-0.1.0.aab`. New personal developer accounts must run a closed test (testers/days) before production; check current Play rules.
4. Store listing: icon `store-assets/play-icon-512.png`, feature graphic `store-assets/feature-graphic-1024x500.png`, screenshots in `store-assets/screenshots`.
5. App content: privacy policy URL (required), target audience (the app handles minors' profiles privately; pick age groups consistently with the in-app policy), content rating questionnaire, ads = none, health apps declaration (fitness/nutrition, not medical).
6. Data safety (Device Mode, no AI proxy): no data collected and no data shared, because everything is stored on the device only; no e-mail is requested and the username is local to the device and never sent anywhere; camera is optional (barcode scan) and frames are processed on device. Data encrypted in transit: n/a / yes only if a proxy is configured. If `VITE_AI_PROXY_URL` is set, declare the user content sent to it (text prompts, meal photos) as collected and shared with the proxy operator.
   **With on-device AI (0.2.0):** local inference sends nothing anywhere (prompts, health snapshot and answers stay on the device, no analytics). The one new network use is the user-initiated model download, which contacts the host in the model URL (default `huggingface.co` and its CDN) and sends only the HTTP request (IP address, user agent `LUPU-FIT-Android`), no account data. Declare no new collected data for local AI; if the cloud proxy is configured the previous disclosure still applies. Mention the optional download in the privacy policy and the store listing (about 2.6 GB, user-initiated).
7. Roll out the release for review.

## Not verified
- The app has NOT been run on a device or emulator (none available in the build environment). Nothing about runtime behaviour in the Android WebView (PGlite worker startup, IndexedDB persistence, service worker registration, camera permission prompt, Hebrew/RTL rendering, safe-area insets, back button) has been tested.
- The AAB was not uploaded to Play; Play Console policy answers above are suggestions to check against the final privacy policy.
- The bundle contains the full `client/public/media` clips (about 49 MB), so the AAB is large (see size in the build report); this is below Play's limits but rebuild after media changes.
