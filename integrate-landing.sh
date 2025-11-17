#!/usr/bin/env bash

set -euo pipefail

IFS=$'\n\t'

# ---------- CONFIG ----------

REPO_DIR="$PWD/quaternion"                         # repo local path (already present per your message)

GAME_DIR="$REPO_DIR/quaternion-game"               # backend "full" game

LANDING_SRC_DIR="$REPO_DIR/blank-canvas-state-main"     # where you put the landing code manually

PUBLIC_DIR="$GAME_DIR/public"                      # where we'll place the final landing files

BACKUP_DIR="$GAME_DIR/.backup_landing_$(date +%s)"

REQUIRED_NODE_MAJOR=18

# -------------------------------

echo

echo "=== ORGANIZE QUATERNION / BLANK-CANVAS-STATE → QUATERNION-GAME (public/) ==="

echo

# basic sanity checks

if [ ! -d "$REPO_DIR" ]; then

  echo "ERROR: repository root not found at $REPO_DIR"

  echo "Please run this from a folder where the 'quaternion' repo is present at $REPO_DIR"

  exit 1

fi

if [ ! -d "$GAME_DIR" ]; then

  echo "ERROR: quaternion-game folder not found at $GAME_DIR"

  exit 1

fi

if [ ! -d "$LANDING_SRC_DIR" ]; then

  echo "ERROR: blank-canvas-state-main not found at $LANDING_SRC_DIR — please ensure you copied it into the quaternion repo."

  exit 1

fi

# back up existing public if any

if [ -d "$PUBLIC_DIR" ]; then

  echo "Backing up existing $PUBLIC_DIR -> $BACKUP_DIR"

  mkdir -p "$BACKUP_DIR"

  cp -a "$PUBLIC_DIR/." "$BACKUP_DIR/" || true

  rm -rf "$PUBLIC_DIR"

fi

mkdir -p "$PUBLIC_DIR"

# try to ensure node and npm present (best-effort)

if command -v node >/dev/null 2>&1; then

  echo "Node detected: $(node -v)"

else

  echo "WARNING: node not found in PATH. The script will still write files, but you must install Node >= ${REQUIRED_NODE_MAJOR}.x to install deps and run the server."

fi

# Helper: find build output dir if a build was performed

find_build_output() {

  # prefer 'dist' then 'build' then 'out'

  for d in dist build out; do

    if [ -d "$d" ]; then

      echo "$d"

      return 0

    fi

  done

  return 1

}

# Step 1: If blank-canvas-state-main has package.json and a build script -> build it and copy build output

if [ -f "$LANDING_SRC_DIR/package.json" ]; then

  echo "Detected package.json in blank-canvas-state-main. Attempting to build (if build script exists)."

  # run build inside blank-canvas-state-main

  pushd "$LANDING_SRC_DIR" > /dev/null

  # Install deps for blank-canvas-state-main (will speed build)

  if command -v npm >/dev/null 2>&1; then

    echo "Installing deps for blank-canvas-state-main (npm ci if lockfile exists, else npm install)..."

    if [ -f package-lock.json ]; then

      if ! npm ci --silent 2>/dev/null; then

        echo "npm ci failed (lockfile out of sync), falling back to npm install..."

        npm install --silent

      fi

    else

      npm install --silent

    fi

  else

    echo "npm not available — skipping install. If build fails, run 'npm install' inside $LANDING_SRC_DIR manually."

  fi

  # decide whether to run build

  BUILD_CMD=$(node -e "try{const p=require('./package.json'); const s=p.scripts||{}; console.log(s.build? 'build' : (s.production? 'production' : 'NONE'));}catch(e){console.log('NONE')}")

  if [ "$BUILD_CMD" != "NONE" ]; then

    echo "Running npm run build in blank-canvas-state-main..."

    npm run build --silent

    # detect build output

    BUILD_DIR=$(find_build_output)

    if [ -n "$BUILD_DIR" ]; then

      echo "Found build output at $BUILD_DIR — copying to $PUBLIC_DIR"

      cp -a "$BUILD_DIR/." "$PUBLIC_DIR/"

      popd > /dev/null

      echo "Copy complete."

      BUILT=true

    else

      echo "No build output directory (dist/build/out) found after build. Falling back to copying source files."

      popd > /dev/null

      BUILT=false

    fi

  else

    echo "No build script found in blank-canvas-state-main package.json. Will attempt to detect static files (index.html) or copy source."

    popd > /dev/null

    BUILT=false

  fi

else

  echo "No package.json in blank-canvas-state-main — likely a static site. Will look for index.html."

  BUILT=false

fi

# Step 2: If not built or static site, copy static files (index.html, assets) directly

if [ "$BUILT" = false ]; then

  # prefer a static 'dist'/'build' folder inside blank-canvas-state, else copy root files

  if [ -d "$LANDING_SRC_DIR/dist" ]; then

    echo "Copying $LANDING_SRC_DIR/dist -> $PUBLIC_DIR"

    cp -a "$LANDING_SRC_DIR/dist/." "$PUBLIC_DIR/"

  elif [ -d "$LANDING_SRC_DIR/build" ]; then

    echo "Copying $LANDING_SRC_DIR/build -> $PUBLIC_DIR"

    cp -a "$LANDING_SRC_DIR/build/." "$PUBLIC_DIR/"

  else

    # copy everything except node_modules and .git

    echo "Copying files from $LANDING_SRC_DIR to $PUBLIC_DIR (excluding node_modules and .git)"

    rsync -a --exclude 'node_modules' --exclude '.git' --exclude 'package-lock.json' --exclude 'yarn.lock' "$LANDING_SRC_DIR/" "$PUBLIC_DIR/"

  fi

