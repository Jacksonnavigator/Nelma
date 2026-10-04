#!/usr/bin/env bash
# Install the NELMA Nginx site. Run as root (sudo). Safe to run again after editing the templates.
#
# Before a certificate exists it installs an HTTP-only site so certbot can prove the domains.
# Once /etc/letsencrypt/live/nelma exists it installs the full HTTPS reverse proxy.
#
# Usage: sudo deploy/scripts/setup-nginx.sh <deploy-user>
# Reads API_DOMAIN and ADMIN_DOMAIN from the repo's .env.

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

[[ "$(id -u)" -eq 0 ]] || die "run with sudo"
DEPLOY_USER="${1:-}"
[[ -n "$DEPLOY_USER" ]] || die "usage: sudo $0 <deploy-user>"
id "$DEPLOY_USER" >/dev/null 2>&1 || die "user '$DEPLOY_USER' does not exist"
require_env_file
command -v envsubst >/dev/null || die "envsubst missing (apt install gettext-base)"

read_env() { grep -E "^$1=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | tr -d "\"' " || true; }
API_DOMAIN="$(read_env API_DOMAIN)"
ADMIN_DOMAIN="$(read_env ADMIN_DOMAIN)"
[[ -n "$API_DOMAIN" && -n "$ADMIN_DOMAIN" ]] || die "set API_DOMAIN and ADMIN_DOMAIN in $ENV_FILE"
export API_DOMAIN ADMIN_DOMAIN

NGINX_DIR="$REPO_ROOT/deploy/nginx"
SITE=/etc/nginx/sites-available/nelma.conf

install -d -m 755 /var/www/certbot /etc/nginx/snippets
install -d -m 755 -o "$DEPLOY_USER" /etc/nginx/nelma
install -m 644 "$NGINX_DIR/nelma-ssl.conf" /etc/nginx/snippets/nelma-ssl.conf
install -m 644 "$NGINX_DIR/nelma-proxy.conf" /etc/nginx/snippets/nelma-proxy.conf

# Upstream file the deploy user rewrites on every switch. Starts on blue.
if [[ ! -f "$UPSTREAM_FILE" ]]; then
  cat >"$UPSTREAM_FILE" <<'EOF'
# Managed by deploy/scripts. Active color: blue (initial)
upstream nelma_api {
    server 127.0.0.1:3001;
    keepalive 16;
}
upstream nelma_admin {
    server 127.0.0.1:4001;
    keepalive 16;
}
EOF
fi
chown "$DEPLOY_USER" "$UPSTREAM_FILE"
chmod 644 "$UPSTREAM_FILE"

if [[ -f /etc/letsencrypt/live/nelma/fullchain.pem ]]; then
  log "Certificate found: installing the HTTPS site for $API_DOMAIN and $ADMIN_DOMAIN"
  template="$NGINX_DIR/nelma.conf.template"
else
  log "No certificate yet: installing the HTTP-only site for the certbot challenge"
  template="$NGINX_DIR/nelma-bootstrap.conf.template"
fi
# Only substitute our two variables; leave Nginx's own $host, $remote_addr, ... alone.
# shellcheck disable=SC2016
envsubst '${API_DOMAIN} ${ADMIN_DOMAIN}' <"$template" >"$SITE"
ln -sf "$SITE" /etc/nginx/sites-enabled/nelma.conf
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
log "Nginx reloaded"
