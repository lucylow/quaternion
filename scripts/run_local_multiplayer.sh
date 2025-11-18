#!/usr/bin/env bash
# scripts/run_local_multiplayer.sh
set -e
export NODE_ENV=development
export PORT=4000
export TICK_MS=50
export USE_AUTHORITATIVE_MP=true
node server.js

