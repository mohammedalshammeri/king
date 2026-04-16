#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ./backend.env ]; then
  echo "[backup] backend.env غير موجود"
  exit 1
fi

set -a
. ./backend.env
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[backup] DATABASE_URL غير مضبوط داخل backend.env"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
BACKUP_RETENTION_COUNT="${BACKUP_RETENTION_COUNT:-7}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="kom-db-${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Creating backup: $BACKUP_FILE"
docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -v "$BACKUP_DIR:/backups" \
  postgres:16-alpine \
  sh -lc "pg_dump \"$DATABASE_URL\" | gzip > /backups/$BACKUP_FILE"

echo "[backup] Backup saved to $BACKUP_DIR/$BACKUP_FILE"

if [ "$BACKUP_RETENTION_COUNT" -gt 0 ] 2>/dev/null; then
  echo "[backup] Applying retention: keep last $BACKUP_RETENTION_COUNT backups"
  find "$BACKUP_DIR" -maxdepth 1 -type f -name 'kom-db-*.sql.gz' | sort -r | tail -n +$((BACKUP_RETENTION_COUNT + 1)) | while read -r old_file; do
    [ -n "$old_file" ] || continue
    rm -f "$old_file"
    echo "[backup] Removed old backup: $(basename "$old_file")"
  done
fi

echo "[backup] Done"