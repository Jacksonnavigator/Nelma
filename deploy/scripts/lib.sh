# Shared helpers for the NELMA blue-green scripts. Sourced, not executed.
# shellcheck shell=bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/deploy/docker-compose.yml"
ENV_FILE="${NELMA_ENV_FILE:-$REPO_ROOT/.env}"
STATE_DIR="${NELMA_STATE_DIR:-$REPO_ROOT/.deploy}"
UPSTREAM_FILE="${NELMA_UPSTREAM_FILE:-/etc/nginx/nelma/upstream.conf}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
API_READY_PATH="${API_READY_PATH:-/api/v1/ready}"

export NELMA_ENV_FILE="$ENV_FILE"

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
die() { printf '[%s] ERROR: %s\n' "$(date -u +%H:%M:%S)" "$*" >&2; exit 1; }

api_port()   { case "$1" in blue) echo 3001 ;; green) echo 3002 ;; *) die "unknown color '$1'" ;; esac; }
admin_port() { case "$1" in blue) echo 4001 ;; green) echo 4002 ;; *) die "unknown color '$1'" ;; esac; }
other_color() { case "$1" in blue) echo green ;; green) echo blue ;; *) die "unknown color '$1'" ;; esac; }

active_color() { cat "$STATE_DIR/active_color" 2>/dev/null || true; }
color_tag()    { cat "$STATE_DIR/$1.tag" 2>/dev/null || true; }

require_env_file() {
  [[ -f "$ENV_FILE" ]] || die "missing $ENV_FILE (copy .env.example to .env and fill it in)"
}

# Only one deploy or rollback at a time.
acquire_lock() {
  mkdir -p "$STATE_DIR"
  exec 9>"$STATE_DIR/lock"
  flock -n 9 || die "another deploy or rollback is running"
}

# docker compose for one color: compose <color> <tag> <args...>
compose() {
  local color="$1" tag="$2"; shift 2
  IMAGE_TAG="$tag" API_PORT="$(api_port "$color")" ADMIN_PORT="$(admin_port "$color")" \
    docker compose --project-name "nelma-$color" --file "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

# Run a command as root: directly when we are root, otherwise through passwordless sudo
# (see the sudoers rule in DEPLOY.md).
as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then "$@"; else sudo -n "$@"; fi
}

check_color_health() {
  local color="$1" api admin
  api="$(api_port "$color")"
  admin="$(admin_port "$color")"
  curl -fsS --max-time 5 "http://127.0.0.1:$api/health" >/dev/null 2>&1 &&
    curl -fsS --max-time 10 "http://127.0.0.1:$api$API_READY_PATH" >/dev/null 2>&1 &&
    curl -fsS --max-time 5 "http://127.0.0.1:$admin/health" >/dev/null 2>&1
}

# Wait until the API answers /health and its readiness check (database reachable), and the
# admin answers /health. Returns non-zero after HEALTH_TIMEOUT seconds.
wait_for_health() {
  local color="$1" deadline=$((SECONDS + HEALTH_TIMEOUT))
  log "Waiting up to ${HEALTH_TIMEOUT}s for $color to pass health checks"
  until check_color_health "$color"; do
    if (( SECONDS >= deadline )); then
      return 1
    fi
    sleep 3
  done
  log "$color is healthy"
}

# Point Nginx at a color. Validates the config and puts the old file back if Nginx rejects it.
switch_nginx() {
  local color="$1" api admin tmp backup
  api="$(api_port "$color")"
  admin="$(admin_port "$color")"
  [[ -f "$UPSTREAM_FILE" ]] || die "missing $UPSTREAM_FILE (run deploy/scripts/setup-nginx.sh first)"

  tmp="$(mktemp)"
  backup="$(mktemp)"
  cat >"$tmp" <<EOF
# Managed by deploy/scripts. Active color: $color ($(date -u +%Y-%m-%dT%H:%M:%SZ))
upstream nelma_api {
    server 127.0.0.1:$api;
    keepalive 16;
}
upstream nelma_admin {
    server 127.0.0.1:$admin;
    keepalive 16;
}
EOF
  cp "$UPSTREAM_FILE" "$backup"
  cat "$tmp" >"$UPSTREAM_FILE"
  rm -f "$tmp"

  if ! as_root nginx -t >/dev/null 2>&1; then
    cat "$backup" >"$UPSTREAM_FILE"
    rm -f "$backup"
    as_root nginx -t || true
    die "Nginx rejected the new upstream; kept the previous one"
  fi
  if ! as_root systemctl reload nginx; then
    cat "$backup" >"$UPSTREAM_FILE"
    rm -f "$backup"
    die "could not reload Nginx (check the sudo rule in DEPLOY.md); traffic was not switched"
  fi
  rm -f "$backup"
  log "Nginx now sends traffic to $color (API :$api, admin :$admin)"
}

set_active() {
  echo "$1" >"$STATE_DIR/active_color"
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) active=$1 tag=$(color_tag "$1") by=${2:-manual}" >>"$STATE_DIR/history.log"
}

# Optional check through Nginx and TLS, using API_DOMAIN from .env. Warns only.
check_public() {
  local domain
  domain="$(grep -E '^API_DOMAIN=' "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d "\"' " || true)"
  [[ -n "$domain" ]] || return 0
  if curl -fsS --max-time 10 --resolve "$domain:443:127.0.0.1" "https://$domain/health" >/dev/null 2>&1; then
    log "https://$domain/health answers through Nginx"
  else
    log "WARNING: https://$domain/health did not answer through Nginx. Check 'sudo nginx -t' and the certificate."
  fi
}