fi

# sanity: ensure index.html exists in public

if [ ! -f "$PUBLIC_DIR/index.html" ]; then

  echo "WARNING: public/index.html not found after copy. Attempting to find an HTML entry in the copied files..."

  FOUND_HTML=$(find "$PUBLIC_DIR" -maxdepth 2 -type f -name 'index.html' -print -quit || true)

  if [ -n "$FOUND_HTML" ]; then

    echo "Found: $FOUND_HTML — moving to $PUBLIC_DIR/index.html"

    mv "$FOUND_HTML" "$PUBLIC_DIR/index.html"

    # remove now-empty parent if needed

  else

    echo "ERROR: Could not find an index.html for the landing page. Please inspect $PUBLIC_DIR"

    echo "Listing $PUBLIC_DIR:"

    ls -la "$PUBLIC_DIR" || true

    echo "Exiting so you can fix the landing files."

    exit 1

  fi

fi

echo "public/ now contains the landing output. Files:"

ls -la "$PUBLIC_DIR" | sed -n '1,200p'

# Step 3: Ensure quaternion-game has a package.json; if not, create a minimal one

if [ ! -f "$GAME_DIR/package.json" ]; then

  echo "No package.json in quaternion-game — creating a minimal one."

  cat > "$GAME_DIR/package.json" <<JSON

{

  "name": "quaternion-game",

  "version": "0.0.0",

  "private": true,

  "scripts": {

    "start": "node server.js",

    "dev": "node server.js"

  },

  "dependencies": {}

}

JSON

fi

# Step 4: Merge/add server dependency and start script using node (safe JSON merge)

echo "Merging package.json: ensuring 'express' (static server) is present and 'start' script exists."

pushd "$GAME_DIR" > /dev/null

node - <<'NODE_EOF'

const fs = require('fs');

const pkgPath = './package.json';

let pkg = {};

try { pkg = JSON.parse(fs.readFileSync(pkgPath,'utf8')); } catch(e){ console.error('Failed to read package.json', e); process.exit(1); }

pkg.dependencies = pkg.dependencies || {};

pkg.scripts = pkg.scripts || {};

// ensure express present (we'll install it later)

if (!pkg.dependencies['express']) pkg.dependencies['express'] = '^4.18.2';

// ensure start script

if (!pkg.scripts.start) pkg.scripts.start = 'node server.js';

// ensure build script (optional): keep existing if present

if (!pkg.scripts.dev) pkg.scripts.dev = pkg.scripts.dev || 'node server.js';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

console.log('Updated package.json with express and start script.');

NODE_EOF

popd > /dev/null

# Step 5: create server.js that serves public/ with SPA fallback

SERVER_FILE="$GAME_DIR/server.js"

if [ -f "$SERVER_FILE" ]; then

  echo "server.js already exists; backing up -> ${SERVER_FILE}.bak"

  cp "$SERVER_FILE" "${SERVER_FILE}.bak"

fi

cat > "$SERVER_FILE" <<'NODE'

/**

 * Simple Express static server for deployment / local testing

 * - serves files from ./public

 * - SPA fallback to /index.html

 * - uses process.env.PORT or 3000

 */

const express = require('express');

const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, 'public');

// Security headers (basic)

app.use((req, res, next) => {

  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  next();

});

// Serve static

app.use(express.static(PUBLIC_DIR, {

  extensions: ['html']

}));

// SPA fallback for single page apps - return index.html for unknown routes

app.get('*', (req, res) => {

  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));

});

app.listen(PORT, () => {

  console.log(`quaternion-game static server listening on http://localhost:${PORT} (PORT=${PORT})`);

});

NODE

echo "Wrote server.js to $SERVER_FILE"

# Step 6: Install dependencies for quaternion-game (including express)

echo "Installing dependencies for quaternion-game (this may take a minute)..."

pushd "$GAME_DIR" > /dev/null

if command -v npm >/dev/null 2>&1; then

  if [ -f package-lock.json ]; then

    if ! npm ci 2>/dev/null; then

      echo "npm ci failed (lockfile out of sync), falling back to npm install..."

      npm install

    fi

  else

    npm install

  fi

else

  echo "npm not available — please run 'npm install' inside $GAME_DIR manually."

fi

popd > /dev/null

echo

echo "=== DONE: Integration complete ==="

echo " - Landing page files are located at: $PUBLIC_DIR"

echo " - quaternion-game now has server.js to serve public/ and package.json has a 'start' script."

echo

echo "Quick test locally (from the repo root):"

echo "  cd \"$GAME_DIR\""

echo "  npm start"

echo

echo "When you run npm start the app will serve the landing page at http://localhost:3000/"

echo

echo "Deploying to lovable (or similar hosts):"

echo " - lovable typically runs your project's 'start' script or uses a static deploy; this repo now exposes a standard 'npm start' server that serves the landing code."

echo

echo "If anything looks off (missing images, broken relative paths):"

echo " - check $PUBLIC_DIR/index.html for absolute vs relative paths"

echo " - if assets use absolute paths like '/assets/...', they will still work because server serves from public root."

echo " - if links break, open $PUBLIC_DIR/index.html in a browser to debug network requests."

echo

echo "Backups of any overwritten 'public' content were stored in: $BACKUP_DIR"

echo

exit 0

