#!/usr/bin/env bash
# scripts/dev_visual_smoke.sh

set -e

HOST=${1:-http://localhost:3000}

echo "[QUAT DEBUG] probing $HOST"

curl -s $HOST > /tmp/quaternion_frontpage.html || true

echo "[QUAT DEBUG] saved /tmp/quaternion_frontpage.html (open in browser)"

# look for canvas id
if grep -q "game-canvas" /tmp/quaternion_frontpage.html; then
  echo "[QUAT DEBUG] Found #game-canvas in HTML"
else
  echo "[QUAT DEBUG] #game-canvas not present in the initial HTML — it may be mounted client-side (OK)"
fi

