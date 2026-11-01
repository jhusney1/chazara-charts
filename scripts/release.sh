#!/usr/bin/env bash
# Release Chazara Charts to the production Droplet.
#
#   bash scripts/release.sh            # deploy origin/master
#   bash scripts/release.sh <ref>      # deploy a specific commit/tag (rollback)
#
# Reads DEPLOY_HOST, DEPLOY_PATH and PROD_URL from deploy.env (gitignored).
# Production only ever runs what is on GitHub: the server fetches and resets
# to the requested ref, so local uncommitted work can never leak into a release.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f deploy.env ]; then
  echo "deploy.env not found. Copy deploy.env.example to deploy.env and fill it in." >&2
  exit 1
fi
set -a; . ./deploy.env; set +a
: "${DEPLOY_HOST:?set in deploy.env}" "${DEPLOY_PATH:?set in deploy.env}" "${PROD_URL:?set in deploy.env}"

REF="${1:-origin/master}"
git fetch -q origin
SHA="$(git rev-parse --short "$REF")"
if [ "$REF" = "origin/master" ] && [ "$(git rev-parse master)" != "$(git rev-parse origin/master)" ]; then
  echo "Local master and origin/master differ. Push or pull first so you deploy what you think you are deploying." >&2
  exit 1
fi

echo "==> Deploying $REF ($SHA) to $DEPLOY_HOST:$DEPLOY_PATH"
ssh -o BatchMode=yes "$DEPLOY_HOST" bash -s -- "$DEPLOY_PATH" "$SHA" < scripts/deploy-remote.sh

echo "==> Smoke-checking $PROD_URL (expecting commit $SHA)"
bash scripts/smoke.sh "$PROD_URL" "$SHA"
echo "==> Released $SHA"
