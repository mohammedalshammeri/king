#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

echo "[deploy] Building and starting services"
docker compose up -d --build

echo "[deploy] Waiting for backend health"
attempt=0
max_attempts=20

while [ "$attempt" -lt "$max_attempts" ]; do
  attempt=$((attempt + 1))

  if docker compose exec -T backend node -e "fetch('http://127.0.0.1:3000/api/v1/health/ready').then((res) => { if (!res.ok) process.exit(1); process.exit(0); }).catch(() => process.exit(1));"; then
    echo "[deploy] Backend is healthy"
    exit 0
  fi

  echo "[deploy] Waiting for backend... attempt ${attempt}/${max_attempts}"
done

echo "[deploy] Backend health check failed after deployment"
exit 1