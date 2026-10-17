#!/usr/bin/env bash
# Build the optional Unity WebGL renderer with the Unity CLI and copy it to public/unity/levelup/Build.
# Needs: Unity CLI (`unity`), a signed-in/licensed Editor with the WebGL module, and a scene with a LevelUpBridge object in Build Settings.
# UNTESTED: not run against a real Editor.
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT=unity/LevelUpClient
EDITOR_VERSION="${UNITY_EDITOR_VERSION:-lts}"
unity build "$PROJECT" --editor-version "$EDITOR_VERSION" --target WebGL --execute-method LevelUp.Builder.BuildWebGL --allow-install
SRC="$PROJECT/Builds/levelup/Build"
DST=public/unity/levelup/Build
mkdir -p "$DST"
for ext in loader.js framework.js data wasm; do
  f=$(ls "$SRC"/*."$ext" | head -1)
  cp "$f" "$DST/levelup.$ext"
done
echo "Copied to $DST. Open /play/<id>?renderer=unity (Plus/Pro)."
