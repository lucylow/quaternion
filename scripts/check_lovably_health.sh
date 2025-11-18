#!/usr/bin/env bash
# PATCHED BY CURSOR - lovable integration - scripts/check_lovably_health.sh
# curl to edge /health endpoint

curl -X GET http://localhost:3000/api/lovably/health || echo "Health check failed - ensure edge proxy is running"

