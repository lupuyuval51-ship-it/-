# LUPU-FIT on Android (Google Play)

The Android app is a **Trusted Web Activity (TWA)**: a small native shell (`android/`) that opens the
LUPU-FIT website full screen in the phone's browser engine. All features, updates and data live on the
website, so the site must be deployed on a public HTTPS domain before the app can work.

## What is in `android/`
- `twa.properties`: domain (`host`), start path, package id (`com.lupufit.app`), name, version.
  The committed host `lupu-fit.example` is a **placeholder** (the `.example` domain can never exist).
- `app/src/main/AndroidManifest.xml`: launcher, links to the site open in the app (verified),
  splash screen (black with the logo), notification delegation (web push from the site appears as
  LUPU-FIT notifications; Android 13+ asks for permission), portrait, Custom Tab fallback.
- Icons are generated from `client/public/icon-*.png` (adaptive icon, round icon, white notification icon).
- `build-aab.sh`: builds a signed `.aab`. Gradle wrapper included (Gradle 8.14.3, AGP 8.13.2,
  compile/target SDK 36, min SDK 24).

## Steps to publish
1. Deploy the web app (server + PostgreSQL) on your domain over HTTPS, e.g. `app.your-domain.com`.
2. Create the upload key once and keep it forever (losing it means asking Google to reset it):
   `LUPUFIT_KEYSTORE_PASSWORD=... ./android/build-aab.sh --create-keystore ~/lupufit-upload.jks`
3. Build: `LUPUFIT_KEYSTORE=~/lupufit-upload.jks LUPUFIT_KEYSTORE_PASSWORD=... ./android/build-aab.sh --host app.your-domain.com --fetch-sdk`
   (raise `--version-code` for every upload).
4. Upload `android/app/build/outputs/bundle/release/app-release.aab` to Play Console (internal testing first),
   with Play App Signing enabled.
5. On the server set `ANDROID_APP_PACKAGE=com.lupufit.app` and `ANDROID_CERT_SHA256=<upload key SHA-256>,<app signing key SHA-256>`
   (the second one is in Play Console > Test and release > App integrity). Check
   `https://app.your-domain.com/.well-known/assetlinks.json` returns both. Without it the app shows an address bar.

## Not verified here
The bundle was built and its signature and merged manifest were checked in a Linux container. It was not
installed on a phone or emulator, and it cannot open a real site until step 1 is done.
