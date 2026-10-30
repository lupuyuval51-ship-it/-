#!/usr/bin/env bash
# Builds a signed Android App Bundle (AAB) of LUPU-FIT for Google Play.
#
#   ./build-aab.sh --host app.your-domain.com            # uses LUPUFIT_KEYSTORE + passwords from the environment
#   ./build-aab.sh --create-keystore ~/lupufit-upload.jks  # one time: makes the upload key (keep it safe!)
#
# Needs: JDK 17+, an Android SDK (ANDROID_HOME) with platform 36 + build-tools 36 (the script can fetch it
# into ./.android-sdk with --fetch-sdk), network access to Google's Maven.
# Signing: LUPUFIT_KEYSTORE (path), LUPUFIT_KEYSTORE_PASSWORD, optional LUPUFIT_KEY_ALIAS (default "upload")
# and LUPUFIT_KEY_PASSWORD (defaults to the keystore password). Keys and passwords are never written to the repo.
set -euo pipefail
cd "$(dirname "$0")"

HOST=""
FETCH_SDK=0
CREATE_KS=""
VERSION_CODE=""
VERSION_NAME=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --version-code) VERSION_CODE="$2"; shift 2 ;;
    --version-name) VERSION_NAME="$2"; shift 2 ;;
    --fetch-sdk) FETCH_SDK=1; shift ;;
    --create-keystore) CREATE_KS="$2"; shift 2 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

if [[ -n "$CREATE_KS" ]]; then
  if [[ -e "$CREATE_KS" ]]; then echo "$CREATE_KS already exists; not overwriting a signing key." >&2; exit 1; fi
  : "${LUPUFIT_KEYSTORE_PASSWORD:?set LUPUFIT_KEYSTORE_PASSWORD (at least 6 characters) first}"
  keytool -genkeypair -v -keystore "$CREATE_KS" -alias "${LUPUFIT_KEY_ALIAS:-upload}" -keyalg RSA -keysize 4096 -validity 10000 \
    -storepass "$LUPUFIT_KEYSTORE_PASSWORD" -keypass "${LUPUFIT_KEY_PASSWORD:-$LUPUFIT_KEYSTORE_PASSWORD}" \
    -dname "CN=LUPU-FIT, O=LUPU-FIT, C=IL" >/dev/null
  echo "Created $CREATE_KS. Back it up and keep the password: Google Play needs this upload key for every update."
  keytool -list -v -keystore "$CREATE_KS" -storepass "$LUPUFIT_KEYSTORE_PASSWORD" | grep "SHA256:"
  exit 0
fi

if [[ $FETCH_SDK == 1 && -z "${ANDROID_HOME:-}" ]]; then
  export ANDROID_HOME="$PWD/.android-sdk"
  if [[ ! -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]]; then
    mkdir -p "$ANDROID_HOME/cmdline-tools"
    curl -fsSL -o /tmp/clt.zip https://dl.google.com/android/repository/commandlinetools-linux-9862592_latest.zip
    unzip -q /tmp/clt.zip -d "$ANDROID_HOME/cmdline-tools" && mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  fi
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null || true
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-36" "build-tools;36.0.0" >/dev/null
fi
: "${ANDROID_HOME:?set ANDROID_HOME to an Android SDK, or pass --fetch-sdk}"

: "${LUPUFIT_KEYSTORE:?set LUPUFIT_KEYSTORE to your upload keystore (create one with --create-keystore)}"
: "${LUPUFIT_KEYSTORE_PASSWORD:?set LUPUFIT_KEYSTORE_PASSWORD}"

ARGS=()
[[ -n "$HOST" ]] && ARGS+=("-Ptwa.host=$HOST")
[[ -n "$VERSION_CODE" ]] && ARGS+=("-Ptwa.versionCode=$VERSION_CODE")
[[ -n "$VERSION_NAME" ]] && ARGS+=("-Ptwa.versionName=$VERSION_NAME")

./gradlew --no-daemon -q clean :app:bundleRelease "${ARGS[@]}"

OUT=app/build/outputs/bundle/release/app-release.aab
EFFECTIVE_HOST="${HOST:-$(grep '^host=' twa.properties | cut -d= -f2)}"
echo "Built $OUT for https://$EFFECTIVE_HOST"
FP=$(keytool -list -v -keystore "$LUPUFIT_KEYSTORE" -storepass "$LUPUFIT_KEYSTORE_PASSWORD" -alias "${LUPUFIT_KEY_ALIAS:-upload}" | grep "SHA256:" | awk '{print $2}')
echo "Upload key SHA-256: $FP"
echo "Set on the server: ANDROID_APP_PACKAGE=$(grep '^packageId=' twa.properties | cut -d= -f2) ANDROID_CERT_SHA256=$FP"
echo "With Play App Signing, also add the app signing key SHA-256 from Play Console (comma-separated)."
if [[ "$EFFECTIVE_HOST" == *.example ]]; then
  echo "WARNING: host is the placeholder '$EFFECTIVE_HOST'. This bundle cannot work until it is rebuilt with --host <your real domain>." >&2
fi
