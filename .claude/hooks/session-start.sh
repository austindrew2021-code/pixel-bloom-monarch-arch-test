#!/bin/bash
# Gets a fresh Claude Code on the web session to the point where `npm test`,
# `npm run lint`, `npm run typecheck` and `npm run dev` all work.
#
# The repository is cloned fresh into an empty container, so node_modules is not
# there. Everything below is safe to run again on an already-warm container.
#
# Runs synchronously, on purpose. Async would hand the session back about 16
# seconds sooner on a cold container and instantly on a warm one, but it opens
# a window where the session is live and node_modules is not there yet — and
# the first thing anyone does in this repo is run the tests. Chasing one
# intermittent "cannot find module" costs more than the 16 seconds saves.
set -euo pipefail

# Local machines already have their own setup; this is only for the remote.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Chromium is pre-installed in this image and Playwright is pointed at it.
# Without the skip flag, @playwright/test's postinstall tries to download its
# own copy, which is slow at best and blocked at worst. Persist both so every
# later command in the session sees them, not just this script.
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo "export PLAYWRIGHT_BROWSERS_PATH=\"$PLAYWRIGHT_BROWSERS_PATH\""
    echo 'export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1'
  } >> "$CLAUDE_ENV_FILE"
fi

# `install` rather than `ci`: the container is snapshotted after this hook, so a
# warm start should be a no-op instead of deleting node_modules and starting over.
echo "[session-start] installing dependencies"
npm install --no-audit --no-fund

# sharp ships platform-specific binaries and is what the photo scripts run on;
# if it did not land, say so here rather than three commands into a session.
node -e "require('sharp')" 2>/dev/null \
  && echo "[session-start] sharp ok" \
  || echo "[session-start] WARNING: sharp did not load — npm run photos will fail"

echo "[session-start] ready"
