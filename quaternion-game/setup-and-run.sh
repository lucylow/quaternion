#!/usr/bin/env bash

set -euo pipefail

IFS=$'\n\t'

# --- CONFIG ---
GAME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUIRED_NODE_MAJOR=18
DEV_PORT=8080
DEV_URL="http://localhost:${DEV_PORT}"

echo "=== Quaternion Game Setup & Run ==="
echo "Working directory: $GAME_DIR"
cd "$GAME_DIR"

# --- Node version (use nvm if present) ---
if command -v nvm >/dev/null 2>&1; then
  echo "nvm detected. Installing/using Node $REQUIRED_NODE_MAJOR..."
  nvm install $REQUIRED_NODE_MAJOR
  nvm use $REQUIRED_NODE_MAJOR
else
  NODE_V="$(node -v 2>/dev/null || echo 'none')"
  if [ "$NODE_V" = "none" ]; then
    echo "ERROR: node is not installed. Please install Node >=${REQUIRED_NODE_MAJOR}.x (or install nvm). Current: none"
    exit 1
  fi
  echo "Node present: $NODE_V (ensure it's >= v${REQUIRED_NODE_MAJOR}.0.0)"
fi

# --- choose package manager ---
if [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then
  PKG_CMD="yarn"
elif [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
  PKG_CMD="pnpm"
else
  PKG_CMD="npm"
fi
echo "Using package manager: $PKG_CMD"

# --- copy .env.example if needed ---
if [ ! -f .env ] && [ -f .env.example ]; then
  echo "Copying .env.example -> .env (default env)"
  cp .env.example .env
fi

# --- install dependencies ---
echo "Installing dependencies..."
if [ "$PKG_CMD" = "npm" ]; then
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
elif [ "$PKG_CMD" = "yarn" ]; then
  yarn install --frozen-lockfile || yarn install
else
  pnpm install
fi

# --- determine run script (prefer dev for Vite projects) ---
RUN_SCRIPT=$(node -e "const s = require('./package.json').scripts || {}; console.log(s.dev ? 'dev' : s.start ? 'start' : s.serve ? 'serve' : s.preview ? 'preview' : 'NONE');")

if [ "$RUN_SCRIPT" = "NONE" ]; then
  echo "No standard dev/start script found in package.json. Available scripts:"
  node -e "console.log(Object.keys(require('./package.json').scripts || {}).join(', ') || '(none)')"
  echo "Please edit package.json to add a 'dev' or 'start' script."
  exit 1
fi

echo "Will run: $PKG_CMD run $RUN_SCRIPT"
echo "Dev server will be available at: $DEV_URL"
echo

# --- run (foreground so logs are visible in Cursor) ---
echo "=== STARTING: $PKG_CMD run $RUN_SCRIPT ==="
echo "Opening $DEV_URL in your browser in 3 seconds..."
(sleep 3 && open "$DEV_URL" 2>/dev/null || true) &

if [ "$PKG_CMD" = "npm" ]; then
  npm run "$RUN_SCRIPT"
elif [ "$PKG_CMD" = "yarn" ]; then
  yarn "$RUN_SCRIPT"
else
  pnpm run "$RUN_SCRIPT"
fi

