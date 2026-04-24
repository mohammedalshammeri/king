#!/bin/bash
set -e

echo "[deploy] Setting up SSH key (if needed)"
mkdir -p ~/.ssh 2>/dev/null || true

echo "[deploy] Cloning/pulling repository"
if [ -d "/root/KOM" ]; then
  cd /root/KOM
  git pull origin main
else
  cd /root
  git clone https://github.com/mohammedalshammeri/king.git KOM
  cd KOM
fi

echo "[deploy] Starting Docker deployment"
cd hostinger
bash deploy.sh

echo "[deploy] ✅ Deployment complete!"
