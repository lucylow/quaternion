#!/bin/bash
# PATCHED BY CURSOR - 2024-12-19 - safe bootstrap & debug
# scripts/dev_visual_smoke.sh
#
# Small tool to validate dev server and presence of canvas id in returned HTML.

URL="${1:-http://localhost:3000}"

echo "[QUAT DEBUG] Running visual smoke test on $URL"

# Check if server is responding
if ! curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
  echo "ERROR: Server not responding at $URL"
  echo "Make sure dev server is running: npm run dev"
  exit 1
fi

echo "✓ Server is responding"

# Check for canvas element in HTML
HTML=$(curl -s "$URL")
if echo "$HTML" | grep -q 'id="game-canvas"'; then
  echo "✓ Canvas element found in HTML"
elif echo "$HTML" | grep -qi 'canvas'; then
  echo "⚠ Canvas element found but without id='game-canvas'"
else
  echo "⚠ No canvas element found in initial HTML (may be created by React)"
fi

# Check for React root
if echo "$HTML" | grep -q 'id="root"'; then
  echo "✓ React root element found"
else
  echo "⚠ React root element not found"
fi

# Check for main script
if echo "$HTML" | grep -q '/src/main'; then
  echo "✓ Main script reference found"
else
  echo "⚠ Main script reference not found"
fi

echo ""
echo "Smoke test complete. Open $URL in browser and check console for [QUAT DEBUG] logs."
