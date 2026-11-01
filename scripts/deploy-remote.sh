#!/usr/bin/env bash
# Runs ON the Droplet. Invoked by scripts/release.sh (manual) and by the
# deploy job in .github/workflows/ci.yml (automatic on push to master):
#   ssh $DEPLOY_HOST bash -s -- <deploy-path> <sha> < scripts/deploy-remote.sh
set -euo pipefail
DEPLOY_PATH="$1"; SHA="$2"
cd "$DEPLOY_PATH" || { echo "No such directory on server: $DEPLOY_PATH" >&2; exit 1; }
[ -f docker-compose.yml ] || { echo "No docker-compose.yml in $DEPLOY_PATH" >&2; exit 1; }
git fetch -q --all
git checkout -q master 2>/dev/null || true
git reset -q --hard "$SHA"
export GIT_SHA="$SHA"
# "app" is behind a compose profile; naming it activates that profile.
docker compose up --build -d --remove-orphans app
docker image prune -f >/dev/null
docker compose ps
