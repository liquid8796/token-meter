#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=/opt/token-meter
RELEASES=/opt/token-meter/releases
SHARED=/opt/token-meter/shared
CURRENT=/opt/token-meter/current
ENV_FILE="$SHARED/.env"
SERVICE=token-meter.service
CADDY_FILE=/etc/caddy/conf.d/token-meter.caddy
HEALTH_URL=http://127.0.0.1:3002/api/health
SITE_URL=https://tokenmeter.site

release_id="${1:-}"
archive="${2:-}"

if [[ $EUID -ne 0 ]]; then
  echo "release.sh must run as root" >&2
  exit 1
fi
if [[ -z "$release_id" || -z "$archive" || ! -f "$archive" ]]; then
  echo "usage: release.sh <release-id> <archive.tgz>" >&2
  exit 1
fi
if [[ ! "$release_id" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "invalid release id" >&2
  exit 1
fi

release_dir="$RELEASES/$release_id"
previous=""
if [[ -L "$CURRENT" ]]; then
  previous="$(readlink -f "$CURRENT" || true)"
fi

rollback() {
  echo "TokenMeter health check failed; rollback starting" >&2
  systemctl stop "$SERVICE" 2>/dev/null || true
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$CURRENT"
    systemctl start "$SERVICE" || true
    echo "Rolled back to $previous" >&2
  else
    rm -f "$CURRENT"
    echo "No previous release existed; service left stopped" >&2
  fi
}

id -u token-meter >/dev/null 2>&1 || \
  useradd --system --create-home --home-dir "$APP_ROOT" --shell /usr/sbin/nologin token-meter
mkdir -p "$RELEASES" "$SHARED"
chown token-meter:token-meter "$APP_ROOT" "$RELEASES" "$SHARED"
chmod 0750 "$APP_ROOT" "$RELEASES" "$SHARED"

if [[ ! -f "$ENV_FILE" ]]; then
  db_password="$(openssl rand -hex 24)"
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='token_meter'" | grep -q 1; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 -qc "ALTER ROLE token_meter WITH LOGIN PASSWORD '$db_password'"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 -qc "CREATE ROLE token_meter LOGIN PASSWORD '$db_password'"
  fi
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='token_meter'" | grep -q 1; then
    sudo -u postgres createdb -O token_meter token_meter
  fi
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=$SITE_URL
DATABASE_URL=postgresql://token_meter:$db_password@127.0.0.1:5432/token_meter
EOF
  chown token-meter:token-meter "$ENV_FILE"
  chmod 0600 "$ENV_FILE"
else
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='token_meter'" | grep -q 1; then
    echo "token_meter PostgreSQL role is missing while $ENV_FILE already exists" >&2
    exit 1
  fi
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='token_meter'" | grep -q 1; then
    sudo -u postgres createdb -O token_meter token_meter
  fi
fi

if grep -q '^NEXT_PUBLIC_SITE_URL=' "$ENV_FILE"; then
  sed -i "s|^NEXT_PUBLIC_SITE_URL=.*$|NEXT_PUBLIC_SITE_URL=$SITE_URL|" "$ENV_FILE"
else
  printf 'NEXT_PUBLIC_SITE_URL=%s\n' "$SITE_URL" >> "$ENV_FILE"
fi
chown token-meter:token-meter "$ENV_FILE"
chmod 0600 "$ENV_FILE"

rm -rf "$release_dir"
mkdir -p "$release_dir"
chown token-meter:token-meter "$release_dir"
sudo -u token-meter tar xzf "$archive" -C "$release_dir"

sudo -u token-meter bash -c "set -euo pipefail; set -a; source '$ENV_FILE'; set +a; cd '$release_dir'; npm ci --include=dev --no-audit --no-fund; npm run db:migrate; npm run db:seed; npm run build; npm prune --omit=dev --no-audit --no-fund"
mkdir -p "$release_dir/.next/cache"
chown -R token-meter:token-meter "$release_dir/.next"

install -m 0644 "$release_dir/ops/token-meter.service" /etc/systemd/system/token-meter.service
caddy_backup=""
if [[ -f "$CADDY_FILE" ]]; then
  caddy_backup="$(mktemp)"
  cp "$CADDY_FILE" "$caddy_backup"
fi
install -m 0644 "$release_dir/ops/token-meter.caddy" "$CADDY_FILE"
if ! caddy validate --config /etc/caddy/Caddyfile >/dev/null; then
  if [[ -n "$caddy_backup" ]]; then
    cp "$caddy_backup" "$CADDY_FILE"
  else
    rm -f "$CADDY_FILE"
  fi
  echo "Caddy validation failed; previous config restored" >&2
  exit 1
fi
rm -f "$caddy_backup"

ln -sfn "$release_dir" "$CURRENT"
systemctl daemon-reload
systemctl enable "$SERVICE" >/dev/null
systemctl restart "$SERVICE"
systemctl reload caddy

healthy=0
for _ in $(seq 1 15); do
  body="$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null || true)"
  if [[ "$body" == *'"status":"ok"'* && "$body" == *'"database":"ready"'* ]]; then
    healthy=1
    break
  fi
  sleep 2
done

if [[ $healthy -ne 1 ]]; then
  journalctl -u "$SERVICE" -n 60 --no-pager >&2 || true
  rollback
  exit 1
fi

rm -f "$archive"
echo "TokenMeter release $release_id is healthy"