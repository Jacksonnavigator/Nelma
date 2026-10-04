#!/usr/bin/env bash
# Send traffic back to the other color (the one that was live before the last deploy).
#
# The old color is normally still running, so this only checks its health and switches
# Nginx. If its containers were stopped (for example after a reboot), they are started
# again first from the images they were built with.
#
# Usage: deploy/scripts/rollback.sh            # switch to the other color
#        deploy/scripts/rollback.sh blue|green # switch to a specific color

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

require_env_file
acquire_lock

ACTIVE="$(active_color)"
TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  [[ -n "$ACTIVE" ]] || die "nothing has been deployed yet"
  TARGET="$(other_color "$ACTIVE")"
fi
other_color "$TARGET" >/dev/null # validates the name
[[ "$TARGET" != "$ACTIVE" ]] || die "$TARGET is already active"

TAG="$(color_tag "$TARGET")"
[[ -n "$TAG" ]] || die "$TARGET has no working release to roll back to"
log "Rolling back from ${ACTIVE:-none} to $TARGET (tag $TAG)"

if ! check_color_health "$TARGET"; then
  log "$TARGET is not answering; starting its containers"
  compose "$TARGET" "$TAG" up --detach --no-build ||
    die "could not start $TARGET (its images may have been removed); deploy a known-good commit instead"
  if ! wait_for_health "$TARGET"; then
    compose "$TARGET" "$TAG" logs --tail 80 || true
    die "$TARGET is not healthy; traffic stays on ${ACTIVE:-none}"
  fi
fi

switch_nginx "$TARGET"
set_active "$TARGET" "rollback"
check_public
log "Done. $TARGET is live with $TAG. ${ACTIVE:-The previous color} is still running."
