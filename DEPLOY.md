# Deploying to a Contabo VPS (Docker, Nginx, blue-green)

This guide runs the **backend API** and the **admin / sales dashboard** on one Ubuntu VPS, behind Nginx with free Let's Encrypt certificates. Deploys are **blue-green**, so the site keeps serving while a new version starts. If the new version is bad, one command switches back.

Render is not affected. `render.yaml`, the Render services and their settings keep working exactly as before. The Contabo workflow runs only when you start it by hand.

## How it works

```
                    ┌──────────────── VPS ────────────────────────────────────────┐
 browser / app ──►  │ Nginx :443 ──► upstream.conf ──► blue  : API :3001, admin :4001 │
   (HTTPS)          │  (Let's Encrypt)            └──► green : API :3002, admin :4002 │
                    └─────────────────────────────────────────────────────────────┘
                                         API ──► PostgreSQL (Supabase or your own)
```

| Piece | Where |
| --- | --- |
| API image | `backend/Dockerfile`. It runs migrations, then Uvicorn on `$PORT` (default 8000). |
| Admin image | `admin/Dockerfile`. A Node server built with `NITRO_PRESET=node-server`, listening on `$PORT` (default 3000). |
| One color (API + admin) | `deploy/docker-compose.yml`, run as the Compose projects `nelma-blue` and `nelma-green` |
| Nginx site and TLS | `deploy/nginx/` |
| Deploy, rollback, status | `deploy/scripts/` |
| GitHub Actions | `.github/workflows/deploy-contabo.yml` (manual only) |
| Server settings | `.env` on the server, copied from `.env.example` |

**Health checks**

- API: `/health` (the process is up) and `/api/v1/ready` (the database is reachable).
- Admin: `/health`.

**What `deploy.sh` does**

1. Builds images tagged with the git commit.
2. Starts them as the **idle** color.
3. Waits until its health checks pass (180 s by default).
4. Rewrites `/etc/nginx/nelma/upstream.conf` to point at the idle color, checks it with `nginx -t`, and reloads Nginx. Requests in flight finish normally.
5. Leaves the **old color running**, so `rollback.sh` can switch straight back.

If the new color never becomes healthy, it is stopped and traffic stays where it was.

Containers listen on `127.0.0.1` only. Nginx is the only public entry point.

---

## First-time server setup

The examples use:

- `api.example.com` for the API
- `admin.example.com` for the dashboard
- `deploy` as the Linux user
- `/opt/nelma` as the app folder

Replace them with your own values.

### 1. Server and DNS

1. Order an Ubuntu 22.04 or 24.04 VPS from Contabo. The admin dashboard is built on the server, so **4 GB RAM or more** is recommended. On a smaller plan, add swap (step 2).
2. At your DNS provider, create `A` records for `api.example.com` and `admin.example.com` pointing to the VPS IPv4 address. If the VPS has IPv6, add `AAAA` records too.
3. Wait until `ping api.example.com` shows the VPS IP.

### 2. Base system (as root)

```bash
ssh root@YOUR_VPS_IP

apt update && apt upgrade -y
apt install -y git curl ca-certificates gnupg ufw nginx certbot gettext-base
timedatectl set-timezone Africa/Dar_es_Salaam   # optional

# Firewall: SSH, HTTP, HTTPS only.
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Optional: 2 GB swap for small plans.
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 3. Install Docker (as root)

Use Docker's official packages, which include the Compose plugin:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker compose version
```

### 4. Create the deploy user (as root)

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy

# Let deploy log in with your own SSH key.
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

The deploy scripts need exactly two root commands: checking and reloading Nginx. Allow only those:

```bash
cat > /etc/sudoers.d/nelma-deploy <<'EOF'
deploy ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx
EOF
chmod 440 /etc/sudoers.d/nelma-deploy
visudo -cf /etc/sudoers.d/nelma-deploy
```

Membership of the `docker` group is effectively root access. Only trusted keys should be able to log in as `deploy`.

### 5. Clone the repository (as deploy)

```bash
mkdir -p /opt/nelma && chown deploy:deploy /opt/nelma   # as root
su - deploy
```

