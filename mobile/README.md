# LEVEL UP — offline Android app (Google Play)

The phone app runs **without any server**. It reuses the website's game code (`src/`): the 3D runtime, challenges, the
study engine and demo templates, and the very same game reducer the server uses (`processEvent`), here running on the
device through `src/lib/offline/store.ts`. Games and progress are kept in the app's local storage.

What is different from the website (by design):
- No accounts, no Stripe, no AI providers (an API key cannot live in an app). Games come from the **study engine** (your
  notes) or **demo templates**, and are labelled that way.
- Answer keys are on the device, so scores are for self-practice, not for anything that must be cheat-proof.
- Graphics tier A/B/C is a Settings choice for the phone's power (there are no paid plans in the app). Default: B, or A on
  phones that report ≥ 6 GB RAM and ≥ 8 cores.
- Version 1 is free. Google Play does not allow Stripe for in-app digital goods; paid features later need **Google Play
  Billing** (products created in your Play Console).

## Build

Needs Node 20+, JDK 17+ (21 used), Android SDK (platform 36, build-tools 36) with `ANDROID_HOME` set.

```bash
npm install
npm run mobile:build          # web bundle → mobile/dist
npx cap sync android          # copy it into the Android project
cd android
./gradlew bundleRelease       # → app/build/outputs/bundle/release/app-release.aab (upload this to Play)
./gradlew assembleRelease     # → app/build/outputs/apk/release/app-release.apk (install on your phone to try)
```

Release signing reads `android/keystore.properties` (not committed):

```
storeFile=/absolute/path/levelup-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Keep the `.jks` file and the password safe and private. With **Play App Signing** (default for new apps) this is only
the *upload* key; Google holds the app-signing key, and a lost upload key can be reset through Play Console support.

Before the first upload, decide the package name: `appId` in `capacitor.config.ts` and `namespace`/`applicationId` in
`android/app/build.gradle` (currently `app.levelup.learn3d`). It can never change after the first upload. Increase
`versionCode` in `android/app/build.gradle` for every new upload.

## Test

```bash
npm run test:e2e:mobile       # Playwright on a Pixel 7 viewport against the built bundle, network blocked
npx vitest run tests/unit/offline.test.ts
```

Icons and store graphics: `python3 mobile/make-icons.py` (writes launcher icons and `mobile/store/*.png`).
Store text and Play Console answers: `mobile/store/listing.md`. Privacy policy: `mobile/store/privacy-policy.md`.
