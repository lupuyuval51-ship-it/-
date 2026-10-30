#!/usr/bin/env bash
# Builds the signed release of the LUPU-FIT Android app (device mode: the server and the database run
# inside the app, no server needed): an App Bundle (.aab) for Google Play and an APK for installing
# directly on a phone.
#
#   ./android/build-release.sh                       # signs with LUPUFIT_KEYSTORE + password from the environment
#   ./android/build-release.sh --out ~/lupufit-release --version-code 3 --version-name 1.0.1
#
# Steps: npm run build:device (dist/device) → npx cap sync android → gradle bundleRelease + assembleRelease
# → checks: signatures (apksigner, jarsigner), merged manifest (permissions, target SDK, version).
#
# Needs: Node 22.13+ with `npm ci` done in lupifit/, JDK 21, an Android SDK (ANDROID_HOME) with platform 36
# and build-tools 36 (--fetch-sdk downloads them into android/.android-sdk), network access to Google's Maven.
# Signing (never written to the repo): LUPUFIT_KEYSTORE (path to the upload keystore), and the password in
# LUPUFIT_KEYSTORE_PASSWORD or in a file named by LUPUFIT_KEYSTORE_PASSWORD_FILE; optional LUPUFIT_KEY_ALIAS
# (default "upload") and LUPUFIT_KEY_PASSWORD (default: the keystore password). Create an upload key once
# with ../android-twa/build-aab.sh --create-keystore (the same key signs both apps).
set -euo pipefail
cd "$(dirname "$0")"
APP_DIR="$(cd .. && pwd)"

OUT=""
VERSION_CODE=""
VERSION_NAME=""
FETCH_SDK=0
SKIP_WEB=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --out) OUT="$2"; shift 2 ;;
    --version-code) VERSION_CODE="$2"; shift 2 ;;
    --version-name) VERSION_NAME="$2"; shift 2 ;;
    --fetch-sdk) FETCH_SDK=1; shift ;;
    --skip-web) SKIP_WEB=1; shift ;;
    -h|--help) sed -n '2,19p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

if [[ $FETCH_SDK == 1 && -z "${ANDROID_HOME:-}" ]]; then
  export ANDROID_HOME="$PWD/.android-sdk"
  if [[ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]]; then
    mkdir -p "$ANDROID_HOME/cmdline-tools"
    tmp="$(mktemp -d)"
    curl -fsSL -o "$tmp/clt.zip" https://dl.google.com/android/repository/commandlinetools-linux-9862592_latest.zip
    unzip -q "$tmp/clt.zip" -d "$ANDROID_HOME/cmdline-tools" && mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
    rm -rf "$tmp"
  fi
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null || true
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-36" "build-tools;36.0.0" >/dev/null
fi
: "${ANDROID_HOME:?set ANDROID_HOME to an Android SDK, or pass --fetch-sdk}"
export ANDROID_HOME

: "${LUPUFIT_KEYSTORE:?set LUPUFIT_KEYSTORE to the upload keystore (.jks)}"
if [[ -z "${LUPUFIT_KEYSTORE_PASSWORD:-}" ]]; then
  : "${LUPUFIT_KEYSTORE_PASSWORD_FILE:?set LUPUFIT_KEYSTORE_PASSWORD or LUPUFIT_KEYSTORE_PASSWORD_FILE}"
  LUPUFIT_KEYSTORE_PASSWORD="$(tr -d '\r\n' < "$LUPUFIT_KEYSTORE_PASSWORD_FILE")"
fi
export LUPUFIT_KEYSTORE LUPUFIT_KEYSTORE_PASSWORD
[[ -f "$LUPUFIT_KEYSTORE" ]] || { echo "keystore not found: $LUPUFIT_KEYSTORE" >&2; exit 1; }

BUILD_TOOLS="$(find "$ANDROID_HOME/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -1)"