**If the repository is private**, give the server a read-only deploy key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_nelma -N "" -C "nelma-vps"
cat ~/.ssh/github_nelma.pub
# GitHub > repo > Settings > Deploy keys > Add deploy key. Paste it and leave "Allow write access" OFF.
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/github_nelma
  IdentitiesOnly yes
EOF
ssh -T git@github.com   # answer "yes" once; it should greet the repository
```

Then clone:

```bash
git clone git@github.com:Jacksonnavigator/Nelma.git /opt/nelma
# Public repository: git clone https://github.com/Jacksonnavigator/Nelma.git /opt/nelma
cd /opt/nelma
```

### 6. Fill in the server settings (as deploy)

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

- Set `API_DOMAIN`, `ADMIN_DOMAIN` and `VITE_API_URL` (`https://API_DOMAIN/api/v1`).
- Put the admin address in `CORS_ORIGINS`, or sign-in will fail.
- Set `DATABASE_URL`, then `JWT_SECRET_KEY` and `INTERNAL_ADMIN_TOKEN`. Generate them with `openssl rand -hex 32`, or reuse Render's values if both share one database.
- Fill in SMTP, Twilio and Supabase the same way as on Render (see `backend/RENDER_SUPABASE.md`).

The API refuses to start in production with unsafe values. A mistake shows up as a failed health check, with the reason printed in the deploy logs.

### 7. Nginx and the Let's Encrypt certificate (as root)

First install a temporary HTTP-only site, so Let's Encrypt can check the domains:

```bash
cd /opt/nelma
deploy/scripts/setup-nginx.sh deploy
```

Get one certificate for both domains:

```bash
certbot certonly --webroot -w /var/www/certbot \
  --cert-name nelma \
  -d api.example.com -d admin.example.com \
  --email you@example.com --agree-tos --no-eff-email
```

Then install the full HTTPS site. The script sees the certificate and switches over:

```bash
deploy/scripts/setup-nginx.sh deploy
```

Make renewals reload Nginx, and test renewal:

```bash
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
certbot renew --dry-run
```

The `certbot` package already installs a timer that renews automatically (`systemctl list-timers | grep certbot`).

Run `deploy/scripts/setup-nginx.sh deploy` again whenever you change `deploy/nginx/` or the domains. It never overwrites the live upstream file.

### 8. First deploy (as deploy)

```bash
su - deploy
cd /opt/nelma
deploy/scripts/deploy.sh
```

The first build takes several minutes. Then check:

```bash
deploy/scripts/status.sh
curl https://api.example.com/health
curl https://api.example.com/api/v1/ready
curl https://admin.example.com/health
```

Open `https://admin.example.com` and sign in.

**New, empty database only:** create the first administrator inside the running API container. Use the color `status.sh` marks with `*`.

```bash
docker exec -it nelma-blue-api-1 python -m app.scripts.create_system_admin \
  --full-name "NELMA Admin" --phone "+255700000000" --email "admin@example.com"
```

If the database is the one Render already uses, the accounts already exist. Skip this.

### 9. GitHub Actions (optional, manual trigger)

The workflow SSHes into the server as `deploy`. It runs `git fetch`, checks out the commit you chose, and runs `deploy/scripts/deploy.sh`. It can also run `rollback.sh`.

1. **On your computer**, make a key pair just for GitHub Actions:

   ```bash
   ssh-keygen -t ed25519 -f nelma-gha -N "" -C "github-actions-nelma"
   ```

2. **On the server**, as `deploy`, allow that key:

   ```bash
   echo "PASTE THE CONTENTS OF nelma-gha.pub" >> ~/.ssh/authorized_keys
   ```

3. **Get the server's host key** (this pins it, so Actions refuses an impostor):

   ```bash
   ssh-keyscan -p 22 YOUR_VPS_IP
   ```

