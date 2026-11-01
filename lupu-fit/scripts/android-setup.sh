#!/usr/bin/env bash
# Installs the Android SDK (command-line tools, platform-tools, platform 35, build-tools 35.0.0) if missing.
# Usage: scripts/android-setup.sh   (honours ANDROID_HOME; default /opt/android-sdk, falls back to ~/android-sdk)
set -euo pipefail
CLT_ZIP="${CLT_ZIP:-commandlinetools-linux-11076708_latest.zip}"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK" ]; then
  if [ -d /opt/android-sdk ] || mkdir -p /opt/android-sdk 2>/dev/null; then SDK=/opt/android-sdk; else SDK="$HOME/android-sdk"; fi
fi
mkdir -p "$SDK/cmdline-tools"
SDKM="$SDK/cmdline-tools/latest/bin/sdkmanager"
if [ ! -x "$SDKM" ]; then
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
  curl -fSL -o "$tmp/clt.zip" "https://dl.google.com/android/repository/$CLT_ZIP"
  unzip -q "$tmp/clt.zip" -d "$tmp/x"
  rm -rf "$SDK/cmdline-tools/latest"; mv "$tmp/x/cmdline-tools" "$SDK/cmdline-tools/latest"
fi
set +o pipefail; yes | "$SDKM" --sdk_root="$SDK" --licenses >/dev/null; set -o pipefail
"$SDKM" --sdk_root="$SDK" "platform-tools" "platforms;android-35" "build-tools;35.0.0"
echo "Android SDK ready at $SDK"
