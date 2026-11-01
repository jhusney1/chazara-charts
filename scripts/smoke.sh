#!/usr/bin/env bash
# Smoke-check a running Chazara Charts instance.
#
#   bash scripts/smoke.sh http://localhost:3002            # local dev (through the CRA proxy)
#   bash scripts/smoke.sh https://example.com abc1234      # also assert the deployed commit
set -euo pipefail
BASE="${1:?usage: smoke.sh <base-url> [expected-short-sha]}"
EXPECT="${2:-}"
BASE="${BASE%/}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
fail() { echo "SMOKE FAIL: $*" >&2; exit 1; }

# Windows curl (schannel) fails hard when it cannot reach the CRL/OCSP endpoint;
# make revocation best-effort there. No-op elsewhere.
CURL=(curl)
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) CURL=(curl --ssl-revoke-best-effort);; esac

HEALTH=""
for _ in $(seq 1 30); do
  if HEALTH="$("${CURL[@]}" -fsS --max-time 5 "$BASE/api/health" 2>/dev/null)"; then break; fi
  sleep 2
done
[ -n "$HEALTH" ] || fail "$BASE/api/health unreachable after 60s"
echo "health: $HEALTH"
if [ -n "$EXPECT" ]; then
  echo "$HEALTH" | grep -q "\"commit\":\"$EXPECT" || fail "deployed commit does not match $EXPECT"
fi

"${CURL[@]}" -fsS --max-time 10 "$BASE/api/tractates" | grep -q '"Berachot"' || fail "tractates endpoint"

BODY='{"tractates":["Berachot"],"reviews":3,"pages":["2a","2b","3a"],"useHebrew":true}'
CT="$("${CURL[@]}" -fsS --max-time 30 -X POST "$BASE/api/create-excel" -H 'Content-Type: application/json' -d "$BODY" -o "$TMP/out.xlsx" -w '%{content_type}')"
echo "$CT" | grep -q spreadsheetml || fail "create-excel returned $CT"
[ -s "$TMP/out.xlsx" ] || fail "create-excel produced an empty file"

"${CURL[@]}" -fsS --max-time 30 -X POST "$BASE/api/create-pdf" -H 'Content-Type: application/json' -d "$BODY" -o "$TMP/out.pdf"
head -c 4 "$TMP/out.pdf" | grep -q '%PDF' || fail "create-pdf did not return a PDF"

echo "SMOKE OK ($BASE)"
