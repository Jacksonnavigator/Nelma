#!/usr/bin/env bash
# Show which color is live, what each color runs, and whether it is healthy.
#
# Usage: deploy/scripts/status.sh

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ACTIVE="$(active_color)"
echo "Active color: ${ACTIVE:-none}"
for color in blue green; do
  tag="$(color_tag "$color")"
  if check_color_health "$color"; then health=healthy; else health="not answering"; fi
  marker=" "
  [[ "$color" == "$ACTIVE" ]] && marker="*"
  printf '%s %-5s  API :%s  admin :%s  tag %-30s %s\n' \
    "$marker" "$color" "$(api_port "$color")" "$(admin_port "$color")" "${tag:--}" "$health"
done
if [[ -f "$UPSTREAM_FILE" ]]; then
  echo
  echo "Nginx upstream ($UPSTREAM_FILE):"
  grep -E 'server 127' "$UPSTREAM_FILE" | sed 's/^/  /'
fi
if [[ -f "$STATE_DIR/history.log" ]]; then
  echo
  echo "Recent switches:"
  tail -n 5 "$STATE_DIR/history.log" | sed 's/^/  /'
fi
