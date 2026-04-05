#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-https://github.com/mohammedalshammeri/king.git}"
APP_DIR="${2:-/var/www/kom}"

export DEBIAN_FRONTEND=noninteractive

echo "[1/6] Updating system packages"
apt update
apt install -y ca-certificates curl gnupg git unzip

if ! command -v docker >/dev/null 2>&1; then
  echo "[2/6] Installing Docker"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
  apt update
  apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
else
  echo "[2/6] Docker already installed"
fi

echo "[3/6] Preparing application directory"
mkdir -p "$(dirname "$APP_DIR")"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "[4/6] Cloning repository"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "[4/6] Repository already exists, pulling latest changes"
  git -C "$APP_DIR" pull --ff-only
fi

echo "[5/6] Preparing deployment env files"
cd "$APP_DIR/hostinger"

if [ ! -f .env ]; then
  cp .env.example .env
fi

if [ ! -f backend.env ]; then
  cp backend.env.example backend.env
fi

chmod 600 .env backend.env

echo "[6/6] Bootstrap complete"
echo
echo "Next commands:"
echo "  cd $APP_DIR/hostinger"
echo "  nano .env"
echo "  nano backend.env"
echo "  docker compose up -d --build"
echo
echo "Files ready:"
echo "  $APP_DIR/hostinger/.env"
echo "  $APP_DIR/hostinger/backend.env"