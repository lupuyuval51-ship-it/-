#!/usr/bin/env bash
# One-command Android release build: device web build -> icons -> cap sync -> signed bundleRelease -> store-assets/LUPU-FIT-<ver>.aab
# Usage: scripts/android-build.sh [--debug-apk]   (env: VITE_AI_PROXY_URL baked into the web build if set)
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$ANDROID_HOME" ]; then if [ -d /opt/android-sdk ]; then ANDROID_HOME=/opt/android-sdk; else ANDROID_HOME="$HOME/android-sdk"; fi; fi
export ANDROID_HOME ANDROID_SDK_ROOT="$ANDROID_HOME"
if [ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ] || [ ! -d "$ANDROID_HOME/platforms/android-35" ] || [ ! -d "$ANDROID_HOME/build-tools/35.0.0" ]; then
  echo ">> Android SDK missing, running android-setup.sh"; scripts/android-setup.sh
fi
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

VERSION="$(node -p "require('./package.json').version")"
echo ">> web build (Device Mode)"; npm run build:device
echo ">> icons"; node scripts/android-icons.mjs
echo ">> cap sync"; npx cap sync android

if [ -f android/keystore/keystore.properties ]; then SIGNED=signed; else
  SIGNED=UNSIGNED; echo "!! android/keystore/keystore.properties missing: the AAB will be UNSIGNED (see docs/ANDROID.md)"; fi

if [ -x android/gradlew ] && (cd android && ./gradlew --version >/dev/null 2>&1); then GRADLE=./gradlew; else GRADLE=/opt/gradle/bin/gradle; fi
cd android
# Maven mirrors occasionally answer 429 through the proxy; Gradle caches what it got, so a retry resumes.
run_gradle() { for i in 1 2 3 4 5; do "$GRADLE" --no-daemon --max-workers=2 "$@" && return 0; echo "!! gradle attempt $i failed, retrying in 30s"; sleep 30; done; return 1; }
if [ "${1:-}" = "--debug-apk" ]; then run_gradle assembleDebug; fi
run_gradle bundleRelease
cd "$ROOT"
OUT=android/app/build/outputs/bundle/release/app-release.aab
mkdir -p store-assets
cp "$OUT" "store-assets/LUPU-FIT-$VERSION.aab"
echo ">> done ($SIGNED): store-assets/LUPU-FIT-$VERSION.aab"; ls -l "store-assets/LUPU-FIT-$VERSION.aab"; sha256sum "store-assets/LUPU-FIT-$VERSION.aab"
