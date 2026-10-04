#!/usr/bin/env bash
# Blue-green deploy of the code currently checked out in this repo.
#
#   1. Build images for this commit.
#   2. Start them as the idle color (blue :3001/:4001 or green :3002/:4002).
#   3. Wait for the idle color's health checks to pass.
#   4. Switch the Nginx upstream to it.
#   5. Leave the old color running so rollback.sh can switch straight back.
#
# If step 3 fails, the idle color is stopped and live traffic is never touched.
#
# Usage: deploy/scripts/deploy.sh
# Env:   HEALTH_TIMEOUT (seconds, default 180)

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_env_file
acquire_lock

cd "$REPO_ROOT"
TAG="$(git rev-parse --short=12 HEAD)"
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  TAG="$TAG-dirty-$(date -u +%Y%m%d%H%M%S)"
fi

ACTIVE="$(active_color)"
if [[ -z "$ACTIVE" ]]; then
  IDLE=blue
  log "First deploy: starting blue"
else
  IDLE="$(other_color "$ACTIVE")"
  log "Active color is $ACTIVE (tag $(color_tag "$ACTIVE")); deploying $TAG to $IDLE"
fi

log "Building images nelma-api:$TAG and nelma-admin:$TAG"
compose "$IDLE" "$TAG" build --pull

log "Starting $IDLE"
compose "$IDLE" "$TAG" up --detach --no-build --force-recreate --remove-orphans
echo "$TAG" >"$STATE_DIR/$IDLE.tag"

if ! wait_for_health "$IDLE"; then
  log "$IDLE did not become healthy. Recent logs:"
  compose "$IDLE" "$TAG" logs --tail 80 || true
  compose "$IDLE" "$TAG" stop || true
  rm -f "$STATE_DIR/$IDLE.tag" # a failed release is never a rollback target
  if [[ -n "$ACTIVE" ]]; then
    die "deploy aborted; traffic is still on $ACTIVE"
  fi
  die "deploy aborted; nothing is serving traffic yet"
fi

switch_nginx "$IDLE"
set_active "$IDLE" "deploy"
check_public

if [[ -n "$ACTIVE" ]]; then
  log "Done. $IDLE is live with $TAG. $ACTIVE is still running for rollback: deploy/scripts/rollback.sh"
else
  log "Done. $IDLE is live with $TAG."
fi

# Remove NELMA images no container uses any more (both colors' images are kept).
docker image prune --all --force --filter "label=app=nelma" --filter "until=168h" >/dev/null || true
