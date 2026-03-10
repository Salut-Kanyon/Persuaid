#!/usr/bin/env bash
# Build the app (no signing), run it, and tail debug logs.
# Run from project root: ./scripts/run-desktop-and-logs.sh

set -e
cd "$(dirname "$0")/.."

echo "Building (no signing)..."
CSC_IDENTITY_AUTO_DISCOVERY=false npm run pack --silent 2>/dev/null || true
CSC_IDENTITY_AUTO_DISCOVERY=false npm run pack

APP="./dist/mac-arm64/Persuaid.app/Contents/MacOS/Persuaid"
LOG="/tmp/persuaid-debug.log"
LOG2="$HOME/Library/Application Support/Persuaid/debug.log"

if [ ! -x "$APP" ]; then
  echo "App not found at $APP. Run npm run pack first."
  exit 1
fi

rm -f /tmp/persuaid-debug.log
echo "Starting app... STT logs will appear below (and in $LOG and $LOG2)."
echo "In the app: sign in, start a call, speak. Then check logs."
echo "---"
"$APP" &
PID=$!
sleep 3
if [ -f "$LOG" ]; then
  tail -f "$LOG"
else
  echo "(Waiting for log file... speak in the app and wait a few seconds)"
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    [ -f "$LOG" ] && { tail -f "$LOG"; exit 0; }
  done
  echo "No log file yet. Check $LOG2 or run the app from Terminal to see stdout."
  wait $PID 2>/dev/null || true
fi
