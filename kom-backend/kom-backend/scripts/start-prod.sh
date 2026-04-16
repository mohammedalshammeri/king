#!/bin/sh
set -eu

if [ "${DEPLOY_RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[startup] Running Prisma migrations"
  npm run prisma:migrate:deploy
else
  echo "[startup] Skipping Prisma migrations because DEPLOY_RUN_MIGRATIONS=false"
fi

echo "[startup] Starting backend"
exec node dist/main.js