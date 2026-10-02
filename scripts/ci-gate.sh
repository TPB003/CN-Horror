#!/usr/bin/env bash
# Pre-push CI gate: mirrors .github/workflows/ci.yml step-for-step.
# Run this BEFORE every push. If any step fails, DO NOT PUSH.
set -euo pipefail
cd "$(dirname "$0")"

echo "=== [1/7] npm ci ==="
npm ci --no-audit --no-fund 2>&1 | tail -1

echo "=== [2/7] typecheck ==="
npm run typecheck

echo "=== [3/7] story:validate ==="
npm run story:validate

echo "=== [4/7] unit tests ==="
npm test 2>&1 | grep -E "Test Files|Tests "

echo "=== [5/7] story:export + novel sync check ==="
npm run story:export 2>&1 | tail -1
if [[ -n "$(git status --porcelain -- novel/)" ]]; then
  echo "FAIL: novel/ out of sync after export. Commit the regenerated novel first."
  git status --short -- novel/
  exit 1
fi
echo "novel/ in sync"

echo "=== [6/7] build ==="
npm run build 2>&1 | tail -1

echo "=== [7/7] e2e ==="
npx playwright test 2>&1 | tail -5

echo ""
echo "ALL CI STEPS PASSED — safe to push."
