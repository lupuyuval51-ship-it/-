#!/usr/bin/env bash
# End-to-end run against a local Supabase stack, the real Edge Functions (served by the
# Supabase edge runtime) and a FAKE Anthropic endpoint (e2e/fake-anthropic/server.mjs).
# The fake endpoint exists only for tests: production reaches api.anthropic.com.
#
# Prereqs: docker, supabase CLI, node 20+, playwright (preinstalled in CI image or `npx playwright install chromium`).
# Usage: bash e2e/run-e2e.sh            (from business-ai/)
set -euo pipefail
cd "$(dirname "$0")/.."

ART=e2e/artifacts
mkdir -p "$ART"
FAKE_PORT=${FAKE_PORT:-8787}
WEB_PORT=${WEB_PORT:-4173}

supabase status >/dev/null 2>&1 || supabase start
STATUS_JSON=$(supabase status -o json 2>/dev/null)
API_URL=$(node -e "console.log(JSON.parse(process.argv[1]).API_URL)" "$STATUS_JSON")
ANON_KEY=$(node -e "const s=JSON.parse(process.argv[1]);console.log(s.PUBLISHABLE_KEY||s.ANON_KEY)" "$STATUS_JSON")

cleanup() {
  [[ -n "${FAKE_PID:-}" ]] && kill "$FAKE_PID" 2>/dev/null || true
  [[ -n "${FN_PID:-}" ]] && kill "$FN_PID" 2>/dev/null || true
  [[ -n "${WEB_PID:-}" ]] && kill "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT

# 1. Fake Anthropic endpoint (reachable from the edge-runtime container via host.docker.internal)
PORT=$FAKE_PORT node e2e/fake-anthropic/server.mjs > "$ART/fake-anthropic.log" 2>&1 &
FAKE_PID=$!

# 2. Edge functions with test-only env
cat > supabase/functions/.env.e2e <<EOF
ANTHROPIC_API_KEY=test-key-not-secret
AI_API_BASE_URL=http://host.docker.internal:${FAKE_PORT}
AI_MODEL=claude-opus-5-5
EOF
supabase functions serve --env-file supabase/functions/.env.e2e > "$ART/functions.log" 2>&1 &
FN_PID=$!

# 3. Web build pointed at the local stack
EXPO_PUBLIC_SUPABASE_URL="$API_URL" EXPO_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY" \
  npx expo export --platform web --output-dir dist-e2e > "$ART/export.log" 2>&1
node e2e/static-server.mjs dist-e2e "$WEB_PORT" > "$ART/web.log" 2>&1 &
WEB_PID=$!

# wait for function runtime + web server
for i in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${WEB_PORT}/" && curl -s -o /dev/null -X OPTIONS "$API_URL/functions/v1/ai"; then break; fi
  sleep 1
done

# 4. Playwright flow (Definition of Done)
BASE_URL="http://127.0.0.1:${WEB_PORT}" SUPABASE_URL="$API_URL" node e2e/dod-flow.mjs
