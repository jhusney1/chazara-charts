#!/usr/bin/env bash
# Runs ON the Droplet. Invoked by the deploy job in .github/workflows/ci.yml
# and by scripts/release.sh:
#   ssh $DEPLOY_HOST bash -s -- <deploy-path> <sha> [pull|build] < scripts/deploy-remote.sh
#
# pull (default): use the image CI built for <sha> from ghcr.io - seconds.
# build:          build the image here - slow on a small Droplet, only for
#                 emergencies when CI is unavailable.
set -euo pipefail
DEPLOY_PATH="$1"; SHA="$2"; MODE="${3:-pull}"
cd "$DEPLOY_PATH" || { echo "No such directory on server: $DEPLOY_PATH" >&2; exit 1; }
[ -f docker-compose.yml ] || { echo "No docker-compose.yml in $DEPLOY_PATH" >&2; exit 1; }

# Keep compose/nginx config in step with the commit being deployed.
git fetch -q --all
git checkout -q master 2>/dev/null || true
git reset -q --hard "$SHA"

# Pin the image tag in .env so plain `docker compose up` after a reboot
# keeps running this release.
touch .env
grep -v '^APP_IMAGE_TAG=' .env > .env.tmp || true
echo "APP_IMAGE_TAG=$SHA" >> .env.tmp
mv .env.tmp .env

# "app" is behind a compose profile; naming it activates that profile.
if [ "$MODE" = "build" ]; then
  GIT_SHA="$SHA" docker compose up --build -d --remove-orphans app
else
  docker compose pull app
  docker compose up -d --no-build --remove-orphans app
fi
docker image prune -f >/dev/null
docker compose ps