# 1. The app itself (web bundle with the server inside) and 2. copy it into the Android project.
if [[ $SKIP_WEB == 0 ]]; then
  (cd "$APP_DIR" && npm run build:device)
fi
[[ -f "$APP_DIR/dist/device/index.html" ]] || { echo "dist/device is missing: run without --skip-web" >&2; exit 1; }
(cd "$APP_DIR" && npx cap sync android)

# 3. Signed bundle and APK.
ARGS=()
[[ -n "$VERSION_CODE" ]] && ARGS+=("-PlupufitVersionCode=$VERSION_CODE")
[[ -n "$VERSION_NAME" ]] && ARGS+=("-PlupufitVersionName=$VERSION_NAME")
./gradlew --no-daemon -q clean :app:bundleRelease :app:assembleRelease "${ARGS[@]}"

AAB=app/build/outputs/bundle/release/app-release.aab
APK=app/build/outputs/apk/release/app-release.apk
[[ -f "$AAB" && -f "$APK" ]] || { echo "build outputs missing" >&2; exit 1; }

# 4. Checks.
ALIAS="${LUPUFIT_KEY_ALIAS:-upload}"
EXPECTED_SHA256="$(keytool -list -v -keystore "$LUPUFIT_KEYSTORE" -storepass:env LUPUFIT_KEYSTORE_PASSWORD -alias "$ALIAS" | awk '/SHA256:/{print $2; exit}')"
echo "Upload key SHA-256: $EXPECTED_SHA256"

echo "APK signature (apksigner):"
APK_CERTS="$("$BUILD_TOOLS/apksigner" verify --verbose --print-certs "$APK")"
echo "$APK_CERTS" | grep -E "^Verified using|^Signer #1 certificate (DN|SHA-256)" | sed 's/^/  /'
APK_SHA="$(echo "$APK_CERTS" | awk -F': ' '/^Signer #1 certificate SHA-256 digest/{print toupper($2); exit}')"
[[ "$(echo "$APK_SHA" | tr -d ':')" == "$(echo "$EXPECTED_SHA256" | tr -d ':')" ]] || { echo "APK is not signed with the upload key" >&2; exit 1; }

echo "AAB signature (jarsigner):"
JARSIGNER_OUT="$(jarsigner -verify "$AAB" 2>&1)"
if ! grep -q "^jar verified\." <<<"$JARSIGNER_OUT"; then
  echo "$JARSIGNER_OUT" >&2
  echo "the AAB signature does not verify" >&2
  exit 1
fi
# Its notes about a self-signed certificate without a timestamp and about the entry order of an .aab are
# expected for an upload key (Play re-signs the app with its app signing key).
echo "  jar verified."
AAB_SHA="$(keytool -printcert -jarfile "$AAB" | awk '/SHA256:/{print $2; exit}')"
[[ "$AAB_SHA" == "$EXPECTED_SHA256" ]] || { echo "AAB is not signed with the upload key" >&2; exit 1; }

echo "Merged manifest (from the APK):"
BADGING="$("$BUILD_TOOLS/aapt2" dump badging "$APK")"
echo "$BADGING" | grep -E "^package:|^(sdkVersion|targetSdkVersion|minSdkVersion):|^uses-permission:|^application-label:" | sed 's/^/  /'
if echo "$BADGING" | grep -qE "android.permission.(USE_EXACT_ALARM|SCHEDULE_EXACT_ALARM)"; then
  echo "exact-alarm permission found in the merged manifest: reminders must stay inexact" >&2
  exit 1
fi

if [[ -n "$OUT" ]]; then
  mkdir -p "$OUT"
  cp "$AAB" "$OUT/LUPU-FIT-device.aab"
  cp "$APK" "$OUT/LUPU-FIT-device.apk"
  echo "Copied to $OUT: LUPU-FIT-device.aab, LUPU-FIT-device.apk"
fi
echo "Done: $AAB (Google Play) and $APK (direct install)."