4. **In GitHub**, go to the repo > Settings > Secrets and variables > Actions > New repository secret:

   | Secret | Value |
   | --- | --- |
   | `CONTABO_HOST` | VPS IP or hostname, exactly as used in step 3 |
   | `CONTABO_USER` | `deploy` |
   | `CONTABO_SSH_KEY` | the whole contents of `nelma-gha` (the private key) |
   | `CONTABO_KNOWN_HOSTS` | the full output of step 3 |
   | `CONTABO_SSH_PORT` | optional; only if SSH is not on port 22 |
   | `CONTABO_APP_DIR` | optional; only if the app is not in `/opt/nelma` |

   Then delete `nelma-gha` from your computer, or store it in a password manager.

5. **Run it:** Actions > **Deploy to Contabo** > Run workflow. Pick the branch and `deploy` or `rollback`.

**Turning on automatic deploys later:** add this to `on:` in `.github/workflows/deploy-contabo.yml`:

```yaml
  push:
    branches: [main]
```

Do this only once you trust the server setup. Render keeps deploying on its own either way.

---

## Day to day

Run these as `deploy` in `/opt/nelma`.

| Task | Command |
| --- | --- |
| Deploy the checked-out code | `git pull && deploy/scripts/deploy.sh` |
| Deploy a specific commit | `git fetch && git checkout --detach <sha> && deploy/scripts/deploy.sh` |
| Switch back to the previous version | `deploy/scripts/rollback.sh` |
| Switch to a specific color | `deploy/scripts/rollback.sh blue` (or `green`) |
| What is live? | `deploy/scripts/status.sh` |
| Logs | `docker logs -f nelma-blue-api-1` (also `-admin-1`, `nelma-green-...`) |
| Give a slow start more time | `HEALTH_TIMEOUT=300 deploy/scripts/deploy.sh` |
| Change `.env` | edit it, then `deploy/scripts/deploy.sh`. Containers only read `.env` when they start. |

A few things worth knowing:

- **Both colors keep running.** That makes rollback instant, at the cost of about double the memory and database connections. On the next deploy, the old color is replaced by the new release.
- **Rollback switches code, not the database.** The new color runs the database migrations when it starts, while the old color is still serving. Keep migrations backward-compatible: add columns or tables first, and remove old ones in a later release. Then the previous release still works after a rollback.
- **After a reboot**, Docker restarts both colors (`restart: unless-stopped`), and Nginx keeps pointing at the last active one.
- **Old images** that no container uses are pruned after a week.
- **Deploy state** lives in `/opt/nelma/.deploy/` (git-ignored): the active color, each color's commit, and a history log.

## Render and Contabo side by side

- Nothing Render uses was changed. `render.yaml` still builds the API with `pip install .` and starts Uvicorn on `$PORT`. The admin Render service still builds with `NITRO_PRESET=node-server` and starts `node .output/server/index.mjs`.
- Both apps read their port from `PORT` with a fallback: 8000 for the API, 3000 for the admin.
- The admin's new `/health` route answers on Render too. It only short-circuits that one path.
- If Render and Contabo share **one database**, both deployments run migrations when they start. Deploy the same commit to both, or make sure the older one still works with the newer schema.
- The mobile app keeps using whatever `EXPO_PUBLIC_API_URL` it was built with. To move it to Contabo, set that to `https://api.example.com/api/v1` and make a new build.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Deploy says "did not become healthy" | Read the logs it prints. Usually a `.env` value fails production validation, or the database is unreachable. |
| `502 Bad Gateway` | `deploy/scripts/status.sh`. Is the active color healthy? Is `/etc/nginx/nelma/upstream.conf` pointing at it? |
| "could not reload Nginx" | The sudo rule from step 4 is missing or has a different path. Check with `sudo -n nginx -t` as `deploy`. |
| "another deploy or rollback is running" | Wait for it to finish. The lock is released when that process exits. |
| Certificate errors | `sudo certbot certificates`. The certificate must be named `nelma` and cover both domains. |
| Sign-in fails in the dashboard | Add `https://admin.example.com` to `CORS_ORIGINS` in `.env`, then redeploy. |
| Out of memory during the build | Add swap (step 2), or use a bigger plan. |
| Actions: "Host key verification failed" | `CONTABO_KNOWN_HOSTS` must come from `ssh-keyscan` against the same host and port as `CONTABO_HOST`. |
