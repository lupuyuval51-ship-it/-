#!/usr/bin/env bash
# Runs every check and keeps the RAW output, so results can be inspected instead of trusted.
#
#   bash scripts/verify-all.sh                 # everything, incl. browser E2E
#   WITH_E2E=0 bash scripts/verify-all.sh      # skip the browser E2E
#   OUT=/some/dir bash scripts/verify-all.sh   # write logs elsewhere
#
# Needs: the local Supabase stack (`supabase start`), Docker, Node 20+, Deno 2, Playwright/Chromium
# for E2E. Writes one log per check plus summary.txt (exit code per check) to $OUT.
# Exit code: 0 only if every check passed.
set -uo pipefail
cd "$(dirname "$0")/.."

OUT=${OUT:-docs/verification/latest}
mkdir -p "$OUT"
SUMMARY="$OUT/summary.txt"
{
  echo "commit:   $(git rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "dirty:    $(git status --porcelain 2>/dev/null | grep -v "^?? $OUT" | wc -l | tr -d ' ') changed file(s) outside $OUT"
  echo "date:     $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "node:     $(node --version)  deno: $(deno --version 2>/dev/null | head -1)  supabase: $(supabase --version 2>/dev/null)"
  echo
} > "$SUMMARY"

failed=0
run() {
  local name=$1
  shift
  printf '%-14s ' "$name"
  "$@" > "$OUT/$name.log" 2>&1
  local code=$?
  if [[ $code -eq 0 ]]; then echo "PASS"; else echo "FAIL (exit $code)"; failed=1; fi
  printf '%-14s exit=%s\n' "$name" "$code" >> "$SUMMARY"
}

run typecheck npx tsc --noEmit
run lint npx expo lint
run jest npx jest --ci -w 2
run pgtap supabase test db
run deno-check bash -c 'cd supabase/functions && deno check ai/index.ts advisor/index.ts'
run deno-test bash -c 'cd supabase/functions && deno test --allow-env --allow-net --allow-read --allow-run=supabase'
run race node e2e/race-checks.mjs
if [[ "${WITH_E2E:-1}" == "1" ]]; then
  run e2e env ART="$OUT/e2e" bash e2e/run-e2e.sh
fi

{
  echo
  echo "---- key lines ----"
  grep -hE '^(Tests|Test Suites):' "$OUT/jest.log" 2>/dev/null
  grep -hE '^(Files=|Result:)' "$OUT/pgtap.log" 2>/dev/null
  grep -hE 'passed.*failed' "$OUT/deno-test.log" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | tail -1
  grep -hE '"ok"' "$OUT/race.log" 2>/dev/null
  grep -hE 'steps passed' "$OUT/e2e.log" 2>/dev/null
} >> "$SUMMARY"

cat "$SUMMARY"
exit $failed
